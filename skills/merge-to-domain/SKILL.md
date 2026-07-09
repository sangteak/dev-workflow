---
name: merge-to-domain
description: "관리자가 호출하여 docs/design/[카테고리] 하위 complete 상태 feature 문서들을 카테고리 도메인 문서(SSOT)로 intelligent merge한다. 다중 작업자 환경에서 의미 보존 머지 강제."
---

# merge-to-domain — 도메인 머지 파이프라인

> 관리자(프로젝트 리더) 단독으로 슬래시 명령 `/dev-workflow:merge-to-domain`을 통해 호출한다.
> 작업자는 이 스킬을 호출하지 않으며, domain.md를 직접 수정하지 않는다.

## 도구의 한계 (사용자에게 노출)

본 머지 스킬은 LLM 추론으로 SSOT를 변형한다. Structured digest와 검증 페르소나로 위험을
통제하지만, 의미 보존을 100% 보장하지 않는다. dry-run plan을 신중히 검토하고,
의심스러우면 abort하라.

---

## 결정 요청 형식 (decision-flow SSOT)

domain.md(설계 문서 SSOT)에 기록될 결정(의미 충돌 채택, 새 섹션 위치, 정책 ID 부여 방식 등 선택지 2개 이상)은 `decision-flow.md`의 결정 박스(D)와 순차 흐름을 따른다. 첫 결정 요청 전에 해당 파일을 Read한다 — `${CLAUDE_PLUGIN_ROOT}/skills/workflow-orchestrator/decision-flow.md` 우선, 미확보 시 `find "$HOME/.claude/plugins" -path "*dev-workflow*/skills/workflow-orchestrator/decision-flow.md" -not -path "*/worktrees/*" -type f | head -1`로 탐색 (리포 상대경로 금지). 본 스킬의 고정 게이트 템플릿(digest 확인, dry-run 승인, resolution 4지 등)은 SSOT의 '로컬 템플릿 우선' 규칙에 따라 문서 그대로 사용한다.

적용 범위: dry-run의 [사용자 결정 항목] 목록이 사전 브리핑(F)을 대체하는 로컬 템플릿이며, 개별 결정 요청에만 결정 박스(D)를 적용한다. 한 줄 헤더(B)·재논의 대기열은 적용하지 않는다 — 본 스킬의 게이트 흐름은 이미 순차 구조이고 충돌 처리는 자체 In-session Resolution(REQ-010)이 담당한다 (SSOT '적용 예외' 해당).

---

## 진입 흐름

0. **경로 해소**: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인 (상세: development-principles "경로 해소 규칙" 참조). 이후 모든 `docs/design/` 참조는 [해소된 경로]를 사용한다
1. **Pre-flight (git-mode)**: `git status`로 [해소된 경로] 하위 미커밋 변경을 확인한다 → 존재 시 경고하고 커밋/스태시를 유도한다. 사용자가 정리를 확인하기 전에는 (4) 적용 단계에 진입하지 않는다
2. ARGUMENTS 해석 (자세한 옵션 처리는 아래 "옵션 처리" 섹션 참조)
3. 대상 카테고리 결정:
   - ARGUMENTS에 카테고리명이 있으면 그것을 사용
   - 없으면 사용자에게 카테고리 선택 (인터랙티브). 선택지에 `0. 전체 — 모든 카테고리 스캔`을 포함한다 (전체 선택 시에만 다중 카테고리 병렬 모드가 후보가 된다)
4. `[해소된 경로]/[카테고리]/**` 스캔하여 `status: complete`인 feature 식별
5. **빈 상태 케이스 (REQ-018)**: 후보 0건이면 한 줄 출력 후 즉시 종료
   `현재 '{category}' 카테고리에 머지 가능한 complete feature가 0건입니다.`
6. **대상 도메인 문서 해소**: `[해소된 경로]/[카테고리]/` 직속 .md 파일을 확인한다
   - 정확히 1개 → 그 문서를 대상 도메인 문서로 사용한다
   - 2개 이상 → 이 시점에는 해소 정책만 선언한다. feature별 대상 도메인 문서 배정은 **(2) feature 학습 완료 후** digest 기반으로 제안하고 사용자 확인을 받는다. 누적 base(REQ-013)는 카테고리 단위가 아닌 **도메인 문서 단위**로 관리한다
   - 0개 (신규 카테고리) → 승격 흐름: 4에서 식별된 후보를 지칭하여 "도메인 문서가 없습니다. [기능명].md를 기반으로 [카테고리].md를 신규 생성할까요?" 확인 후, feature.md를 도메인 형식(시스템 개요·정책·결정 사항·관련 파일·변경 이력)으로 재구성해 생성한다. dry-run·승인 게이트는 머지와 동일하게 적용한다
7. 실행 모드 결정 (병렬/순차) → 5단계 머지 알고리즘 진입

---

## 5단계 머지 알고리즘 (REQ-004)

각 후보 feature에 대해 다음 5단계를 순서대로 실행한다:

(1) **domain.md 학습** — Structured Digest 추출
(2) **feature.md 학습** — Structured Digest 추출
(3) **머지 계획 수립** — 충돌 분류 + Architect 피드백 루프
(4) **적용** — dry-run → 사용자 승인 → domain.md 수정
(5) **검증** — Tech Lead/PM 체크리스트

**digest 사후 고지 노출 정책:** domain 학습 사후 고지는 대상 도메인 문서당 최초 1회만 노출한다. 누적 base 반영을 위한 재학습(두 번째 feature부터)은 내부 재추출로 수행하고 고지를 생략한다 — 변경분은 직전 dry-run 승인에서 이미 검토됐다.

---

## (1) domain.md 학습

domain.md를 읽고 다음 형식의 structured digest를 생성하라.
자유 서술 요약은 **금지**.

전문은 본 스킬의 references/templates.md 「domain_digest YAML 형식」을 Read하여 사용하라.
(Read 실패 시 최소 요건: policies/decisions/requirement_ids/section_index를 ID·statement·source_section 필드로 구조화)

**Idempotent 의무 (REQ-005):**
- 동일 입력에 대해 동일 ID/순서 보장
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (POL-001부터)
- 재학습 시에도 동일한 ID/순서 산출

**누락 처리:**
- policies / decisions / requirement_ids 어느 것이라도 부재 시 해당 필드를 빈 배열로 둔다
- 호환성 첫 머지 체크리스트(아래 "호환성 첫 머지 체크리스트" 섹션 참조)에 따라 후속 처리

**Fallback (REQ-026):**
- domain.md 토큰이 80K를 초과하면 섹션 단위 분할 학습으로 fallback
- 섹션 인덱스로 부분 로드 → 각 섹션의 digest를 합쳐서 domain_digest 구성
- 토큰 추정: `file_size_bytes / 3.5` (고정 상수 — 한·영 혼합 평균 근사, 임계값 트리거 용도로 충분)

**digest 사후 고지 (REQ-005 개정):**

domain digest 산출 직후 답을 요구하지 않는 1줄로 고지한다.

전문은 본 스킬의 references/templates.md 「domain digest 사후 고지 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: `📄 digest 추출 완료 — 정책 [N]건·결정 [M]건` 형식 1줄 고지 + 이의 제기 시 digest 노출·수정·재추출)

사용자가 이의를 제기하면 해당 digest를 즉시 노출하고 수정 반영 후 재추출한다 (안전망: development-principles "자동 결정 안전망" 참조)

---

## (2) feature.md 학습

각 feature.md에 대해 동일한 structured digest 형식으로 추출한다.
ID prefix는 `F-POL-`, `F-DEC-`를 사용 (domain과 구분).

전문은 본 스킬의 references/templates.md 「feature_digest YAML 형식」을 Read하여 사용하라.
(Read 실패 시 최소 요건: policies/decisions/requirement_ids를 F-POL-/F-DEC- ID·statement·source_section 필드로 구조화)

**Idempotent 의무 (REQ-005):**
- domain.md 학습과 동일한 규칙 적용 (동일 입력 → 동일 ID/순서)
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (F-POL-001부터)

**digest 사후 고지 (REQ-005 개정):**

feature digest 산출 직후 답을 요구하지 않는 1줄로 고지한다 (domain과 동일 패턴).
복수 feature가 있을 경우, **카테고리당 1회로 묶어 고지** (인지 부담 절감).

전문은 본 스킬의 references/templates.md 「feature digest 사후 고지 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: `📄 digest 추출 완료 — 정책 [N]건·결정 [M]건` 형식 1줄 고지 + 이의 제기 시 digest 노출·수정·재추출)

사용자가 이의를 제기하면 해당 feature의 digest를 즉시 노출하고 수정 반영 후 재추출한다 (안전망: development-principles "자동 결정 안전망" 참조)

---

## (3) 머지 계획 수립

학습된 domain_digest와 feature_digest를 비교하여 머지 계획을 생성한다.

### 충돌 식별 및 분류 (REQ-006)

다음 분류 규칙을 적용한다 (자동 수정 vs 사용자 결정):

| 충돌 유형 | 처리 방식 | 비고 |
|---|---|---|
| ID 중복 (REQ-001 등) | 자동 renumbering | 참조 갱신 포함, dry-run에 회계 형식 노출 |
| 표 형식 불일치 (헤더 동일) | 자동 통일 | 컬럼 순서 정렬 |
| 표 형식 불일치 (헤더 다름) | 사용자 결정 | 시맨틱 안전 위해 강등 |
| 충돌 없는 신규 항목 | 자동 append | 새 REQ, 새 모드 |
| 새 섹션 신설 | 사용자 결정 | 위치/이름 |
| 의미 충돌 (정책 vs 정책) | 사용자 결정 | "MMR vs latency" 등 |
| 기존 결정 무효화 (supersede) | 사용자 결정 | 명시적 확인 |
| 의존성 맵 재정의 | 사용자 결정 | 컴포넌트 관계 변경 |
| 분류 애매한 경우 | 사용자 결정 | 보수 원칙 (fallback) |

### Architect 라운드 등급 결정 (REQ-007)

분류 완료 직후, Architect 진입 **전에** 라운드 등급을 결정한다 (외부 분류 규칙).

| 머지 계획 특성 | Architect 라운드 |
|---|---|
| 자동 수정 only + 사용자 결정 0 + append만 | 1 |
| 사용자 결정 1~2건 + 의미 충돌 0 | 2 |
| 사용자 결정 3건 이상 + 의미 충돌 0 | 2 |
| 의미 충돌 ≥ 1 OR 의존성 재정의 OR 기존 결정 무효화 | 3 |

라운드 등급 결정 후 🏛️ Architect 페르소나를 정확히 등급 라운드만큼 실행한다.
각 라운드 종료 시 다음 출력 템플릿 강제 (M = 결정된 라운드 등급):

```
[Round N/M] 검토 결론: PASS | FAIL
- 자동 수정 항목 [건수] 검증 완료
- 사용자 결정 항목 [건수]
- 발견된 우려: [없음 / 항목 나열]
```

- 2라운드 이후는 직전 라운드의 "발견된 우려" 해소 여부를 재검토한다
- "발견된 우려" 중 **차단성 우려**가 있으면 등급을 1단계 자동 승급한다 (이미 등급 3이면 유지 — 차단성 우려 잔존 시 PASS 선언 차단). 판별문: "이 우려가 반영되지 않으면 dry-run 승인을 진행할 수 없는가?" — Yes면 차단성, No면 권고성. 권고성 우려는 승급 없이 dry-run 회계에 1줄로 기록한다. `--review-merge=N` 지정 시 자동 승급보다 N이 우선한다. N은 라운드 수에만 우선한다 — 차단성 우려가 잔존하면 PASS 선언 차단은 N과 무관하게 유지된다.
- 최종 라운드가 FAIL이면 In-session Resolution(REQ-010) 4지 선택지로 라우팅한다

---

## (4) 적용

머지 계획 + Architect 검증 통과 후 적용 단계로 진입.

### Dry-run plan 생성 (REQ-009)

자동 수정 항목도 **회계 형식**으로 노출한다 (사용자가 사후 검증 가능):

전문은 본 스킬의 references/templates.md 「dry-run plan 예시」를 Read하여 사용하라.
(Read 실패 시 최소 요건: 자동 수정 항목 회계 형식 + 사용자 결정 항목 목록 + 삭제 고지 + 커밋 미리보기 + Yes/No)

**결정 해소 순서:** [사용자 결정 항목]은 dry-run에 목록으로만 표시한다. 승인 질문 전에 각 항목을 decision-flow의 결정 박스(D)로 한 번에 하나씩 해소하고, 전부 해소된 최종 계획으로 dry-run을 갱신 표시한 뒤 "이대로 진행할까요?" 승인을 받는다.

### 실제 적용

사용자 승인 후:
1. **no-git-mode 체크포인트**: domain.md 수정 직전에 같은 디렉토리에 `[도메인 문서명].premerge-YYYYMMDD.bak`을 생성한다 (git-mode는 git이 복원 수단이므로 생략). 세션 정상 종료 시 체크포인트 파일을 정리한다
2. domain.md 수정
3. 섹션 10 변경 이력 자동 추가 (REQ-020): `| YYYY-MM-DD | {feature-name} 통합 (작성자: {git_author}) | {affected_sections} | 완료 |`
4. (5) 검증 단계로 이동

---

## (5) 검증

(4) 적용 직후 검증 단계를 실행한다.

**페르소나 분리 (REQ-008):**
검증은 🔧 Tech Lead 또는 📋 PM 페르소나가 담당한다. 🏛️ Architect와 분리하여
자기 검증 사각지대 회피.

### 검증 체크리스트

검증 첫 단계로 **머지된 domain.md를 (1)과 동일한 규칙으로 재학습하여 post-merge digest를 산출한다** (내부 재추출, 게이트 없음).

| 항목 | 검증 방법 |
|---|---|
| 정책 보존 | pre-merge digest의 각 정책이 post-merge digest에 **statement 단위**로 존재하는지 매칭. ID 집합 비교는 명시 ID 컬럼이 영구화된 문서에서만 사용한다 (위치 기반 자동 ID는 새 항목 삽입으로 밀릴 수 있어 단독 비교 기준으로 쓰지 않는다) |
| supersede 없는 정책 누락 X | 명시적 supersede 없이 사라진 정책 없는지 확인 |
| 섹션 10 변경 이력 행 추가 | 자동 추가된 행이 정확한 포맷인지 확인 |
| 라인 수 변화율 ±50% 이내 | 대량 손실 탐지 |

**통과 시 (feature 단위 확정):**
1. 머지 결과(domain.md 수정 + 섹션 10)를 즉시 커밋한다 — 메시지 규약: `docs(merge): {category} ← {feature}` (dry-run 승인이 이 커밋에 대한 동의다)
2. 직후 커밋으로 feature 디렉토리를 삭제한다 — 메시지 규약: `docs(merge): remove {feature} after merge` (REQ-019 — no-git-mode는 삭제 직전 확인 1회). 되돌릴 때는 머지+삭제 커밋 2건을 쌍으로 revert한다
3. 다음 feature로 진행한다 (누적 base = **해당 대상 도메인 문서**의 방금 커밋된 상태)
4. no-git-mode: 커밋 단계는 생략하며 수정된 파일 자체가 누적 base가 된다. 해당 도메인 문서의 체크포인트는 정리하고, 다음 feature의 (4) 적용 직전에 재생성한다

**실패 항목 발견 시:**
1. in-session resolution 4지 선택지 노출 (REQ-010)
2. skip 또는 abort 선택 시 domain.md를 pre-merge 상태로 복원한다 — git-mode: `git checkout -- [도메인 문서]`, no-git-mode: 체크포인트 파일 복원
3. 복원 완료를 확인한 뒤에만 다음 feature로 진행한다 (부분 재작성 상태가 누적 base 체인을 오염시키지 않도록)

---

## 실행 모드 결정 (REQ-015)

후보 식별 직후, 다음 알고리즘으로 실행 모드를 결정한다:

```
total_bytes = sum(file_size(domain.md) + file_size(f.md) for f in candidates)
estimated_tokens = total_bytes / 3.5  # 고정 상수
feature_count = len(candidates)
category_count = len(target_categories)

if category_count == 1:
    mode = "sequential"  # 단일 카테고리는 feature 수와 무관하게 항상 순차 (REQ-013 카테고리 내 직렬)
elif feature_count < 3 AND estimated_tokens < 20K:
    mode = "sequential"
elif feature_count >= 5 OR estimated_tokens > 50K:
    mode = "parallel"    # 카테고리 단위 2-pass 병렬 (REQ-016 참조)
else:
    mode = ask_user_3way(default="자동위임")
```

병렬 모드는 진입 흐름 3에서 "전체 — 모든 카테고리 스캔"을 선택해 대상 카테고리가 2개 이상일 때만 후보가 된다.

사용자 3지 선택지 출력:
```
머지 후보 N개 (예상 토큰 ~XK). 실행 모드를 선택하세요:

1. 순차 (안전, 약간 느림)
2. 병렬 (빠름, 풀 크기 3)
3. 자동위임 — 시스템이 보수적으로 결정 (기본)
```

`자동위임` 선택 시 → 시스템이 보수적으로 순차로 결정.

---

## 카테고리 직렬/병렬 정책

### 카테고리 내 직렬 (REQ-013) — 누적 base

같은 카테고리의 후보들은 git log main 머지 순서 기준으로 직렬 처리.
직전 머지 결과를 다음 머지의 base로 사용 (누적 base).
카테고리에 도메인 문서가 복수인 경우 누적 base 체인은 **도메인 문서별로 독립 관리**된다 (진입 흐름 6) — 연속한 두 feature가 서로 다른 도메인 문서를 대상으로 하면 서로의 base에 영향을 주지 않는다.

```
카테고리 A 내부 (시작 순서):
  f1 → A.md(v0) base로 머지 → A.md(v1)
  f2 → A.md(v1) base로 머지 → A.md(v2)
  f3 → A.md(v2) base로 머지 → A.md(v3)
```

`no-git-mode`에서는 파일 mtime 기준으로 fallback.

### 카테고리 간 병렬 (REQ-014)

서로 다른 카테고리는 서브에이전트 풀로 병렬 처리.
풀 크기 기본값 3, 상한 5 (고정 — brainstorming Enhanced Mode 검증 범위).
처리 완료 시 다음 후보를 즉시 투입 (rolling pool).

---

## 병렬 모드 2-pass 프로토콜 (REQ-016)

서브에이전트는 사용자와 대화할 수 없고 일시정지/재개도 불가능하므로, 병렬 모드는 2-pass로 실행한다:

- **Pass 1 (병렬)**: 카테고리별 서브에이전트가 (1)(2) 학습(digest 추출)과 (3) 충돌 분류까지만 수행하고, digest·머지 계획 초안·"사용자 결정 항목 목록"을 반환한다. 서브에이전트는 사용자에게 질문하거나 파일을 수정하지 않는다
- **digest 사후 고지 (메인, 직렬)**: 결정 해소 전, 메인 컨텍스트가 Pass 1이 반환한 domain digest를 **대상 도메인 문서당 1회** 사후 고지로 노출한다. feature digest는 카테고리당 1회 묶음으로 노출한다. 사용자가 이의를 제기하면 메인이 직접 재추출한다
- **결정 해소 (메인, 직렬)**: 메인 컨텍스트가 카테고리 시작 순서(FIFO)대로 결정 항목을 **한 번에 1개**씩 사용자에게 노출해 해소한다
- **Pass 2 (메인, 직렬)**: 해소된 계획으로 (4) 적용과 (5) 검증을 카테고리별로 직렬 실행한다 — SSOT 파일 수정은 병렬화하지 않는다

## 출력 버퍼 flush 규칙 (REQ-017)

본 규칙은 **Pass 1 반환물**(digest·머지 계획 초안·결정 항목 목록)의 노출 순서에 적용된다 — Pass 2는 메인 직렬 실행이라 자연 충족된다.

병렬 모드의 결과 출력 순서를 안정화한다:

- 각 카테고리 결과를 메인이 buffer에 보관
- flush 순서: 카테고리 시작 순서 (git log main 머지 순서)
- 시작 순서가 빠른 카테고리가 진행 중이면 후속 출력 보류
- 실시간 인터리브 금지

```
시작 순서: A → B → C
완료 순서: C → A → B  (각자 다른 속도)

올바른 출력 순서 (시작 순서 기준):
[A 결과] [B 결과] [C 결과]
```

---

## 옵션 처리

### 옵션 플래그 (REQ-023)

| 플래그 | 의미 |
|---|---|
| `--no-review` | Architect 피드백 루프 강제 차단 (긴급 핫픽스용, 사용자 책임) |
| `--review-merge=N` | 라운드 수를 정확값 N으로 강제 (디버깅 모드) |
| `--auto` | 자동 모드 (자동 수정 항목의 사후 확인 생략). 사용자 결정 항목은 여전히 질문 |

### ARGUMENTS 처리 규칙

스킬은 다음 우선순위로 ARGUMENTS를 해석한다:

1. **알려진 플래그 (`--auto`, `--no-review`, `--review-merge=N`) 매칭** → 해당 모드 활성
2. **알려지지 않은 텍스트** → 카테고리명으로 간주
3. **ARGUMENTS 비어있음** → 인터랙티브 fallback (REQ-023)

### 인터랙티브 fallback

자동완성 즉시 실행 환경에서 ARGUMENTS가 비어있거나 모르는 키워드일 경우:

전문은 본 스킬의 references/templates.md 「인터랙티브 fallback 메뉴」를 Read하여 사용하라.
(Read 실패 시 최소 요건: 기본/자동모드/리뷰차단/커스텀 4택 메뉴 출력)

4(커스텀) 선택 시 각 옵션을 개별로 묻는다.

### 자동 모드 키워드 보조 인식 (REQ-024)

ARGUMENTS에 다음 키워드가 발견되면 자동 모드로 진입하고 고지한다:

전문은 본 스킬의 references/templates.md 「자동 모드 키워드 표 + confirm 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: 한/영 자동모드 키워드 매칭 표 + 진입 고지 1줄)

진입 고지: (위 Read 지시와 동일 블록)

**자동 모드 의미 경계 (REQ-024):**
- 자동 수정 항목의 사후 확인을 생략한다
- 사용자 결정 필요 항목은 여전히 질문한다 (SSOT 손상 위험 차단)
- **dry-run 승인 게이트는 `--auto`, `--no-review`, 키워드 자동 모드 등 어떤 플래그 조합에서도 생략할 수 없다** — 자동 모드가 생략하는 것은 자동 수정 항목의 항목별 사후 확인뿐이다
- 세션 종료 시 자동 리셋, 파일 저장 없음

---

## 호환성 첫 머지 체크리스트 (REQ-022)

기존 도메인 문서를 처음 만나는 경우 해당 도메인에서 1회만 발동한다.

전문은 본 스킬의 references/templates.md 「호환성 첫 머지 체크리스트 표」를 Read하여 사용하라.
(Read 실패 시 최소 요건: 섹션10 시작행 자동, ID는 사용자 결정, 의존성 맵은 필요시만)

체크리스트 발동 시 사용자에게 한 줄 안내: (위 Read 지시와 동일 블록)

---

## In-session Resolution (REQ-010)

머지 단계 어디서든 실패가 발생하면 **abort보다 in-session resolution을 우선한다**.
실패 시 다음 4지 선택지 노출:

전문은 본 스킬의 references/templates.md 「resolution 4지 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: Tech Lead 재투입/직접 수정/skip(보존)/abort 4지)

### Skip 정책 (REQ-011)

3(skip) 선택 시:
- 해당 feature 디렉토리는 **삭제하지 않고 보존**
- 다음 머지 세션에서 자연스럽게 후보로 재등장
- skip 사유는 사용자가 기억 (별도 기록 없음, Phase 2 결정)
- 누적 base는 직전 성공 머지 결과 유지 (skip된 feature는 base에 반영 안 됨)

### Abort 정책

4(abort) 선택 또는 사용자 명시 abort 발화 시:
- 머지 세션 전체 중단
- 미커밋 상태의 도메인 문서 변경은 머지가 건드린 파일에 한정해 복원한다 — git-mode: `git checkout -- [도메인 문서]`, no-git-mode: 체크포인트 파일 복원. **전체 `git reset`은 사용하지 않는다** (사용자의 다른 미커밋 작업 보호)
- 이미 feature 단위로 커밋된 머지는 유지한다 — 되돌리려면 커밋 메시지 접두(`docs(merge):`)를 확인한 후 해당 커밋만 revert한다
- 진행 중이던 서브에이전트 작업 결과는 폐기한다

## 충돌 시 사용자 질문 우선 (REQ-012)

(3) 머지 계획에서 식별된 **의미 충돌은 항상 사용자 결정 항목이다** — 어떤 플래그 조합에서도 자동 처리될 수 없다.
`--auto`와 사전 승인 키워드가 생략하는 것은 자동 수정 항목의 항목별 사후 확인뿐이다 (REQ-024 의미 경계).

---

## 부수 동작

### Feature 디렉토리 삭제 (REQ-019)

머지 성공 + (5) 검증 통과 시 (삭제 순서는 (5) 검증의 "통과 시" 절차를 따른다 — 머지 결과를 먼저 커밋한 후 직후 커밋으로 삭제):
- feature 디렉토리를 통째로 삭제 (`docs/design/[category]/[feature]/`)
- phase 파일, plan.md, [feature].md, seed.yaml 모두 삭제
- git-mode: 역사적 맥락은 git log에 위임, _archive 보존 없음
- no-git-mode: 삭제 직전 확인 1회를 요구한다 — "[기능명] 디렉토리를 삭제합니다. git 히스토리가 없어 복구할 수 없습니다. 진행할까요? 1. Yes 2. No (보존)"

skip된 feature는 디렉토리 보존 (위 In-session Resolution 참조).

### 섹션 10 변경 이력 자동 기록 (REQ-020)

(4) 적용 직후, domain.md의 섹션 10에 다음 형식의 행을 추가:

```
| YYYY-MM-DD | {feature-name} 통합 (작성자: {git_author}) | {affected_sections} | 완료 |
```

- `{git_author}`: 해당 feature 디렉토리의 git log 최초 작성자 (git-mode 한정, no-git-mode는 "-" 표시)
- `{affected_sections}`: 머지 계획에서 수정된 섹션 목록 (쉼표 구분)
- skip / abort는 기록하지 않음 (자연 재시도로 충분)

### 머지 세션 종료 inline 요약 (REQ-021)

세션 종료 시 다음 형식의 inline 요약 출력 (휘발 허용):

전문은 본 스킬의 references/templates.md 「재논의(대기열) 노출·요약 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: 완료/skip/abort 건수와 feature명을 나열)

---

## Concurrency (REQ-025)

별도 동시성 메커니즘을 두지 않는다 — **git native 메커니즘에 위임**.

- 머지 결과 → `git add` + `git commit` (로컬, feature 단위 — (5) 검증 "통과 시" 절차). dry-run 승인을 해당 머지의 커밋 동의로 간주한다 (dry-run에 커밋 메시지 미리보기 포함)
- push는 사용자가 명시 요청할 때만 실행한다
- push 시 rejected 발생 → 사용자가 git native 메커니즘으로 해결 (rebase/merge)
- 머지 스킬은 git error를 사용자에게 그대로 노출
- **이 위임은 git-mode 한정이다.** no-git-mode에서는 동시 머지 세션을 감지할 수 없으므로 단일 관리자 세션에서만 실행하라

별도 SHA 비교, 락 메커니즘, 시작 시점 스냅샷 체크 등 추가 안전장치 없음. 단 진입 흐름 1의 pre-flight(더티 워킹 트리 확인)와 (4) 적용의 no-git 체크포인트는 예외적으로 강제한다.
