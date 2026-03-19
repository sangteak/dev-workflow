# handoff-discovery-ux Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 세션 시작 시 HANDOFF 탐색 과정을 노출하지 않고, 진행 중인 모든 작업을 하나의 통합 목록 템플릿으로 일관되게 제시한다.

**Architecture:** context-handling SKILL.md를 전면 개편하여 탐색·분류·출력을 일원화하고, workflow-orchestrator SKILL.md의 Session Start Protocol Step 2를 단순 invoke로 축소한다. 두 스킬 파일만 수정하며 새 파일 생성은 없다.

**Tech Stack:** Markdown 스킬 파일 (SKILL.md)

---

### Task 1: context-handling SKILL.md — 메타데이터 및 트리거 조건 갱신

**Files:**
- Modify: `skills/context-handling/SKILL.md` (frontmatter + 트리거 조건 섹션)

**Step 1: frontmatter description 갱신**

현재:
```yaml
description: Use when HANDOFF.md is detected at session start, or when the user explicitly requests a handoff save during brainstorming.
```

변경:
```yaml
description: Use at session start to detect and present all in-progress work (with or without HANDOFF.md), or when the user explicitly requests a handoff save during brainstorming.
```

**Step 2: 트리거 조건 섹션 갱신**

현재 "트리거 조건" 섹션은 HANDOFF 저장 요청에만 해당한다.
세션 시작 시 invoke되는 케이스를 명시적으로 추가한다:

```markdown
## 트리거 조건

### A. 세션 시작 시 (orchestrator에서 invoke)
workflow-orchestrator의 Session Start Protocol Step 2에서 자동 invoke된다.
진행 중인 작업 탐색 및 목록 제시를 담당한다.

### B. HANDOFF 저장 요청 시
아래 발언이 있을 때 즉시 HANDOFF.md를 생성한다:
[기존 내용 유지]
```

**완료 기준:** description이 확장된 역할을 반영하고, 트리거 조건이 A/B로 분리됨

---

### Task 2: context-handling SKILL.md — "새 세션에서 HANDOFF 탐색 및 복구" 섹션 전면 교체

**Files:**
- Modify: `skills/context-handling/SKILL.md` ("새 세션에서 HANDOFF 탐색 및 복구" 섹션 전체)

**Step 1: 기존 섹션 (76~98행 부근) 을 아래 내용으로 전면 교체**

```markdown
## 새 세션에서 작업 탐색 및 목록 제시

Session Start Protocol에서 invoke 시, 아래 절차를 실행한다.
탐색부터 목록 제시까지의 과정을 사용자에게 출력하지 않는다.
결과만 통합 목록 템플릿으로 제시한다.

### 탐색 절차

docs/design/ 하위를 탐색하여 진행 중인 작업을 수집한 뒤, 아래 통합 목록 템플릿으로만 출력한다.

1. `docs/design/` 존재 여부를 확인한다
   - 존재하지 않으면 → "작업 없음" 템플릿을 출력하고 종료한다
2. 아래 파일을 수집한다 (`_archive/` 경로 포함 항목은 즉시 제외):
   - `docs/design/**/HANDOFF.md`
   - `docs/design/**/phase*.md`
   - 각 기능 디렉토리의 `[기능명].md`, `plan.md`
3. 디렉토리별로 그룹핑한 뒤, 아래 우선순위로 상태를 판정한다:
   1) HANDOFF.md 있음 → `current-phase` 값을 라벨로 사용
   2) HANDOFF 없음 + `status: complete` → 완료, 목록에서 제외
   3) HANDOFF 없음 + `plan.md` 존재 + `status` ≠ `complete` → 라벨: `DEVELOP 진행 중`
   4) HANDOFF 없음 + `[기능명].md` 존재 + `status: ready-for-plan` → 라벨: `PLAN 대기`
   5) HANDOFF 없음 + `phase*.md`만 존재 → 가장 높은 phase 번호 + `완료` (예: `Phase 2 완료`)
   6) 위 어디에도 해당하지 않음 → 목록에서 제외
4. HANDOFF 없는 항목에는 `⚠️ HANDOFF 없음` 태그를 부착한다
5. `is-issue: true`인 HANDOFF 또는 `issues/` 하위 항목은 `parent-feature` 하위에 들여쓰기로 표시한다
6. `last-updated` (HANDOFF) 또는 가장 최근 파일 수정일 역순으로 정렬한다
7. 통합 목록 템플릿으로 출력한다

### ⛔ 금지 출력

탐색부터 목록 제시 사이에 다음을 출력하지 않는다:
- "탐색합니다", "검색 중", "파일을 찾고 있습니다"
- glob 실행 결과 (파일 수, 경로 목록)
- "HANDOFF.md가 없습니다", "다른 위치에서 찾겠습니다"
- sequential-thinking 등 내부 추론 과정
- 탐색 성공/실패 중간 보고

### 통합 목록 템플릿

**진행 중인 작업이 있는 경우:**
```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (현재 단계)
  2. [카테고리] 기능명 (Phase 1 완료 · ⚠️ HANDOFF 없음) — 최근: YYYY-MM-DD

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

**진행 중인 작업이 없는 경우:**
```
📋 진행 중인 작업이 없습니다.

  0. ✨ 새 작업 시작

새 작업을 시작하세요.
```
```

**완료 기준:** 기존 76~98행의 탐색 절차가 완전히 교체되고, 금지 출력 블록과 통합 목록 템플릿이 포함됨

---

### Task 3: context-handling SKILL.md — HANDOFF 복구 흐름 섹션 갱신

**Files:**
- Modify: `skills/context-handling/SKILL.md` ("HANDOFF 복구 흐름" 섹션)

**Step 1: 기존 복구 흐름 섹션을 아래로 교체**

```markdown
## 작업 복구 흐름

사용자가 목록에서 작업을 선택하면, HANDOFF 유무에 따라 다른 안내를 제시한다.

### HANDOFF 있는 경우

```
⚠️ 이전 세션이 [국면명] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?
```

사용자 확인 후:
1. 완료된 phase 파일들을 로드한다
2. HANDOFF.md의 진행 내용을 기반으로 중단 지점부터 이어서 진행한다
3. 국면 완료 → 해당 `phase*.md` 생성 → `HANDOFF.md` 삭제 (역할 완료)

### HANDOFF 없는 경우

```
⚠️ 이 작업에는 HANDOFF.md가 없습니다.
마지막으로 완료된 단계는 [Phase N / PLAN 대기 / DEVELOP]입니다.
[다음 단계명]부터 새로 시작합니다. 계속할까요?
```

사용자 확인 후:

| 라벨 | 복구 동작 |
|------|----------|
| Phase N 완료 | phase 파일 로드 → Phase N+1부터 시작 |
| PLAN 대기 | [기능명].md 로드 → PLAN 단계 진입 |
| DEVELOP 진행 중 | plan.md 로드 → 태스크 체크리스트 확인 후 재개 |

### "새 작업 시작" 선택 시

일반 워크플로우 진입 (orchestrator의 Stage Detection으로 이동)
```

**완료 기준:** 복구 흐름이 HANDOFF 유무에 따라 분기되고, 각각의 안내 메시지 템플릿이 명시됨

---

### Task 4: workflow-orchestrator SKILL.md — Session Start Protocol Step 2 축소

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (Session Start Protocol Step 2)

**Step 1: 기존 Step 2를 아래로 교체**

현재 (23~29행 부근):
```markdown
2. **HANDOFF & Design Document Check**
   - Not exists (동일 세션 내 브레인스토밍 완료 직후) → 생략
   - Not exists (신규 세션) → 아래 순서로 탐색:
     1. `docs/design/**/HANDOFF.md` glob 탐색 → 발견 시 invoke `dev-workflow:context-handling` skill (HANDOFF 목록 제시)
     2. HANDOFF 없음 + `docs/design/[카테고리]/[기능명]/phase*.md` 존재 → 가장 최근 phase 파일 감지, 다음 국면부터 이어서 진행 제안
     3. HANDOFF 없음 + `docs/design/[카테고리]/[기능명]/[기능명].md` 만 존재 → 설계 문서 로드 후 PLAN 진입
     4. `docs/design/` 자체가 없음 → "설계 문서가 없습니다. 설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?"
```

변경:
```markdown
2. **작업 상태 확인**
   - 동일 세션 내 브레인스토밍 완료 직후 → 생략
   - 신규 세션 → invoke `dev-workflow:context-handling` skill
     (탐색, 분류, 목록 제시를 모두 처리. 탐색 과정을 직접 출력하지 않는다)
   - context-handling이 "진행 중인 작업 없음"을 반환한 경우:
     "설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?" 후속 질문
```

**완료 기준:** 4단계 분기가 제거되고 단순 invoke + 후속 질문 구조로 축소됨

---

### Task 5: 검증 — 시나리오별 출력 확인

수정된 두 스킬의 내용을 시나리오별로 대조 검증한다.

**Step 1: 시나리오 매트릭스 확인**

| 시나리오 | 예상 동작 | 확인 포인트 |
|----------|----------|------------|
| HANDOFF 1개 존재 | 목록에 1개 + 새 작업 시작 | 템플릿 준수 |
| HANDOFF 다수 + issues/ | 부모-자식 들여쓰기 | 계층 표시 |
| HANDOFF 없음 + phase 파일만 | ⚠️ HANDOFF 없음 태그 | 라벨 정확성 |
| HANDOFF 없음 + 기능명.md (ready-for-plan) | PLAN 대기 표시 | status 확인 |
| HANDOFF 없음 + plan.md 존재 | DEVELOP 진행 중 표시 | 파일 조합 |
| status: complete | 목록에서 제외 | 필터링 |
| _archive/ 존재 | 목록에서 제외 | 경로 필터링 |
| docs/design/ 미존재 | "작업 없음" 템플릿 | 후속 질문 |
| 혼합 (HANDOFF 있음 + 없음) | 통합 목록 | 정렬 + 태그 |

**Step 2: 스킬 파일 크로스 체크**

- context-handling의 탐색 절차가 모든 시나리오를 커버하는지 확인
- orchestrator Step 2에 잔여 분기 로직이 없는지 확인
- 복구 흐름의 메시지 템플릿이 라벨별로 매핑되는지 확인

**완료 기준:** 모든 시나리오가 수정된 스킬 내용과 일관되게 매핑됨
