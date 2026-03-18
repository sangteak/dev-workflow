# Implementation Plan: status-keyword-standardization

> 설계 문서: `docs/design/dev-workflow/status-keyword-standardization/status-keyword-standardization.md`
> 생성일: 2026-03-18

---

## Overview

설계 문서 프론트매터의 `status` 값 불일치를 해소하고, 쓰기 시점 강화 + 읽기 시점 방어를 구현한다.

## Tasks

### Task 1: 기존 불일치 문서 수정 (REQ-004)

**파일:**
- `docs/design/dev-workflow/input-interaction-consistency/input-interaction-consistency.md`
- `docs/design/dev-workflow/persona-feedback-loop/persona-feedback-loop.md`

**변경:**
- 프론트매터 `status: completed` → `status: complete`

**검증:**
- 전체 설계 문서에서 `status:` 값 일괄 확인 (모두 `complete` 또는 `ready-for-plan`이어야 함)

---

### Task 2: `document-consolidation` 쓰기 시 우선순위 규칙 추가 (REQ-002)

**파일:**
- `skills/document-consolidation/SKILL.md`

**변경:**
- Step 3(프론트매터 업데이트) 항목에 우선순위 규칙 추가:
  - "plan.md 등 다른 소스에 명시된 값에 관계없이, 프론트매터 status는 반드시 정규값 `complete`를 사용한다"
- 정규 상태값 정의 명시: `ready-for-plan`, `complete` (2개만)

**검증:**
- 변경 전후 스킬 파일 diff 확인
- 기존 consolidate-main / consolidate-issue 흐름에 영향 없음 확인

---

### Task 3: `design-doc-index` 상태 정규화 전처리 추가 (REQ-003)

**파일:**
- `skills/design-doc-index/SKILL.md`

**변경:**
- 기존 `status: complete` 필터링 로직 앞에 "상태 정규화 전처리" 섹션 추가:
  1. 대상 문서의 프론트매터 status 값을 읽는다
  2. `complete` → 변경 없음
  3. `completed` → 해당 파일의 프론트매터를 `complete`로 수정
  4. 그 외 값 또는 status 없음 → 스킵
- 기존 `status: complete` 필터링 로직은 변경하지 않음

**검증:**
- 전처리 절차가 기존 필터링 앞에 위치하는지 확인
- `design-summary` 스킬의 전처리와 동일한 표현인지 확인

---

### Task 4: `design-summary` 상태 정규화 전처리 추가 (REQ-003)

**파일:**
- `skills/design-summary/SKILL.md`

**변경:**
- `design-doc-index`와 동일한 전처리 절차 추가
- `status: complete` 필터링 앞에 배치

**검증:**
- `design-doc-index` 스킬의 전처리와 동일한 표현인지 확인

---

### Task 5: 버전 범프 (patch)

**파일:**
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

**변경:**
- 버전 patch 범프 (현재 버전 확인 후 +1)

**검증:**
- 두 파일의 버전이 동기화되어 있는지 확인

---

## Execution Order

```
Task 1 (데이터 정규화) → Task 2 (쓰기 강화) → Task 3, 4 (읽기 방어, 병렬 가능) → Task 5 (버전 범프)
```

## Out of Scope

- `input-interaction-consistency/plan.md`의 `in-development` 제안 정리 — 아카이브 대상이므로 별도 처리
- Superpowers `writing-plans` 스킬 수정 — 소관 외
- `status` 외 프론트매터 필드 검증
