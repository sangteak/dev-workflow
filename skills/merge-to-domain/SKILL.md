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

## 진입 흐름

1. ARGUMENTS 해석 (자세한 옵션 처리는 후속 Task에서 추가될 "옵션 처리" 섹션 참조)
2. 대상 카테고리 결정:
   - ARGUMENTS에 카테고리명이 있으면 그것을 사용
   - 없으면 사용자에게 카테고리 선택 (인터랙티브)
3. `docs/design/[카테고리]/**` 스캔하여 `status: complete`인 feature 식별
4. **빈 상태 케이스 (REQ-018)**: 후보 0건이면 한 줄 출력 후 즉시 종료
   `현재 '{category}' 카테고리에 머지 가능한 complete feature가 0건입니다.`
5. 후보가 있으면 실행 모드 결정 (병렬/순차) → 5단계 머지 알고리즘 진입

---

## 5단계 머지 알고리즘

각 후보 feature에 대해 다음 5단계를 순서대로 실행한다:

(1) **domain.md 학습** — Structured Digest 추출
(2) **feature.md 학습** — Structured Digest 추출
(3) **머지 계획 수립** — 충돌 분류 + Architect 피드백 루프
(4) **적용** — dry-run → 사용자 승인 → domain.md 수정
(5) **검증** — Tech Lead/PM 체크리스트

---

## (1) domain.md 학습

domain.md를 읽고 다음 형식의 structured digest를 생성하라.
자유 서술 요약은 **금지**.

```yaml
domain_digest:
  policies:
    - id: POL-001
      statement: "..."
      source_section: "..."
      immutability_level: high | medium | low
  decisions:
    - id: DEC-001
      statement: "..."
      supersedes: null  # 또는 이전 결정 ID
  requirement_ids: [REQ-001, REQ-002, ...]
  section_index:
    "1. 배경": [1, 15]
    "4. 설계 개요": [50, 120]
```

**Idempotent 의무 (REQ-005):**
- 동일 입력에 대해 동일 ID/순서 보장
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (POL-001부터)
- 재학습 시에도 동일한 ID/순서 산출

**누락 처리:**
- policies / decisions / requirement_ids 어느 것이라도 부재 시 해당 필드를 빈 배열로 둔다
- 호환성 첫 머지 체크리스트(후속 Task에서 추가될 "호환성 첫 머지" 섹션 참조)에 따라 후속 처리

**Fallback (REQ-026):**
- domain.md 토큰이 80K를 초과하면 섹션 단위 분할 학습으로 fallback
- 섹션 인덱스로 부분 로드 → 각 섹션의 digest를 합쳐서 domain_digest 구성
- 토큰 추정: `file_size_bytes / 3.5` (`MERGE_TOKEN_DIVISOR` 환경 변수로 조정)

**학습 단계 사용자 게이트 (REQ-005):**

domain digest 산출 직후 사용자에게 검토 요청:

```
── domain.md 학습 결과 (digest) ───────────

추출된 정책: [요약 출력]
추출된 결정: [요약 출력]
요구사항 ID: [REQ ID 범위]
섹션 인덱스: [섹션명 목록]

이렇게 해석이 맞나요?

1. Yes
2. 수정 필요
```

"수정 필요" 선택 시 → 사용자에게 어느 부분이 잘못되었는지 받고 재추출.

---

## (2) feature.md 학습

각 feature.md에 대해 동일한 structured digest 형식으로 추출한다.
ID prefix는 `F-POL-`, `F-DEC-`를 사용 (domain과 구분).

```yaml
feature_digest:
  policies:
    - id: F-POL-001
      statement: "..."
      source_section: "..."
  decisions:
    - id: F-DEC-001
      statement: "..."
  requirement_ids: [REQ-001, ...]  # feature가 사용하는 REQ ID (domain과 충돌 가능)
```

**Idempotent 의무 (REQ-005):**
- domain.md 학습과 동일한 규칙 적용 (동일 입력 → 동일 ID/순서)
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (F-POL-001부터)

**학습 단계 사용자 게이트 (REQ-005):**

feature digest 산출 직후 사용자에게 검토 요청 (domain과 동일 패턴).
복수 feature가 있을 경우, **카테고리당 1회로 묶어 표시** (인지 부담 절감).

```
── feature.md 학습 결과 (digest) ───────────

[feature-A]
  정책: [요약 출력]
  결정: [요약 출력]
  요구사항 ID: [REQ ID 범위]

[feature-B]
  정책: [요약 출력]
  결정: [요약 출력]
  요구사항 ID: [REQ ID 범위]

...

이렇게 해석이 맞나요?

1. Yes
2. 수정 필요
```

"수정 필요" 선택 시 → 어느 feature의 어느 부분이 잘못되었는지 받고 해당 feature만 재추출.

---

## (3) 머지 계획 수립

학습된 domain_digest와 feature_digest를 비교하여 머지 계획을 생성한다.

### 충돌 식별 및 분류

다음 분류 규칙을 적용한다:

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
| 의미 충돌 ≥ 1 OR 의존성 재정의 OR 기존 결정 무효화 | 3 |

라운드 등급 결정 후 🏛️ Architect 페르소나를 정확히 N라운드 실행한다.
1라운드 종료 시 다음 출력 템플릿 강제:

```
[Round 1/1] 검토 결론: PASS | FAIL
- 자동 수정 항목 N건 검증 완료
- 사용자 결정 항목 M건
- 발견된 우려: [없음 / 항목 나열]
```

"발견된 우려"가 비어있지 않으면 자동 2라운드 승급 (PASS 선언 강제 차단).

---

## (4) 적용

머지 계획 + Architect 검증 통과 후 적용 단계로 진입.

### Dry-run plan 생성 (REQ-009)

자동 수정 항목도 **회계 형식**으로 노출한다 (사용자가 사후 검증 가능):

```
── 머지 계획 (dry-run) ────────────────────────────

대상: matchmaking.md (도메인)
머지 후보: rating-system, br-mode-system

[자동 수정 항목 — 회계 형식]
- feature.REQ-001 → domain.REQ-008 (renumbering)
  참조 갱신: feature.md 섹션 4 (2건), 섹션 6 (1건)
- 표 형식 통일: 의존성 맵 컬럼 순서

[사용자 결정 항목]
1. 의미 충돌: domain의 "MMR 기준" vs feature의 "latency 기준"
   → 어느 정책을 채택하시겠습니까?
2. 새 섹션 "보안 고려사항" 신설 위치
   → 11번 섹션? 7번 다음? 다른 위치?

이대로 진행할까요?
1. Yes
2. No (abort)
```

### 실제 적용

사용자 승인 후:
1. domain.md 수정
2. 섹션 10 변경 이력 자동 추가 (REQ-020): `| YYYY-MM-DD | {feature-name} 통합 (작성자: {git_author}) | {affected_sections} | 완료 |`
3. (5) 검증 단계로 이동

---

## (5) 검증

(4) 적용 직후 검증 단계를 실행한다.

**페르소나 분리 (REQ-008):**
검증은 🔧 Tech Lead 또는 📋 PM 페르소나가 담당한다. 🏛️ Architect와 분리하여
자기 검증 사각지대 회피.

### 검증 체크리스트

| 항목 | 검증 방법 |
|---|---|
| 정책 ID 보존 | pre-merge domain_digest의 policy ID 집합 ⊆ post-merge digest |
| supersede 없는 정책 누락 X | 명시적 supersede 없이 사라진 정책 없는지 확인 |
| 섹션 10 변경 이력 행 추가 | 자동 추가된 행이 정확한 포맷인지 확인 |
| 라인 수 변화율 ±50% 이내 | 대량 손실 탐지 |

모든 항목 통과 → 머지 확정 (feature 디렉토리 삭제).
실패 항목 발견 → in-session resolution 4지 선택지 노출.

---

## 실행 모드 결정 (REQ-015)

후보 식별 직후, 다음 알고리즘으로 실행 모드를 결정한다:

```
total_bytes = sum(file_size(domain.md) + file_size(f.md) for f in candidates)
estimated_tokens = total_bytes / 3.5  # MERGE_TOKEN_DIVISOR 환경 변수 적용
feature_count = len(candidates)

if feature_count < 3 AND estimated_tokens < 20K:
    mode = "sequential"  # 메인 세션 순차
elif feature_count >= 5 OR estimated_tokens > 50K:
    mode = "parallel"    # 서브에이전트 풀
else:
    mode = ask_user_3way(default="자동위임")
```

사용자 3지 선택지 출력:
```
머지 후보 N개 (예상 토큰 ~XK). 실행 모드를 선택하세요:

1. 순차 (안전, 약간 느림)
2. 병렬 (빠름, 풀 크기 {MERGE_POOL_SIZE})
3. 자동위임 — 시스템이 보수적으로 결정 (기본)
```

`자동위임` 선택 시 → 시스템이 보수적으로 순차로 결정.

---

## 카테고리 직렬/병렬 정책

### 카테고리 내 직렬 (REQ-013) — 누적 base

같은 카테고리의 후보들은 git log main 머지 순서 기준으로 직렬 처리.
직전 머지 결과를 다음 머지의 base로 사용 (누적 base).

```
카테고리 A 내부 (시작 순서):
  f1 → A.md(v0) base로 머지 → A.md(v1)
  f2 → A.md(v1) base로 머지 → A.md(v2)
  f3 → A.md(v2) base로 머지 → A.md(v3)
```

`no-git-mode`에서는 파일 mtime 기준으로 fallback.

### 카테고리 간 병렬 (REQ-014)

서로 다른 카테고리는 서브에이전트 풀로 병렬 처리.
풀 크기 기본값 3, 상한 5. `MERGE_POOL_SIZE` 환경 변수로 조정 가능.
처리 완료 시 다음 후보를 즉시 투입 (rolling pool).

---

## 사용자 결정 큐 노출 규칙 (REQ-016)

병렬 모드에서 여러 카테고리가 동시에 사용자 결정이 필요할 수 있다.
다음 규칙을 적용한다:

- 카테고리 워커가 "사용자 결정 필요" 항목 도달 시 **메인 큐에 push** (FIFO)
- 메인 컨텍스트는 큐에서 **한 번에 1개**만 꺼내 사용자에게 노출
- 사용자 응답 후 해당 카테고리 워커는 재개 → 다음 큐 항목 노출
- 다른 카테고리는 결정 대기 동안 정상 진행 (block 안 됨)

## 출력 버퍼 flush 규칙 (REQ-017)

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

<!-- 후속 Task에서 추가될 섹션 (forward reference):
     - 옵션 처리 (ARGUMENTS, --auto 플래그, 자동 모드 발화)
     - 호환성 첫 머지 체크리스트
     - In-session Resolution 정책 (실패 시 4지 선택)
-->
