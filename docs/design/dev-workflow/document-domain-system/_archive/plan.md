# Document Domain System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 설계 문서 관리를 feature 단위에서 domain 단위 2계층 모델로 전환하는 스킬 변경

**Architecture:** 3개 스킬(document-consolidation, design-doc-index, design-summary)의 SKILL.md를 수정하여 domain.md 체계를 지원. 코드 변경 없이 Markdown 스킬 파일만 수정.

**Tech Stack:** Markdown (SKILL.md 파일)

---

### Task 1: document-consolidation 스킬 — Mode 3 추가 (consolidate-domain)

**Files:**
- Modify: `skills/document-consolidation/SKILL.md`

**Step 1: 기존 스킬 파일 읽기 및 변경 범위 확인**

기존 Mode 1(consolidate-main), Mode 2(consolidate-issue)는 유지. 새로운 Mode 3(consolidate-domain)을 추가한다.

**Step 2: Mode 3 섹션 추가**

Mode 2 아래에 다음 내용을 추가:

```markdown
## Mode 3: consolidate-domain

feature 완료 후 설계 문서를 domain.md에 통합하거나 새 domain으로 승격한다.
consolidate-main 실행 후 자동으로 이어지는 단계이다.

### 트리거

consolidate-main(Mode 1)의 _archive/ 이동 완료 후 자동으로 제안한다:
"domain.md 통합을 진행할까요?"

### 실행 절차

1. **domain.md 존재 확인**
   - `[해소된 경로]/[카테고리]/` 직속의 .md 파일 중 관련 domain.md를 탐색한다
   - domain.md 판별: category 디렉토리 직속 .md 파일 = domain

2. **통합 방향 판단 — 사용자에게 질문**

   **domain.md가 존재하는 경우:**
   ```
   📋 이 feature의 내용을 어디에 통합할까요?

   1. 기존 domain에 merge ([domain명].md)
   2. 새 domain으로 승격
   ```

   **domain.md가 존재하지 않는 경우:**
   ```
   📋 관련 domain.md가 없습니다. 새 domain으로 승격합니다.
   domain 이름을 지정해주세요.
   > 예: "workflow-lifecycle"
   ```

3. **merge 실행 (기존 domain에 통합)**
   - feature 설계 문서(`[기능명].md`)의 핵심 내용을 domain.md의 적절한 섹션에 병합
   - 병합 원칙: "원래 하나였던 것처럼" — 참조 링크가 아닌 직접 병합
   - domain.md에 없던 정책/결정은 새 섹션 또는 기존 섹션에 추가
   - 충돌하는 내용은 최신(현재 feature)의 결정을 우선하되, 변경 사유를 명시

4. **승격 실행 (새 domain 생성)**
   - feature 설계 문서(`[기능명].md`)를 기반으로 `[domain명].md`를 category 직속에 생성
   - domain.md 형식으로 재구성: 시스템 개요, 정책, 결정 사항, 파일 목록

5. **크로스 도메인 pending 처리**
   ```
   📋 다른 domain에 영향을 준 변경이 있나요?

   1. 있음 — pending 파일 생성
   2. 없음
   ```

   "있음" 선택 시:
   ```
   어떤 domain에 영향을 줬나요?
   > 예: "aggro-system"

   변경 키워드를 간단히 기록해주세요.
   > 예: "상태 전이 추가: Combat → Threat"
   ```
   → `[기능명]/_pending/[대상domain].pending.md` 생성

   **pending 파일 형식:**
   ```markdown
   # [대상domain] pending
   - from: [기능명]
   - [사용자 입력 키워드]
   ```

6. **pending 반영 (현재 feature에 pending이 있는 경우)**
   - 현재 feature 디렉토리에 `_pending/` 이 존재하면, 각 pending 파일을 대상 domain.md에 반영
   - 반영 방식: pending 키워드를 기반으로 코드베이스를 참조하며 domain.md 업데이트
   - 반영 후 pending 파일 삭제

7. **feature 디렉토리 삭제**
   ```
   📋 domain 통합 완료. feature 디렉토리를 삭제합니다.

   삭제 대상: docs/design/[카테고리]/[기능명]/
   (domain.md에 모든 내용이 통합되었습니다)

   진행할까요?
   1. Yes
   2. No
   ```
   사용자 승인 후 feature 디렉토리 전체 삭제.

### 최종 상태

**merge의 경우:**
```
docs/design/[카테고리]/
├── [domain명].md              ← 업데이트된 SSOT
└── (feature 디렉토리 삭제됨)
```

**승격의 경우:**
```
docs/design/[카테고리]/
├── [domain명].md              ← 새로 생성된 SSOT
└── (feature 디렉토리 삭제됨)
```
```

**Step 3: Mode 1 수정 — consolidate-domain 연결**

Mode 1의 "최종 상태" 섹션 아래에 다음을 추가:

```markdown
### domain 통합 연결

_archive/ 이동 완료 후, consolidate-domain(Mode 3)을 제안한다:
"domain.md 통합을 진행할까요?"

사용자가 거부하면 consolidate-main만으로 완료 처리한다.
```

**Step 4: 변경 결과 확인**

수정된 SKILL.md를 읽어 Mode 1 → Mode 3 연결과 Mode 3 전체 흐름이 올바른지 확인한다.

**Step 5: Commit**

```bash
git add skills/document-consolidation/SKILL.md
git commit -m "feat: add consolidate-domain mode (Mode 3) to document-consolidation skill"
```

---

### Task 2: design-doc-index 스킬 — domain.md 우선 인덱싱

**Files:**
- Modify: `skills/design-doc-index/SKILL.md`

**Step 1: 색인 대상 섹션 변경**

기존 "색인 대상" 섹션을 다음으로 교체:

```markdown
## 색인 대상

구현 완료된 설계 문서를 대상으로 하며, domain.md를 우선 참조한다.

### 우선순위

1. **domain.md** (1순위) — category 디렉토리 직속 .md 파일
   - 탐색 경로: `[해소된 경로]/[카테고리]/*.md`
   - 판별: category 디렉토리 직속에 위치한 .md 파일
   - 프론트매터 status 필터링 없음 (domain.md는 항상 활성 상태)

2. **feature 설계 문서** (2순위) — 진행 중인 feature의 설계 문서
   - 탐색 경로: `[해소된 경로]/[카테고리]/[기능명]/[기능명].md`
   - 프론트매터 `status: complete` 필터링 유지
   - domain.md가 존재하는 시스템의 feature 문서는 domain.md에 통합되어 삭제되므로,
     여기에 남아있는 feature 문서는 아직 진행 중이거나 domain 미통합 상태
```

**Step 2: 상태 정규화 전처리 — domain.md 제외 추가**

상태 정규화 전처리 절차에 다음 조건을 추가:

```markdown
0-1. domain.md(category 직속 .md)는 상태 정규화 대상에서 제외한다
```

**Step 3: 색인 모드 출력 형식 변경**

색인 모드의 출력을 domain과 feature로 구분:

```markdown
### 출력 형식

```
📚 설계 문서 색인 ([N]건)

[Domain]
  1. [카테고리]/[domain명] — "[한 줄 요약]"
  2. [카테고리]/[domain명] — "[한 줄 요약]"

[진행 중 Feature]
  3. [카테고리]/[기능명] — "[한 줄 요약]" (진행 중)
```
```

**Step 4: 전체 로드 모드 매칭 전략 변경**

매칭 시 domain.md도 대상에 포함:

```markdown
### 매칭 전략

디렉토리명 및 파일명 부분 매칭(substring)으로 검색한다.

```
키워드: "aggro"

domain 레벨: [해소된 경로]/[카테고리]/*aggro*.md
feature 레벨: [해소된 경로]/[카테고리]/*aggro*/[기능명].md

→ 두 결과를 합쳐서 중복 제거
→ domain.md 우선 표시
```
```

**Step 5: 변경 결과 확인**

수정된 SKILL.md를 읽어 domain 우선 인덱싱 흐름이 올바른지 확인한다.

**Step 6: Commit**

```bash
git add skills/design-doc-index/SKILL.md
git commit -m "feat: add domain.md priority indexing to design-doc-index skill"
```

---

### Task 3: design-summary 스킬 — domain.md 기반 동작

**Files:**
- Modify: `skills/design-summary/SKILL.md`

**Step 1: 대상 문서 탐색 섹션 변경**

탐색 대상에 domain.md를 추가:

```markdown
## 대상 문서 탐색

### 탐색 규칙

1. `[해소된 경로]/` 하위의 설계 문서를 glob 탐색한다
2. **domain.md 우선**: category 직속 .md 파일을 먼저 탐색
3. **feature 보조**: domain.md가 없는 경우 feature 설계 문서(`[기능명]/[기능명].md`)를 탐색
4. feature 문서는 프론트매터 `status: complete` 필터링 유지
5. 인자에 따른 매칭:
   - **키워드 매칭**: 파일명 및 디렉토리명 부분 매칭(substring)
     - domain 레벨: `[해소된 경로]/[카테고리]/*[키워드]*.md`
     - feature 레벨: `[해소된 경로]/[카테고리]/*[키워드]*/[기능명].md`
     - 두 결과 합산 후 중복 제거, domain 우선
   - **카테고리 전체**: 해당 카테고리 하위 모든 domain.md + complete feature 문서
   - **기능명 목록**: 지정된 문서만
```

**Step 2: 상태 정규화 전처리 — domain.md 제외 추가**

design-doc-index와 동일하게:

```markdown
0-1. domain.md(category 직속 .md)는 상태 정규화 대상에서 제외한다
```

**Step 3: 요약 생성 전략 — domain.md 처리 방식 추가**

```markdown
### domain.md 특별 처리

domain.md는 이미 통합된 문서이므로, 추출 시 전체 구조를 그대로 활용한다.
feature 설계 문서와 domain.md가 동일 시스템에 대해 존재하면,
domain.md의 내용을 기준으로 하고 feature 문서는 보충 정보로만 활용한다.
```

**Step 4: 색인 힌트 문구 변경**

기존 "같은 접두사를 공유하는 문서가 3개 이상이면" 힌트를 domain.md 체계에 맞게 수정하거나 제거한다. domain.md가 이미 통합 문서이므로 feature-group-summary 용도의 힌트는 불필요.

**Step 5: 변경 결과 확인**

수정된 SKILL.md를 읽어 domain.md 기반 요약 생성 흐름이 올바른지 확인한다.

**Step 6: Commit**

```bash
git add skills/design-summary/SKILL.md
git commit -m "feat: update design-summary skill to prioritize domain.md"
```

---

### Task 4: 플러그인 버전 업데이트

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Step 1: 현재 버전 확인**

두 파일의 현재 `version` 값을 읽는다.

**Step 2: 마이너 버전 증가**

두 파일 모두 동일한 새 버전으로 업데이트한다. (예: 1.3.5 → 1.4.0)

**Step 3: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore: bump version to 1.4.0 for document-domain-system"
```

---

### Task 5: 최종 검증

**Step 1: 변경된 스킬 파일 전체 리뷰**

3개 스킬 파일을 순서대로 읽어 다음을 확인:
- document-consolidation: Mode 1 → Mode 3 연결이 자연스러운가
- design-doc-index: domain/feature 구분이 명확한가
- design-summary: domain.md 우선 처리가 일관적인가

**Step 2: 시나리오 워크스루**

"SearchTarget 완료 → aggro domain merge + search-target domain 승격" 시나리오를 스킬 흐름대로 추적하여 빈틈이 없는지 확인.

**Step 3: Commit (필요 시)**

검증 중 발견된 수정 사항이 있으면 반영 후 커밋.
