# Case-Insensitive Path Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `docs/design/` 경로 탐색 시 대소문자 차이로 작업을 찾지 못하는 사일런트 실패를 제거한다.

**Architecture:** `development-principles` 스킬에 공통 경로 해소 규칙을 정의하고, 7개 스킬의 탐색 절차에 `find -iname` 기반 인라인 경로 해소 스텝을 삽입한다. 탐색은 case-insensitive, 생성은 표준 `docs/design/` 고정.

**Tech Stack:** Markdown 스킬 파일 편집 (코드 없는 플러그인). Bash `find -iname` 명령.

**수정 대상 스킬 파일 경로 (모두 `skills/` 하위):**
- `development-principles/SKILL.md` — 공통 규칙 추가
- `context-handling/SKILL.md` — 탐색 절차 수정 (가장 큰 변경)
- `brainstorming/SKILL.md` — 카테고리 스캔 수정
- `design-doc-index/SKILL.md` — glob 탐색 수정
- `design-summary/SKILL.md` — glob 탐색 수정
- `document-consolidation/SKILL.md` — 읽기 경로 수정 (생성 경로 유지)
- `plan-stage/SKILL.md` — 읽기 경로 수정 (생성 경로 유지)
- `workflow-orchestrator/SKILL.md` — 존재 확인 수정

---

### Task 1: development-principles에 공통 경로 해소 규칙 추가

**Files:**
- Modify: `skills/development-principles/SKILL.md`

**Step 1: SKILL.md 읽기**

현재 파일 내용을 확인한다. `docs/design/` 참조가 없는 상태.

**Step 2: "경로 해소 규칙 (Path Resolution)" 섹션 추가**

파일 끝에 아래 섹션을 추가한다:

```markdown
---

## 경로 해소 규칙 (Path Resolution)

모든 스킬에서 `docs/design/` 디렉토리를 탐색할 때 적용하는 공통 규칙이다.

### 탐색 시 (Search/Read)

`docs/design/` 경로를 탐색하기 전, 실제 경로를 확인한다:

1. 아래 명령을 실행한다:
   ```bash
   find . -maxdepth 2 -iname "docs" -type d
   ```
2. 결과에서 `design` 하위 디렉토리가 존재하는지 확인한다
3. 발견된 실제 경로를 이후 모든 탐색(glob, 존재 확인, 스캔)에 사용한다
4. `docs` 디렉토리를 찾지 못한 경우 → "docs/design/ 디렉토리를 찾을 수 없습니다" 안내

### 생성 시 (Create/Write)

파일 및 디렉토리 생성은 항상 표준 경로 `docs/design/`을 사용한다.
경로 해소 결과와 무관하게 소문자 표준을 강제한다.

### 실행 빈도

경로 해소는 **스킬 실행당 1회**만 수행한다.
해소된 경로를 해당 스킬의 전체 실행 동안 재사용한다.
```

**Step 3: 변경 확인**

추가된 섹션이 기존 내용과 자연스럽게 이어지는지 확인한다.

---

### Task 2: context-handling 탐색 절차 수정

**Files:**
- Modify: `skills/context-handling/SKILL.md`

**Step 1: SKILL.md 읽기**

현재 "새 세션에서 작업 탐색 및 목록 제시 > 탐색 절차" 섹션을 확인한다.

**Step 2: 탐색 절차 상단에 경로 해소 스텝 삽입**

기존 탐색 절차의 1번 항목 앞에 경로 해소 스텝을 삽입한다:

기존:
```
1. `docs/design/` 존재 여부를 확인한다
   - 존재하지 않으면 → "작업 없음" 템플릿을 출력하고 종료한다
```

변경 후:
```
1. 경로 해소: 아래 명령을 실행하여 실제 경로를 확보한다
   ```bash
   find . -maxdepth 2 -iname "docs" -type d
   ```
   - 결과에서 `design` 하위 디렉토리를 확인한다
   - 발견된 실제 경로를 이후 탐색에 사용한다
   - 찾지 못한 경우 → "작업 없음" 템플릿을 출력하고 종료한다
   - 상세 규칙: development-principles "경로 해소 규칙" 섹션 참조
2. 아래 파일을 수집한다 (`_archive/` 경로 포함 항목은 즉시 제외):
   (이하 기존 내용 유지, 단 `docs/design/` → "해소된 경로" 표현으로 변경)
```

**Step 3: 나머지 `docs/design/` 탐색 참조 업데이트**

이 스킬 내 모든 탐색/읽기 참조에서:
- `docs/design/**/HANDOFF.md` → `[해소된 경로]/**/HANDOFF.md`
- `docs/design/**/phase*.md` → `[해소된 경로]/**/phase*.md`
- `docs/design/` 하위 탐색 → `[해소된 경로]` 하위 탐색

단, 아래 생성 참조는 변경하지 않는다:
- "HANDOFF.md 생성 규칙" 섹션의 생성 경로 → `docs/design/` 유지
- "모든 파일 경로 규칙" 헤더 → `docs/design/` 유지

**Step 4: 변경 확인**

탐색 참조와 생성 참조가 올바르게 분리되었는지 검증한다.

---

### Task 3: brainstorming 카테고리 스캔 수정

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

**Step 1: SKILL.md 읽기**

"국면 0: 카테고리 결정" 섹션을 확인한다.

**Step 2: 카테고리 스캔에 경로 해소 스텝 삽입**

국면 0 절차의 "기존 카테고리 조회" 부분에 경로 해소를 추가한다:

기존:
```
2. 기존 카테고리 조회: `docs/design/` 하위 1depth 디렉토리를 스캔한다
```

변경 후:
```
2. 기존 카테고리 조회:
   - 경로 해소: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
     (상세: development-principles "경로 해소 규칙" 참조)
   - 해소된 경로의 1depth 디렉토리를 스캔한다
```

**Step 3: 나머지 참조 확인**

이 스킬의 `docs/design/` 참조는 대부분 파일 생성(phase 파일, 설계 문서)이므로 변경하지 않는다.
"모든 파일 경로 규칙" 헤더도 그대로 유지한다.

---

### Task 4: design-doc-index glob 탐색 수정

**Files:**
- Modify: `skills/design-doc-index/SKILL.md`

**Step 1: SKILL.md 읽기**

"상태 정규화 전처리" 및 "색인 모드" 섹션을 확인한다.

**Step 2: 탐색 절차 상단에 경로 해소 스텝 삽입**

"상태 정규화 전처리" 섹션의 절차 상단에 추가:

```markdown
0. 경로 해소: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
   (상세: development-principles "경로 해소 규칙" 참조)
```

**Step 3: 탐색 경로 참조 업데이트**

이 스킬의 6개 참조는 모두 탐색(SEARCH) 유형이므로 전부 "해소된 경로" 표현으로 변경:
- `docs/design/` 디렉토리를 스캔 → `[해소된 경로]`를 스캔
- `docs/design/[카테고리]/[기능명]/[기능명].md` 패턴 → `[해소된 경로]/[카테고리]/...` 패턴
- glob 탐색 경로 모두 동일 패턴 적용

---

### Task 5: design-summary glob 탐색 수정

**Files:**
- Modify: `skills/design-summary/SKILL.md`

**Step 1: SKILL.md 읽기**

"상태 정규화 전처리" 및 "대상 문서 탐색" 섹션을 확인한다.

**Step 2: 탐색 절차 상단에 경로 해소 스텝 삽입**

design-doc-index와 동일한 패턴으로 추가:

```markdown
0. 경로 해소: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
   (상세: development-principles "경로 해소 규칙" 참조)
```

**Step 3: 탐색 경로 참조 업데이트**

4개 참조 모두 SEARCH 유형 → "해소된 경로" 표현으로 변경.
design-doc-index와 동일 패턴.

---

### Task 6: document-consolidation 읽기 경로 수정

**Files:**
- Modify: `skills/document-consolidation/SKILL.md`

**Step 1: SKILL.md 읽기**

"Mode 1: consolidate-main" 및 "Mode 2: consolidate-issue" 섹션을 확인한다.

**Step 2: 경로 해소 스텝 삽입**

각 Mode 실행 절차 상단에 추가:

```markdown
0. 경로 해소: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
   (상세: development-principles "경로 해소 규칙" 참조)
```

**Step 3: 읽기 참조만 업데이트**

- READ 참조 (3개): phase 파일 읽기, HANDOFF.md 읽기, 이슈 설계 문서 읽기 → "해소된 경로" 적용
- CREATE 참조 (8개): `_archive/` mkdir, 파일 이동, 디렉토리 구조 → `docs/design/` 유지

---

### Task 7: plan-stage 읽기 경로 수정

**Files:**
- Modify: `skills/plan-stage/SKILL.md`

**Step 1: SKILL.md 읽기**

"Step 1: 브레인스토밍 문서 분석" 섹션을 확인한다.

**Step 2: 신규 세션 진입 시 경로 해소 스텝 삽입**

"신규 세션에서 진입하는 경우" 블록 상단에 추가:

```markdown
경로 해소: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
(상세: development-principles "경로 해소 규칙" 참조)
```

**Step 3: 참조 업데이트**

- READ 참조 (1개): 설계 문서 읽기 → "해소된 경로" 적용
- CREATE 참조 (1개): plan.md 저장 경로 → `docs/design/` 유지

---

### Task 8: workflow-orchestrator 존재 확인 수정

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md`

**Step 1: SKILL.md 읽기**

"Workflow Stage Detection > PLAN" 섹션을 확인한다.

**Step 2: PLAN 감지 조건에 경로 해소 적용**

기존:
```
- `docs/design/[카테고리]/[기능명]/[기능명].md` 존재 + 태스크 목록(plan.md) 미생성
```

변경 후:
```
- 경로 해소(`find . -maxdepth 2 -iname "docs" -type d`) 후
  `[해소된 경로]/[카테고리]/[기능명]/[기능명].md` 존재 + 태스크 목록(plan.md) 미생성
  (상세: development-principles "경로 해소 규칙" 참조)
```

---

### Task 9: 통합 검증

**Step 1: 모든 수정 파일 재확인**

8개 스킬 파일을 순회하며:
- 탐색 참조가 모두 "해소된 경로" 또는 `find -iname` 명령을 포함하는지 확인
- 생성 참조가 모두 `docs/design/` 표준 경로를 유지하는지 확인
- "모든 파일 경로 규칙" 헤더가 변경되지 않았는지 확인

**Step 2: 경로 해소 명령 일관성 검증**

모든 스킬에서 동일한 명령이 사용되는지 확인:
```bash
find . -maxdepth 2 -iname "docs" -type d
```

**Step 3: 버전 업데이트**

- `plugin.json` 의 `version` 업데이트 (patch 버전 증가)
- `marketplace.json` 의 `plugins[].version` 동일하게 업데이트
- 두 파일의 버전이 일치하는지 확인

**Step 4: 설계 문서 상태 업데이트**

`docs/design/dev-workflow/case-insensitive-path-search/case-insensitive-path-search.md` 의:
- `status: ready-for-plan` → `status: in-development`
- `last-updated` 갱신
