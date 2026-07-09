# gate-effectiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 게이트 심사 확정본(설계 문서 §4, 34행)을 8개 스킬 파일에 반영 — 등급 오류 교정(커밋/푸시 분리) + 형식 게이트 처분(생략+안전망·라운드 정비·시드 직접 갱신) + 공통 규범 신설 (v1.15.0)

**Architecture:** development-principles 신설 2절(안전망 포맷·게이트 신설 체크리스트)을 최우선 확정 → 하류 7개 파일이 그 문구를 참조하며 병렬 개정. 개정 문면은 본 plan에 확정 수록(구현은 verbatim 치환만). 구 독트린 스윕을 태스크별 완료 조건에 포함.

**Tech Stack:** Markdown 스킬 문서 편집, bash(grep 체크), git

## Global Constraints

- 본 plan의 확정 문면은 **verbatim 반영** — 구현 중 재작성·문구 개선 금지. 수정 필요 발견 시 중단·보고
- 게이트 의미 보존: 유지 23건은 화면·선택지 수·발동 조건 무변경. 처분 변경 12건은 설계 문서 §4 표와 일치해야 함
- **구 독트린 스윕 (태스크별 완료 조건)**: 각 태스크는 자기 파일에서 `생략할 수 없다`·`학습 게이트`·`커밋+푸시` grep을 실행해 새 규범과 모순되는 잔존 문장 0건을 확인 후 커밋
- 안전망 문면은 T2의 표준형을 따르고 각 스킬은 development-principles를 1줄 참조 — 개별 장문 서술 금지
- 적용 범위 밖 무변경: decision-flow.md는 지정 2줄 외 무접촉, conversation-ux 스켈레톤·REVIEW 절차·design-doc-index/design-summary/rules-injection 무변경, document-consolidation Mode 3(DEPRECATED) 무변경
- 사후 고지는 **답을 요구하지 않는 1줄** — 새 게이트를 만들지 않는다 (질문형 문장 금지)
- 커밋은 태스크당 1개

---

### Task 1: 베이스라인 인벤토리

**Files:**
- Create: `docs/design/dev-workflow/gate-effectiveness/baseline-gates.md` (일회용 — T8에서 폐기)

**Interfaces:**
- Produces: T3~T6 전후 대조 기준 + T7 전수 재검 원판

- [ ] **Step 1: 개정 대상 게이트 현행 문면 스냅샷** — 처분 변경 12건(설계 §4 표의 자동화 5·조건부 1·분리 1·생략 2·정비 2·직접 갱신 1)의 현행 문면을 {파일:줄, 인용}으로 기록. 유지 23건은 {파일:줄, 화면 이름, 선택지 수, 발동 조건}만 기록
- [ ] **Step 2: 구 독트린 grep 목록** — `grep -rn "생략할 수 없다\|학습 게이트\|커밋+푸시" skills/` 전 결과를 기록 (각 줄에 "개정 대상/유지 정당" 표시 — T7 스윕의 대조 기준). `wc -c skills/workflow-orchestrator/bootstrap.md` 기록
- [ ] **Step 3: 커밋**

```bash
git add docs/design/dev-workflow/gate-effectiveness/baseline-gates.md
git commit -m "docs(gate-eff): capture baseline gate inventory"
```

---

### Task 2: development-principles 신설 2절 (최우선 — 하류 참조 원본)

**Files:**
- Modify: `skills/development-principles/SKILL.md` (기존 섹션 무변경 — 말미에 2절 추가)

**Interfaces:**
- Produces: 안전망 표준형·3단 트리 문면 — T3~T6의 고지 문면과 참조 줄이 이를 따름

- [ ] **Step 1: 두 절을 verbatim 추가**

```markdown
## 자동 결정 안전망 (공통 포맷)

게이트(사용자 확인 지점)를 생략·자동화한 자리에는 아래 3요소 중 최소 1개를 동반한다 — 안전망 없는 단순 생략 금지:

- **사후 고지 1줄**: 자동으로 처리된 결정을 답을 요구하지 않는 한 줄로 알린다. 표준형: `[이모지] [무엇]을 자동 [처리]했습니다 — [요지]. (수정하려면 말씀하세요)`
- **기록**: 자동 결정의 내용을 산출물(phase 파일·회계 목록·git 이력)에 남긴다
- **소급 수정 경로**: 사용자가 이의를 제기하면 해당 확인을 소급 제시하거나 결정을 되돌린다 — 재논의 대기열을 거치지 않고 즉시 처리한다

이 포맷은 merge-to-domain의 "자동 수정 회계" 패턴을 일반화한 것이다. 각 스킬은 안전망을 개별 서술하지 않고 본 절을 참조한다.

## 게이트 신설 체크리스트 (3단 결정 트리)

새 사용자 확인 지점을 만들기 전에, 그리고 기존 확인을 제거·자동화하기 전에 아래 3문항에 순서대로 답한다:

1. 이 확인이 없으면 되돌릴 수 없는 결과가 발생하는가? → Yes = 게이트를 둔다 (비가역 승인 — 어떤 진행 모드에서도 생략 불가)
2. 이 확인의 답이 사실상 항상 같은가? → Yes = 게이트 대신 위 "자동 결정 안전망"을 쓴다
3. 생략해도 사용자가 사후에 그 사실을 알 방법이 있는가? → No = 안전망부터 설계한다 — 설계할 수 없으면 게이트를 둔다
```

- [ ] **Step 2: 기계 체크 + 커밋** — `grep -c "자동 결정 안전망\|게이트 신설 체크리스트" skills/development-principles/SKILL.md` → 각 ≥1, 기존 섹션 diff 무접촉 확인

```bash
git add skills/development-principles/SKILL.md
git commit -m "feat(gate-eff): add safety-net format and gate-creation checklist to development-principles"
```

---

### Task 3: workflow-orchestrator — 커밋/푸시 분리 + bootstrap 동기 + decision-flow 2줄 (한 태스크 고정)

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (Completion Step 3), `skills/workflow-orchestrator/bootstrap.md` (불변식 줄), `skills/workflow-orchestrator/decision-flow.md` (지정 2줄만)

- [ ] **Step 1: Completion Step 3 → 2단 분리** — 기존 `**Step 3: 커밋+푸시 제안**` 블록("마무리가 완료되었습니다. 커밋+푸시를 진행할까요?" 사용자 확인 후 실행)을 verbatim 교체:

```markdown
**Step 3: 커밋 제안**
- "마무리가 완료되었습니다. 커밋을 진행할까요?" 사용자 확인 후 커밋 실행

**Step 3.5: 푸시 제안 (커밋 성공 후)**
- "커밋 완료: [커밋 요지 1줄]. 원격에 푸시할까요?" 사용자 확인 후 푸시 실행
- 푸시는 원격 공개(되돌리기 어려움)이므로 커밋과 분리해 별도 승인을 받는다 — 커밋만 하고 마치는 선택을 허용한다
```

(주변의 "커밋+푸시는 마무리 시퀀스에서 처리" 류 문장들도 같은 파일 내에서 "커밋·푸시(각각 확인)"로 정렬 — 스윕에서 확인)

- [ ] **Step 2: bootstrap.md 불변식 줄 교체** — "커밋+푸시는 Completion Protocol에서만, 커밋 전 사용자 확인" → `커밋·푸시는 Completion Protocol에서만 — 각각 별도 확인 (푸시는 원격 공개라 분리 승인)`. `wc -c` ≤ T1 기록 +100B
- [ ] **Step 3: decision-flow.md 지정 2줄** — ① :8의 `**G5(게이트 배칭)와의 관계:** 게이트 배칭은 확인의 묶음 단위(이 확인이 필요한가)를 다루고` → `**게이트 실효성 정비와의 관계:** 게이트 정비는 확인의 존폐·등급(이 확인이 필요한가)을 다루고` (문장 나머지 무변경) ② 3부 "초심자 언어 기본값" 항목 말미에 별도 문장 추가: `업종 특화 어휘(특정 분야 종사자만 아는 말)는 풀이를 붙이는 대신 일상어로 대체한다.`
- [ ] **Step 4: 스윕 + 기계 체크 + 커밋** — 파일 3개에서 `grep -n "커밋+푸시"` → 잔존은 T1 목록의 "유지 정당" 항목뿐, `grep -c "Step 3.5" SKILL.md` → 1, decision-flow diff가 정확히 2개 지점인지 확인

```bash
git add skills/workflow-orchestrator/
git commit -m "feat(gate-eff): split commit/push approval, sync bootstrap, 2-line decision-flow update"
```

---

### Task 4: merge-to-domain — 학습 게이트 생략 + 라운드 정비 + 자동모드 confirm

**Files:**
- Modify: `skills/merge-to-domain/SKILL.md`, `skills/merge-to-domain/references/templates.md`

- [ ] **Step 1: 학습 게이트 2곳(domain :82-89 · feature :105-113) → 사후 고지 전환** — 게이트 규정(사용자 검토 요청·수정 필요 분기)을 삭제하고 verbatim 삽입 (2곳 대칭):

```markdown
**digest 사후 고지 (REQ-005 개정):** digest 산출 직후 답을 요구하지 않는 1줄로 고지한다: `📄 digest 추출 완료 — 정책 [N]건·결정 [M]건 (오추출은 dry-run 원문 대조와 검증 단계가 잡습니다 · 상세를 보려면 "digest 보여줘")` 사용자가 이의를 제기하면 해당 digest를 즉시 노출하고 수정 반영 후 재추출한다 (안전망: development-principles "자동 결정 안전망" 참조)
```

- [ ] **Step 2: "생략 불가" 문면 2곳 개정** — :347 `dry-run 승인 게이트와 도메인 문서당 최초 1회 학습 게이트는 … 생략할 수 없다` → `dry-run 승인 게이트는 --auto, --no-review, 키워드 자동 모드 등 어떤 플래그 조합에서도 생략할 수 없다` / :283의 학습 게이트 생략 불가 서술도 동일 원칙으로 제거·정렬
- [ ] **Step 3: 라운드 등급표+승급 개정** — 등급표(:141-145)에 행 추가: `| 사용자 결정 3건 이상 + 의미 충돌 0 | 2 |` / 승급 규정(:158)을 verbatim 교체:

```markdown
- "발견된 우려" 중 **차단성 우려**가 있으면 등급을 1단계 자동 승급한다 (이미 등급 3이면 유지 — 차단성 우려 잔존 시 PASS 선언 차단). 판별문: "이 우려가 반영되지 않으면 dry-run 승인을 진행할 수 없는가?" — Yes면 차단성, No면 권고성. 권고성 우려는 승급 없이 dry-run 회계에 1줄로 기록한다. `--review-merge=N` 지정 시 자동 승급보다 N이 우선한다
```

- [ ] **Step 4: 자동모드 키워드 confirm → 자동 진입+고지** — confirm 게이트를 verbatim 교체: `🔁 자동 모드로 진행합니다 (감지 키워드: [키워드]) — 사용자 결정 필요 항목(의미 충돌 등)은 여전히 개별로 여쭙습니다. (수동 진행을 원하시면 말씀하세요)` (답을 요구하지 않는 고지 — 이의 시 즉시 수동 전환)
- [ ] **Step 5: templates.md 학습 게이트 출력 펜스 2곳(:22-36·:52-73) → 위 고지 문면 반영** (Read 지시·블록 헤딩 구조는 무변경 — 펜스 내용만 교체)
- [ ] **Step 6: 스윕 + 기계 체크 + 커밋** — `grep -n "학습 게이트" skills/merge-to-domain/` → 잔존은 "생략된 게이트의 이력 서술"이 아닌 새 고지 규정 지칭만 (T1 목록 대조), `grep -c "차단성 우려" SKILL.md` → ≥1, 게이트 대조: dry-run 승인·의미 충돌·삭제 확인 등 유지 게이트 무변경

```bash
git add skills/merge-to-domain/
git commit -m "feat(gate-eff): digest gate to post-notice, blocking-concern escalation, auto-mode notice"
```

---

### Task 5: brainstorming + plan-stage

**Files:**
- Modify: `skills/brainstorming/SKILL.md`, `skills/plan-stage/SKILL.md`

- [ ] **Step 1: brainstorming 국면 4 시드 불릿(:427-431) verbatim 교체:**

```markdown
- 📎 **Enhanced Mode — Seed YAML 직접 갱신:** 설계 문서 확정 후, 메인 컨텍스트가 Step B 확정 시드에 국면 2~4의 변경분(신규 결정·non_goals·기술 가이드라인)만 반영해 `docs/design/[카테고리]/[기능명]/seed.yaml`을 직접 작성한다 — 서브에이전트를 재투입하지 않는다 (모든 내용이 이미 사용자 확정 완료 상태이므로 형식 반영만 수행). 이 시드는 PLAN 단계·문서 취합의 참조 자료다
  - Standalone Mode에서는 Step B 시드를 설계 문서에 인라인으로 포함하고, 별도 파일은 생성하지 않는다 (기존과 동일)
```

- [ ] **Step 2: PLAN 연속 진행 확인 → 자동 진행+고지** — "설계 문서가 …에 저장되었습니다. PLAN 단계로 바로 진행할까요?" 제안 규정을 verbatim 교체: `파일 생성 완료 후 PLAN 단계로 자동 진행하며 1줄 고지한다: "💡 설계 문서 저장 완료 — PLAN 단계로 자동 진행합니다 (원치 않으시면 말씀하세요)" (안전망: 고지+이의 시 즉시 중단 — development-principles "자동 결정 안전망" 참조. PLAN 진행 시 Persona Resolution은 PLAN 페르소나만 새로 확정한다)`
- [ ] **Step 3: plan-stage Step 4 루프 규칙(:248) verbatim 교체** — "PLAN 단계의 주요 결정 전 피드백루프를 절대 생략하지 않는다" → `PLAN 단계의 주요 결정 전 피드백루프를 생략하지 않는다 — 단 페르소나 초기 의견이 전원 일치하면 합의 블록 기록으로 라운드를 종료한다 (반박·이견이 있을 때만 후속 라운드를 연다)`
- [ ] **Step 4: 스윕 + 기계 체크 + 커밋** — `grep -c "재투입하지 않는다" skills/brainstorming/SKILL.md` → 1, `grep -c "자동 진행" skills/brainstorming/SKILL.md` → ≥1, `grep -c "절대 생략" skills/plan-stage/SKILL.md` → 0, 유지 게이트(시드 확인·국면 전환·재협의 4지) 무변경 대조

```bash
git add skills/brainstorming/SKILL.md skills/plan-stage/SKILL.md
git commit -m "feat(gate-eff): direct seed update, auto PLAN transition, early consensus exit"
```

---

### Task 6: document-consolidation + context-handling + persona-resolution

**Files:**
- Modify: `skills/document-consolidation/SKILL.md`, `skills/context-handling/SKILL.md`, `skills/persona-resolution/SKILL.md`

- [ ] **Step 1: document-consolidation Mode 1 Step 6 → 조건부 자동화** — 삭제 확인 게이트를 verbatim 교체 (트리 ③ 정확 적용 — git 이력이 없는 환경은 사후 인지 불가이므로 확인 유지):

```markdown
6. **중간 산출물 정리**

   git-mode: 확인 없이 정리하고 1줄로 고지한다: `🧹 중간 산출물을 정리했습니다: phase1~3.md, plan.md, seed.yaml[, HANDOFF.md] — [기능명].md는 complete로 보존 (기록은 git 이력에 남음 · 되돌리려면 말씀하세요)` (안전망: development-principles "자동 결정 안전망" 참조)
   no-git-mode: 삭제가 복구 불가능하므로 기존 확인을 유지한다 — "중간 산출물을 삭제합니다 … 진행할까요? 1. Yes — 고르면: 삭제 (기록 없음 주의) 2. No — 고르면: 유지"
```

- [ ] **Step 2: context-handling 잔존 HANDOFF 삭제 → 조건부 자동화** — 잔존 정리 제안 게이트를 verbatim 교체: `git-mode: 확인 없이 삭제하고 1줄 고지: "🧹 완료된 작업의 잔존 HANDOFF [n]건을 정리했습니다 (기록은 git에 남음 · 복원하려면 말씀하세요)" / no-git-mode: 기존 확인 게이트 유지` (기존 목록·탐색 규칙 무변경)
- [ ] **Step 3: context-handling HANDOFF 복구 재확인 → 자동 시작+고지** — "계속할까요?" 재확인 2곳(HANDOFF 있는/없는 경우)을 verbatim 교체: `목록에서 항목을 선택하면 재확인 없이 복구를 시작하며 1줄 고지한다: "▶️ [기능명] — [국면/단계]부터 복구를 시작합니다 ([HANDOFF 기반 | HANDOFF 없음 — 마지막 완료 단계 기준])" (선택 자체가 의사 표명 — 잘못 선택했으면 말씀하는 즉시 중단)`
- [ ] **Step 4: persona-resolution 저장 제안 → 자동 저장+고지** — Session End 저장 제안 게이트를 verbatim 교체: `저장 제안 조건 충족 시 확인 없이 .claude/personas.md를 생성하고 1줄 고지한다: "💾 이번 세션 페르소나를 .claude/personas.md로 자동 저장했습니다 — 다음 세션부터 확인 없이 적용됩니다 (원치 않으면 말씀하세요 — 삭제해 드립니다)" (안전망: 파일 삭제로 즉시 되돌림 가능)` (기존 저장 제안 조건 3항은 무변경 유지)
- [ ] **Step 5: 스윕 + 기계 체크 + 커밋** — `grep -c "자동 결정 안전망" [3파일]` → 각 ≥1 (참조 줄), `grep -c "계속할까요" skills/context-handling/SKILL.md` → 0, 유지 게이트(Mode2 이슈 통합·복구 목록 제시) 무변경 대조

```bash
git add skills/document-consolidation/SKILL.md skills/context-handling/SKILL.md skills/persona-resolution/SKILL.md
git commit -m "feat(gate-eff): conditional auto-cleanup, auto resume start, auto persona save"
```

---

### Task 7: 전수 검증 + 판단 리뷰 + 드라이런

**Files:**
- Modify: `docs/design/dev-workflow/gate-effectiveness/baseline-gates.md` (결과 기록)

- [ ] **Step 1: 게이트 대조 전수 재검** — T1 기록 전 행: 유지 23건 동일 재현, 처분 변경 12건은 설계 §4 표·본 plan 문면과 일치 — PASS/FAIL 기록
- [ ] **Step 2: 구 독트린 스윕 전수** — `grep -rn "생략할 수 없다\|학습 게이트\|커밋+푸시\|절대 생략" skills/` 전 결과를 T1 목록과 대조 — 신 규범과 모순되는 잔존 0건 확인 (bootstrap.md·decision-flow.md 포함)
- [ ] **Step 3: 드라이런 1회** — 개정된 workflow-orchestrator SKILL.md + bootstrap.md**만** 읽는 신선 서브에이전트에게 가상 마무리 시나리오(문서 취합 완료 상태 가정)를 진행시켜, ① 커밋 확인 → ② 커밋 후 푸시 별도 확인의 2단 발동을 대화 로그로 기록 — 로그를 baseline-gates.md에 첨부
- [ ] **Step 4: 판단 리뷰 (신선한 눈 1회)** — 컨텍스트 없는 서브에이전트에게 개정 8파일을 주고 판정: 새 고지 문면들이 질문형이 아닌지(새 게이트 미생성), 안전망 참조가 해소되는지, 라운드 판별문이 예/아니오로 실행 가능한지, 두 트랙(생략된 게이트 vs 유지 게이트) 규정에 상호 모순이 없는지
- [ ] **Step 5: 결과 기록 + 커밋**

```bash
git add docs/design/dev-workflow/gate-effectiveness/baseline-gates.md
git commit -m "test(gate-eff): full gate parity check + dry-run + fresh-eyes review"
```

---

### Task 8: 릴리스 마감

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `docs/design/dev-workflow/gate-effectiveness/gate-effectiveness.md` (§9·§10)
- Delete: `docs/design/dev-workflow/gate-effectiveness/baseline-gates.md` (일회용 폐기 — 검증 요약은 §9로 이식)

- [ ] **Step 1: 버전 1.15.0 동기 범프** (`sed -i 's/"version": "1.14.0"/"version": "1.15.0"/' .claude-plugin/*.json` 후 grep으로 두 파일 확인, 1.14.0 잔존 0)
- [ ] **Step 2: 설계 문서 §9 기록** (구현 결과·검증 결과·일탈 — 특히 document-consolidation Step 6의 조건부 완화[자동화→git 한정 자동화]는 트리 ③의 정확 적용으로서 §9.2에 기록)·§10 행 추가, **status: ready-for-plan 유지** (complete 마킹은 Completion Protocol 몫), 인벤토리 삭제
- [ ] **Step 3: 커밋** — `git add -A` (미추적 설계 문서 일괄 포함 의도됨, `.superpowers/` 제외 확인)

```bash
git add -A
git commit -m "chore(release): bump to 1.15.0 for gate-effectiveness"
```

---

## Self-Review 결과

1. 스펙 커버리지: REQ-001(목록 확정본)→설계 §4+T1, REQ-002(자동화 5건)→T4 S4·T5 S2·T6 S1~4, REQ-003→T3, REQ-004→T4 S1~2·S5, REQ-005→T4 S3+T5 S3, REQ-006→T5 S1, REQ-007→T6 S2, REQ-008→T2, REQ-009→T3 S3, REQ-010→T1+T7 — 공백 없음
2. 플레이스홀더: 고지·판별문·분리 게이트·신설 2절 전부 실문면 수록 — 통과
3. 일관성: 사후 고지 표준형(T2)과 각 고지 문면(T4~T6)의 골격 일치("~했습니다 — 요지 (수정하려면 말씀하세요)"), 조건부 자동화 2건(T6 S1·S2)의 git/no-git 분기 문면 동형 — 통과
4. 동형 템플릿 슬롯 대조 (conversation-ux 교훈): 고지 문면 6종 모두 {이모지, 무엇을, 요지, 이의 경로} 4슬롯 충족 — 통과
