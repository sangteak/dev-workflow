# skill-aliases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dev-workflow 플러그인에 commands/ 디렉토리를 추가하여 save, resume, design-summary 명령을 콘솔 자동완성으로 즉시 실행할 수 있게 한다.

**Architecture:** 플러그인 루트에 `commands/` 디렉토리를 생성하고, 각 명령 파일은 Ouroboros 패턴을 따라 YAML frontmatter + SKILL.md Read 지시문으로 구성한다. save/resume은 하드코딩된 ARGUMENTS로 context-handling 스킬을 간접 호출하고, design-summary는 {{ARGUMENTS}}로 사용자 입력을 전달한다. commands/ 파일 본문은 SKILL.md 내용과 함께 Claude 프롬프트에 포함되므로, SKILL.md가 `ARGUMENTS:` 뒤의 값을 인식하여 모드(save/resume)를 분기한다.

**Tech Stack:** Markdown 명령 파일, Claude Code 플러그인 commands/ 메커니즘

**Spec:** `docs/design/dev-workflow/skill-aliases/skill-aliases.md`

---

### Task 1: commands/ 디렉토리 및 save.md 생성

**Files:**
- Create: `commands/save.md`

- [ ] **Step 1: commands/ 디렉토리 생성**

```bash
mkdir -p commands
```

- [ ] **Step 2: save.md 작성**

```markdown
---
description: "현재 세션 컨텍스트를 HANDOFF.md에 저장"
---

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/context-handling/SKILL.md` using the Read tool and follow its instructions exactly.

ARGUMENTS: save
```

- [ ] **Step 3: 파일 생성 확인**

```bash
cat commands/save.md
```

Expected: frontmatter + Read 지시문 + `ARGUMENTS: save` 확인

---

### Task 2: resume.md 생성

**Files:**
- Create: `commands/resume.md`

- [ ] **Step 1: resume.md 작성**

```markdown
---
description: "HANDOFF.md에서 이전 세션 작업 복구"
---

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/context-handling/SKILL.md` using the Read tool and follow its instructions exactly.

ARGUMENTS: resume
```

- [ ] **Step 2: 파일 생성 확인**

```bash
cat commands/resume.md
```

Expected: frontmatter + Read 지시문 + `ARGUMENTS: resume` 확인

---

### Task 3: design-summary.md 커맨드 래퍼 생성

**Files:**
- Create: `commands/design-summary.md`

- [ ] **Step 1: design-summary.md 작성**

design-summary는 사용자 입력(키워드, 카테고리, 기능명)을 받으므로 {{ARGUMENTS}} 사용.
NOTE: 이 커맨드는 사용자 입력을 전달해야 하므로, 구현 규칙 2번(하드코딩)의 의도된 예외로 {{ARGUMENTS}} 패턴을 사용한다 (스펙 Section 6 기술 결정 참조).

```markdown
---
description: "관련 설계 문서 그룹의 통합 요약 생성"
---

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/design-summary/SKILL.md` using the Read tool and follow its instructions exactly.

## User Input

{{ARGUMENTS}}
```

- [ ] **Step 2: 파일 생성 확인**

```bash
cat commands/design-summary.md
```

Expected: frontmatter + Read 지시문 + `{{ARGUMENTS}}` 확인

---

### Task 4: CLAUDE.md에 커맨드 포함 기준 문서화

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: CLAUDE.md에 Commands 섹션 추가**

`## Conventions` 섹션 하단 또는 `## Key Patterns` 섹션에 아래 내용 추가:

```markdown
### Commands (슬래시 명령 별칭)

`commands/` 디렉토리에는 콘솔 자동완성으로 즉시 실행 가능한 독립 명령 파일을 배치한다.

**포함 기준:** "사용자가 워크플로우 자동 흐름 밖에서, 임의의 시점에, 명시적 의도를 가지고 호출하는 스킬"

| 커맨드 | 대상 스킬 | ARGUMENTS | 설명 |
|--------|-----------|-----------|------|
| save | context-handling | save (하드코딩) | 세션 컨텍스트를 HANDOFF.md에 저장 |
| resume | context-handling | resume (하드코딩) | HANDOFF.md에서 작업 복구 |
| design-summary | design-summary | {{ARGUMENTS}} | 설계 문서 통합 요약 생성 |

- 자동 트리거 스킬(orchestrator, persona-resolution 등)에는 커맨드를 추가하지 않는다
- 하드코딩 ARGUMENTS: 콘솔 자동완성 즉시 실행 시 아규먼트 입력 불가 문제 해결
- {{ARGUMENTS}}: 사용자 입력이 필요한 경우 사용 (Ouroboros 패턴)
```

- [ ] **Step 2: CLAUDE.md Architecture 섹션의 Core Components에 commands/ 추가**

기존 Core Components 목록에 commands/ 항목 추가:

```markdown
- **`commands/`** — 콘솔 자동완성용 독립 명령 파일 (save, resume, design-summary)
```

- [ ] **Step 3: 변경 확인**

CLAUDE.md에서 "commands" 관련 내용이 올바르게 추가되었는지 확인

---

### Task 5: 통합 테스트

**Files:**
- 없음 (수동 테스트)

- [ ] **Step 1: 플러그인 디렉토리 구조 확인**

```bash
find commands/ -type f -name "*.md" | sort
```

Expected:
```
commands/design-summary.md
commands/resume.md
commands/save.md
```

- [ ] **Step 2: 콘솔 자동완성 테스트 (수동)**

Claude Code 콘솔에서:
1. `/save` 입력 → `dev-workflow:save` 자동완성 표시 확인
2. 엔터 → context-handling save 모드 실행 확인
3. `/resume` 입력 → `dev-workflow:resume` 자동완성 표시 확인
4. 엔터 → context-handling resume 모드 실행 확인
5. `/design-summary` 입력 → `dev-workflow:design-summary` 자동완성 표시 확인

- [ ] **Step 3: 기존 스킬 호환성 확인**

기존 `/dev-workflow:context-handling save` 명령이 여전히 동작하는지 확인
기존 `/dev-workflow:design-summary` 명령이 여전히 동작하는지 확인
