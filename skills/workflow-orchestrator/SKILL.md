---
name: workflow-orchestrator
description: Use at the start of EVERY session - orchestrates the full development workflow lifecycle (Brainstorm → Plan → Develop → Review → Completion) with persona-based feedback loops
---

# Dev Workflow Orchestrator

## CRITICAL

These instructions are MANDATORY across ALL projects.
If Superpowers skills exist for a task, run them FIRST. This workflow extends Superpowers — it does NOT replace it.

---

## Session Start Protocol

At the start of EVERY session, execute in order:

1. **Persona Resolution** — invoke `dev-workflow:persona-resolution` skill
   - 페르소나 확정 없이 다음 단계로 넘어가지 않는다
   - 예외: 동일 세션 내 브레인스토밍 완료 후 PLAN 전환 시 재실행 생략, PLAN 페르소나만 확정

2. **작업 상태 확인**
   - 동일 세션 내 브레인스토밍 완료 직후 → 생략
   - 신규 세션 → invoke `dev-workflow:context-handling` skill
     (탐색, 분류, 목록 제시를 모두 처리. 탐색 과정을 직접 출력하지 않는다)
   - context-handling이 "진행 중인 작업 없음"을 반환한 경우:
     "설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?" 후속 질문

3. **VCS Detection** — 프로젝트 루트의 `.git` 디렉토리 존재 여부를 확인한다
   - `.git` 존재 → `git-mode` (기존 Superpowers 방식 그대로)
   - `.git` 없음 → `no-git-mode` (worktree 스킵, 파일 기반 체크포인트)
   - 판단 모호 시 → 사용자에게 "worktree를 사용할 수 있는 환경인가요?" 질문
   - 감지 결과를 내부적으로 기록 (세션당 1회, 사용자에게 출력하지 않음)

3.5. **Ouroboros Detection** — Ouroboros 플러그인 존재 여부를 확인한다
   - 탐색 순서 (MCP 우선, 에이전트 파일 후순위):
     1. Ouroboros MCP 도구 사용 가능 여부 확인
        - 사용 가능한 도구 목록에서 `ouroboros` 포함 MCP 도구 탐색 (예: `mcp__plugin_ouroboros_ouroboros__ouroboros_interview`)
        - 또는 ToolSearch `+ouroboros` 실행
     2. MCP 미발견 시 → 에이전트 파일 탐색
        - `find "$HOME/.claude/plugins" -path "*/ouroboros/agents/socratic-interviewer.md"` 실행
        - ⚠️ 프로젝트 루트 기준 glob은 사용 불가 (Ouroboros는 프로젝트 외부 플러그인 디렉토리에 설치됨)
   - 판정:
     - MCP 도구 사용 가능 → **Path A** (Enhanced + MCP)
     - MCP 미사용 + agents 파일 발견 → **Path B** (Enhanced, MCP 없음)
     - 모두 미발견 → **Path C** (Standalone)
   - 에이전트 파일 경로는 Path A/B 판정 시 기록하여 brainstorming 스킬에서 참조한다
   - 감지 결과를 내부적으로 기록 (세션당 1회, 사용자에게 출력하지 않음)
   - Path A 또는 B일 때만 Stage Announcement에 한 줄 표시: "🔗 Ouroboros 연동: Enhanced Mode"

4. **Stage Detection** — 현재 워크플로우 단계 자동 감지

5. **Stage Announcement** — 감지된 단계와 확정 페르소나 선언 후 진행

6. **Lessons Review** — `tasks/lessons.md` 존재 시 내부적으로 읽고 숙지 (사용자에게 출력하지 않음)

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
  - 모든 태스크 완료 후 커밋을 제안하지 않는다
  - 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리할까요?"
  - 커밋+푸시는 마무리 시퀀스(Completion Protocol)에서 처리한다

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
    2. git commit 대신 Implementer 리포트 제출로 Task 체크포인트를 대체한다
    3. Code Quality Reviewer에게 BASE_SHA/HEAD_SHA 대신 Implementer 리포트의 "Files changed" 목록을 전달한다
    4. 리뷰어는 전달받은 파일 목록의 코드를 직접 읽어 리뷰한다
    5. Spec Reviewer는 변경 없이 기존 방식 그대로 동작한다
    6. TodoWrite로 Task 진행 추적 (기존과 동일)

### REVIEW
- 기능/태스크 구현 완료
- 사용자 메시지: 리뷰, review, 검토, 확인, check, QA

→ Superpowers `requesting-code-review` 전담 (페르소나 없음)

**📎 Enhanced Mode — Evaluator QA 게이트:**
Superpowers 코드 리뷰 완료 후, 설계 문서의 수락 기준(Success Criteria / Acceptance Criteria)이 존재하면
Evaluator 에이전트를 서브에이전트로 실행하여 AC 충족 여부를 검증한다.
에이전트 파일 경로: orchestrator 감지 경로 사용. 미확보 시 `find "$HOME/.claude/plugins" -path "*/ouroboros/agents/evaluator.md" -type f | head -1` 로 동적 탐색.

```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/evaluator.md 전문]

--- 수락 기준 ---
[설계 문서의 success_criteria 목록]

--- 구현 결과물 ---
[변경된 파일 목록 및 주요 변경 내용]

각 수락 기준에 대해 PASS/FAIL/PARTIAL을 판정하라.
FAIL 또는 PARTIAL 항목에는 구체적 근거와 수정 제안을 포함하라.
```

출력 형식:
```
── 🎯 AC 검증 결과 [Evaluator] ───────────────────────
  ✅ PASS: [N개]
  ⚠️ PARTIAL: [N개]
  ❌ FAIL: [N개]

[상세 목록]
──────────────────────────────────────────────────────
```

- FAIL 항목이 있으면 → 수정 후 재검증을 제안한다
- 모두 PASS → REVIEW 완료로 진행한다
- Standalone Mode에서는 Evaluator를 생략하고 Superpowers 코드 리뷰 결과만으로 판단한다
- 설계 문서에 수락 기준이 없으면 Evaluator를 스킵한다

### Ambiguous
```
현재 단계를 감지하지 못했습니다. 어느 단계인가요?

1. 브레인스토밍
2. 계획
3. 개발
4. 리뷰
```

---

## Superpowers Delegation

| 단계 | 담당 | 페르소나 | 📎 Ouroboros 에이전트 |
|---|---|---|---|
| BRAINSTORM | dev-workflow | ✅ 사용 | Ontologist, Socratic, Seed-Architect, Contrarian, Simplifier, Hacker |
| PLAN | dev-workflow | ✅ 사용 | Architect, Researcher |
| DEVELOP (git-mode) | Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 | — |
| DEVELOP (no-git-mode) | Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 | — |
| REVIEW | Superpowers `requesting-code-review` + Evaluator QA | ❌ 없음 | Evaluator |
| COMPLETION | dev-workflow (Completion Protocol) | ❌ 없음 | — |

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
- 실패 시 → 중단, 사용자에게 상황 보고

**Step 2: README 영향 판단**
- 변경 내용을 분석하여 README.md 업데이트 필요 여부를 판단한다
- 영향 있음 → "README.md 업데이트가 필요해 보입니다. 진행할까요?" 사용자 확인 후 업데이트
- 영향 없음 → 스킵
- README.md가 프로젝트에 존재하지 않으면 스킵
- 실패 시 → 중단, 사용자에게 상황 보고

**Step 3: 커밋+푸시 제안**
- "마무리가 완료되었습니다. 커밋+푸시를 진행할까요?" 사용자 확인 후 실행

---

## Output Format Rules

- 페르소나 이름은 항상 이모지 접두사와 함께 표시
- 합의 결론은 페르소나 토론과 명확히 분리
- 단계 진입 시 항상 명시적으로 선언
- 사용자가 합의를 확인하면 루프를 반복하지 않고 진행

---

## Input Format Rules

사용자에게 입력을 요청할 때 아래 형식을 따른다. AskUserQuestion 도구를 사용하지 않는다.

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

### 공통 규칙

- AskUserQuestion 도구를 사용하지 않는다
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
