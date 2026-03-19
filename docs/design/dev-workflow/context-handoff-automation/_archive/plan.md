# context-handoff-automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `context-handling` 스킬에 `save`/`resume` 서브커맨드를 추가하여 HANDOFF 저장/복구를 slash command로 수행할 수 있게 한다.

**Architecture:** 기존 `context-handling/SKILL.md`에 모드 라우팅 섹션을 추가하고, 기존 로직을 모드별로 참조하는 구조. `document-consolidation`의 Mode 패턴을 그대로 적용한다.

**Tech Stack:** Markdown 스킬 파일 (SKILL.md), YAML frontmatter

---

### Task 1: 모드 라우팅 섹션 추가

**Files:**
- Modify: `skills/context-handling/SKILL.md:1-4` (frontmatter description 업데이트)
- Modify: `skills/context-handling/SKILL.md:6-11` (모드 라우팅 섹션 삽입)

**Step 1: description 필드 업데이트**

frontmatter의 description을 서브커맨드 정보를 포함하도록 변경:

기존:
```yaml
description: Use at session start to detect and present all in-progress work (with or without HANDOFF.md), or when the user explicitly requests a handoff save during brainstorming.
```

변경:
```yaml
description: "Context handoff management. Subcommands: 'save' (create HANDOFF.md for session transfer), 'resume' (find and restore from HANDOFF.md). Also invoked automatically at session start to detect in-progress work."
```

**Step 2: 모드 라우팅 섹션 삽입**

기존 "트리거 조건" 섹션 앞(line 14 부근)에 모드 라우팅 섹션을 삽입:

```markdown
## 모드 라우팅

args에 따라 분기한다:

| args | 동작 | 참조 섹션 |
|------|------|-----------|
| `save` | HANDOFF.md 생성 후 안내 메시지 출력 | → "Mode: save" 섹션 |
| `resume` | HANDOFF 탐색, 목록 제시, 작업 복구 | → "Mode: resume" 섹션 |
| (없음) | 세션 시작 시 자동 탐색/목록 제시 (기존 동작) | → "트리거 조건 A" 이하 기존 로직 |

---
```

**Step 3: 변경 내용 확인**

`skills/context-handling/SKILL.md`를 읽어 모드 라우팅이 기존 섹션 구조와 충돌하지 않는지 확인한다.

---

### Task 2: Mode: save 섹션 추가

**Files:**
- Modify: `skills/context-handling/SKILL.md` (파일 하단에 Mode: save 섹션 추가)

**Step 1: Mode: save 섹션 작성**

기존 "주의 사항" 섹션 뒤에 추가:

```markdown
---

## Mode: save

`/context-handling save`로 호출 시 실행한다.

### 실행 절차

1. 현재 세션의 작업 상태를 분석한다
2. "HANDOFF.md 생성 규칙" 섹션의 템플릿에 따라 HANDOFF.md를 생성한다
3. 생성 완료 후 아래 안내 메시지를 출력한다:

```
✅ HANDOFF 저장 완료: docs/design/[카테고리]/[기능명]/HANDOFF.md

/clear 후 아무 메시지를 입력하면 자동으로 작업 목록이 표시됩니다.
(또는 /context-handling resume 으로 직접 복구할 수 있습니다.)
```

### 기존 자연어 트리거와의 관계

"트리거 조건 B"의 자연어 트리거("핸드오프 저장해줘" 등)는 기존과 동일하게 동작한다.
`/context-handling save`는 동일한 HANDOFF 생성 로직의 명시적 진입점이다.
```

**Step 2: 변경 내용 확인**

마크다운 구문이 올바른지 확인한다. 특히 코드블록 내 코드블록(nested fenced blocks) 이스케이프 처리.

---

### Task 3: Mode: resume 섹션 추가

**Files:**
- Modify: `skills/context-handling/SKILL.md` (Mode: save 섹션 뒤에 Mode: resume 섹션 추가)

**Step 1: Mode: resume 섹션 작성**

Mode: save 뒤에 추가:

```markdown
---

## Mode: resume

`/context-handling resume`으로 호출 시 실행한다.

### 실행 절차

"새 세션에서 작업 탐색 및 목록 제시" 섹션의 탐색 절차를 그대로 실행한다:

1. docs/design/ 하위를 탐색하여 진행 중인 작업을 수집한다
2. 통합 목록 템플릿으로 제시한다
3. 사용자가 작업을 선택하면 "작업 복구 흐름"에 따라 복구한다

### orchestrator invoke와의 관계

세션 시작 시 orchestrator가 args 없이 invoke하는 것과 동일한 로직을 실행한다.
`/context-handling resume`은 사용자가 명시적으로 복구를 요청하는 진입점이다.
```

**Step 2: 변경 내용 확인**

전체 SKILL.md 구조가 일관성을 유지하는지 확인한다.

---

### Task 4: 버전 범프

**Files:**
- Modify: `.claude-plugin/plugin.json:4` (version 업데이트)
- Modify: `.claude-plugin/marketplace.json:11` (version 업데이트)

**Step 1: plugin.json 버전 업데이트**

```json
"version": "1.3.4"
```
→
```json
"version": "1.3.5"
```

**Step 2: marketplace.json 버전 업데이트**

```json
"version": "1.3.4"
```
→
```json
"version": "1.3.5"
```

**Step 3: 두 파일의 버전이 동일한지 확인**

---

### Task 5: 통합 검증

**Files:**
- Read: `skills/context-handling/SKILL.md` (전체)

**Step 1: SKILL.md 전체 구조 검증**

완성된 SKILL.md가 아래 구조인지 확인:
```
frontmatter (description 업데이트됨)
# Context Limit Handling (HANDOFF.md)
## 모드 라우팅              ← 신규
## 트리거 조건              ← 기존 유지
## HANDOFF.md 생성 규칙     ← 기존 유지
## 새 세션에서 작업 탐색    ← 기존 유지
## 작업 복구 흐름           ← 기존 유지
## 중간 결정 사항 업데이트  ← 기존 유지
## 주의 사항                ← 기존 유지
## Mode: save               ← 신규
## Mode: resume              ← 신규
```

**Step 2: 하위 호환성 확인**

- args 없이 invoke 시 기존 동작("트리거 조건 A" 이하)이 유지되는지 확인
- "트리거 조건 B"의 자연어 트리거가 여전히 유효한지 확인
- 모드 라우팅이 기존 섹션의 참조를 깨뜨리지 않는지 확인
