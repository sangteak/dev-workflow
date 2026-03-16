# completion-sequence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** workflow-orchestrator에 종료 프로토콜(Completion Protocol)을 추가하여, 마무리 시퀀스(문서 취합 → README → 커밋)의 순서를 강제한다.

**Architecture:** workflow-orchestrator SKILL.md에 Completion Protocol 섹션과 DEVELOP 공통 컨텍스트 주입을 추가. 실행은 기존 document-consolidation 스킬에 위임.

**Tech Stack:** Markdown (SKILL.md 편집)

---

### Task 1: DEVELOP 섹션에 Superpowers 공통 컨텍스트 주입 추가

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (DEVELOP 섹션, line 63~85)

**Step 1: DEVELOP 섹션 리팩토링**

git-mode/no-git-mode 분기 이전에 공통 컨텍스트 주입 블록을 추가한다:

```markdown
### DEVELOP
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물)
- 사용자 메시지: 구현, implement, 개발, 작성, coding, write

→ VCS 모드에 관계없이 `superpowers:subagent-driven-development` 실행 시 아래 공통 규칙을 컨텍스트로 전달:
  - 모든 태스크 완료 후 커밋을 제안하지 않는다
  - 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리를 진행해주세요."
  - 커밋+푸시는 마무리 시퀀스(Completion Protocol)에서 처리한다
```

기존 git-mode/no-git-mode 분기는 공통 블록 아래에 그대로 유지한다.

**Step 2: 변경 확인**

DEVELOP 섹션이 다음 구조인지 확인:
1. 공통 컨텍스트 주입 (커밋 제안 억제)
2. git-mode 분기
3. no-git-mode 분기

---

### Task 2: Completion Protocol 섹션 추가

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (Superpowers Delegation 섹션 뒤에 추가)

**Step 1: Completion Protocol 섹션 작성**

`## Superpowers Delegation` 섹션과 `## Output Format Rules` 섹션 사이에 새 섹션을 삽입한다:

```markdown
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
```

---

### Task 3: Superpowers Delegation 테이블 업데이트

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (Superpowers Delegation 섹션)

**Step 1: 테이블에 COMPLETION 행 추가**

기존 테이블 아래에 행을 추가한다:

```markdown
| COMPLETION | dev-workflow (Completion Protocol) | ❌ 없음 |
```

**Step 2: 위임 규칙 목록에 추가**

기존 규칙 목록 마지막에 추가한다:

```markdown
- DEVELOP 완료 후 커밋+푸시는 Completion Protocol을 통해서만 실행한다
```

---

### Task 4: description 메타데이터 업데이트

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (line 2, frontmatter)

**Step 1: description 업데이트**

오케스트레이터의 역할 확장을 반영한다:

```yaml
description: Use at the start of EVERY session - orchestrates the full development workflow lifecycle (Brainstorm → Plan → Develop → Review → Completion) with persona-based feedback loops
```
