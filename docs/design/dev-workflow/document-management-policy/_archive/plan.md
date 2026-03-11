# Document Management Policy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** dev-workflow 플러그인의 문서 관리 정책을 카테고리 기반 구조로 전면 개편한다.

**Architecture:** 5개 스킬 파일(4개 수정 + 1개 신규)과 플러그인 메타데이터를 변경. 모든 경로를 `docs/design/[카테고리]/[기능명]/` 패턴으로 통일하고, HANDOFF를 멀티세션 지원으로 확장하며, 개발 완료 후 문서 통합 스킬을 추가한다.

**Tech Stack:** Claude Code Plugin (SKILL.md markdown files), Bash hooks

**참조 설계 문서:** `docs/design/dev-workflow/document-management-policy/document-management-policy.md`

---

## Task 1: brainstorming 스킬 수정

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

**변경 범위:**
- 카테고리 선택 절차 추가 (국면 1 이전)
- 모든 경로를 `docs/design/[카테고리]/[기능명]/`으로 변경
- 설계 문서 템플릿을 10개 섹션 + YAML 프론트매터로 교체
- issues/ 서브 워크플로우 진입 섹션 추가

### Step 1: 카테고리 선택 절차 추가

스킬 상단, 국면 1 이전에 **"국면 0: 카테고리 결정"** 섹션을 삽입한다.

```markdown
## 국면 0: 카테고리 결정

브레인스토밍 시작 전, 기능이 속할 카테고리를 결정한다.

**절차:**
1. 사용자의 요구사항을 분석하여 적합한 카테고리를 추천한다
2. 기존 카테고리 조회: `docs/design/` 하위 1depth 디렉토리를 스캔한다
3. 추천 결과를 제시한다:

**추천이 명확한 경우:**
```
📂 카테고리 추천: [카테고리명]
   기존 카테고리에서 [근거]와 일치합니다.
   이 카테고리로 진행할까요?
```

**추천이 모호한 경우:**
```
📂 기존 카테고리 목록:
  1. [카테고리A] — [소속 기능 수]개 기능
  2. [카테고리B] — [소속 기능 수]개 기능
  3. ✨ 새 카테고리 생성

어떤 카테고리에 속할까요?
```

**신규 카테고리 생성 시:**
- 도메인/시스템 단위인지 확인하는 질의응답 진행
- 소문자 kebab-case로 네이밍
- 확정 후 디렉토리 생성

4. 카테고리 확정 후 국면 1로 진행한다

**확정된 카테고리는 이후 모든 파일 경로에 사용된다:**
`docs/design/[카테고리]/[기능명]/`
```

### Step 2: 모든 경로 패턴 변경

스킬 전체에서 경로를 변경한다:

| 기존 | 변경 |
|------|------|
| `docs/design/[기능명]/` | `docs/design/[카테고리]/[기능명]/` |
| `docs/design/[기능명]/phase1_exploration.md` | `docs/design/[카테고리]/[기능명]/phase1_exploration.md` |
| `docs/design/[기능명]/phase2_discovery.md` | `docs/design/[카테고리]/[기능명]/phase2_discovery.md` |
| `docs/design/[기능명]/phase3_validation.md` | `docs/design/[카테고리]/[기능명]/phase3_validation.md` |
| `docs/design/[기능명]/[기능명].md` | `docs/design/[카테고리]/[기능명]/[기능명].md` |

### Step 3: 설계 문서 템플릿 교체

국면 4의 **표준 설계 문서 포맷**을 아래로 교체한다:

````markdown
**표준 설계 문서 포맷:**
```markdown
---
feature: [기능명]
category: [카테고리명]
status: ready-for-plan
created: [날짜]
last-updated: [날짜]
dependencies:
  - [선행 기능명]
affects:
  - [영향받는 컴포넌트명]
---

# [기능명] 설계 문서

> 한 줄 요약: [이 기능이 해결하는 문제]

## 1. 배경과 동기
- [이 기능이 필요한 이유]

## 2. 목표와 비목표
### 목표
- GOAL-001: [구체적 목표]
### 비목표
- [명시적으로 범위에서 제외한 것과 그 이유]

## 3. 확정된 요구사항
- REQ-001: [명세] — 우선순위: HIGH
- REQ-002: [명세] — 우선순위: MEDIUM

## 4. 설계 개요
- [아키텍처/구조 설명]
- [주요 컴포넌트 간 관계]

## 5. 의존성 맵
| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|

## 6. 기술 결정 및 대안 검토
| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|

## 7. 제약조건과 가정
- [설계 당시의 기술적 제약]
- [환경에 대한 전제]

## 8. 기술 가이드라인
- [구현 시 준수해야 할 기술적 방향]

## 9. 구현 결과 및 일탈 사항
> 구현 완료 후 작성

## 10. 변경 이력
| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
```
````

### Step 4: 디렉토리 최종 구조 업데이트

국면 4의 **디렉토리 최종 구조**를 교체한다:

```markdown
**디렉토리 구조:**
```
docs/design/[카테고리]/[기능명]/
├── phase1_exploration.md    ← 국면 1 완료 시 생성, 불변
├── phase2_discovery.md      ← 국면 2 완료 시 생성, 불변
├── phase3_validation.md     ← 국면 3 완료 시 생성, 불변
├── [기능명].md              ← 국면 4 확정 시 생성, 최종 설계 문서
├── plan.md                  ← PLAN 단계에서 생성
├── HANDOFF.md               ← 미완료 시 존재
├── issues/                  ← 서브 문제 발생 시
│   └── [문제명]/
└── _archive/                ← 개발 완료 후
```
```

### Step 5: issues/ 서브 워크플로우 섹션 추가

국면 4 이후에 새 섹션을 추가한다:

```markdown
---

## issues/ 서브 워크플로우 (hotfix 전략)

개발 중 설계 보완이 필요한 서브 문제가 발생하면 issues/ 디렉토리에서 격리 처리한다.
git hotfix 브랜치와 동일한 전략이다.

### 진입 조건

사용자가 설계 논의가 필요하다고 판단하여 명시적으로 요청한 경우에만 진입한다.
Claude가 자동으로 issues/를 생성하지 않는다.

### 진입 절차

1. 부모 기능 디렉토리 확인: `docs/design/[카테고리]/[기능명]/`
2. 이슈 디렉토리 생성: `docs/design/[카테고리]/[기능명]/issues/[문제명]/`
3. 정규 4단계(국면 0 카테고리 결정은 생략 — 부모 카테고리 상속) 브레인스토밍 진행
4. phase 파일 및 설계 문서를 issues/[문제명]/ 하위에 생성

### 이슈 디렉토리 구조

```
docs/design/[카테고리]/[기능명]/issues/[문제명]/
├── phase1_exploration.md
├── phase2_discovery.md
├── phase3_validation.md
├── [문제명].md              ← 이슈 설계 문서
└── HANDOFF.md               ← 이슈 미완료 시
```

### 완료 후 통합

이슈 해결이 완료되면 `dev-workflow:document-consolidation` 스킬의
consolidate-issue 모드를 사용하여 부모 design 문서에 통합한다.
통합 후 issues/[문제명]/ 디렉토리를 삭제한다.

### 중첩 금지

issues/ 내에서 추가 문제 발견 시:
- 같은 맥락 확장 → 현재 이슈의 phase를 리셋하여 재진행
  - 기존 phase 파일 삭제, 유효 결정사항을 새 Phase 1 컨텍스트로 이월
- 새로운 기능 필요 → 별도 기능 디렉토리로 격상 (feature 브랜치 전략)
- 무관한 문제 → 메모 후 별도 세션에서 처리

### 개발 중 문제 판단 플로우

```
테스트 중 문제 발생
  │
  ├─ 코드 수정만으로 해결? → 즉시 수정 (commit)
  │
  └─ 설계 논의 필요?
       ├─ 현재 기능의 설계? → issues/ (hotfix)
       ├─ 새로운 기능 필요? → 별도 기능 디렉토리 (feature)
       └─ 현재 기능과 무관? → 메모 후 별도 세션
```
```

### Step 6: 검증

- 스킬 파일이 유효한 마크다운인지 확인
- 경로 패턴이 일관되게 `[카테고리]/[기능명]/`을 사용하는지 전체 검색

### Step 7: 커밋

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: brainstorming 스킬에 카테고리 선택, 경로 변경, issues/ 지원, 설계 문서 템플릿 추가"
```

---

## Task 2: plan-stage 스킬 수정

**Files:**
- Modify: `skills/plan-stage/SKILL.md`

**변경 범위:**
- Step 1의 문서 탐색 경로를 카테고리 구조로 변경
- Superpowers writing-plans 출력 경로 안내를 `plan.md`로 변경

### Step 1: 경로 변경

Step 1 신규 세션 진입 시 `docs/design/` 탐색 로직을 카테고리 구조에 맞게 변경한다:

```markdown
**신규 세션에서 진입하는 경우:**
`docs/design/[카테고리]/[기능명]/` 의 설계 문서를 읽고 추출 후 사용자 확인:
```

### Step 2: writing-plans 출력 경로 안내 추가

Step 4 설계 방향 수립 완료 후 섹션에 경로 안내를 추가한다:

```markdown
설계 방향 수립 완료 후 Superpowers `writing-plans` 를 실행한다.

**plan 파일 저장 경로:** `docs/design/[카테고리]/[기능명]/plan.md`
Superpowers가 다른 경로에 생성할 경우, 위 경로로 이동한다.
```

### Step 3: 검증

- 경로 패턴 일관성 확인

### Step 4: 커밋

```bash
git add skills/plan-stage/SKILL.md
git commit -m "feat: plan-stage 경로를 카테고리 기반 구조로 변경"
```

---

## Task 3: context-handling 스킬 수정

**Files:**
- Modify: `skills/context-handling/SKILL.md`

**변경 범위:**
- HANDOFF.md 위치를 `docs/design/[카테고리]/[기능명]/HANDOFF.md`로 변경
- HANDOFF 프론트매터 스펙 추가
- "동시에 여러 HANDOFF 금지" 규칙 삭제 (멀티세션 지원)
- 세션 시작 시 HANDOFF 목록 탐색/표시 로직 추가
- 이슈 HANDOFF 지원 추가

### Step 1: HANDOFF 생성 규칙 전면 교체

**기존** `docs/design/[기능명]/HANDOFF.md` 생성 규칙을 아래로 교체한다:

```markdown
## HANDOFF.md 생성 규칙

`docs/design/[카테고리]/[기능명]/HANDOFF.md` 를 즉시 생성한다.
issues/ 진행 중이면 `docs/design/[카테고리]/[기능명]/issues/[문제명]/HANDOFF.md`에 생성한다.

```markdown
---
feature: [기능명]
category: [카테고리명]
current-phase: "[Phase N 단계명]"
last-updated: [YYYY-MM-DD]
is-issue: false
parent-feature: ""
---

# Handoff: [기능명]

## 현재 상태
- 진행 중인 국면: [국면 번호 및 이름]
- 중단 시점: [구체적으로 어디까지 진행했는지]

## 확정된 페르소나
- 브레인스토밍: [목록]

## 완료된 국면
- [완료된 phase 파일 목록]

## 현재 국면 진행 내용

### 확정된 항목
- [목록]

### 미완료 항목 (다음 세션에서 이어서 진행)
- [목록]

## 다음 세션 시작 방법
1. 이 파일을 로드한다
2. [phase 파일들]을 로드한다
3. [국면명] [구체적 지점]부터 이어서 시작한다
```
```

### Step 2: 주의 사항 교체

기존 주의 사항의 "동시에 여러 HANDOFF.md가 존재해서는 안 된다"를 삭제하고 교체한다:

```markdown
## 주의 사항

- HANDOFF.md는 임시 파일이다. 국면 완료 시 반드시 삭제한다 (또는 _archive/로 이동)
- 여러 기능의 HANDOFF.md가 동시에 존재할 수 있다 (멀티세션 지원)
- phase*.md가 생성된 국면은 HANDOFF.md 없이도 복구 가능하므로
  HANDOFF.md는 현재 진행 중인 국면 정보만 담는다
- issues/ 내 HANDOFF는 is-issue: true, parent-feature에 부모 기능명을 기록한다
```

### Step 3: 세션 시작 HANDOFF 목록 탐색 섹션 추가

새 세션에서 복구 흐름 섹션을 전면 교체한다:

```markdown
## 새 세션에서 HANDOFF 탐색 및 복구

Session Start Protocol에서 호출 시:

1. `docs/design/**/HANDOFF.md` glob 탐색을 실행한다
2. 발견된 HANDOFF 파일들의 프론트매터(파일 상위 10줄)를 파싱한다
3. `last-updated` 역순으로 정렬한다
4. 아래 형식으로 목록을 제시한다:

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (현재 단계)
  2. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

5. is-issue: true인 HANDOFF는 parent-feature 하위에 들여쓰기로 표시한다
6. 사용자가 번호를 선택하면 해당 HANDOFF를 로드하고 복구 흐름을 진행한다
7. "새 작업 시작" 선택 시 일반 워크플로우 진입

**HANDOFF 미발견 시:**
`docs/design/` 구조를 분석한다:
- phase*.md만 존재 → 가장 최근 phase 감지, "HANDOFF를 생성하고 이어서 진행할까요?" 제안
- plan.md 존재 → "개발 단계 HANDOFF를 생성할까요?" 제안
- [기능명].md만 존재 → 완료된 기능, 미완료 작업 없음 안내
```

### Step 4: 검증

- HANDOFF 프론트매터 필드가 누락 없이 정의되어 있는지 확인
- 이슈 HANDOFF 경로가 issues/ 하위에 정확히 위치하는지 확인

### Step 5: 커밋

```bash
git add skills/context-handling/SKILL.md
git commit -m "feat: context-handling을 멀티세션 HANDOFF + 카테고리 구조로 전면 개편"
```

---

## Task 4: workflow-orchestrator 스킬 수정

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md`

**변경 범위:**
- Session Start Protocol의 Design Document Check를 카테고리 구조 + HANDOFF 목록으로 변경
- Stage Detection의 경로 패턴 업데이트

### Step 1: Session Start Protocol 변경

**기존** Step 2 "Design Document Check"를 교체한다:

```markdown
2. **HANDOFF & Design Document Check**
   - Not exists (동일 세션 내 브레인스토밍 완료 직후) → 생략
   - Not exists (신규 세션) → 아래 순서로 탐색:
     1. `docs/design/**/HANDOFF.md` glob 탐색 → 발견 시 invoke `dev-workflow:context-handling` skill (목록 제시)
     2. HANDOFF 없음 + `docs/design/[카테고리]/[기능명]/phase*.md` 존재 → 가장 최근 phase 파일 감지, 다음 국면부터 이어서 진행 제안
     3. HANDOFF 없음 + `docs/design/[카테고리]/[기능명]/[기능명].md` 만 존재 → 설계 문서 로드 후 PLAN 진입
     4. `docs/design/` 자체가 없음 → "설계 문서가 없습니다. 설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?"
```

### Step 2: Stage Detection 경로 업데이트

PLAN 단계 감지 조건을 변경한다:

```markdown
### PLAN
- `docs/design/[카테고리]/[기능명]/[기능명].md` 존재 + 태스크 목록(plan.md) 미생성
- 사용자 메시지: 계획, plan, 설계, architecture, 구조, breakdown
- Superpowers `writing-plans` 활성화 직전
```

### Step 3: 검증

- Session Start Protocol이 순서대로 실행되는지 논리 흐름 검토
- glob 패턴 `docs/design/**/HANDOFF.md`가 카테고리 구조와 issues/ 모두 커버하는지 확인

### Step 4: 커밋

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "feat: workflow-orchestrator에 HANDOFF 목록 탐색 및 카테고리 구조 인식 추가"
```

---

## Task 5: document-consolidation 신규 스킬 생성

**Files:**
- Create: `skills/document-consolidation/SKILL.md`

### Step 1: 디렉토리 생성

```bash
mkdir -p skills/document-consolidation
```

### Step 2: SKILL.md 작성

```markdown
---
name: document-consolidation
description: Use when development is complete (after REVIEW) or when an issue is resolved. Consolidates phase/plan files into the final design document and manages _archive/.
---

# Document Consolidation

개발 완료 후 중간 문서를 최종 설계 문서에 통합하고 정리한다.
두 가지 모드로 동작한다.

---

## 트리거

자동 실행하지 않는다. 아래 시점에 **제안**하고 사용자 승인 후 실행한다:
- REVIEW 완료 시: "문서 통합을 진행할까요?" (consolidate-main)
- issues/ 완료 시: "이슈 내용을 설계 문서에 통합할까요?" (consolidate-issue)

---

## Mode 1: consolidate-main

개발 완료 후 phase/plan/HANDOFF를 최종 design 문서에 통합한다.

### 실행 절차

1. **소스 파일 읽기**
   - `docs/design/[카테고리]/[기능명]/phase1_exploration.md`
   - `docs/design/[카테고리]/[기능명]/phase2_discovery.md`
   - `docs/design/[카테고리]/[기능명]/phase3_validation.md`
   - `docs/design/[카테고리]/[기능명]/plan.md`
   - `docs/design/[카테고리]/[기능명]/HANDOFF.md` (존재 시)

2. **섹션별 매핑 규칙에 따라 design 문서 업데이트**

   | 소스 | 대상 섹션 | 매핑 내용 |
   |------|-----------|-----------|
   | phase1 요구사항 | 섹션 3 확정된 요구사항 | 최종 상태 반영 (이미 반영된 경우 스킵) |
   | phase2 Q&A 결정 | 섹션 6 기술 결정 | 주요 결정 사항 추가 |
   | phase3 TD 검토 | 섹션 8 기술 가이드라인 | TD 가이드라인 보강 |
   | plan 구현 전략 | 섹션 4 설계 개요 | 실제 구현 아키텍처로 보강 |
   | plan 설계 변경 | 섹션 6 기술 결정 | 구현 중 변경된 결정 추가 |
   | 실제 구현 결과 | 섹션 9 구현 결과 | 설계 대비 일탈 사항 기록 |

3. **프론트매터 업데이트**
   - `status: ready-for-plan` → `status: complete`
   - `last-updated: [오늘 날짜]`

4. **변경 이력(섹션 10) 추가**
   ```
   | [날짜] | 개발 완료 — 문서 통합 | 전체 | 완료 |
   ```

5. **사용자 리뷰**
   ```
   📋 문서 통합 결과:

   업데이트된 섹션:
   - 섹션 3: 요구사항 [N]건 최종 확인
   - 섹션 4: 구현 아키텍처 반영
   - 섹션 6: 기술 결정 [N]건 추가
   - 섹션 8: 가이드라인 보강
   - 섹션 9: 구현 결과 및 일탈 사항 작성
   - 섹션 10: 변경 이력 추가

   확인 후 _archive/ 이동을 진행합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **사용자 승인 후 _archive/ 이동**
   ```bash
   mkdir -p docs/design/[카테고리]/[기능명]/_archive
   mv phase1_exploration.md _archive/
   mv phase2_discovery.md _archive/
   mv phase3_validation.md _archive/
   mv plan.md _archive/
   mv HANDOFF.md _archive/  # 존재 시
   ```

### 최종 상태

```
docs/design/[카테고리]/[기능명]/
├── [기능명].md              ← 자기완결적 최종 문서
└── _archive/
    ├── phase1_exploration.md
    ├── phase2_discovery.md
    ├── phase3_validation.md
    ├── plan.md
    └── HANDOFF.md
```

---

## Mode 2: consolidate-issue

이슈(hotfix) 완료 후 이슈 내용을 부모 design 문서에 통합한다.

### 실행 절차

1. **이슈 설계 문서 읽기**
   - `docs/design/[카테고리]/[기능명]/issues/[문제명]/[문제명].md`

2. **부모 design 문서에 자연스럽게 통합**

   통합 원칙: **"원래 하나였던 것처럼"** — 참조 링크가 아닌 직접 병합

   | 이슈 내용 | 부모 대상 섹션 | 병합 방식 |
   |-----------|---------------|-----------|
   | 변경된 요구사항 | 섹션 3 | 기존 REQ 업데이트 또는 신규 REQ 추가 |
   | 새 기술 결정 | 섹션 6 | 행 추가 |
   | 변경된 설계 | 섹션 4 | 해당 부분 갱신 |
   | 새 가이드라인 | 섹션 8 | 항목 추가 |
   | 새 의존성 | 섹션 5 | 행 추가 |
   | 새 제약조건 | 섹션 7 | 항목 추가 |

3. **변경 이력(섹션 10) 추가**
   ```
   | [날짜] | [문제명] 이슈 해결 — 설계 통합 | [영향 범위] | 완료 |
   ```

4. **프론트매터 업데이트**
   - `last-updated: [오늘 날짜]`

5. **사용자 리뷰**
   ```
   📋 이슈 통합 결과:

   이슈: [문제명]
   업데이트된 섹션:
   - [변경된 섹션 목록]

   확인 후 issues/[문제명]/ 디렉토리를 삭제합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **사용자 승인 후 이슈 디렉토리 삭제**
   ```bash
   rm -rf docs/design/[카테고리]/[기능명]/issues/[문제명]/
   ```
   issues/ 디렉토리가 비어있으면 issues/ 디렉토리도 삭제한다.

---

## 주의 사항

- 두 모드 모두 반자동이다 — 자동 병합 후 반드시 사용자 리뷰를 거친다
- 병합 결과가 부자연스러우면 사용자가 직접 수정할 수 있도록 안내한다
- 통합 실행 전 대상 파일이 존재하는지 확인한다
- _archive/ 이동 또는 issues/ 삭제는 사용자 승인 후에만 실행한다
```

### Step 3: 검증

- 스킬 파일이 유효한 마크다운인지 확인
- 두 모드의 절차가 누락 없이 정의되어 있는지 확인

### Step 4: 커밋

```bash
git add skills/document-consolidation/SKILL.md
git commit -m "feat: document-consolidation 신규 스킬 추가 (main/issue 통합)"
```

---

## Task 6: plugin.json 버전 업데이트

**Files:**
- Modify: `.claude-plugin/plugin.json`

### Step 1: 버전 업데이트

`version`을 `1.0.0` → `1.1.0`으로 변경한다 (마이너 기능 추가).

```json
{
  "name": "dev-workflow",
  "description": "Structured development workflow: Brainstorming → Plan → Develop → Review with persona-based feedback loops",
  "version": "1.1.0",
  "author": {
    "name": "sangteak"
  },
  "homepage": "https://github.com/sangteak/dev-workflow",
  "repository": "https://github.com/sangteak/dev-workflow",
  "license": "MIT",
  "keywords": ["workflow", "brainstorming", "planning", "persona", "gamedev", "unreal", "document-management"]
}
```

### Step 2: 커밋

```bash
git add .claude-plugin/plugin.json
git commit -m "chore: bump version to 1.1.0 (document management policy)"
```

---

## 구현 순서 요약

| 순서 | Task | 스킬 | 난이도 | 의존성 |
|------|------|------|--------|--------|
| 1 | brainstorming 수정 | brainstorming | 높음 | 없음 |
| 2 | plan-stage 수정 | plan-stage | 낮음 | 없음 |
| 3 | context-handling 수정 | context-handling | 높음 | 없음 |
| 4 | workflow-orchestrator 수정 | workflow-orchestrator | 중간 | Task 3 |
| 5 | document-consolidation 생성 | document-consolidation | 중간 | 없음 |
| 6 | plugin.json 업데이트 | 설정 | 낮음 | 전체 완료 후 |

**병렬 가능:** Task 1, 2, 3, 5는 독립적으로 병렬 실행 가능.
**순차 필수:** Task 4는 Task 3 이후. Task 6은 전체 완료 후.
