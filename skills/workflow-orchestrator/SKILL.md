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
   - "진행 중인 작업 없음" + 워크플로우 의도도 없음 → 후속 질문 없이 사용자 요청에 일반 응답한다
   - "진행 중인 작업 없음" + 워크플로우 의도 있음 → "설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?" 후속 질문

2. **Lessons Review** — `tasks/lessons.md` 존재 시 내부적으로 읽고 숙지 (사용자에게 출력하지 않음)

### 지연 발동 (워크플로우 의도 감지 시에만)

**게이트:** 워크플로우 의도 신호(단계 키워드, docs/design 산출물 작업, 진행 중 작업 재개)가 전혀 없는 요청은 아래 단계를 생략하고 일반 응답한다. 이후 대화에서 신호가 등장하면 그 시점에 진입한다.

3. **Stage Detection** — 현재 워크플로우 단계 감지 (아래 Workflow Stage Detection)

4. **Persona Resolution** — **BRAINSTORM 또는 PLAN 판정 시에만** invoke `dev-workflow:persona-resolution`
   - HANDOFF 복구 시에는 HANDOFF의 "확정된 페르소나"를 그대로 적용하고 재확정을 생략한다
   - DEVELOP/REVIEW/COMPLETION은 페르소나를 사용하지 않으므로 생략한다
   - 동일 세션 내 브레인스토밍 완료 후 PLAN 전환 시 재실행 생략, PLAN 페르소나만 확정

5. **Stage Announcement** — 감지된 단계(BRAINSTORM/PLAN이면 확정 페르소나 포함) 선언 후 진행

### 지연 감지 (소비 시점 직전, 세션당 1회 캐시)

- **VCS Detection** — DEVELOP 또는 REVIEW 진입 시점(둘 중 먼저)에 실행한다. 세션 환경 컨텍스트의 "Is directory a git repo" 값을 사용한다
  - 제공되지 않은 경우에만 git 명령으로 확인한다 (`.git` 디렉토리 리터럴 검사는 linked worktree에서 오탐하므로 사용하지 않는다)
  - Yes → `git-mode` (기존 Superpowers 방식 그대로), No → `no-git-mode` (worktree 스킵, 파일 기반 체크포인트)
  - 감지 결과를 내부적으로 기록 (사용자에게 출력하지 않음)

- **Ouroboros Detection** — BRAINSTORM/PLAN에서 첫 Enhanced 서브에이전트 투입 직전, 또는 REVIEW의 Evaluator QA 게이트 직전(둘 중 먼저)에 실행한다
  - 탐색 순서 (MCP 우선, 에이전트 파일 후순위):
    1. Ouroboros MCP 도구 사용 가능 여부 확인 — 사용 가능한 도구 목록에서 `ouroboros` 포함 MCP 도구 탐색 (예: `mcp__plugin_ouroboros_ouroboros__ouroboros_interview`), 또는 ToolSearch `+ouroboros` 실행
    2. MCP 미발견 시 → 에이전트 파일 탐색: `find "$HOME/.claude/plugins" -path "*/ouroboros/agents/socratic-interviewer.md"` (⚠️ 프로젝트 루트 기준 glob 불가 — Ouroboros는 프로젝트 외부 플러그인 디렉토리에 설치됨)
  - 판정: MCP 사용 가능 → **Path A** (Enhanced + MCP) / MCP 미사용 + agents 파일 발견 → **Path B** (Enhanced) / 모두 미발견 → **Path C** (Standalone)
  - 에이전트 파일 경로는 Path A/B 판정 시 기록하여 brainstorming 스킬에서 참조한다
  - 감지 결과를 내부적으로 기록하고, Path A 또는 B일 때만 감지 완료 시점에 1회 표시: "🔗 Ouroboros 연동: Enhanced Mode"

---

## Workflow Stage Detection

자동 감지한다. 감지 불가 시에만 사용자에게 질문한다.

### BRAINSTORM
- 사용자 메시지: 브레인스토밍, brainstorm, 아이디어, 기획, 방향
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
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물)
- 사용자 메시지: 구현, implement, 개발, 작성, coding, write

→ VCS 모드에 관계없이 `superpowers:subagent-driven-development` 실행 시 아래 공통 규칙을 컨텍스트로 전달:
  1. **단계 진입 즉시**: invoke `dev-workflow:rules-injection` with:
     - stage: develop
     - purpose: pre-stage-attach
     - target_agent: Implementer

     이 호출 결과(활성 규칙 본문 + 단계 라벨)를 `superpowers:subagent-driven-development`의 Implementer/Task Reviewer(스펙 준수 + 코드 품질 통합 리뷰) 호출 프롬프트에 함께 첨부한다. `.claude/rules/`가 없으면 자동으로 no-op이 된다.
  2. 모든 태스크 완료 후 커밋을 제안하지 않는다
  3. 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리할까요?"
  4. 커밋+푸시는 마무리 시퀀스(Completion Protocol)에서 처리한다

→ VCS 모드에 따라 분기:

**git-mode:**
→ Superpowers `subagent-driven-development` 전담 (페르소나 없음)
  - `superpowers:using-git-worktrees` 실행 후 `superpowers:subagent-driven-development` 실행
  - 기존 Superpowers 방식 그대로

**no-git-mode:**
→ Superpowers `subagent-driven-development` 전담 (페르소나 없음)
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

**📎 Enhanced Mode — Evaluator QA 게이트:**
Superpowers 코드 리뷰 완료 후, 설계 문서의 수락 기준(Success Criteria / Acceptance Criteria)이 존재하면
Evaluator 에이전트를 서브에이전트로 실행하여 AC 충족 여부를 검증한다.
에이전트 파일 경로: orchestrator 감지 경로 사용. 미확보 시 `find "$HOME/.claude/plugins" -path "*/ouroboros/agents/evaluator.md" -type f | head -1` 로 동적 탐색.

```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
--- 에이전트 역할 정의 --- [Ouroboros agents/evaluator.md 전문]
--- 수락 기준 --- [설계 문서의 success_criteria 목록]
--- 구현 결과물 --- [변경 파일 목록 및 주요 변경 내용]
각 수락 기준에 PASS/FAIL/PARTIAL을 판정하고, FAIL/PARTIAL에는 근거와 수정 제안을 포함하라.
```

출력 형식:
```
── 🎯 AC 검증 결과 [Evaluator] ─── ✅ PASS: N · ⚠️ PARTIAL: N · ❌ FAIL: N
[상세 목록]
──────────────────────────────────
```

- FAIL 항목이 있으면 → 수정 후 재검증을 제안한다
- 모두 PASS → REVIEW 완료로 진행한다
- Standalone Mode에서는 Evaluator를 생략하고 Superpowers 코드 리뷰 결과만으로 판단한다
- 설계 문서에 수락 기준이 없으면 Evaluator를 스킵한다

### Ambiguous

워크플로우 의도 신호는 있으나 단계가 불명확할 때만 질문한다. 신호가 전혀 없으면 질문 없이 일반 응답한다 (Session Start Protocol의 게이트).

```
현재 단계를 감지하지 못했습니다. 어느 단계인가요?

1. 브레인스토밍
2. 계획
3. 개발
4. 리뷰
0. 해당 없음 — 하려는 작업을 자유롭게 설명해주세요
```

---

## Superpowers Delegation

| 단계 | 담당 | 페르소나 | 📎 Ouroboros 에이전트 |
|---|---|---|---|
| BRAINSTORM | dev-workflow | ✅ 사용 | Ontologist, Socratic, Seed-Architect, Contrarian, Simplifier, Hacker |
| PLAN | dev-workflow | ✅ 사용 | Architect, Researcher |
| DEVELOP (git-mode) | dev-workflow `rules-injection` → Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 | — |
| DEVELOP (no-git-mode) | dev-workflow `rules-injection` → Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 | — |
| REVIEW | dev-workflow `rules-injection` (사전+사후) → Superpowers `requesting-code-review` + Evaluator QA | ❌ 없음 | Evaluator |
| COMPLETION | dev-workflow `rules-injection` → Completion Protocol (작업자 측) + merge-to-domain (관리자 측) | ❌ 없음 | — |

- **검증 버전: Superpowers 6.1.1** — 이후 버전에서 역할 구조가 다르면 의미상 등가 역할(구현 담당 → Implementer 규칙, 태스크 리뷰 담당 → Reviewer 규칙)에 첨부하라
- Superpowers 스킬이 존재하면 FIRST 실행
- DEVELOP/REVIEW 충돌 시 → Superpowers 우선
- BRAINSTORM/PLAN 충돌 시 → 이 워크플로우 우선
- PLAN Step 4 완료 후 → Superpowers `writing-plans` 실행
- no-git-mode에서는 `using-git-worktrees` 를 호출하지 않는다
- no-git-mode에서 `subagent-driven-development` 실행 시 git 관련 단계(commit, SHA 비교)를 파일 기반으로 대체하라는 컨텍스트를 전달한다
- DEVELOP 완료 후 커밋+푸시는 Completion Protocol을 통해서만 실행한다

---

## Completion Protocol

DEVELOP 완료 후 마무리 시퀀스를 관리한다. 커밋+푸시는 반드시 이 시퀀스 내에서만 실행한다.

### 마무리 트리거 감지

사용자의 자연어 발화로 마무리 시퀀스를 시작한다:
- 한국어: "마무리", "마무리해줘", "완료", "정리해줘", "끝내자"
- 영어: "wrap up", "finish", "finalize", "done"

### 마무리 시퀀스

감지 시 아래 순서를 자동으로 실행한다. 각 단계는 이전 단계 성공 후에만 진행한다.

**Step 1: 문서 취합**
- invoke `dev-workflow:document-consolidation` (consolidate-main 모드)
- 역할: phase/plan 파일을 feature 문서로 통합 후 status를 `complete`로 마킹
- ⚠️ 이 단계에서는 domain.md 머지를 시도하지 않는다 (별도 머지 스킬이 전담)
- **⚠️ 이 invoke는 document-consolidation의 '자동 실행하지 않는다' 규칙보다 우선한다. 사용자 확인 없이 즉시 실행한다.**
- 실패 시 → 중단, 사용자에게 상황 보고

**Step 2: README 영향 판단**
- 변경 내용을 분석하여 README.md 업데이트 필요 여부를 판단한다
- 영향 있음 → "README.md 업데이트가 필요해 보입니다. 진행할까요?" 사용자 확인 후 업데이트
- 영향 없음 → 스킵
- README.md가 프로젝트에 존재하지 않으면 스킵
- 실패 시 → 중단, 사용자에게 상황 보고

**Step 2.5: rules-injection 호출 (커밋 직전):**
invoke `dev-workflow:rules-injection` with:
- stage: completion
- purpose: pre-stage-attach

`applies-to: completion` 규칙(예: 커밋 메시지 형식)이 현재 컨텍스트에 첨부되어 Step 3의 커밋 메시지 작성에 반영된다.

**Step 3: 커밋+푸시 제안**
- "마무리가 완료되었습니다. 커밋+푸시를 진행할까요?" 사용자 확인 후 실행

**Step 4 (선택, 관리자만): 도메인 통합**
- 작업자는 여기서 작업을 마무리한다
- 관리자는 별도 시점에 `/dev-workflow:merge-to-domain [카테고리]`를 호출하여 도메인 통합 진행
- merge-to-domain 스킬은 docs/design 스캔으로 status=complete feature를 자동 식별

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
0. [탈출 레이블]          ← 자유 입력 탈출구 필요 시에만 추가, 항상 마지막
```

### Yes/No 질문

```
[질문 텍스트]

1. Yes
2. No
```

### 열린 입력 (선택지 없는 자유 텍스트)

```
[질문 텍스트]
> 예: "[예시 입력]"
```

### decision-flow와의 경계

- 산출물(phase 파일·설계 문서·plan.md)에 기록될 결정(선택지 2개 이상)은 `decision-flow.md`의 결정 박스(D, 오픈형)와 순차 흐름을 따른다
- 단순 진행 확인·Yes/No 게이트·탐색적 질문은 본 섹션의 무박스 형식을 따른다
- 결정 박스 내부의 선택지 표기 규칙(번호만, 0번 조건)은 본 섹션이 담당한다

### 결정 요청 폴백 형식 (decision-flow.md Read 실패 시)

- 결정은 한 번에 하나만 묻는다. 사용자가 일괄로 답하거나 위임하면 그 의도를 수용한다 (응답이 형식을 이긴다)
- 결정 요청은 우측 개방형 결정 박스로 표시한다:

```
┌── 📌 결정 요청: [결정명] ──────────────
│  1. [선택지]
│  2. [선택지]
└──────────────────────────────────────
```

- 여러 결정이 대기 중이면 결정 요청 응답 상단에 한 줄 헤더를 표시한다: `📋 확정 N/M · 진행 중: [결정명] · 재논의 K건`
- 재논의 대기열(모델이 감지했으나 즉시 처리하지 않기로 한 결정 간 충돌 항목)이 없으면 '재논의' 필드를 생략한다

### 공통 규칙

- 번호만 사용한다 (문자 선택 A/B/C/D 금지)
- 슬래시 구분 "(Yes / No)" 형식을 사용하지 않는다
- 0번은 닫힌 선택에서 자유 입력 탈출구가 필요한 경우에만 추가한다. 항상 목록 마지막에 배치하며, 레이블은 맥락에 맞게 변경할 수 있다
- 사용자가 번호 또는 자연어로 응답할 수 있다. 의미가 모호한 경우에만 재확인한다

---

## What This Workflow Does NOT Cover

아래는 Superpowers 전담:
- DEVELOP 단계 구현 및 검토 (subagent-driven-development)
- REVIEW 단계 코드 리뷰 (requesting-code-review)
- TDD (RED/GREEN/REFACTOR)
- git worktree 관리 (git-mode에서만 Superpowers 전담, no-git-mode에서는 스킵)
- Subagent 디스패치
- 태스크 세분화
- 브랜치 마무리 및 PR 생성
