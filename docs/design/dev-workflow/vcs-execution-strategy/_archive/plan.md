# VCS Execution Strategy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VCS 종류에 따라 DEVELOP 단계의 실행 모델을 자동 분기하여, worktree 불가 환경에서도 Superpowers의 2단계 리뷰 loop를 유지한다.

**Architecture:** workflow-orchestrator 스킬에 VCS 감지 단계를 추가하고, DEVELOP 진입 시 git-mode/no-git-mode에 따라 Superpowers 호출 방식을 분기한다. Superpowers 자체는 수정하지 않으며, 프롬프트 컨텍스트 주입으로 동작을 제어한다.

**Tech Stack:** Markdown (스킬 정의 파일), Claude Code 스킬 시스템

---

## File Structure

| 파일 | 역할 | 변경 유형 |
|------|------|-----------|
| `skills/workflow-orchestrator/SKILL.md` | 세션 시작 프로토콜 + DEVELOP 분기 | Modify |

---

## Chunk 1: VCS Execution Strategy

### Task 1: Session Start Protocol에 VCS 감지 단계 추가

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md:15-36` (Session Start Protocol 섹션)

- [ ] **Step 1: Session Start Protocol에 VCS Detection 단계 삽입**

현재 step 2(HANDOFF Check)와 step 3(Stage Detection) 사이에 새로운 단계를 추가한다.

기존:
```markdown
3. **Stage Detection** — 현재 워크플로우 단계 자동 감지
```

변경 후:
```markdown
3. **VCS Detection** — 프로젝트 루트의 `.git` 디렉토리 존재 여부를 확인한다
   - `.git` 존재 → `git-mode` (기존 Superpowers 방식 그대로)
   - `.git` 없음 → `no-git-mode` (worktree 스킵, 파일 기반 체크포인트)
   - 판단 모호 시 → 사용자에게 "worktree를 사용할 수 있는 환경인가요?" 질문
   - 감지 결과를 내부적으로 기록 (세션당 1회, 사용자에게 출력하지 않음)

4. **Stage Detection** — 현재 워크플로우 단계 자동 감지

5. **Stage Announcement** — 감지된 단계와 확정 페르소나 선언 후 진행

6. **Lessons Review** — `tasks/lessons.md` 존재 시 내부적으로 읽고 숙지 (사용자에게 출력하지 않음)
```

번호가 3→4→5→6으로 밀리므로 후속 번호도 함께 업데이트한다.

- [ ] **Step 2: 변경 내용 검증**

수정된 Session Start Protocol이 아래 조건을 만족하는지 확인:
- VCS Detection이 HANDOFF Check 이후, Stage Detection 이전에 위치
- 기존 단계들의 번호가 올바르게 업데이트됨
- git-mode/no-git-mode 설명이 명확함

---

### Task 2: DEVELOP 단계에 VCS 모드별 분기 추가

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md:57-61` (DEVELOP 섹션)
- Modify: `skills/workflow-orchestrator/SKILL.md:74-87` (Superpowers Delegation 섹션)

- [ ] **Step 1: DEVELOP 섹션에 모드별 분기 추가**

기존:
```markdown
### DEVELOP
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물)
- 사용자 메시지: 구현, implement, 개발, 작성, coding, write

→ Superpowers `subagent-driven-development` 전담 (페르소나 없음)
```

변경 후:
```markdown
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
```

- [ ] **Step 2: Superpowers Delegation 테이블 업데이트**

기존:
```markdown
| DEVELOP | Superpowers `subagent-driven-development` | ❌ 없음 |
```

변경 후:
```markdown
| DEVELOP (git-mode) | Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 |
| DEVELOP (no-git-mode) | Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 |
```

- [ ] **Step 3: Superpowers Delegation 하단 규칙에 no-git-mode 관련 항목 추가**

기존 규칙 목록 아래에 추가:
```markdown
- no-git-mode에서는 `using-git-worktrees` 를 호출하지 않는다
- no-git-mode에서 `subagent-driven-development` 실행 시 git 관련 단계(commit, SHA 비교)를 파일 기반으로 대체하라는 컨텍스트를 전달한다
```

- [ ] **Step 4: 변경 내용 검증**

수정된 DEVELOP 섹션이 아래 조건을 만족하는지 확인:
- git-mode와 no-git-mode 분기가 명확히 구분됨
- no-git-mode 규칙 5개가 모두 포함됨
- Superpowers Delegation 테이블이 두 모드를 반영함
- 기존 REVIEW 섹션에 영향 없음

---

### Task 3: "What This Workflow Does NOT Cover" 섹션 업데이트

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md:99-108` (Does NOT Cover 섹션)

- [ ] **Step 1: git worktree 항목을 조건부로 수정**

기존:
```markdown
- git worktree 관리
```

변경 후:
```markdown
- git worktree 관리 (git-mode에서만 Superpowers 전담, no-git-mode에서는 스킵)
```

- [ ] **Step 2: 최종 전체 검증**

workflow-orchestrator SKILL.md 전체를 읽고 아래 확인:
- Session Start Protocol 번호가 1~6으로 올바른지
- VCS Detection 단계가 올바른 위치에 있는지
- DEVELOP 분기가 git-mode/no-git-mode 모두 정의되어 있는지
- Superpowers Delegation 테이블이 정확한지
- 기존 BRAINSTORM, PLAN, REVIEW 섹션에 영향이 없는지
- 마크다운 문법 오류가 없는지

- [ ] **Step 3: Commit**

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "feat: add VCS execution strategy to workflow-orchestrator"
```
