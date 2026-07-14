# persona-improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 페르소나 발언을 초보자도 읽는 일상어로 강제하고(언어 규범 펜스), 토론의 실질성·독립성을 지시문으로 강화하며(실질성 규칙·블라인드 첫 라운드), 페르소나 관련 문서-스킬 불일치를 정비한다.

**Architecture:** 언어 규범과 블라인드 공통 절차의 원본을 decision-flow.md 한 곳에 두고(3부 펜스 · §7 하위절), 각 스킬은 복제 지시와 로컬 파라미터만 갖는다. 구현 순서는 원본 선행(Task 1~2) → 소비자 반영(Task 3~7) → 스킬 밖 + 스윕(Task 8~12) → 최종 검증·버전(Task 13). 도메인 문서 교정은 직접 수정하지 않고 설계 문서 §6 supersede 지정으로 완료된 상태다(머지 시점 반영).

**Tech Stack:** Markdown 지시문(코드 없음). 검증은 grep/Read 기반. 스펙: `docs/design/dev-workflow/persona-improvement/persona-improvement.md` (REQ-001~013 · §8 가이드라인 1~22).

## Global Constraints

- 작업 디렉토리: `D:\02_Workspace\98_Github\dev-workflow\.claude\worktrees\persona-improvement` · 브랜치: `worktree-persona-improvement` — **매 커밋 전 `git branch --show-current` 출력이 `worktree-persona-improvement`인지 확인** (main 오염 금지 — tasks/lessons.md 재발 이력)
- `skills/*/references/agent-roles.md` 3개 파일은 **바이트 불변** — 어떤 태스크도 수정 금지
- `docs/design/dev-workflow/*.md` 도메인 문서 7개는 **직접 수정 금지** — 교정은 설계 문서 §6 supersede가 담당 (이중 반영 금지)
- 커밋: Conventional Commits (`feat:`/`fix:`/`docs:`/`chore:`), 태스크당 1커밋
- **언어 규범 펜스 원문 (전 태스크 공통 — 이 문면 그대로, 자구 변경 금지):**

```
📣 언어 규범 — 모든 사용자 대면 문면과 페르소나 발언에 적용 (본 파일의 결정 흐름 적용 범위와 별개):
- 한국어로 쓴다 — 초보자도 읽는 일상어로, 평소 잘 안 쓰는 한자어 대신 쉬운 말을 쓴다
- 전문 용어는 나온 자리에서 짧게 풀이하고, 줄임말을 쓰지 않는다
- 논점이 바뀔 때마다 빈 줄로 문단을 나누고, 병렬 나열은 불릿으로 쓴다
```

- **복제 지시 표준 문구 (프롬프트 템플릿에 삽입할 때 — 이 문면 그대로):**
  `프롬프트 조립 시 decision-flow.md 3부 「언어 규범」 펜스 전문을 "--- 언어 규범 ---" 구획으로 그대로 붙여넣는다 (Read 실패 시 최소 요건: 한국어·일상어·용어 즉석 풀이·줄임말 금지·문단 개행)`
- **정본 명칭 (태스크 간 참조 일관성):** 펜스 헤딩 = `### 언어 규범 (원본)` · 블라인드 절차 헤딩 = `### 블라인드 라운드 공통 절차` · 구획명 = `--- 언어 규범 ---` · 생략 센티널 = `[의견 없음 — 사유 1줄]`

---

### Task 1: decision-flow 3부 분리 + 언어 규범 펜스 신설

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (7행 적용 범위 · 9행 문서 구성 · 194행~ 3부)

**Interfaces:**
- Produces: 헤딩 `### 언어 규범 (원본)` + 펜스 원문 (Task 3~9가 포인터·복제 지시로 소비) / 헤딩 `### 결정·질문 구조 규범`

- [ ] **Step 1: 재배치표 사전 확인 (가이드라인 1)**

Read `skills/workflow-orchestrator/decision-flow.md` 194~242행. 현행 「초심자 언어 기본값」 5개 항목의 분류를 확인한다:
- 언어 규범으로 이동: ③ "전문 용어는 등장 시 짧게 풀이"
- 구조 규범에 잔류: ① 짧은 배경 ② "고르면: 결과 1줄" ④ 추천 별도 줄 ⑤ 비유는 도움될 때

- [ ] **Step 2: 3부 헤딩 직후에 언어 규범 하위절 삽입**

`## 공통 형식·언어 (결정·질문 공통 — 형식·언어의 원본)` 헤딩 바로 다음, `**출력 스켈레톤 (고정 — 이 모양 그대로):**` 앞에 삽입:

```markdown
### 언어 규범 (원본)

아래 펜스가 언어 규범의 유일한 원본이다. 페르소나 서브에이전트 프롬프트에는 이 펜스를 "--- 언어 규범 ---" 구획으로 전문 복제한다 (복제는 실행 시점 행위 — 문서 사본을 만들지 않는다).

[Global Constraints의 언어 규범 펜스 원문을 코드 펜스로 삽입]

### 결정·질문 구조 규범
```

- [ ] **Step 3: 초심자 언어 기본값 재서술 (항목 ③ 제거)**

기존 문단:
> **초심자 언어 기본값:** 사용자에게 묻거나 결과를 공유하는 모든 문면의 기본 — ① 짧은 배경(왜 묻는지/무엇이 문제인지) ② 선택지마다 "고르면: [결과 1줄]" ③ 전문 용어는 등장 시 짧게 풀이 ④ 💡 추천과 사유는 별도 줄 ⑤ 비유는 도움이 될 때 (의무 아님).

교체:
> **초심자 구조 기본값:** 사용자에게 묻거나 결과를 공유하는 모든 문면의 기본 — ① 짧은 배경(왜 묻는지/무엇이 문제인지) ② 선택지마다 "고르면: [결과 1줄]" ③ 💡 추천과 사유는 별도 줄 ④ 비유는 도움이 될 때 (의무 아님). 어휘·문단은 「언어 규범」 펜스가 원본이다.

문단 뒷부분("사용자가 더 풀어달라고 하면 …" · "업종 특화 어휘 …")은 그대로 유지한다.

- [ ] **Step 4: 적용 범위(7행)·문서 구성(9행) 선언 증보**

7행 `**적용 범위:**` 문단 끝에 1문장 추가: `단 3부 「언어 규범」 펜스는 이 범위와 별개로 모든 사용자 대면 문면·페르소나 발언에 적용된다.`
9행 `**문서 구성:**` 끝에 1문장 추가: `3부는 「언어 규범」(원본 펜스)과 「결정·질문 구조 규범」으로 구성된다.`

- [ ] **Step 5: 검증**

Run: `grep -n "언어 규범 (원본)\|결정·질문 구조 규범\|초심자 구조 기본값" skills/workflow-orchestrator/decision-flow.md`
Expected: 3건 모두 검출. `grep -c "전문 용어" skills/workflow-orchestrator/decision-flow.md` — 펜스 1곳 + 업종 특화 어휘 문단 외에 중복 서술 없음(눈 대조).
Run: `grep -n "^## " skills/workflow-orchestrator/decision-flow.md` — 기존 절 헤딩(1~9·질문 규칙·공통 형식) 개수·순서 불변.

- [ ] **Step 6: Commit**

```bash
git branch --show-current  # worktree-persona-improvement 확인
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-flow): 3부 언어/구조 분리 + 언어 규범 펜스 신설 (REQ-001·002)"
```

---

### Task 2: decision-flow §7 — 블라인드 예외 + 공통 절차 하위절 + §6 상태 보존

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (§6 123~130행 · §7 132~151행)

**Interfaces:**
- Consumes: Task 1의 「언어 규범 (원본)」 헤딩
- Produces: 헤딩 `### 블라인드 라운드 공통 절차` (Task 3·5가 파라미터 서술로 소비) / §7 재구성 책임의 예외 문장 / §6 블라인드 상태 보존 불릿

- [ ] **Step 1: §7 「서브에이전트 출력 재구성 책임」에 예외 문장 추가**

기존:
> 서브에이전트 출력은 메인 컨텍스트가 수합 후 본 SSOT 형식으로 재구성해 제시한다. 서브에이전트 원문에 포함된 결정 요청 문구("A로 할지 B로 할지 결정해 주세요" 등)를 그대로 노출하지 않는다 — 태그 부착과 형식 재구성 책임은 메인 컨텍스트에 있다.

끝에 추가:
> **유일한 예외 — 블라인드 라운드의 원문 나열:** 아래 「블라인드 라운드 공통 절차」의 취합은 발언 원문을 그대로 나열하며 재구성하지 않는다. 이 예외는 원문 나열에만 적용된다 — 결정 요청 문구 노출 금지는 블라인드 발언에도 계속 유효하다(서브에이전트 프롬프트의 출력 제약이 담당).

- [ ] **Step 2: §7 끝에 하위절 신설 (### 레벨 — 절 번호 재배열 금지)**

`## 8. 적용 범위와 우선순위` 헤딩 직전에 삽입:

```markdown
### 블라인드 라운드 공통 절차 (원본)

블라인드 절차의 원본은 본 절이 유일하다 — 각 스킬은 파라미터(대상 라운드·페르소나 목록·발췌 내용·판정 기준)만 서술한다.

- **실행:** 대상 라운드의 전원 페르소나를 병렬 서브에이전트로 동시 투입한다 — 상호 발언 미노출. 별도 비판 담당은 두지 않는다 (비판 로빈은 2라운드부터)
- **프롬프트 구성:** [사고 제약 원문 (스킬이 지정한 경우만)] + [도메인 페르소나 정의] + [발췌] + [언어 규범 펜스 전문 — "--- 언어 규범 ---" 구획] + [정형 형식: 결론 1줄 + 근거 최대 3개] + [전제 반박 의무: "이 전제가 틀렸다면 네 도메인에서 무엇이 무너지는지 1개 이상"] + [출력 제약: 결정 요청 문구 금지]
- **발췌 규격 (조립 재량 금지):** 사용자 발화는 원문 인용 + 시드는 해당 절 원문 + 기확정 결정 목록("재론 금지" 제약 명시). 이전 라운드 발언 전문은 넣지 않는다
- **생략 센티널:** 보탤 것이 프롬프트에 이미 적힌 내용의 재진술뿐이면 정확히 `[의견 없음 — 사유 1줄]`만 반환한다 — 취합 시 나열에서 제외한다
- **취합:** 발언 원문을 그대로 나열한다 — 본체 재요약 금지. 나열 순서는 라운드·주제마다 회전하며, 회전 상태를 잃으면 임의 순서로 재시작한다 (유실은 실패가 아니다)
- **해석:** 블라인드 일치도 독립 검증이 아니라 약한 신호다 — 같은 모델이 같은 발췌를 읽으므로 오류가 함께 나는 경향은 남는다
- **상태:** "국면당 첫 루프 완료 여부"는 HANDOFF 「결정 흐름 상태」에 기록한다. 불확실해지면 블라인드로 간주해 재실행한다 (오판 비용 상한: 병렬 1라운드분)
- **끄기:** 사용자가 블라인드 생략을 요청하면 해당 라운드를 기존 대화형 경로로 라우팅한다. 세션 최초 블라인드 실행 시 1회 고지: "⏳ 블라인드 라운드 — 전원 독립 의견을 병렬 수집합니다 (대기 약 1~2분 · 원치 않으면 말씀하세요)"
```

- [ ] **Step 3: §6 상태 보존 목록에 블라인드 상태 추가**

§6의 `- **HANDOFF 저장(save) 시**:` 불릿 끝에 1문장 추가: `블라인드 첫 루프 완료 여부(국면 단위)도 함께 기록한다.`

- [ ] **Step 4: 검증 — 외부 참조 무결성**

Run: `grep -n "^## " skills/workflow-orchestrator/decision-flow.md`
Expected: `## 5.` `## 6.` `## 7.` `## 8.` `## 9.` 번호 불변 (하위절은 ### 레벨).
Run: `grep -rn "decision-flow.*§[678]\|§[678]" skills/brainstorming/SKILL.md skills/context-handling/SKILL.md | head` — 참조 대상 절이 여전히 같은 내용을 가리키는지 눈 대조.

- [ ] **Step 5: Commit**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-flow): §7 블라인드 예외 + 블라인드 라운드 공통 절차 원본 신설 (REQ-005·006)"
```

---

### Task 3: brainstorming SKILL.md — Read 시점·블라인드 파라미터·출력 형식 재서술

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (73~75행 발동 조건 · 111~119행 출력 형식/SSOT Read · 국면 3 절)

**Interfaces:**
- Consumes: Task 2의 `### 블라인드 라운드 공통 절차` 헤딩명
- Produces: 블라인드 파라미터 규칙 (Task 4의 프롬프트 신설이 전제)

- [ ] **Step 1: Read 의무 시점 앞당김 (가이드라인 4·21)**

기존 (117행): `페르소나 토론 시작 전 반드시 해당 파일을 Read하고 준수한다.`
교체: `첫 서브에이전트 투입 전 반드시 해당 파일을 Read하고 준수한다 — 컨텍스트 압축(/compact) 복원 후에는 재적용한다 (세션당 1회가 아니다).`

- [ ] **Step 2: 「발동 조건」에 블라인드 파라미터 추가**

기존 발동 조건 불릿(73~75행) 뒤에 추가:

```markdown
### 블라인드 첫 라운드 (파라미터 — 절차 원본: decision-flow §7 「블라인드 라운드 공통 절차」)

- 대상: 국면 1~2 발산 토론은 국면당 첫 루프의 1라운드만 · 국면 3 검증 판정은 상시
- 페르소나: 현재 확정 세트 전원 · 사고 제약 원문: 미포함 (도메인 의견 수집이 목적)
- 발췌 내용: 현재 주제의 사용자 발화 원문 + 시드 해당 절 + 기확정 결정 목록
- 2라운드부터는 기존 대화형 + 비판 로빈 규칙이 그대로 적용된다
```

- [ ] **Step 3: 「출력 형식」 절 재서술 (덧붙이기 금지 — 절 전체 교체, 가이드라인 6·7)**

기존 (111~115행):
> ### 출력 형식
>
> - 의견 본문은 자유 형식 (페르소나 이모지 + 이름 접두사)
> - 정형 태그(찬성/반대 등)를 사용하지 않는다
> - 라운드 카운터를 포함한다: `[라운드 N/3]`

교체:

```markdown
### 출력 형식 (라운드 유형별)

**공통:** 페르소나 발언은 이모지 + 이름 접두사로 시작하고, 언어 규범(decision-flow 3부 펜스 — 일상어·용어 풀이·줄임말 금지·문단 개행)을 따른다. 라운드 카운터 `[라운드 N/3]` 포함. 정형 태그(찬성/반대 등)는 사용하지 않는다. **발언이 없는 것이 정상 상태다 — 쓰는 쪽이 입증 책임을 진다.**

**블라인드 라운드:** 정형 형식 — 결론 1줄 + 근거 최대 3개. 취합·센티널·순서 회전은 decision-flow §7 「블라인드 라운드 공통 절차」가 원본이다.

**대화형 라운드 (2라운드+):** 자유 문장. 단 발언하려면 새 기여 요소(새 근거·반례·성립 조건 수정·우선순위 변경) 최소 1개를 담아야 하고, 모든 주장에 도메인 근거를 병기한다 — 동의 대상이 타 페르소나든 사용자든 시드든 동일. **새 기여를 만들 수 없으면 지어내지 말고 발언을 생략한다.**
```

- [ ] **Step 4: 국면 3 규칙에 판정 블라인드 1줄**

국면 3 「규칙」 목록에 추가: `- TD 검토·리스크 판정 라운드는 상시 블라인드로 실행한다 (파라미터: 위 「블라인드 첫 라운드」 절 · 절차 원본: decision-flow §7)`

- [ ] **Step 5: 검증**

Run: `grep -n "자유 형식" skills/brainstorming/SKILL.md`
Expected: "대화형 라운드" 문맥의 "자유 문장" 외에 구 문장("의견 본문은 자유 형식") 잔존 0.
Run: `grep -n "블라인드" skills/brainstorming/SKILL.md` — 파라미터 절 + 국면 3 + 출력 형식 3곳 검출.

- [ ] **Step 6: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(brainstorming): 블라인드 파라미터 + 출력 형식 라운드 유형별 재서술 + Read 시점 앞당김 (REQ-004·005)"
```

---

### Task 4: brainstorming templates.md — 복제 지시 + 블라인드 프롬프트 신설

**Files:**
- Modify: `skills/brainstorming/references/templates.md` (머리말 + 프롬프트 7개 + 신설 절)

**Interfaces:**
- Consumes: Global Constraints의 복제 지시 표준 문구 · 구획명 `--- 언어 규범 ---`
- Produces: 「블라인드 라운드 프롬프트」 (Task 3 파라미터의 실행 템플릿) · 적용 경로 목록 (Task 13 검증 대상)

- [ ] **Step 1: 머리말에 공통 조립 규칙 + 적용 경로 목록 추가 (가이드라인 5)**

1행 인용문 뒤에 추가:

```markdown
> **공통 조립 규칙 (REQ-003):** 아래 모든 프롬프트 펜스 조립 시 decision-flow.md 3부 「언어 규범」 펜스 전문을 "--- 언어 규범 ---" 구획으로 그대로 붙여넣는다 (Read 실패 시 최소 요건: 한국어·일상어·용어 즉석 풀이·줄임말 금지·문단 개행).
> 적용 경로 목록 (검증 기준 — 누락 0): ① Step A-0 Ontologist ② Step A Socratic ③ 미답변 조사 ④ Step B Seed-Architect ⑤ Step C Contrarian ⑥ Step C Hacker ⑦ Simplifier ⑧ 블라인드 라운드 (본 파일) + plan-stage Architect·Researcher·블라인드 판정 (plan-stage SKILL.md).
```

- [ ] **Step 2: 프롬프트 7개 각각에 구획 삽입**

7개 프롬프트 펜스(Ontologist·Socratic·미답변 조사·Seed-Architect·Contrarian·Hacker·Simplifier) 각각에서, `--- 현재 주제 ---`(또는 각 펜스의 마지막 구획) 앞에 삽입:

```
--- 언어 규범 ---
[decision-flow.md 3부 「언어 규범」 펜스 전문 — 공통 조립 규칙 참조]
```

- [ ] **Step 3: 「블라인드 라운드 프롬프트」 절 신설 (파일 끝)**

```markdown
## 「블라인드 라운드 프롬프트」

절차 원본: decision-flow §7 「블라인드 라운드 공통 절차」. 페르소나 수만큼 병렬 투입한다 (상호 발언 미노출).

```
너는 [워크플로우 단계명] 블라인드 라운드의 독립 의견 제공자다.

--- 도메인 페르소나 정의 ---
[이모지] [이름] — [도메인 설명]

--- 언어 규범 ---
[decision-flow.md 3부 「언어 규범」 펜스 전문]

--- 발췌 ---
[사용자 발화 원문 인용]
[시드 해당 절 원문]
[기확정 결정 목록 — 재론 금지]

--- 지시 ---
이 도메인 관점의 독립 의견을 정형 형식으로 반환하라: 결론 1줄 + 근거 최대 3개 (불릿).
추가 의무: 이 논의의 전제가 틀렸다면 네 도메인에서 무엇이 무너지는지 1개 이상 지적하라.
보탤 것이 위 발췌의 재진술뿐이면 정확히 `[의견 없음 — 사유 1줄]`만 반환하라.
출력 제약: 사용자를 향한 결정 요청 문구를 포함하지 않는다.
```
```

- [ ] **Step 4: 검증**

Run: `grep -c -- "--- 언어 규범 ---" skills/brainstorming/references/templates.md`
Expected: 9 (프롬프트 7개 + 블라인드 프롬프트 1 + 공통 조립 규칙 인용 1 — 실측 후 목록과 대조).

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming/references/templates.md
git commit -m "feat(brainstorming): 언어 규범 구획 복제 지시 + 블라인드 라운드 프롬프트 신설 (REQ-003·005)"
```

---

### Task 5: plan-stage SKILL.md — Read 시점 + Step 2 블라인드 판정

**Files:**
- Modify: `skills/plan-stage/SKILL.md` (10행 Read 의무 · Step 2 92~150행 · Architect/Researcher 프롬프트)

**Interfaces:**
- Consumes: Task 2 헤딩 · Task 4의 블라인드 프롬프트 골격 (판정 기준만 교체)
- Produces: 블라인드 판정 절차 (판정 출력 형식은 기존 유지)

- [ ] **Step 1: Read 의무 시점 앞당김**

기존 (10행): `첫 결정 요청 전에 반드시 해당 파일을 Read한다`
교체: `첫 서브에이전트 투입 전에 반드시 해당 파일을 Read한다 — 컨텍스트 압축(/compact) 복원 후에는 재적용한다`

- [ ] **Step 2: Step 2 판정을 블라인드로 명시 (가이드라인 8)**

`페르소나 3인이 각 요구사항의 구현 가능 여부를 판정한다.` 교체:

```markdown
페르소나 3인이 각 요구사항의 구현 가능 여부를 판정한다. **판정은 상시 블라인드로 실행한다** — 3인을 병렬 서브에이전트로 동시 투입하며(상호 미노출), 절차 원본은 decision-flow §7 「블라인드 라운드 공통 절차」다.

판정 프롬프트 구성 (사고 제약 원문 미포함 — 판정용 원문이 존재하지 않음을 설계로 확정): [도메인 페르소나 정의] + [판정 기준 ✅/⚠️/🚫] + [발췌: 설계 문서 요구사항 + Architect 구조 분석 결과] + ["--- 언어 규범 ---" 구획] + [정형 형식: 요구사항별 판정 + 근거 1~2문장] + [전제 반박 의무 1개].
```

- [ ] **Step 3: Architect·Researcher 프롬프트 펜스에 구획 삽입**

두 프롬프트 펜스 각각 `--- 설계 문서 ---` / `--- 조사 대상 ---` 구획 앞에 `--- 언어 규범 ---` 구획(Task 4 Step 2와 동일 형식)을 삽입한다.

- [ ] **Step 4: 검증**

Run: `grep -n "블라인드\|언어 규범" skills/plan-stage/SKILL.md`
Expected: Step 2 블라인드 문단 + 프롬프트 구획 2곳 검출. `grep -n "첫 결정 요청 전" skills/plan-stage/SKILL.md` → 0.

- [ ] **Step 5: Commit**

```bash
git add skills/plan-stage/SKILL.md
git commit -m "feat(plan-stage): Feasibility 판정 상시 블라인드 + 언어 규범 구획 (REQ-003·005)"
```

---

### Task 6: persona-resolution — 표 원본 선언·복구 예외·표기 경계

**Files:**
- Modify: `skills/persona-resolution/SKILL.md` (9행 · 60~69행 Fallback 표)

**Interfaces:**
- Produces: "표 원본" 선언 (Task 10 README가 참조) · 복구 예외 문장 (Task 7과 같은 표현 — 이쪽이 원본)

- [ ] **Step 1: 복구 문장에 예외 추가 (가이드라인 11 — 본 스킬이 원본)**

기존 (9행): `HANDOFF 복구 시에는 HANDOFF의 "확정된 페르소나"를 그대로 적용하고 본 스킬을 생략한다.`
교체: `HANDOFF 복구 시에는 HANDOFF의 "확정된 페르소나"를 그대로 적용하고 본 스킬을 생략한다 — 단 현재 단계의 페르소나 줄이 HANDOFF에 없으면 본 스킬을 정상 실행한다 (원본 규칙: 본 문장 — context-handling이 참조).`

- [ ] **Step 2: Fallback 표에 원본 선언 + 표기 경계 (가이드라인 22)**

`## 기본 페르소나 정의 (Fallback)` 헤딩 아래 첫 문단 앞에 추가:
`이 표가 기본 페르소나의 유일한 원본이다 — README 등 사용자 문서는 예시만 싣는다. 표기: 브레인스토밍 3번째 페르소나는 "🔧 TD"로 통일한다 (PLAN의 "🔧 Tech Lead"는 별개 페르소나다).`

- [ ] **Step 3: 검증 + Commit**

Run: `grep -n "유일한 원본\|정상 실행" skills/persona-resolution/SKILL.md` — 2건 검출.

```bash
git add skills/persona-resolution/SKILL.md
git commit -m "feat(persona-resolution): Fallback 표 원본 선언 + HANDOFF 복구 예외 (REQ-009·010)"
```

---

### Task 7: context-handling — HANDOFF 반복 형식 + 블라인드 상태 줄

**Files:**
- Modify: `skills/context-handling/SKILL.md` (66~67행 템플릿 · 「결정 흐름 상태」 81~100행 · 복구 흐름)

**Interfaces:**
- Consumes: Task 6의 복구 예외 원본 문장

- [ ] **Step 1: 「확정된 페르소나」 반복 형식 (가이드라인 13 — 빈 슬롯 예시 금지)**

기존:
> ## 확정된 페르소나
> - 브레인스토밍: [목록]

교체:
> ## 확정된 페르소나
> - [단계명]: [목록]
> <!-- 확정된 단계만 한 줄씩 기록한다 (예: 브레인스토밍, PLAN). 미확정 단계의 줄을 만들지 않는다 -->

- [ ] **Step 2: 「결정 흐름 상태」에 블라인드 상태 조건부 줄 추가**

`- ❓ 질문 진행: …` 줄 아래에 추가:
`- 블라인드 첫 루프: [완료/미완료] · 국면: [국면명]` + 주석 `<!-- 블라인드 라운드 사용 국면에서만 포함 — 유실 시 블라인드로 간주 재실행 (decision-flow §7) -->`

- [ ] **Step 3: 복구 흐름에 참조 문장 추가**

「HANDOFF 있는 경우」 고지 아래 절차에 추가: `단 현재 단계의 페르소나 줄이 HANDOFF에 없으면 persona-resolution을 정상 실행한다 (원본: persona-resolution 복구 규칙).`

- [ ] **Step 4: 검증 + Commit**

Run: `grep -n "\[단계명\]\|블라인드 첫 루프\|정상 실행" skills/context-handling/SKILL.md` — 3건 검출. `grep -n "브레인스토밍: \[목록\]" skills/context-handling/SKILL.md` → 0.

```bash
git add skills/context-handling/SKILL.md
git commit -m "feat(context-handling): HANDOFF 페르소나 반복 형식 + 블라인드 상태 보존 (REQ-010)"
```

---

### Task 8: orchestrator SKILL.md — 이슈 카드 관점 줄 + 언어 축약 + 폴백 보강

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (Issue Lifecycle 경량 사이클 1 · 「결정 요청 폴백 형식」 · Superpowers Delegation 표)

**Interfaces:**
- Consumes: 정본 명칭 (언어 규범 원본 포인터)

- [ ] **Step 1: 경량 사이클 1에 관점 줄 규격 삽입 (REQ-011)**

기존: `1. **분석** — 카드의 원인·영향 범위·수정 방향을 채운다 (원인 분석은 \`superpowers:systematic-debugging\`의 근본 원인 우선 원칙을 따른다). 수정 방향에 대해 확인 1회: "수정 방향대로 진행할까요? 1. Yes 2. 수정 방향 조정"`

교체 (확인 문구 앞에 관점 줄 규격 추가):

```markdown
1. **분석** — 카드의 원인·영향 범위·수정 방향을 채운다 (원인 분석은 `superpowers:systematic-debugging`의 근본 원인 우선 원칙을 따른다). 확인 직전, `.claude/personas.md`의 PLAN 세트가 있으면 페르소나별 관점을 1줄씩 병기한다 — 형식 `[이모지] [이름]: [관점 1줄]`. 관점 줄이 하나도 없는 것이 정상 상태이며 쓰는 쪽이 입증 책임을 진다 (새 근거·반례·조건 수정이 없으면 그 페르소나 줄은 만들지 않는다). personas.md가 없으면 관점 줄 전체를 생략한다 (기본 페르소나 미사용). 언어: 쉬운 한국어·용어 즉석 풀이·줄임말 금지·문단 개행 (원본: decision-flow 3부 「언어 규범」). 이어서 확인 1회: "수정 방향대로 진행할까요? 1. Yes 2. 수정 방향 조정"
```

- [ ] **Step 2: 「결정 요청 폴백 형식」에 언어 축약 1줄 (가이드라인 20-③)**

폴백 절 첫 불릿 앞에 추가: `- 언어 최소 요건: 쉬운 한국어 · 전문 용어 즉석 풀이 · 줄임말 금지 · 문단 개행 (원본: decision-flow 3부 「언어 규범」 — Read 실패 시에도 이 줄이 적용된다)`

- [ ] **Step 3: Delegation 표 DEVELOP 행 예외 표기**

`| DEVELOP (git-mode) | … | ❌ 없음 | — |` 및 no-git-mode 행의 `❌ 없음` → `❌ 없음 (이슈 카드 관점 1줄 예외)` (두 행 모두).

- [ ] **Step 4: 검증 + Commit**

Run: `grep -n "관점" skills/workflow-orchestrator/SKILL.md` — 경량 사이클 1 검출. `grep -c "이슈 카드 관점 1줄 예외" skills/workflow-orchestrator/SKILL.md` ≥ 2.

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "feat(orchestrator): 이슈 카드 PLAN 세트 관점 1줄 + 언어 축약 폴백 (REQ-011, 가이드라인 20)"
```

---

### Task 9: bootstrap.md — 세션 불변식 언어 1줄

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md` (26~33행 세션 불변식)

- [ ] **Step 1: 불변식 추가 (32행 폴백 줄과 동형 — compact 재주입 기계 보장)**

`- 페르소나 발언에는 항상 이모지 접두사를 붙인다` 교체:
`- 페르소나 발언에는 항상 이모지 접두사를 붙이고, 사용자 대면 문면은 쉬운 한국어로 쓴다 — 전문 용어 즉석 풀이 · 줄임말 금지 · 문단 개행 (원본: decision-flow 3부 「언어 규범」)`

- [ ] **Step 2: 검증 + Commit**

Run: `grep -n "쉬운 한국어" skills/workflow-orchestrator/bootstrap.md` — 1건. 파일 크기 확인(`wc -c`) — 경량 부트스트랩 취지 유지 (증가 ~150B).

```bash
git add skills/workflow-orchestrator/bootstrap.md
git commit -m "feat(bootstrap): 세션 불변식에 언어 규범 최저선 1줄 (가이드라인 20-②)"
```

---

### Task 10: README — 표 예시 강등 + 표기 통일

**Files:**
- Modify: `README.md` (5행 · 106~114행 기본 페르소나 표 · 583~592행 커스터마이징 예시 · 99~104행 피드백 루프 서술)

- [ ] **Step 1: 기본 페르소나 표(108~111행) 예시 강등 (REQ-009)**

기존 표(`| 단계 | 페르소나 |` ~ `| Plan | … |`)와 106행 `**기본 페르소나:**` 라벨을 통째로 교체:

```markdown
**기본값 예:** 🎮 Game Designer · 👤 Player · 🔧 TD(기술 검증 담당 — Phase 3 합류) / Plan 단계는 🏛️ Architect · 🔧 Tech Lead · 📋 PM — 프로젝트에 맞게 바뀝니다. 정확한 기본값 규칙은 플러그인의 페르소나 확정 단계가 관리합니다.
```

- [ ] **Step 2: 표기 통일 — "Tech Director" 전수 교체**

5행 `(Game Designer, Player, Tech Director 등)` → `(Game Designer, Player, TD 등)`
589행 `- 🔧 Tech Director: 기술적 실현 가능성 검증` → `- 🔧 TD: 기술적 실현 가능성 검증`
111행은 Step 1의 표 교체로 소멸.

- [ ] **Step 3: 피드백 루프 서술에 블라인드 1문장 (99~104행)**

102행 부근 불릿 목록에 추가: `- 토론의 첫 의견은 서로 안 보이게 각자 따로 수집합니다 (먼저 나온 의견에 끌려가는 것을 막기 위해) — 판정·평가 회차는 항상 이 방식입니다`

- [ ] **Step 4: 검증 + Commit**

Run: `grep -c "Tech Director" README.md` → 0. `grep -n "기본값 예" README.md` — 1건.

```bash
git add README.md
git commit -m "docs(readme): 페르소나 표 예시 강등 + TD 표기 통일 + 블라인드 라운드 서술 (REQ-009)"
```

---

### Task 11: CLAUDE.md — 위임 표·Key Patterns 갱신

**Files:**
- Modify: `CLAUDE.md` (Workflow Stage → Delegation 표 · Key Patterns 이슈 카드 불릿)

- [ ] **Step 1: 위임 표 DEVELOP 행**

`| DEVELOP | Superpowers \`subagent-driven-development\` | ❌ 없음 |` → `| DEVELOP | Superpowers \`subagent-driven-development\` | ❌ 없음 (이슈 카드 관점 1줄 예외) |`

- [ ] **Step 2: Key Patterns 이슈 카드 불릿 끝에 추가**

`- **이슈 카드**: …` 불릿 끝에 ` 카드 분석 확인 시 PLAN 세트 페르소나 관점 1줄 병기 (personas.md 없으면 생략)` 추가.

- [ ] **Step 3: 검증 + Commit**

Run: `grep -c "관점 1줄" CLAUDE.md` ≥ 2.

```bash
git add CLAUDE.md
git commit -m "docs(claude-md): DEVELOP 페르소나 예외 + 이슈 카드 관점 1줄 반영"
```

---

### Task 12: 규범 스윕 — "DEVELOP 페르소나 없음"·"자유 형식" 재서술 전수

**Files:**
- Modify: grep 인벤토리가 지목하는 파일 (예상: `skills/workflow-orchestrator/SKILL.md` 40·100·105·118행 부근, `skills/persona-resolution/SKILL.md` 62~63행 — 실측으로 확정)

- [ ] **Step 1: 인벤토리 추출 (도메인 문서 제외 — 가이드라인 12)**

Run: `grep -rn "페르소나를 사용하지 않\|페르소나 없음\|페르소나가 없\|DEVELOP/REVIEW는 Superpowers 전담" skills/ commands/ README.md CLAUDE.md --include="*.md"`
Expected: Task 8·11에서 처리된 곳 외 잔존 목록 산출. **`docs/design/` 하위는 검색·수정 대상에서 제외한다** (supersede 경유 — 이중 반영 금지).

- [ ] **Step 2: 잔존 문장 갱신**

각 잔존 지점에 예외 문구를 붙인다 — 표준형: `(단 이슈 카드 관점 1줄 예외 — orchestrator 「Issue Lifecycle」)`. persona-resolution 62~63행 `DEVELOP/REVIEW는 Superpowers 서브에이전트가 전담한다` → `DEVELOP/REVIEW는 Superpowers 서브에이전트가 전담한다 (단 이슈 카드 관점 1줄 예외 — orchestrator 「Issue Lifecycle」).`

- [ ] **Step 3: "자유 형식" 구 독트린 스윕**

Run: `grep -rn "자유 형식" skills/ README.md CLAUDE.md --include="*.md"`
Expected: Task 3 처리 후 페르소나 발언 문맥의 잔존 0 (다른 의미의 "자유 형식"은 문맥 확인 후 유지 — plan 문면 예외 없음 원칙: 페르소나 발언 문맥이면 전부 갱신).

- [ ] **Step 4: 재검증 + Commit**

Step 1·3의 grep 재실행 — 페르소나 문맥 잔존 0 (도메인 문서 제외).

```bash
git add -A
git commit -m "fix(sweep): DEVELOP 페르소나 없음·자유 형식 재서술 전수 갱신 (가이드라인 16)"
```

---

### Task 13: 최종 검증 배터리 + 버전 1.19.0

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (version → `1.19.0`)

- [ ] **Step 1: 펜스 적용 경로 목록 대조 (REQ-003 성공 기준)**

Run: `grep -c -- "--- 언어 규범 ---" skills/brainstorming/references/templates.md` (기대 9) · `grep -c -- "--- 언어 규범 ---" skills/plan-stage/SKILL.md` (기대 ≥3: Architect·Researcher·블라인드 판정 구성) · `grep -n "언어" skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md | grep -c "언어 규범"` ≥ 2
Task 4 Step 1의 적용 경로 목록과 1:1 대조 — 누락 0.

- [ ] **Step 2: decision-flow 구조·참조 무결성**

Run: `grep -n "^## \|^### " skills/workflow-orchestrator/decision-flow.md` — 절 번호 1~9 불변 + 신설 하위절 2개(언어 규범·블라인드) 확인.
Run: `grep -rn "decision-flow" skills/ | grep -v "persona-improvement"` — 참조 문장들이 깨진 절 번호를 가리키지 않는지 확인.

- [ ] **Step 3: 불변·무오염 확인**

Run: `git diff main --stat -- "skills/brainstorming/references/agent-roles.md" "skills/plan-stage/references/agent-roles.md" "skills/workflow-orchestrator/references/agent-roles.md"` → 변경 0.
Run: `git diff main --stat -- "docs/design/dev-workflow/document-management.md" "docs/design/dev-workflow/ux-consistency.md" "docs/design/dev-workflow/workflow-lifecycle.md"` → 변경 0 (도메인 문서 무수정).
Run: `git branch --show-current` → `worktree-persona-improvement`.

- [ ] **Step 4: 관측·해석 문장 존재 확인 (REQ-013)**

Run: `grep -rn "약한 신호" skills/workflow-orchestrator/decision-flow.md` — 1건 (Task 2).
Run: `grep -rn "lessons.md" skills/brainstorming/SKILL.md skills/workflow-orchestrator/decision-flow.md` — 언어 펜스 위반 기록 고리 1건 이상. 없으면 Task 2의 하위절 「해석」 불릿 끝에 추가: `언어 규범이 안 지켜진 발언을 발견하면 tasks/lessons.md에 기록한다 (자기개선 루프).`

- [ ] **Step 5: 버전 범프**

`.claude-plugin/plugin.json`과 `.claude-plugin/marketplace.json`의 version을 현재 값(1.18.x — 실측)에서 `1.19.0`으로 (MINOR — 하위 호환 동작 추가·개선, PM 판정).

- [ ] **Step 6: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore(release): bump to 1.19.0 for persona-improvement"
```

---

## 완료 후 (plan 범위 밖 — Completion Protocol이 담당)

- 문서 취합(document-consolidation) → 설계 문서 §9 작성·status: complete → 커밋·푸시 확인 → 관리자 merge-to-domain 시 §6 supersede 4건 반영
- 관측 항목 (다음 릴리스 입력): 페르소나 발언 가독성 체감 · 펜스 준수율(lessons.md 기록 건수) · 블라인드 라운드 대기 체감 · 만장일치 경보 재고 여부
