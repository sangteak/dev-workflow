---
name: workflow-orchestrator
description: Use when workflow intent signals appear (brainstorm/plan/develop/review/wrap-up keywords, docs/design artifacts, or resuming in-progress work) - orchestrates the full development workflow lifecycle (Brainstorm → Plan → Develop → Review → Completion) with persona-based feedback loops
---

# Dev Workflow Orchestrator

## CRITICAL

These instructions are MANDATORY across ALL projects.
If Superpowers skills exist for a task, run them FIRST. This workflow extends Superpowers — it does NOT replace it.

사용자 입력 요청에 AskUserQuestion 도구를 사용하지 않는다 (본 워크플로우가 주관하는 BRAINSTORM/PLAN/COMPLETION 한정 — Superpowers 전담 DEVELOP/REVIEW 단계는 이 금지의 적용 범위 밖이다).

---

## Session Start Protocol

orchestrator 최초 invoke 시(세션 시작 또는 대화 중 워크플로우 신호 최초 감지 시점) 아래를 실행한다. **경량 상시**는 최초 invoke 시 1회, **지연 발동**은 워크플로우 의도가 있을 때만 실행한다.

### 경량 상시 (최초 invoke 시 1회)

1. **작업 상태 확인**
   - 동일 세션에서 이미 작업 상태 확인을 수행했거나 워크플로우 단계가 진행 중이면(/compact 요약 복원 포함) → 생략하고 진행 중 흐름을 계속한다
   - 최초 invoke → invoke `dev-workflow:context-handling` skill
     (탐색, 분류, 목록 제시를 모두 처리. 탐색 과정을 직접 출력하지 않는다)
   - "진행 중인 작업 없음" + 답이 이미 정해진 요청 → 후속 질문 없이 사용자 요청에 일반 응답한다
   - "진행 중인 작업 없음" + 워크플로우 의도 있음 → 아래 후속 질문

     참고할 설계 문서가 있습니까?

     1. 있다 — 고르면: 그 설계 문서를 읽고 내용을 바탕으로 이어서 진행합니다
     2. 없다 — 고르면: 설계 문서 없이 지금 요청부터 바로 진행합니다

2. **Lessons Review** — `tasks/lessons.md` 존재 시 내부적으로 읽고 숙지 (사용자에게 출력하지 않음)

### 지연 발동 (워크플로우 의도 감지 시에만)

**게이트:** 워크플로우 의도 신호(단계 키워드, **착수 신호**, docs/design 산출물 작업, 진행 중 작업 재개)가 전혀 없고 **답이 이미 정해진 요청**은 아래 단계를 생략하고 일반 응답한다. 이후 대화에서 신호가 등장하면 그 시점에 진입한다.

3. **Stage Detection** — 현재 워크플로우 단계 감지 (아래 Workflow Stage Detection)

4. **Persona Resolution** — **BRAINSTORM 또는 PLAN 판정 시에만** invoke `dev-workflow:persona-resolution`
   - HANDOFF 복구 시에는 HANDOFF의 "확정된 페르소나"를 그대로 적용하고 재확정을 생략한다
   - DEVELOP/REVIEW/COMPLETION은 페르소나를 사용하지 않으므로 생략한다 (단 이슈 카드 관점 1줄 예외 — orchestrator 「Issue Lifecycle」)
   - 동일 세션 내 브레인스토밍 완료 후 PLAN 전환 시 재실행 생략, PLAN 페르소나만 확정

5. **Stage Announcement** — 감지된 단계(BRAINSTORM/PLAN이면 확정 페르소나 포함) 선언 후 진행

### 지연 감지 (소비 시점 직전, 세션당 1회 캐시)

- **VCS Detection** — **코드 파일을 처음 고치기 직전, 또는 DEVELOP과 REVIEW 진입 중 먼저 오는 시점**에 실행한다 (단계 이름이 아니라 행위가 트리거다 — 작업 방향에 따라 진입 모양이 달라져도 감지를 놓치지 않는다). 세션 환경 컨텍스트의 "Is directory a git repo" 값을 사용한다
  - 제공되지 않은 경우에만 git 명령으로 확인한다 (`.git` 디렉토리 리터럴 검사는 linked worktree에서 오탐하므로 사용하지 않는다)
  - Yes → `git-mode` (기존 Superpowers 방식 그대로), No → `no-git-mode` (worktree 스킵, 파일 기반 체크포인트)
  - 감지 결과를 내부적으로 기록 (사용자에게 출력하지 않음)

- **Ouroboros Detection** — BRAINSTORM/PLAN에서 첫 서브에이전트 투입 직전, 또는 REVIEW의 Evaluator QA 게이트 직전(둘 중 먼저)에 실행한다
  - 판정: Ouroboros MCP 도구 사용 가능 여부만 확인한다 — 사용 가능한 도구 목록에서 `ouroboros` 포함 MCP 도구 탐색 (예: `mcp__plugin_ouroboros_ouroboros__ouroboros_interview`), 또는 ToolSearch `+ouroboros` 실행
  - MCP 사용 가능 → **Path A (MCP 연동)** — validate_seed 등 MCP 전용 도구를 추가로 사용 / MCP 미사용 → **Path B (내장 역할)** — 내장 역할 정의만으로 동일하게 동작
  - 에이전트 역할 정의는 Path와 무관하게 각 스킬의 `references/agent-roles.md` 내장본을 사용한다 (v1.16.0 — 외부 플러그인 파일 탐색 제거, 구 Standalone Mode/Path C 소멸)
  - 감지 결과를 내부적으로 기록하고, Path A일 때만 감지 완료 시점에 1회 표시: "🔗 Ouroboros 연동: MCP 모드"

---

## Workflow Stage Detection

자동 감지한다. 감지 불가 시에만 사용자에게 질문한다.

### BRAINSTORM
- 사용자 메시지: 브레인스토밍, brainstorm, 아이디어, 기획, 방향, 버그, 에러, 안 나와, 재현, 고쳐줘, 리팩터링
  ↳ 착수 신호로 진입한 경우 Step B-1(작업 방향 확인)에서 작업 방향을 확정한다 — 상세는 본 스킬 「착수 트리거 감지」
- 요구사항이 불완전하거나 정제되지 않은 상태로 논의 요청
- 코드베이스 없이 기능/시스템 방향성 탐색 요청

→ invoke `dev-workflow:brainstorming` skill

### PLAN
- 경로 해소(`find . -maxdepth 2 -iname "docs" -type d`) 후
  `[해소된 경로]/[카테고리]/[기능명]/[기능명].md` 존재 + 태스크 목록(plan.md) 미생성
  (상세: development-principles "경로 해소 규칙" 참조)
- 사용자 메시지: 계획, plan, 설계, architecture, 구조, breakdown
- Superpowers `writing-plans` 활성화 직전

→ invoke `dev-workflow:plan-stage` skill

### DEVELOP
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물) — 작업 방향과 무관하게 PLAN Step 4가 항상 생성한다 (`plan-stage/SKILL.md` Step 4)
- 사용자 메시지: 구현, implement, 개발, 작성, coding, write

→ **위임 목적지는 작업 방향이 정한다** (REQ-016, GOAL-002).
  `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md`를 Read해 현재 `action:` 값의 블록에서 「넘길 곳」을 읽는다.
  값 해소 순서: `[기능명].md` 앞머리(정본) → `HANDOFF.md` 앞머리(임시 정본) → 없으면 `new-feature` (REQ-007).
  Read에 실패하면 `superpowers:subagent-driven-development`로 폴백한다.

  - 「넘길 곳」이 `superpowers:systematic-debugging`인 경우: 그 블록의 **「종료 조건」 다섯 칸을 채운 값 그대로** 호출 프롬프트에 싣는다. 1~3번 칸은 그 스킬 1단계의 입력이므로 다시 물을 것이 없다. 워크트리와 태스크 루프 규칙은 적용하지 않는다
    - 채운 값의 해소 순서: `phase1_exploration.md`의 「종료 조건 충족 내역」 → `HANDOFF.md` 본문의 「확정된 항목」. 어느 자리에도 없으면 **개발로 넘기지 말고** 브레인스토밍 Step A(인터뷰)로 되돌아가 채운다
    - 아래 공통 규칙 중 **1(rules-injection)과 3(마무리 복귀 문구)은 이 경로에도 적용한다** — `target_agent`는 `Implementer` 대신 디버깅 담당으로 바꿔 첨부하고, 3번 문구는 "태스크" 대신 이 경로에 맞는 말로 바꿔 디버깅 완료를 보고한 뒤 마무리 복귀를 안내한다 (예: "✅ 문제 해결이 완료되었습니다. 마무리할까요? (/dev-workflow:finish 또는 \"마무리해줘\")")
  - 그 외(태스크 목록 실행형인 경우): 아래 공통 규칙을 그대로 따른다

→ 태스크 목록 실행형 위임 시, VCS 모드에 관계없이 `superpowers:subagent-driven-development` 실행 시 아래 공통 규칙을 컨텍스트로 전달:
  1. **단계 진입 즉시**: invoke `dev-workflow:rules-injection` with:
     - stage: develop
     - purpose: pre-stage-attach
     - target_agent: Implementer

     이 호출 결과(활성 규칙 본문 + 단계 라벨)를 `superpowers:subagent-driven-development`의 Implementer/Task Reviewer(스펙 준수 + 코드 품질 통합 리뷰) 호출 프롬프트에 함께 첨부한다. `.claude/rules/`가 없으면 자동으로 no-op이 된다.
  2. 모든 태스크 완료 후 커밋을 제안하지 않는다
  3. 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리할까요? (/dev-workflow:finish 또는 \"마무리해줘\")"
  4. 커밋과 푸시는 마무리 시퀀스(Completion Protocol)에서 처리한다
  5. 규범의 의미를 바꾸는 변경(게이트 존폐, 독트린 역전과 명칭 개명)이 plan에 포함된 경우, 태스크 리뷰와 최종 브랜치 리뷰 프롬프트에 검증 항목을 첨부한다: "구 규범 문장 잔존(스테일) 0 확인 — 범위는 skills/ 밖(README, commands, CLAUDE.md)까지" (절차 규범: development-principles 「규범 변경 스윕」)
  6. DEVELOP 중 계획 밖 결함의 처리(카드 선행, 태스크 경계와 대기열)는 본 스킬 「Issue Lifecycle」 절을 따른다 — 서브에이전트 리포트 수신 시 태스크 범위 밖 발견물은 대기 카드로 적재한다

→ 태스크 목록 실행형 위임 시, VCS 모드에 따라 분기:

**git-mode (태스크 목록 실행형):**
→ Superpowers `subagent-driven-development` 전담 (페르소나 없음 — 단 이슈 카드 관점 1줄 예외 — 「Issue Lifecycle」)
  - `superpowers:using-git-worktrees` 실행 후 `superpowers:subagent-driven-development` 실행
  - 기존 Superpowers 방식 그대로

**no-git-mode (태스크 목록 실행형):**
→ Superpowers `subagent-driven-development` 전담 (페르소나 없음 — 단 이슈 카드 관점 1줄 예외 — 「Issue Lifecycle」)
  - DEVELOP 진입 시 안내: "⚙️ no-git-mode — worktree 없이 현재 디렉토리에서 진행합니다"
  - `superpowers:using-git-worktrees` 스킵
  - `superpowers:subagent-driven-development` 실행 시 아래 규칙을 컨텍스트로 전달:
    1. worktree 설정 단계를 스킵하고 현재 프로젝트 디렉토리에서 직접 작업한다
    2. 커밋 체크포인트를 파일 기반 리포트로 대체한다 — git commit 대신 Implementer 리포트 제출이 Task 체크포인트
    3. Task Reviewer에게 diff/SHA 비교 자료 대신 Implementer 리포트의 "Files changed" 목록을 전달하고, 리뷰어는 해당 파일의 코드를 직접 읽어 리뷰한다
    4. 세션에 노출된 네이티브 태스크 추적 도구로 Task 진행을 추적한다 (예: TaskCreate/TaskUpdate 계열 또는 TodoWrite — 특정 도구명에 의존하지 않는다)

### REVIEW
- 기능/태스크 구현 완료
- 사용자 메시지: 리뷰, review, 검토, 확인, check, QA

→ Superpowers `requesting-code-review` 전담 (페르소나 없음)

**📎 rules-injection 호출 (사전 + 사후):**

1. **REVIEW 진입 즉시 (사전 첨부):**
   invoke `dev-workflow:rules-injection` with:
   - stage: review
   - purpose: pre-stage-attach
   - target_agent: code-reviewer

   결과를 Superpowers `requesting-code-review` 호출 프롬프트에 첨부한다.

2. **Superpowers 리뷰 완료 후 (검증 + 자동 수정 라운드):**
   invoke `dev-workflow:rules-injection` with:
   - stage: review
   - purpose: post-review-validate

   `type: quantitative/structural` 규칙은 Ouroboros Evaluator로 라우팅되어 PASS/FAIL/PARTIAL 판정. 위반 시 `auto-fix` 메타데이터에 따라 자동 수정 라운드 실행 (별도 커밋 + 테스트 재실행 + 실패 시 자동 롤백).

**순서:** Superpowers `requesting-code-review` 완료 후 → 위 `post-review-validate`(rules-injection)를 먼저 실행 → 그 다음 아래 `Evaluator QA 게이트`를 실행한다. rules-injection에서 type:quantitative/structural 규칙을 Evaluator로 라우팅하므로, Evaluator QA 게이트는 설계 문서의 Success Criteria만 검증한다 (중복 호출 회피).

**📎 Evaluator QA 게이트:**
Superpowers 코드 리뷰 완료 후, 설계 문서의 수락 기준(Success Criteria / Acceptance Criteria)이 존재하면
Evaluator 에이전트를 서브에이전트로 실행하여 AC 충족 여부를 검증한다 (v1.16.0부터 Ouroboros 설치 여부와 무관하게 상시 실행 — 의도된 강화).
역할 정의: 본 스킬의 `references/agent-roles.md` 「Evaluator」 블록을 Read하여 사용한다.
(Read 실패 시 최소 요건: 각 수락 기준에 PASS/FAIL/PARTIAL 판정 + 근거와 수정 제안)

```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 취지가 같은 섹션을 찾아 따르라.
--- 에이전트 역할 정의 --- [references/agent-roles.md 「Evaluator」 블록 전문]
--- 수락 기준 --- [설계 문서의 success_criteria 목록]
--- 구현 결과물 --- [변경 파일 목록 및 주요 변경 내용]
각 수락 기준에 PASS/FAIL/PARTIAL을 판정하고, FAIL/PARTIAL에는 근거와 수정 제안을 포함하라.
```

출력 형식:
```
── 🎯 AC 검증 결과 [Evaluator] ─── ✅ PASS: N, ⚠️ PARTIAL: N, ❌ FAIL: N
[상세 목록]
──────────────────────────────────
```

- FAIL 항목이 있으면 → 수정 후 재검증을 제안한다
- 모두 PASS → REVIEW 완료로 진행한다
- 설계 문서에 수락 기준이 없으면 Evaluator를 스킵한다

### Ambiguous

워크플로우 의도 신호는 있으나 단계가 불명확할 때만 질문한다. 답이 이미 정해진 요청이면 질문 없이 일반 응답한다 (Session Start Protocol의 게이트).

**메뉴형이다** (원본: `decision-flow.md` 「판정형과 메뉴형」 표) — 이 화면은 근거를 못 대는 것이 발동 조건이라 판정형을 쓰지 않는다. 대신 **선택지 이름과 결과 줄에 사용자 요청의 대상을 넣는다** (원본: 같은 문서 「내보내기 전 검사」 2번과 3번 — 결과 줄과 선택지 이름 둘 다 걸린다). `[대상]`은 사용자 발화에서 뽑은 이번 일의 이름이다.

```
[대상]을 어느 단계부터 할지 잡지 못했습니다. 브레인스토밍, 계획, 구현이나 리뷰 중 어디인가요?

1. [대상] 브레인스토밍 — 고르면: 무엇을 만들지 아직 안 정해졌으니 [대상]의 요구사항부터 정리합니다
2. [대상] 계획 — 고르면: [대상]의 설계 문서가 이미 있으니 구현 계획을 짭니다
3. [대상] 구현 — 고르면: [대상]의 구현 계획이 이미 있으니 바로 개발로 넘어갑니다
4. [대상] 리뷰 — 고르면: 이미 구현된 [대상]의 코드를 검토합니다

0\. 이 중에 없음 — 하려는 일을 자유롭게 설명해주세요
```

- **선택지 이름은 단계 이름 넷을 그대로 쓴다** — 「언어 규범」의 독자 기준선(주니어와 시니어 사이의 개발자)이 이미 아는 말이라 지어낸 쉬운 말로 바꾸지 않는다. 첫 줄에 넷을 함께 적어 「내보내기 전 검사」 1번(선택지 낱말)의 대조 상대를 만든다

---

## Superpowers Delegation

| 단계 | 담당 | 페르소나 | 📎 Ouroboros 에이전트 |
|---|---|---|---|
| BRAINSTORM | dev-workflow | ✅ 사용 | Ontologist, Socratic, Seed-Architect, Contrarian, Simplifier, Hacker |
| PLAN | dev-workflow | ✅ 사용 | Architect, Researcher |
| DEVELOP (태스크 목록 실행형, git-mode) | dev-workflow `rules-injection` → Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 (이슈 카드 관점 1줄 예외) | — |
| DEVELOP (태스크 목록 실행형, no-git-mode) | dev-workflow `rules-injection` → Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 (이슈 카드 관점 1줄 예외) | — |
| DEVELOP (「넘길 곳」이 디버깅인 경우) | dev-workflow → Superpowers `systematic-debugging` (워크트리, 태스크 루프 미적용) | ❌ 없음 | — |
| REVIEW | dev-workflow `rules-injection` (사전+사후) → Superpowers `requesting-code-review` + Evaluator QA | ❌ 없음 | Evaluator |
| COMPLETION | dev-workflow `rules-injection` → Completion Protocol (작업자 측) + merge-to-domain (관리자 측) | ❌ 없음 | — |

- **검증 버전: Superpowers 6.2.0** — 이후 버전에서 역할 구조가 다르면 의미상 등가 역할(구현 담당 → Implementer 규칙, 태스크 리뷰 담당 → Reviewer 규칙)에 첨부하라
  - `systematic-debugging` 1단계 요구 셋(에러 원문, 재현 절차와 최근 변경)에 `actions.md`의 결함 종료 조건 1~3번이 이름을 맞추고 있다. 상위 버전에서 이 셋이 바뀌면 블록의 해당 칸도 함께 고친다
- Superpowers 스킬이 존재하면 FIRST 실행
- DEVELOP/REVIEW 충돌 시 → Superpowers 우선
- BRAINSTORM/PLAN 충돌 시 → 이 워크플로우 우선
- PLAN Step 4 완료 후 → Superpowers `writing-plans` 실행
- no-git-mode에서는 `using-git-worktrees` 를 호출하지 않는다
- no-git-mode에서 `subagent-driven-development` 실행 시 git 관련 단계(commit, SHA 비교)를 파일 기반으로 대체하라는 컨텍스트를 전달한다
- DEVELOP 완료 후 커밋과 푸시는 Completion Protocol을 통해서만 실행한다

---

## Issue Lifecycle (이슈 생애주기)

DEVELOP 진입 후(테스트와 검증 포함) 발견되는 **계획 밖 문제**를 관리한다. 이슈는 한 번에 하나만 처리한다.

### 트리거 — 카드 선행 규칙 (행동 기반)

현재 plan.md 태스크 범위 밖의 결함을 수정하기 위해 코드 수정 도구를 사용하려는 시점에는, 수정 전에 이슈 카드를 먼저 생성한다. 판정 기준은 발화 표현이 아니라 행동이다:
- 판정: "지금 하려는 수정이 plan.md의 태스크에 규정된 작업인가?" — Yes = 정상 진행 / No = 카드 선행
- 현재 태스크 범위 내에서 태스크 리뷰와 fix 루프가 다루는 결함은 카드를 만들지 않는다 (Superpowers SDD가 전담)
- 서브에이전트 리포트에 태스크 범위 밖 발견물(완료 태스크의 회귀, 범위 밖 부작용과 Evaluator FAIL)이 포함되면 리포트 수신 시점에 대기 카드를 생성한다

### 이슈 카드 규격

경로: `docs/design/[카테고리]/[기능명]/issues/NNN-[문제명].md` (NNN = 3자리 생성 순번 — 순서를 파일명에 고정, frontmatter 없음)

```markdown
# [문제명]

## 심각도
[경미 | 중간 | 크리티컬]

## 증상
[무엇이 어떻게 잘못되는가 — 1~3줄]

## 원인
[분석 결과 — 활성화 시 기록]

## 영향 범위
[설계 문서, 남은 plan 태스크와 다른 코드에 미치는 영향 — 활성화 시 기록]

## 수정 방향
[구체 수정 계획 — 이 절이 수정 작업의 입력 프롬프트가 된다]
```

상태는 카드 구조가 인코딩한다 (별도 상태값 없음):
- **대기**: 심각도와 증상만 기록 (생성 비용 2줄)
- **활성**: 원인~수정 방향까지 기록 — 활성 카드는 항상 1장만
- **해소**: 파일 삭제됨 — 요지는 부모 설계 문서 §10에 1~2줄이 유일 기록

### 경량 사이클 (심각도: 경미나 중간)

1. **분석** — 카드의 원인, 영향 범위와 수정 방향을 채운다 (원인 분석은 `superpowers:systematic-debugging`의 근본 원인 우선 원칙을 따른다). 확인 직전, `.claude/personas.md`의 PLAN 세트가 있으면 페르소나별 관점을 1줄씩 병기한다 — 형식 `[이모지] [이름]: [관점 1줄]`. 관점 줄이 하나도 없는 것이 정상 상태이며 쓰는 쪽이 입증 책임을 진다 (새 근거, 반례와 조건 수정이 없으면 그 페르소나 줄은 만들지 않는다). personas.md가 없으면 관점 줄 전체를 생략한다 (기본 페르소나 미사용). 언어: 독자는 주니어와 시니어 사이의 개발자, 표준 용어는 그대로, 저장소에 없는 낱말로 개념에 이름 붙이지 않기, 코드에 적히는 이름 번역 금지, 저장소 고유 용어와 식별자는 즉석 풀이(병기) — 번호만 쓰지 않고 무엇인지 한 조각을 함께 적는다 — 내보내기 전에 풀이 없는 것을 센다 — 도메인 명사는 세션 목록 또는 코드 자리에서 1건 이상, 가운뎃점(·) 금지 — 나열은 쉼표와 와/과, 줄임말 금지, 문단 개행, 화면 폭에 맞춘 임의 줄바꿈 금지 (원본: decision-flow 3부 「언어 규범」). 이어서 확인 1회: "수정 방향대로 진행할까요? 1. Yes 2. 수정 방향 조정"
2. **수정** — 카드의 "수정 방향"을 입력으로 같은 워크트리에서 구현과 테스트한다. 카드 없이 계획 밖 수정을 시작하지 않는다
3. **반영** — 부모 설계 문서 §10(변경 이력)에 요약 1~2줄 추가. 설계 서술이 실제로 바뀌었으면 해당 절(§4/§6 등)도 갱신. 남은 plan 태스크에 영향이 있으면 해당 태스크만 갱신. 완료 후 카드를 삭제한다 — git-mode: 확인 없이 삭제하고 1줄 고지 `🧹 이슈 카드 [문제명]을 정리했습니다 — 요지는 설계 문서의 변경 이력 절에 기록 (기록은 git 이력에 남음, 되돌리려면 말씀하세요)` (안전망: development-principles "자동 결정 안전망" 참조) / no-git-mode: 삭제 확인 1회
- 반영 검증 항목: **"분석(카드)이 수정에 선행했는가"** — 태스크 리뷰와 최종 브랜치 리뷰에 포함한다

### 대기열 (카드 = 큐)

- 활성 이슈 진행 중 새 문제를 발견하면 현재 이슈에 섞지 않는다 — 심각도와 증상 2필드만 채운 대기 카드를 즉시 생성하고 현재 이슈로 복귀한다
- 처리 순서: 번호순(FIFO) 추천을 기본으로 하되, 심각도가 높은 대기 카드가 있으면 앞당김을 제안한다
- 활성 카드가 있는 동안 신규 SDD 태스크 디스패치는 보류한다 (이슈 해소 후 재개)
- 활성 카드 해소 시 대기 카드가 있으면 다음 카드 활성화를 제안한다 — 사용자가 태스크 우선을 고르면 SDD를 재개한다 (카드는 대기 유지)

### 크리티컬 경로 (심각도: 크리티컬)

심각도가 "크리티컬"로 기록되면 판별문을 적용해 경로를 분류하고, 분류 결과를 결정 요청으로 제시한다. **감지와 분류 제안은 자동, 경로 전환 실행은 사용자 확인 후** (자동 전환 금지 — 비가역 승인):

판별문: **"설계 문서의 목표와 비목표 절이 그대로 유효한가?"**

> 이 판별문은 **크리티컬 이슈에만** 건다. 경미나 중간 이슈가 목표와 비목표를 조금씩 밀어내는 것은 이슈 하나로는 안 보이고 쌓여야 보이므로, 마무리의 **§2 대조**(`document-consolidation` 실행 절차 3단계)가 한 번에 잡는다 — 여기서 이슈마다 묻지 않는 이유다.

- **Yes (아키텍처만 변경) → 제자리 재계획** — 같은 feature, 워크트리와 브랜치 유지:
  1. 카드 분석을 바탕으로 설계 문서 갱신안 제시 + 사용자 리뷰:
     - §4(설계 개요)
     - §6(기술 결정 — 폐기 대안 기록)
     - §10(이력)
  2. invoke `dev-workflow:plan-stage`의 재계획 진입 (명시 라우팅 — Stage Detection을 거치지 않는다: plan.md가 이미 존재해 자동 감지가 불가한 경로)
  3. 재계획 완료 후 SDD를 재개한다. 카드는 이 시점에 경량 사이클 3(반영)의 삭제 규칙에 따라 삭제한다 (§10 기록은 갱신안 반영 시 이미 완료)
- **No (목표 자체가 바뀜 = 사실상 새 기능) → 아카이브 + 승계**:
  1. 원 설계 문서 §9에 중단 사유와 완료분, §10에 "중단 — [새 기능명]으로 승계" 기록
  2. feature 디렉토리를 `docs/design/[카테고리]/_archive/[기능명]/`로 이동한다 (세션 목록과 머지 스캔에서 자동 제외 — 기존 `_archive/` 제외 메커니즘)
  3. 새 feature의 브랜치는 원 워크트리 브랜치의 HEAD에서 분기한다 — 커밋 히스토리를 승계하고, 무효가 된 구현은 revert 커밋으로 기록하며, 원 워크트리는 정리한다. 새 feature 브레인스토밍은 원 설계 문서를 초기 컨텍스트로 참조한다. no-git-mode에서는 분기, revert와 워크트리 정리를 생략하고 새 feature 디렉토리 생성으로 대체한다.

### 경계선

- feature가 **열려 있으면**(개발 진행 중) → 이슈 카드
- feature가 **닫혔으면**(complete나 도메인 머지됨) → 별도 feature로 처리 (기존 설계와 도메인 문서를 참조 컨텍스트로)

### 구형 이슈 디렉토리 (호환)

`issues/[문제명]/` 디렉토리 형식(구형 — phase 파일 포함)은 잔존을 허용한다. 세션 탐색에서 발견 시 1줄 안내: "구 형식 이슈입니다 — 이어서 마무리하거나 정리하세요". 새 이슈는 항상 카드 형식으로 생성한다.

---

## Completion Protocol

DEVELOP 완료 후 마무리 시퀀스를 관리한다. 커밋과 푸시는 반드시 이 시퀀스 내에서만 실행한다.

### 마무리 대기 표시 (경고등)

파일 술어가 참이면, 오케스트레이터가 통제하는 일단락 출력(이슈 카드 해소 고지, Evaluator 결과와 리뷰 완료 보고) 말미에 아래 한 줄을 표기한다:

- 술어: `[기능명].md`의 status ≠ complete **이고** plan.md를 읽었을 때 잔여 태스크가 없다고 판단됨 (판단 주체는 LLM의 파일 읽기 — bash 파싱 금지)
- 표기: `🔔 마무리 대기: [기능명] — /dev-workflow:finish 또는 "마무리해줘"`
- Completion Step 1이 status를 complete로 전이하면 술어가 거짓이 되어 자동 소등된다
- 이 표시는 가시화이지 판단이 아니다 — 마무리 실행 여부는 항상 사용자가 선언한다

### 마무리 트리거 감지

사용자의 자연어 발화로 마무리 시퀀스를 시작한다. 어휘 목록 (SSOT — 훅 `hooks/completion-nudge`가 미러, diff는 `tests/hooks/test-completion-nudge.sh` 케이스 0번이 검증):

`completion-vocab: 마무리|완료|정리해|끝내자|wrap up|finish|finalize|done`

- 위 어휘가 세션 전체 작업의 마무리 의도로 발화되면 시퀀스를 시작한다 (특정 코드와 파일에 대한 정리 요청은 해당 없음)
- `<completion-signal>` 주입(completion-nudge 훅)이 보이면 같은 판정을 즉시 수행한다
- `/dev-workflow:finish` 호출은 감지를 생략하고 시퀀스로 직행한다 (호출=선언)

### 착수 트리거 감지

새로 들어온 일을 워크플로우 입구로 보낸다. 어휘 목록 (SSOT — 훅 `hooks/intake-nudge`가 미러, diff는 `tests/hooks/test-intake-nudge.sh` 케이스 0번이 검증):

`intake-vocab: 버그|버그가|에러|오류|안 나와|안나와|안 떠|재현|리팩터링|리팩토링|고쳐줘|문제 확인`

- 위 어휘가 보이면 자체 판단으로 곧장 고치지 말고 브레인스토밍 입구로 라우팅한다 — 그 입구에서 작업 성격을 확정한다
- **이미 진행 중인 작업의 개발 도중에 발견된 결함은 해당 없음** — 「Issue Lifecycle」의 이슈 카드 경로를 따른다
- `<intake-signal>` 주입(intake-nudge 훅)이 보이면 같은 판정을 즉시 수행한다
- 어느 쪽인지 불분명하면 입구로 보낸다 — 묻는 비용이 잘못 고치는 비용보다 싸다

### 마무리 시퀀스

`[플러그인 루트]/skills/workflow-orchestrator/references/completion-protocol.md`를 Read하여 그 전문을 따른다.
(Read 실패 폴백 최소 요건: Step 0 이슈 카드 잔존 검사 → Step 1 문서 취합(document-consolidation 즉시 실행, status→complete) → Step 2 README 영향 판단 → Step 2.5 rules-injection(completion) → Step 3 커밋 확인 → Step 3.5 푸시 별도 확인 → Step 4 도메인 통합은 관리자 별도)

---

## Output Format Rules

- 페르소나 이름은 항상 이모지 접두사와 함께 표시
- 합의 결론은 페르소나 토론과 명확히 분리
- 단계 진입 시 항상 명시적으로 선언
- 사용자가 합의를 확인하면 루프를 반복하지 않고 진행

**결정 요청 형식 (SSOT):** BRAINSTORM/PLAN 진입 후 첫 사용자 결정 요청 전에 반드시 `decision-flow.md`를 Read한다. 이 파일은 사용자 프로젝트가 아닌 플러그인 설치 디렉토리에 있다. 경로 해소 순서:
1. 플러그인 루트를 아는 경우 (세션 시작 컨텍스트에 주입된 "플러그인 루트" 값 사용): `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`
2. 미확보 시 동적 탐색: `find "$HOME/.claude/plugins" -path "*dev-workflow*/skills/workflow-orchestrator/decision-flow.md" -not -path "*/worktrees/*" -type f | head -1` (플러그인 캐시는 `.../dev-workflow/<버전>/skills/...` 구조로 버전 디렉토리를 포함한다)
3. Read 실패 시: Input Format Rules의 '결정 요청 폴백 형식'을 따르고, 탐색 실패를 사용자에게 노출하지 않는다

---

## Input Format Rules

사용자에게 입력을 요청할 때 아래 형식을 따른다 (도구 금지 선언은 CRITICAL 섹션이 SSOT — 여기서는 형식만 정의한다).

### 닫힌 선택 (선택지가 있는 질문)

```
[질문 텍스트]

1. 선택지A
2. 선택지B
3. 선택지C

0\. [탈출 레이블]          ← 항상 마지막. 번호 선택지가 붙은 질문에는 늘 붙이고, 결정 박스에는 자유 입력 탈출구가 필요할 때만 붙인다. 앞에 빈 줄을 두고 마침표를 `\`로 막아 목록에서 뗀다 — 이어 쓰면 렌더러가 다음 번호로 바꿔 찍는다
```

### Yes/No 질문

```
[질문 텍스트]

1. Yes — 고르면: [무엇이 일어나는지 1줄]
2. No — 고르면: [무엇이 일어나는지 1줄]
```

"Yes"와 "No"는 고르면 무슨 일이 나는지를 이름에 안 담으므로 결과 줄을 붙인다. 되돌리기 비용이 있는 게이트일수록 그렇다.

### 열린 입력 (선택지 없는 자유 텍스트)

```
[질문 텍스트]
> 예: "[예시 입력]"
```

### decision-flow와의 경계

- 산출물(phase 파일, 설계 문서와 plan.md)에 기록될 결정(선택지 2개 이상)은 `decision-flow.md`의 결정 박스(D)와 순차 흐름을 따른다
- 단순 진행 확인과 Yes/No 게이트는 본 섹션의 무박스 형식을 따른다. 탐색적 질문은 decision-flow.md의 질문 규칙(하나씩과 ❓ 질문 N/M)을 따르되, 내보내기 전에 「조립 전 갈림」 둘을 센다 — ① 답이 phase 파일, 설계 문서와 plan.md에 기록되면 탐색적 질문이 아니라 결정이므로 `❓ 질문` 대신 결정 박스로 조립하고 질문 카운터에서 뺀다 ② 답의 후보를 적어 본다 — 두 줄 이상 적히면 그 줄들이 번호 선택지가 되고, 한 줄 이하면 개방형으로 둔다
- 결정 박스 내부의 선택지 표기 규칙(번호만, 0번 조건)은 본 섹션이 담당한다

### 결정 요청 폴백 형식 (decision-flow.md Read 실패 시)

- 언어 최소 요건: 독자는 주니어와 시니어 사이의 개발자, 표준 용어는 그대로, 저장소에 없는 낱말로 개념에 이름 붙이지 않기, 코드에 적히는 이름 번역 금지, 저장소 고유 용어와 식별자는 즉석 풀이(병기) — 번호만 쓰지 않고 무엇인지 한 조각을 함께 적는다 — 내보내기 전에 풀이 없는 것을 센다 — 도메인 명사는 세션 목록 또는 코드 자리에서 1건 이상, 가운뎃점(·) 금지 — 나열은 쉼표와 와/과, 줄임말 금지, 문단 개행, 화면 폭에 맞춘 임의 줄바꿈 금지, 절 기호 등 전문 표기 금지, 슬래시 압축 금지 (원본: decision-flow 3부 「언어 규범」 — Read 실패 시에도 이 줄이 적용된다)
- 결정은 한 번에 하나만 묻는다. 사용자가 위임하거나 모드 전환("다 보여줘"/"알아서")을 요청하면 수용한다 — 노출된 선택지에만 답할 수 있으며, 하나씩 모드의 다중 값 응답은 첫 값만 반영한다 (응답이 형식을 이긴다)
- 결정 요청은 아래 스켈레톤으로 표시한다:

```
📌 결정 요청 : [결정명]

이 결정이 다루는 문제:
[선택지가 갈리는 원인 먼저 (아래 검사 4번) + 왜 지금 정하는지 + 앞선 결정과의 연결]

확인된 사실:
- [✔ 출처] [사실 1줄]   (없으면 이 칸에 "없음"이라고 쓴다)

확인 못 한 것:
- [⚠️ 확인 불가] [결정에 영향을 주는 불확실 1줄]   (없으면 "없음")

토론 요지: [수렴/충돌 1~3줄]

1. [선택지] — 고르면: [결과 1줄]
2. [선택지] — 고르면: [결과 1줄]

0\. [탈출 레이블] (자유 입력 탈출구 필요 시에만)

💡 추천: [번호]
[추천 사유 1줄]
```

- 설명 블록: 직전에 라운드나 조사가 있었으면 박스 앞에 **짧은 설명 문단**을 쓴다 — 이름표를 붙이지 않는다. 왜, 무엇을, 어떻게와 언제는 담을 내용의 점검표이고 넷을 다 채우려 하지 않는다 (원본: decision-flow 3부 「결정과 질문 구조 규범」 — Read 실패 시에도 이 줄이 적용된다)
- 내보내기 전 검사 여섯: ① 선택지 이름의 낱말과 박스 본문의 식별자 중, 이 박스와 앞 블록에서 풀이 없는 것이나 코드 자리에서 1건 이상 안 나오는 번역어가 있으면 고쳐 쓴다 — 나오기만 한 것은 통과가 아니다 (모든 박스) ② 선택지의 "고르면:" 줄이 「이 결정이 다루는 문제」 칸이나 「확인된 사실」 칸의 명사를 하나 이상 담는다 (메뉴형 자리 전부) ③ 선택지 **이름**도 그 두 칸의 명사를 하나 이상 담는다 (작업 방향 확인과 단계 감지 둘 — 나머지는 다음 릴리스) ④ **지우면 선택지 하나가 무의미해지는 항목**(=원인)이 「이 결정이 다루는 문제」 칸에 들어 있다. 판정형에서는 대조 상대가 판정 문장이고, 지워도 판정이 그대로 서는 근거 줄은 뺀다 (전 자리) ⑤ 박스와 같은 메시지에 선택지로 답할 수 없는 물음이나 통보가 있으면 빼고 다음 차례에 별도 결정으로 내기(선택지를 내는 모든 박스) ⑥ 화면에 가운뎃점(·)이 있으면 쉼표와 와/과나 줄 나눔으로 고쳐 쓰기(모든 화면)
- 되물음 처리: 사용자가 선택 대신 되물으면 설명을 덧붙여 같은 박스를 다시 내지 않는다 — 빠진 것의 갈래(풀이, 실물, 근거, 결과 줄과 흐름)가 다시 쓸 자리를 정하고, 제목에 `(다시 씀: …)` 접미로 다시 쓴 것을 붙여 박스를 재조립한다. 둘째 되물음은 다른 갈래로, 셋째는 자유 응답을 받아 그 말로 다시 조립한다. 판정형의 「의견 있음」만 예외(근거를 다시 보이고 자유 응답). 신호, 자리와 접미 문구의 정본은 decision-flow 「되물음 재조립」 표다
- 판정형과 메뉴형: 「작업 방향 확인 화면」은 **지도형 판정형**(후보 넷을 모두 내고 짚은 자리에 `▶`), 「재협의 선택지」는 판정형이다 — 판정 한 줄과 확인 태그 붙은 근거를 먼저 내고 「진행」과 「의견 있음」 둘로 받는다. 그 근거를 한 줄도 못 만들면 메뉴형으로 조립한다. 나머지 자리는 메뉴형이다
- 등급: 직전에 라운드나 조사가 있었으면 4칸 상시(빈 칸 "없음"), 아니면 문제 칸+이력 칸. 로컬 템플릿과 게이트는 칸 구성이 기존 형식이고 설명 블록만 면제 — 검사는 각 항목의 적용 자리를 따른다
- 여러 결정이 대기 중이면 결정 요청 응답 상단에 한 줄 헤더를 표시한다: `📋 확정 N/M, 진행 중: [결정명], 다시 볼 것 K건`
- 재논의 대기열(모델이 감지했으나 즉시 처리하지 않기로 한 결정 간 충돌 항목)이 없으면 '다시 볼 것' 필드를 생략한다

### 공통 규칙

- 번호만 사용한다 (문자 선택 A/B/C/D 금지)
- 슬래시 구분 "(Yes / No)" 형식을 사용하지 않는다
- 0번은 항상 목록 마지막에 배치하며 레이블은 맥락에 맞게 변경할 수 있다. **번호 선택지가 붙은 질문에는 늘 붙인다.** 결정 박스에서는 자유 입력 탈출구가 필요한 경우에만 붙인다
- 사용자가 번호 또는 자연어로 응답할 수 있다. 의미가 모호한 경우에만 재확인한다

---

## What This Workflow Does NOT Cover

아래는 Superpowers 전담:
- DEVELOP 단계 구현 및 검토 (subagent-driven-development, 「넘길 곳」이 디버깅인 경우는 systematic-debugging)
- REVIEW 단계 코드 리뷰 (requesting-code-review)
- TDD (RED/GREEN/REFACTOR)
- git worktree 관리 (git-mode에서만 Superpowers 전담, no-git-mode에서는 스킵)
- Subagent 디스패치
- 태스크 세분화
- 브랜치 마무리 및 PR 생성
