---
name: workflow-orchestrator
description: Use at the start of EVERY session - orchestrates the full development workflow (Brainstorm → Plan → Develop → Review) with persona-based feedback loops
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

2. **HANDOFF & Design Document Check**
   - Not exists (동일 세션 내 브레인스토밍 완료 직후) → 생략
   - Not exists (신규 세션) → 아래 순서로 탐색:
     1. `docs/design/**/HANDOFF.md` glob 탐색 → 발견 시 invoke `dev-workflow:context-handling` skill (HANDOFF 목록 제시)
     2. HANDOFF 없음 + `docs/design/[카테고리]/[기능명]/phase*.md` 존재 → 가장 최근 phase 파일 감지, 다음 국면부터 이어서 진행 제안
     3. HANDOFF 없음 + `docs/design/[카테고리]/[기능명]/[기능명].md` 만 존재 → 설계 문서 로드 후 PLAN 진입
     4. `docs/design/` 자체가 없음 → "설계 문서가 없습니다. 설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?"

3. **VCS Detection** — 프로젝트 루트의 `.git` 디렉토리 존재 여부를 확인한다
   - `.git` 존재 → `git-mode` (기존 Superpowers 방식 그대로)
   - `.git` 없음 → `no-git-mode` (worktree 스킵, 파일 기반 체크포인트)
   - 판단 모호 시 → 사용자에게 "worktree를 사용할 수 있는 환경인가요?" 질문
   - 감지 결과를 내부적으로 기록 (세션당 1회, 사용자에게 출력하지 않음)

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
- `docs/design/[카테고리]/[기능명]/[기능명].md` 존재 + 태스크 목록(plan.md) 미생성
- 사용자 메시지: 계획, plan, 설계, architecture, 구조, breakdown
- Superpowers `writing-plans` 활성화 직전

→ invoke `dev-workflow:plan-stage` skill

### DEVELOP
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물)
- 사용자 메시지: 구현, implement, 개발, 작성, coding, write

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

### Ambiguous
"현재 단계를 감지하지 못했습니다. [브레인스토밍 / 계획 / 개발 / 리뷰] 중 어느 단계인가요?"

---

## Superpowers Delegation

| 단계 | 담당 | 페르소나 |
|---|---|---|
| BRAINSTORM | dev-workflow | ✅ 사용 |
| PLAN | dev-workflow | ✅ 사용 |
| DEVELOP (git-mode) | Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 |
| DEVELOP (no-git-mode) | Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 |
| REVIEW | Superpowers `requesting-code-review` | ❌ 없음 |

- Superpowers 스킬이 존재하면 FIRST 실행
- DEVELOP/REVIEW 충돌 시 → Superpowers 우선
- BRAINSTORM/PLAN 충돌 시 → 이 워크플로우 우선
- PLAN Step 4 완료 후 → Superpowers `writing-plans` 실행
- no-git-mode에서는 `using-git-worktrees` 를 호출하지 않는다
- no-git-mode에서 `subagent-driven-development` 실행 시 git 관련 단계(commit, SHA 비교)를 파일 기반으로 대체하라는 컨텍스트를 전달한다

---

## Output Format Rules

- 페르소나 이름은 항상 이모지 접두사와 함께 표시
- 합의 결론은 페르소나 토론과 명확히 분리
- 단계 진입 시 항상 명시적으로 선언
- 사용자가 합의를 확인하면 루프를 반복하지 않고 진행

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
