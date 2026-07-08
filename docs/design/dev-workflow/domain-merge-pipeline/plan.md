# domain-merge-pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dev-workflow 플러그인에 관리자 트리거 intelligent domain 머지 파이프라인 (`merge-to-domain` 스킬)을 추가하고 기존 `document-consolidation`/`workflow-orchestrator`를 새 책임 경계에 맞춰 단순화한다.

**Architecture:** Markdown 전용 플러그인 — 코드 없이 SKILL.md/commands/메타 파일만으로 구현. 신규 스킬 + 명령을 추가하고 기존 스킬에서 책임을 비우는 방향. 5단계 머지 알고리즘 (학습 → 학습 → 계획 → 적용 → 검증) + Architect 라운드 적응형 + 카테고리 단위 직렬/병렬 + Structured Digest + dry-run 안전 게이트.

**Tech Stack:** Markdown (SKILL.md, commands/*.md), YAML frontmatter, dev-workflow 컨벤션 (10섹션 표준 설계 문서, 카테고리/feature 구조), 페르소나 시스템 (🏛️ Plugin Architect / 🔧 Tech Lead / 📋 PM), Ouroboros 에이전트 (Path B Enhanced Mode).

**검증 방식:** Markdown 플러그인이므로 자동 테스트 없음. 각 task 종료 시 (a) 파일 내용 자가 검토, (b) 관련 다른 스킬과의 일관성 확인, (c) 필요 시 dry-run 시나리오 시뮬레이션을 통해 검증.

---

## File Structure

**신규 파일 (2개):**
- Create: `skills/merge-to-domain/SKILL.md` — 신규 머지 스킬 본문
- Create: `commands/merge-to-domain.md` — 슬래시 명령 진입점

**변경 파일 (3개):**
- Modify: `skills/document-consolidation/SKILL.md` — Mode 1 단순화 + Mode 3 deprecate
- Modify: `skills/workflow-orchestrator/SKILL.md` — Completion Protocol Step 1 호출 결과 처리 갱신
- Modify: `skills/context-handling/SKILL.md` — resume 모드에 complete feature 카운트 알림 추가

**메타 갱신 파일 (3개):**
- Modify: `CLAUDE.md` — 스킬 수, Commands 표, "자기-도그푸딩 가이드"
- Modify: `.claude-plugin/plugin.json` — MINOR 버전 업
- Modify: `.claude-plugin/marketplace.json` — MINOR 버전 업

**검증 산출물 (1개):**
- Create: `docs/design/dev-workflow/domain-merge-pipeline/dryrun-document-management.md` — 가상 머지 시뮬레이션 결과 (Task 8 산출물)

---

### Task 1: document-consolidation Mode 1 단순화 + Mode 3 deprecate

**Files:**
- Modify: `skills/document-consolidation/SKILL.md`

**책임 변경:** Mode 1 (consolidate-main)에서 domain 머지 제안 로직을 제거. Mode 3 (consolidate-domain) 전체를 deprecated 표시.

- [ ] **Step 1: 기존 SKILL.md 전체 읽고 영향 범위 파악**

Read: `skills/document-consolidation/SKILL.md` 전체
확인 사항:
- Mode 1의 어느 Step에서 domain 머지를 제안하는지 (예: 종료 단계 분기)
- Mode 3 전체 섹션의 위치와 본문
- 다른 스킬 또는 commands가 Mode 3를 직접 호출하는지

- [ ] **Step 2: Mode 1에서 domain 머지 제안 분기 제거**

Mode 1 종료 부분 직전의 "domain 머지를 제안하시겠습니까?" 같은 분기 또는 안내문을 제거.
대신 종료 문구를 다음으로 교체:
```
✅ feature 문서 통합 완료: docs/design/[카테고리]/[기능명]/[기능명].md

도메인 통합은 별도 머지 세션에서 처리됩니다.
(관리자: /dev-workflow:merge-to-domain [카테고리] 호출)
```

- [ ] **Step 3: Mode 3 (consolidate-domain) 섹션에 deprecation 마커 추가**

Mode 3 섹션 본문 최상단에 다음 블록 삽입:
```markdown
> ⚠️ **DEPRECATED**: Mode 3은 v1.9.0부터 폐기 예정입니다.
> 도메인 통합은 `/dev-workflow:merge-to-domain` 명령 (skills/merge-to-domain/SKILL.md)을 사용하세요.
> 다음 릴리스(v2.0.0)에서 본 섹션은 완전히 제거됩니다.
```

본문 자체는 그대로 둠 (사용자가 기존에 호출하는 경로 호환). 단, 내부 분기에서 Mode 3를 자동 발동시키는 부분이 있으면 제거.

- [ ] **Step 4: frontmatter description 갱신**

`description` 필드를 다음으로 수정:
> "Use when development is complete (after REVIEW). Consolidates phase/plan files into the final design document for the current feature. Domain consolidation is now handled by separate `merge-to-domain` skill."

- [ ] **Step 5: 자가 검토 — Mode 1과 Mode 3 사이 의존성 점검**

확인:
- Mode 1 종료 후 Mode 3로 자동 전환되는 흐름이 남아있지 않은가?
- Mode 1의 "Completion Protocol Step 1" 진입점이 여전히 명확한가?
- workflow-orchestrator가 호출할 때 잘못된 응답을 보내지 않는가?

- [ ] **Step 6: Commit**

```bash
git add skills/document-consolidation/SKILL.md
git commit -m "refactor(document-consolidation): remove domain merge from Mode 1, deprecate Mode 3

Mode 1(consolidate-main)에서 domain 머지 제안 로직 제거하여 feature 문서 통합 책임만 유지.
Mode 3(consolidate-domain)은 v1.9.0 deprecated 표시, v2.0.0에서 완전 제거 예정.
도메인 통합은 신규 merge-to-domain 스킬이 전담."
```

---

### Task 2: workflow-orchestrator Completion Protocol 갱신

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md`

**변경:** Completion Protocol Step 1의 호출 결과 처리를 갱신. document-consolidation의 새 책임 경계 반영 + Superpowers Delegation 표의 COMPLETION 행 갱신.

- [ ] **Step 1: 기존 SKILL.md에서 Completion Protocol 섹션 위치 확인**

Read: `skills/workflow-orchestrator/SKILL.md`
다음을 식별:
- "Completion Protocol" 섹션
- Step 1: document-consolidation 호출 부분
- Step 1 결과 처리 분기 (domain 머지 제안 흐름)
- Superpowers Delegation 표

- [ ] **Step 2: Completion Protocol Step 1 갱신**

기존 Step 1 본문을 다음으로 갱신:
```markdown
**Step 1: 문서 취합**
- invoke `dev-workflow:document-consolidation` (consolidate-main 모드)
- 역할: phase/plan 파일을 feature 문서로 통합 후 status를 `complete`로 마킹
- ⚠️ 이 단계에서는 domain.md 머지를 시도하지 않는다 (별도 머지 스킬이 전담)
- 실패 시 → 중단, 사용자에게 상황 보고
```

기존에 "domain 머지를 제안" 같은 분기가 있으면 제거.

- [ ] **Step 3: Completion Protocol 종료 시 안내문 추가**

Step 3 (커밋+푸시) 직후 안내문 추가:
```markdown
**Step 4 (선택, 관리자만): 도메인 통합**
- 작업자는 여기서 작업을 마무리한다
- 관리자는 별도 시점에 `/dev-workflow:merge-to-domain [카테고리]`를 호출하여 도메인 통합 진행
- merge-to-domain 스킬은 docs/design 스캔으로 status=complete feature를 자동 식별
```

- [ ] **Step 4: Superpowers Delegation 표 갱신**

표의 "COMPLETION" 행을 다음으로 수정:
```
| COMPLETION | dev-workflow (Completion Protocol 작업자 측) + dev-workflow (merge-to-domain, 관리자 측) | ❌ 없음 | — |
```

- [ ] **Step 5: 자가 검토 — Completion Protocol 일관성**

확인:
- Step 1 → Step 2 → Step 3 흐름이 끊기지 않는가?
- 작업자 vs 관리자 책임 경계가 명확한가?
- design-doc-index/design-summary 등 다른 스킬과의 호출 관계가 깨지지 않는가?

- [ ] **Step 6: Commit**

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "refactor(workflow-orchestrator): split Completion Protocol responsibilities

Completion Protocol에서 작업자(Step 1~3)와 관리자(Step 4 선택)의 책임을 명확히 분리.
Step 1의 domain 머지 분기 제거. Step 4로 merge-to-domain 안내 추가.
Superpowers Delegation 표의 COMPLETION 행 갱신."
```

---

### Task 3: merge-to-domain SKILL.md — 기본 골격 + 학습 단계 (REQ-001, REQ-004, REQ-005)

**Files:**
- Create: `skills/merge-to-domain/SKILL.md`

**범위:** SKILL.md의 frontmatter, 진입 흐름, (1)(2) 학습 단계 (Structured Digest 산출 + idempotent 규칙 + 학습 게이트).

- [ ] **Step 1: 새 SKILL.md 파일 생성, frontmatter 작성**

Create: `skills/merge-to-domain/SKILL.md`

내용:
```markdown
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
```

- [ ] **Step 2: 진입 흐름 + 빈 상태 처리 작성 (REQ-018)**

이어서 추가:
```markdown
## 진입 흐름

1. ARGUMENTS 해석 (자세한 옵션 처리는 "옵션 처리" 섹션 참조)
2. 대상 카테고리 결정:
   - ARGUMENTS에 카테고리명이 있으면 그것을 사용
   - 없으면 사용자에게 카테고리 선택 (인터랙티브)
3. `docs/design/[카테고리]/**` 스캔하여 `status: complete`인 feature 식별
4. **빈 상태 케이스 (REQ-018)**: 후보 0건이면 한 줄 출력 후 즉시 종료
   ```
   현재 '{category}' 카테고리에 머지 가능한 complete feature가 0건입니다.
   ```
5. 후보가 있으면 실행 모드 결정 (병렬/순차) → 5단계 머지 알고리즘 진입
```

- [ ] **Step 3: 5단계 알고리즘 개요 작성 (REQ-004)**

이어서 추가:
```markdown
## 5단계 머지 알고리즘

각 후보 feature에 대해 다음 5단계를 순서대로 실행한다:

(1) **domain.md 학습** — Structured Digest 추출
(2) **feature.md 학습** — Structured Digest 추출
(3) **머지 계획 수립** — 충돌 분류 + Architect 피드백 루프
(4) **적용** — dry-run → 사용자 승인 → domain.md 수정
(5) **검증** — Tech Lead/PM 체크리스트
```

- [ ] **Step 4: (1) domain.md 학습 단계 작성 (REQ-005)**

이어서 추가:
```markdown
## (1) domain.md 학습

domain.md를 읽고 다음 형식의 structured digest를 생성하라.
자유 서술 요약은 **금지**.

\`\`\`yaml
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
\`\`\`

**Idempotent 의무 (REQ-005):**
- 동일 입력에 대해 동일 ID/순서 보장
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (POL-001부터)
- 재학습 시에도 동일한 ID/순서 산출

**누락 처리:**
- policies / decisions / requirement_ids 어느 것이라도 부재 시 해당 필드를 빈 배열로 둔다
- 호환성 첫 머지 체크리스트(섹션 "호환성 첫 머지" 참조)에 따라 후속 처리

**Fallback (REQ-026):**
- domain.md 토큰이 80K를 초과하면 섹션 단위 분할 학습으로 fallback
- 섹션 인덱스로 부분 로드 → 각 섹션의 digest를 합쳐서 domain_digest 구성
- 토큰 추정: `file_size_bytes / 3.5` (`MERGE_TOKEN_DIVISOR` 환경 변수로 조정)

**학습 단계 사용자 게이트 (REQ-005):**

domain digest 산출 직후 사용자에게 검토 요청:
\`\`\`
── domain.md 학습 결과 (digest) ───────────

추출된 정책: [요약 출력]
추출된 결정: [요약 출력]
요구사항 ID: [REQ ID 범위]
섹션 인덱스: [섹션명 목록]

이렇게 해석이 맞나요?
1. Yes
2. 수정 필요
\`\`\`

"수정 필요" 선택 시 → 사용자에게 어느 부분이 잘못되었는지 받고 재추출.
```

- [ ] **Step 5: (2) feature.md 학습 단계 작성**

이어서 추가:
```markdown
## (2) feature.md 학습

각 feature.md에 대해 동일한 structured digest 형식으로 추출한다.
ID prefix는 `F-POL-`, `F-DEC-`를 사용 (domain과 구분).

\`\`\`yaml
feature_digest:
  policies:
    - id: F-POL-001
      statement: "..."
      source_section: "..."
  decisions:
    - id: F-DEC-001
      statement: "..."
  requirement_ids: [REQ-001, ...]  # feature가 사용하는 REQ ID (domain과 충돌 가능)
\`\`\`

**학습 단계 사용자 게이트 (REQ-005):**

feature digest 산출 직후 사용자에게 검토 요청 (domain과 동일 패턴).
복수 feature가 있을 경우, **카테고리당 1회로 묶어 표시** (인지 부담 절감).
```

- [ ] **Step 6: 자가 검토 — 학습 단계 일관성**

확인:
- domain digest와 feature digest의 ID 부여 규칙이 일관되는가?
- idempotent 의무가 명확히 강제되는가?
- 게이트 출력 형식이 workflow-orchestrator Input Format Rules (번호만, AskUserQuestion X)를 따르는가?

- [ ] **Step 7: Commit**

```bash
git add skills/merge-to-domain/SKILL.md
git commit -m "feat(merge-to-domain): add skill skeleton with learning phase

신규 merge-to-domain 스킬의 frontmatter, 진입 흐름, 5단계 알고리즘 개요,
(1)(2) 학습 단계(Structured Digest + idempotent + 학습 게이트) 추가.
REQ-001, REQ-004, REQ-005, REQ-018, REQ-026 반영."
```

---

### Task 4: merge-to-domain SKILL.md — 머지 계획 + Architect 루프 (REQ-006, REQ-007, REQ-008)

**Files:**
- Modify: `skills/merge-to-domain/SKILL.md`

**범위:** (3) 머지 계획 단계 — 정책 충돌 분류 + Architect 라운드 등급 결정 + (5) 검증 단계의 페르소나 분리.

- [ ] **Step 1: (3) 머지 계획 단계 골격 작성 (REQ-006)**

기존 SKILL.md 본문 끝에 추가:
```markdown
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
```

- [ ] **Step 2: Architect 라운드 등급 규칙 작성 (REQ-007)**

이어서 추가:
```markdown
### Architect 라운드 등급 결정 (REQ-007)

분류 완료 직후, Architect 진입 **전에** 라운드 등급을 결정한다 (외부 분류 규칙).

| 머지 계획 특성 | Architect 라운드 |
|---|---|
| 자동 수정 only + 사용자 결정 0 + append만 | 1 |
| 사용자 결정 1~2건 + 의미 충돌 0 | 2 |
| 의미 충돌 ≥ 1 OR 의존성 재정의 OR 기존 결정 무효화 | 3 |

라운드 등급 결정 후 🏛️ Architect 페르소나를 정확히 N라운드 실행한다.
1라운드 종료 시 다음 출력 템플릿 강제:

\`\`\`
[Round 1/1] 검토 결론: PASS | FAIL
- 자동 수정 항목 N건 검증 완료
- 사용자 결정 항목 M건
- 발견된 우려: [없음 / 항목 나열]
\`\`\`

"발견된 우려"가 비어있지 않으면 자동 2라운드 승급 (PASS 선언 강제 차단).
```

- [ ] **Step 3: (5) 검증 단계 작성 (REQ-008)**

이어서 추가:
```markdown
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
```

- [ ] **Step 4: 자가 검토 — 분류 규칙과 라운드 등급의 일관성**

확인:
- 분류 규칙과 라운드 등급 규칙이 충돌하지 않는가?
- 자동 수정 규칙이 ID renumbering 시 참조 갱신을 포함하는가?
- 검증 페르소나(Tech Lead/PM)와 Architect 페르소나가 명확히 분리되었는가?

- [ ] **Step 5: Commit**

```bash
git add skills/merge-to-domain/SKILL.md
git commit -m "feat(merge-to-domain): add merge planning, Architect loop, and validation

(3) 머지 계획 단계 — 정책 충돌 분류 + Architect 라운드 등급 외부 규칙.
(5) 검증 단계 — Tech Lead/PM 담당 (Architect와 분리), 4건 체크리스트.
REQ-006, REQ-007, REQ-008 반영."
```

---

### Task 5: merge-to-domain SKILL.md — 적용 + 실행 모드 + 직렬화 (REQ-009, REQ-013~017)

**Files:**
- Modify: `skills/merge-to-domain/SKILL.md`

**범위:** (4) 적용 단계 (dry-run 회계 형식), 실행 모드 결정 (복합 임계값), 카테고리 직렬/병렬, 큐 노출 규칙, 출력 버퍼 flush 규칙.

- [ ] **Step 1: (4) 적용 단계 + 회계 형식 dry-run 작성 (REQ-009)**

기존 SKILL.md 본문 끝에 추가:
```markdown
## (4) 적용

머지 계획 + Architect 검증 통과 후 적용 단계로 진입.

### Dry-run plan 생성 (REQ-009)

자동 수정 항목도 **회계 형식**으로 노출한다 (사용자가 사후 검증 가능):

\`\`\`
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
\`\`\`

### 실제 적용

사용자 승인 후:
1. domain.md 수정
2. 섹션 10 변경 이력 자동 추가 (REQ-020): `| YYYY-MM-DD | {feature-name} 통합 (작성자: {git_author}) | {affected_sections} | 완료 |`
3. (5) 검증 단계로 이동
```

- [ ] **Step 2: 실행 모드 결정 알고리즘 작성 (REQ-015)**

이어서 추가:
```markdown
## 실행 모드 결정 (REQ-015)

후보 식별 직후, 다음 알고리즘으로 실행 모드를 결정한다:

\`\`\`
total_bytes = sum(file_size(domain.md) + file_size(f.md) for f in candidates)
estimated_tokens = total_bytes / 3.5  # MERGE_TOKEN_DIVISOR 환경 변수 적용
feature_count = len(candidates)

if feature_count < 3 AND estimated_tokens < 20K:
    mode = "sequential"  # 메인 세션 순차
elif feature_count >= 5 OR estimated_tokens > 50K:
    mode = "parallel"    # 서브에이전트 풀
else:
    mode = ask_user_3way(default="자동위임")
\`\`\`

사용자 3지 선택지 출력:
\`\`\`
머지 후보 N개 (예상 토큰 ~XK). 실행 모드를 선택하세요:

1. 순차 (안전, 약간 느림)
2. 병렬 (빠름, 풀 크기 {MERGE_POOL_SIZE}}
3. 자동위임 — 시스템이 보수적으로 결정 (기본)
\`\`\`

`자동위임` 선택 시 → 시스템이 보수적으로 순차로 결정.
```

- [ ] **Step 3: 카테고리 직렬/병렬 정책 작성 (REQ-013, REQ-014)**

이어서 추가:
```markdown
## 카테고리 직렬/병렬 정책

### 카테고리 내 직렬 (REQ-013) — 누적 base

같은 카테고리의 후보들은 git log main 머지 순서 기준으로 직렬 처리.
직전 머지 결과를 다음 머지의 base로 사용 (누적 base).

\`\`\`
카테고리 A 내부 (시작 순서):
  f1 → A.md(v0) base로 머지 → A.md(v1)
  f2 → A.md(v1) base로 머지 → A.md(v2)
  f3 → A.md(v2) base로 머지 → A.md(v3)
\`\`\`

`no-git-mode`에서는 파일 mtime 기준으로 fallback.

### 카테고리 간 병렬 (REQ-014)

서로 다른 카테고리는 서브에이전트 풀로 병렬 처리.
풀 크기 기본값 3, 상한 5. `MERGE_POOL_SIZE` 환경 변수로 조정 가능.
처리 완료 시 다음 후보를 즉시 투입 (rolling pool).
```

- [ ] **Step 4: 사용자 결정 큐 + 출력 버퍼 flush 규칙 작성 (REQ-016, REQ-017)**

이어서 추가:
```markdown
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

\`\`\`
시작 순서: A → B → C
완료 순서: C → A → B  (각자 다른 속도)

올바른 출력 순서 (시작 순서 기준):
[A 결과] [B 결과] [C 결과]
\`\`\`
```

- [ ] **Step 5: 자가 검토 — 적용/실행 모드 일관성**

확인:
- dry-run plan 회계 형식이 자동 수정 항목을 모두 노출하는가?
- 실행 모드 결정 알고리즘에 모든 경계 케이스가 다뤄지는가?
- 카테고리 직렬/병렬의 결과 일관성이 큐 규칙과 buffer flush 규칙으로 보장되는가?

- [ ] **Step 6: Commit**

```bash
git add skills/merge-to-domain/SKILL.md
git commit -m "feat(merge-to-domain): add application, execution mode, and serialization

(4) 적용 단계 + 회계 형식 dry-run.
실행 모드 결정 (복합 임계값) + 카테고리 직렬/병렬 정책.
사용자 결정 큐 FIFO + 출력 버퍼 flush 규칙.
REQ-009, REQ-013~017 반영."
```

---

### Task 6: merge-to-domain SKILL.md — 옵션 처리 + 호환성 + In-session resolution (REQ-010~012, REQ-019~025)

**Files:**
- Modify: `skills/merge-to-domain/SKILL.md`

**범위:** 옵션 플래그 + 인터랙티브 fallback, 호환성 첫 머지 체크리스트, in-session resolution + skip 정책, 부수 동작 (디렉토리 삭제, 변경 이력, inline 요약), Concurrency 위임.

- [ ] **Step 1: 옵션 처리 작성 (REQ-023, REQ-024)**

기존 SKILL.md 본문 끝에 추가:
```markdown
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

\`\`\`
── merge-to-domain 옵션 ────────────────────

머지 진행 방식을 선택하세요:

1. 기본 (Architect 자동 발동, 자동 수정 확인 요구)
2. 자동 모드 (자동 수정 사후 확인 생략)
3. 리뷰 차단 (Architect 차단, 긴급용)
4. 커스텀 (개별 옵션 선택)

선택: _
\`\`\`

4(커스텀) 선택 시 각 옵션을 개별로 묻는다.

### 자동 모드 키워드 보조 인식 (REQ-024)

ARGUMENTS에 다음 키워드가 발견되면 1차 confirm 발생:

| 한국어 | 영어 |
|---|---|
| "다 자동으로", "자동으로 진행" | "auto mode", "yolo" |
| "이번엔 그냥 진행", "알아서 해" | "all auto", "skip confirms" |
| "yolo", "자동 모드" | "yes to all", "go go" |

확인 출력:
\`\`\`
자동 모드로 전환을 요청하신 것으로 이해했습니다.
남은 머지 후보 N개를 자동 수정 항목까지 사용자 확인 없이 진행할까요?
(사용자 결정 필요 항목은 여전히 질문합니다)

1. Yes — 자동 모드 (이번 세션만)
2. No — 현재 모드 유지
\`\`\`

**자동 모드 의미 경계 (REQ-024):**
- 자동 수정 항목의 사후 확인을 생략한다
- 사용자 결정 필요 항목은 여전히 질문한다 (SSOT 손상 위험 차단)
- 세션 종료 시 자동 리셋, 파일 저장 없음
```

- [ ] **Step 2: 호환성 첫 머지 체크리스트 작성 (REQ-022)**

이어서 추가:
```markdown
## 호환성 첫 머지 체크리스트 (REQ-022)

기존 도메인 문서를 처음 만나는 경우 해당 도메인에서 1회만 발동한다.

| 항목 | 부재 시 처리 |
|---|---|
| 섹션 10 변경 이력 | 시작점 행만 자동 추가 (`| YYYY-MM-DD | 기존 문서 — 신규 머지 시작 이전 | - | - |`). **소급 기록 금지** |
| 정책 ID | 첫 머지에서 사용자 결정 (자동 부여 vs 보존) |
| 의존성 맵 | 머지에 필요한 경우에만 사용자에게 질문 |
| frontmatter | 없어도 진행 (위치로 domain 판별) |

체크리스트 발동 시 사용자에게 한 줄 안내:
\`\`\`
ℹ️ '{category}.md'는 신규 머지 흐름에 처음 진입합니다.
   호환성 체크리스트를 적용합니다.
\`\`\`
```

- [ ] **Step 3: In-session resolution + skip 정책 작성 (REQ-010, REQ-011, REQ-012)**

이어서 추가:
```markdown
## In-session Resolution (REQ-010)

머지 단계 어디서든 실패가 발생하면 **abort보다 in-session resolution을 우선한다**.
실패 시 다음 4지 선택지 노출:

\`\`\`
머지 실패: [실패 단계 + 사유]

어떻게 처리할까요?

1. 🔧 Tech Lead 추가 투입 (재시도)
2. 사용자 직접 수정 (어느 부분을 수정?)
3. 이 feature만 skip (디렉토리 보존, 다음 세션 후보)
4. abort (전체 중단, 사용자 명시 확인 시에만)
\`\`\`

### Skip 정책 (REQ-011)

3(skip) 선택 시:
- 해당 feature 디렉토리는 **삭제하지 않고 보존**
- 다음 머지 세션에서 자연스럽게 후보로 재등장
- skip 사유는 사용자가 기억 (별도 기록 없음, Phase 2 결정)
- 누적 base는 직전 성공 머지 결과 유지 (skip된 feature는 base에 반영 안 됨)

### Abort 정책

4(abort) 선택 또는 사용자 명시 abort 발화 시:
- 머지 세션 전체 중단
- 이미 적용된 변경은 git에 위임 (롤백은 git reset/revert)
- 진행 중이던 워커 즉시 정지

## 충돌 시 사용자 질문 우선 (REQ-012)

(3) 머지 계획에서 식별된 의미 충돌은 기본적으로 사용자 질문을 우선한다.
`--auto` 플래그 또는 사전 승인 키워드 인식 시에만 자동 처리 가능
(단, "자동 수정 항목"만 자동, "사용자 결정 항목"은 여전히 질문 — REQ-024 의미 경계 준수).
```

- [ ] **Step 4: 부수 동작 작성 (REQ-019, REQ-020, REQ-021)**

이어서 추가:
```markdown
## 부수 동작

### Feature 디렉토리 삭제 (REQ-019)

머지 성공 + (5) 검증 통과 시:
- feature 디렉토리를 통째로 삭제 (`docs/design/[category]/[feature]/`)
- phase 파일, plan.md, [feature].md, seed.yaml 모두 삭제
- 역사적 맥락은 git log에 위임
- _archive 보존 없음

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

\`\`\`
머지 세션 완료
  완료: N개 (rating-system, br-mode-system)
  skip: M개 (queue-system — 사유는 사용자 메모)
  abort: K개
\`\`\`
```

- [ ] **Step 5: Concurrency 정책 작성 (REQ-025)**

이어서 추가:
```markdown
## Concurrency (REQ-025)

별도 동시성 메커니즘을 두지 않는다 — **git native 메커니즘에 위임**.

- 머지 결과 → `git add` + `git commit` (로컬)
- push는 별도 단계 (Completion Protocol Step 3 또는 사용자 명시)
- push 시 rejected 발생 → 사용자가 git native 메커니즘으로 해결 (rebase/merge)
- 머지 스킬은 git error를 사용자에게 그대로 노출

별도 SHA 비교, 락 메커니즘, 시작 시점 스냅샷 체크 등 추가 안전장치 없음.
```

- [ ] **Step 6: 자가 검토 — SKILL.md 전체 일관성**

전체 SKILL.md를 처음부터 다시 읽고:
- 모든 REQ가 본문에 명시되었는가?
- 섹션 순서가 5단계 알고리즘 흐름과 일치하는가?
- 출력 형식이 workflow-orchestrator Input Format Rules와 일치하는가?
- 분류 규칙, 라운드 등급, 자동 수정 분류 등이 서로 모순되지 않는가?

- [ ] **Step 7: Commit**

```bash
git add skills/merge-to-domain/SKILL.md
git commit -m "feat(merge-to-domain): add options, compatibility, resolution, side effects

옵션 플래그 + 인터랙티브 fallback + 키워드 보조 인식.
호환성 첫 머지 체크리스트 (REQ-022).
In-session resolution + skip 정책 + abort 정책.
Feature 디렉토리 삭제, 섹션 10 변경 이력, inline 요약.
Concurrency 위임 (git native).
REQ-010~012, REQ-019~025 반영."
```

---

### Task 7: commands/merge-to-domain.md 신규 명령

**Files:**
- Create: `commands/merge-to-domain.md`

**범위:** 슬래시 명령 진입점. 기존 `commands/design-summary.md` 패턴(SKILL.md Read + `{{ARGUMENTS}}` 전달)을 차용.

- [ ] **Step 1: 기존 commands/design-summary.md 패턴 참조**

Read: `commands/design-summary.md`
패턴 확인:
- `description` 필드
- SKILL.md Read 명령
- `{{ARGUMENTS}}` 전달

- [ ] **Step 2: commands/merge-to-domain.md 작성**

Create: `commands/merge-to-domain.md`
내용:
```markdown
---
description: "관리자가 도메인 머지 파이프라인을 호출. 카테고리 하위 status=complete feature 문서들을 카테고리 도메인 문서로 intelligent merge한다."
---

Read the file at `~/.claude/plugins/cache/dev-workflow-marketplace/dev-workflow/[VERSION]/skills/merge-to-domain/SKILL.md` using the Read tool and follow its instructions exactly.

ARGUMENTS: {{ARGUMENTS}}
```

**주의:** 실제 경로의 `[VERSION]`은 플러그인 버전에 맞춰 갱신해야 함. Task 11에서 plugin.json 버전과 함께 조정.

- [ ] **Step 3: 자가 검토 — commands 패턴 일관성**

확인:
- description이 사용자가 자동완성에서 이해할 만큼 명확한가?
- ARGUMENTS 패턴이 design-summary와 일관되는가?
- SKILL.md 경로가 올바른가?

- [ ] **Step 4: Commit**

```bash
git add commands/merge-to-domain.md
git commit -m "feat(commands): add /dev-workflow:merge-to-domain command

관리자가 도메인 머지 스킬을 호출할 수 있는 슬래시 명령 진입점 추가.
ARGUMENTS는 SKILL.md에서 해석 (플래그/카테고리명/인터랙티브 fallback)."
```

---

### Task 8: 가상 머지 dry-run — document-management.md 호환성 검증 (PLAN 산출물)

**Files:**
- Create: `docs/design/dev-workflow/domain-merge-pipeline/dryrun-document-management.md`

**범위:** `document-management.md`를 대상으로 신규 스킬의 5단계 알고리즘을 시뮬레이션하여 호환성 이슈 발견 → SKILL.md에 반영.

- [ ] **Step 1: document-management.md 학습 단계 시뮬레이션**

Read: `docs/design/dev-workflow/document-management.md` 전체
다음 추출 시도:
- structured digest의 policies / decisions / requirement_ids / section_index
- 정책 ID 체계 존재 여부
- 섹션 10 변경 이력 존재 여부
- 의존성 맵 존재 여부

- [ ] **Step 2: 가상 feature 작성**

Create: `docs/design/dev-workflow/domain-merge-pipeline/dryrun-document-management.md`
내용 초안:
```markdown
# 가상 머지 dry-run: document-management.md

## 가상 feature

**feature: doc-search (가상)**

\`\`\`markdown
---
feature: doc-search
category: dev-workflow
status: complete
---

# doc-search 설계 문서

## 3. 확정된 요구사항
- REQ-001: 키워드 기반 검색 지원
- REQ-002: 카테고리별 그룹핑 표시

## 4. 설계 개요
설계 문서 검색은 grep + glob 조합으로 처리한다.
검색 결과는 카테고리별로 그룹핑하여 표시.
\`\`\`
```

- [ ] **Step 3: 5단계 시뮬레이션 결과 기록**

`dryrun-document-management.md`에 5단계 시뮬레이션 결과를 기록:

```markdown
## 5단계 시뮬레이션 결과

### (1) document-management.md 학습
- domain_digest 추출 시도 결과:
  - policies: [발견된 정책 ID 부여 결과]
  - decisions: [발견된 결정 ID 부여 결과]
  - requirement_ids: [REQ ID 발견 또는 부재]
  - section_index: [섹션 시작/끝 라인]

- 발견된 호환성 이슈:
  - [정책 ID 부재 여부]
  - [섹션 10 변경 이력 부재 여부]
  - [기타 발견 사항]

### (2) doc-search 학습
- feature_digest 추출 결과: [내용]

### (3) 머지 계획
- 정책 충돌 식별: [충돌 목록]
- 자동 수정 vs 사용자 결정 분류: [분류 결과]
- Architect 라운드 등급 예상: [1/2/3]

### (4) 적용 (가상)
- dry-run plan 예상 출력: [내용]

### (5) 검증 (가상)
- 체크리스트 통과 여부 예상: [내용]
```

- [ ] **Step 4: 발견된 이슈를 SKILL.md에 반영**

dryrun에서 발견된 이슈를 `skills/merge-to-domain/SKILL.md`의 호환성 첫 머지 체크리스트 섹션에 추가:
- 예: 정책 ID 부재 처리, 섹션 10 부재 처리 흐름 더 구체화
- 예: 의존성 맵 부재 시 사용자 질문 형식

만약 새로운 이슈를 발견하면 SKILL.md에 추가 후 별도 commit.

- [ ] **Step 5: Commit**

```bash
git add docs/design/dev-workflow/domain-merge-pipeline/dryrun-document-management.md skills/merge-to-domain/SKILL.md
git commit -m "docs(plan): add compatibility dry-run for document-management.md

기존 도메인 document-management.md에 대한 가상 머지 dry-run 시뮬레이션 결과.
발견된 호환성 이슈를 merge-to-domain SKILL.md에 반영하여 첫 머지 시
graceful degradation 보장."
```

---

### Task 9: context-handling resume 보완 — complete feature 카운트 알림 (REQ-027)

**Files:**
- Modify: `skills/context-handling/SKILL.md`

**범위:** resume 모드에 "현재 카테고리별 complete feature 카운트" 알림 추가 (drift gap 보완).

- [ ] **Step 1: context-handling resume 모드 위치 확인**

Read: `skills/context-handling/SKILL.md`
- "Mode: resume" 섹션 위치
- 통합 목록 템플릿 형식
- "잔존 HANDOFF 정리" 섹션 형식

- [ ] **Step 2: 통합 목록 템플릿에 complete feature 카운트 알림 추가**

resume 모드의 통합 목록 출력 직후 (또는 잔존 HANDOFF 알림 직전 위치)에 다음 블록 삽입:

```markdown
**Step 3.5: complete feature 카운트 알림 (REQ-027 — domain-merge-pipeline 연동)**

탐색 중 식별된 각 카테고리의 `status: complete` feature 수를 카운트하여, 결과가 0건 초과인 카테고리에 대해 다음 형식으로 한 줄 안내를 추가:

\`\`\`
📦 도메인 머지 대기 중:
  - dev-workflow: 2건 (rating-system, br-mode-system)
  - matchmaking: 1건 (queue-system)

관리자라면 `/dev-workflow:merge-to-domain [카테고리]`로 도메인 통합을 진행할 수 있습니다.
\`\`\`

이 알림은 자동 머지 트리거가 아니며, 사용자가 인지하도록 정보만 제공한다.
관리자가 아닌 사용자(작업자)에게 노출되어도 무방하다 (정보 메시지 성격).
```

- [ ] **Step 3: 자가 검토 — context-handling 일관성**

확인:
- 통합 목록 템플릿의 기존 흐름이 깨지지 않는가?
- 잔존 HANDOFF 정리와의 출력 순서가 자연스러운가?
- "Mode: save" 동작에는 영향 없는가?

- [ ] **Step 4: Commit**

```bash
git add skills/context-handling/SKILL.md
git commit -m "feat(context-handling): add complete feature count notification in resume mode

REQ-027 반영. /dev-workflow:resume 호출 시 카테고리별 status=complete feature 수를
한 줄로 알림. 머지 무기한 지연으로 SSOT가 누적적으로 낡아질 위험 보완.
자동 트리거 아닌 정보 알림."
```

---

### Task 10: CLAUDE.md 메타 갱신

**Files:**
- Modify: `CLAUDE.md`

**범위:** 스킬 목록, Commands 표, "자기-도그푸딩 가이드" 추가.

- [ ] **Step 1: CLAUDE.md 기존 내용 확인**

Read: `CLAUDE.md`
- "Skills" 섹션의 스킬 수 (현재 9 → 10으로 갱신)
- "Workflow Stage → Delegation" 표 (COMPLETION 행 갱신)
- "Commands" 표 (merge-to-domain 행 추가)
- "Key Patterns" 또는 "Conventions" 섹션

- [ ] **Step 2: Skills 표 갱신**

Skills 섹션 표에 다음 행 추가:
```
| `merge-to-domain` | 관리자가 카테고리 도메인 문서(SSOT)에 complete feature를 intelligent merge. 5단계 알고리즘 + Architect 라운드 + dry-run 안전 게이트 |
```

스킬 수 카운트 갱신 (9 → 10).

- [ ] **Step 3: Workflow Stage → Delegation 표 갱신**

COMPLETION 행을 다음으로 수정:
```
| COMPLETION | dev-workflow (Completion Protocol 작업자 측) + dev-workflow (merge-to-domain, 관리자 측) | ❌ 없음 |
```

- [ ] **Step 4: Commands 표 갱신**

Commands 표에 다음 행 추가:
```
| merge-to-domain | merge-to-domain | {{ARGUMENTS}} | 관리자가 도메인 머지 파이프라인 호출 (카테고리명/플래그/공란 지원) |
```

- [ ] **Step 5: 자기-도그푸딩 가이드 섹션 추가**

"Key Patterns" 섹션 끝 또는 별도 섹션으로 다음 추가:
```markdown
### 자기-도그푸딩 (Self-Dogfooding)

dev-workflow 플러그인은 자기 도메인 문서를 신규 `merge-to-domain` 스킬로 관리한다.
현재 6개 도메인 문서 (document-management, session-management, ux-consistency,
workflow-lifecycle, thinking-enhancement, project-customization)는 신규 스킬 도입 이전에
생성되었으므로 **첫 머지 시 호환성 체크리스트** (REQ-022)가 발동된다:

- 정책 ID 부재 → 사용자 결정 (자동 부여 vs 보존)
- 섹션 10 변경 이력 부재 → 시작점 행 자동 추가
- 의존성 맵 부재 → 머지에 필요할 때만 질문

마이그레이션을 별도 작업으로 만들지 않는다. 신규 스킬이 자연스럽게 첫 머지에서
점진 보완한다.
```

- [ ] **Step 6: 자가 검토 — CLAUDE.md 일관성**

확인:
- 스킬 수 카운트가 모든 위치에서 일치하는가?
- Commands 표가 자동완성 사용 가이드와 일치하는가?
- 자기-도그푸딩 가이드가 다른 섹션(Document Structure 등)과 모순되지 않는가?

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude-md): add merge-to-domain skill/command and self-dogfooding guide

Skills 목록에 merge-to-domain 추가 (9 → 10).
Commands 표에 merge-to-domain 행 추가.
Workflow Stage → Delegation 표의 COMPLETION 행 갱신.
자기-도그푸딩 가이드 섹션 신설."
```

---

### Task 11: plugin.json + marketplace.json MINOR 버전 업 + 최종 통합 검증

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `commands/merge-to-domain.md` (버전 경로 갱신)

**범위:** SemVer MINOR 버전 업 (1.8.0 → 1.9.0), 신규 사용자에게 영향 없는 기능 추가. 그리고 전체 통합 검증.

- [ ] **Step 1: 현재 버전 확인**

Read: `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`
현재 버전을 확인 (예상: 1.8.0).

- [ ] **Step 2: marketplace.json의 version 필드 1.9.0으로 갱신**

`plugins[].version`을 `1.9.0`으로 수정. (SSOT)

- [ ] **Step 3: plugin.json의 version 필드 1.9.0으로 동기 갱신**

- [ ] **Step 4: commands/merge-to-domain.md의 SKILL.md 경로에 새 버전 반영**

`commands/merge-to-domain.md`의 Read 경로:
```
~/.claude/plugins/cache/dev-workflow-marketplace/dev-workflow/1.9.0/skills/merge-to-domain/SKILL.md
```

- [ ] **Step 5: 최종 통합 검증 — 모든 파일 일관성**

전체 변경 파일을 다시 점검:
- [ ] `skills/document-consolidation/SKILL.md` — Mode 1에서 domain 머지 분기 제거, Mode 3 deprecate 표시
- [ ] `skills/workflow-orchestrator/SKILL.md` — Completion Protocol 갱신, Delegation 표 갱신
- [ ] `skills/merge-to-domain/SKILL.md` — 모든 REQ가 본문에 명시
- [ ] `commands/merge-to-domain.md` — 패턴 일관, 버전 경로 갱신
- [ ] `skills/context-handling/SKILL.md` — resume 모드에 카운트 알림 추가
- [ ] `CLAUDE.md` — 스킬/Commands/자기-도그푸딩 갱신
- [ ] `plugin.json`, `marketplace.json` — 1.9.0 일치

- [ ] **Step 6: dryrun-document-management.md 재검토**

가상 머지 시뮬레이션에서 발견된 호환성 이슈가 모두 SKILL.md에 반영되었는지 확인.

- [ ] **Step 7: 자가 검토 — 시나리오 실행 시뮬레이션**

머릿속으로 다음 시나리오를 시뮬레이션:

**시나리오 A (작업자):**
1. 작업자가 BRAINSTORM → PLAN → DEVELOP → REVIEW 완료
2. Completion Protocol Step 1 실행 → document-consolidation Mode 1 호출
3. feature 문서 통합 완료 + status=complete 마킹
4. domain 머지 제안 발생 X (기존 분기 제거 확인)
5. 커밋 후 종료

**시나리오 B (관리자):**
1. 다음 세션에서 `/dev-workflow:resume` 호출
2. context-handling resume → "📦 도메인 머지 대기 중" 알림 노출
3. 관리자가 `/dev-workflow:merge-to-domain dev-workflow` 호출
4. merge-to-domain 스킬 진입 → docs/design 스캔 → complete feature 식별
5. 실행 모드 결정 → 5단계 알고리즘 → dry-run → 사용자 승인 → 적용 → 검증
6. feature 디렉토리 삭제 + 섹션 10 변경 이력 기록 + inline 요약

각 시나리오의 모든 단계가 SKILL.md에서 명시적으로 처리되는지 확인.

- [ ] **Step 8: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json commands/merge-to-domain.md
git commit -m "chore(release): bump version to 1.9.0 for domain-merge-pipeline

MINOR 버전 업 — 기존 사용자 프로젝트의 docs/design 구조는 그대로 동작.
신규 merge-to-domain 스킬 + 명령 + 호환성 첫 머지 체크리스트로
점진적 도입 가능.

기능 추가:
- merge-to-domain 신규 스킬 (5단계 algorithm + Architect 루프 + dry-run)
- /dev-workflow:merge-to-domain 신규 슬래시 명령
- context-handling resume에 complete feature 카운트 알림
- document-consolidation Mode 1 단순화, Mode 3 deprecate"
```

---

## Self-Review

본 plan을 작성 후 spec(설계 문서 + phase 파일)과 대조하여 다음을 확인:

**1. Spec coverage:**
- REQ-001 (신규 스킬) → Task 3-6에서 다룸 ✓
- REQ-002 (document-consolidation 단순화) → Task 1 ✓
- REQ-003 (workflow-orchestrator 갱신) → Task 2 ✓
- REQ-004 (5단계 알고리즘) → Task 3 ✓
- REQ-005 (structured digest + idempotent + 학습 게이트) → Task 3 ✓
- REQ-006~008 (분류 규칙, Architect 등급, 검증 페르소나) → Task 4 ✓
- REQ-009 (dry-run 회계 형식) → Task 5 ✓
- REQ-010~012 (in-session resolution, skip, 충돌 우선) → Task 6 ✓
- REQ-013~017 (직렬/병렬, 임계값, 큐 노출, buffer flush) → Task 5 ✓
- REQ-018~021 (빈 상태, 삭제, 변경 이력, inline 요약) → Task 3, 6 ✓
- REQ-022 (호환성 체크리스트) → Task 6, 8 ✓
- REQ-023~024 (옵션 플래그 + 인터랙티브 fallback) → Task 6 ✓
- REQ-025 (Concurrency git 위임) → Task 6 ✓
- REQ-026 (토큰 fallback) → Task 3 ✓
- REQ-027 (resume 카운트 알림) → Task 9 ✓
- REQ-028 (Mode 3 deprecate) → Task 1 ✓
- success_criteria 추가 항목 (가상 머지 dry-run) → Task 8 ✓

전체 REQ + 신규 사항이 모두 Task에 매핑됨.

**2. Placeholder scan:**
- "TBD" / "구현 예정" 등 없음 ✓
- 모든 step에 실제 내용 또는 명확한 절차 명시 ✓
- 예외: Task 8 (가상 머지 dry-run)은 실측 시점에 결과를 채워야 하므로 일부 자리표시는 의도된 것

**3. Type consistency:**
- "structured digest" 어휘 일관 ✓
- "Architect 라운드 등급" 표 통일 ✓
- ID prefix (POL-, DEC-, F-POL-, F-DEC-, REQ-) 일관 ✓
- 슬래시 명령 이름 `/dev-workflow:merge-to-domain` 통일 ✓

---

## Execution Handoff

Plan complete and saved to `docs/design/dev-workflow/domain-merge-pipeline/plan.md`.

**Execution options:**

1. **Subagent-Driven (recommended)** — REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`. Fresh subagent per task + two-stage review.

2. **Inline Execution** — REQUIRED SUB-SKILL: `superpowers:executing-plans`. Batch execution with checkpoints.
