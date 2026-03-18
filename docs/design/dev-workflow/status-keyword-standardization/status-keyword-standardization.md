---
feature: status-keyword-standardization
category: dev-workflow
status: complete
created: 2026-03-18
last-updated: 2026-03-18
dependencies:
  - design-doc-index
  - design-summary
  - document-consolidation
affects:
  - design-doc-index
  - design-summary
  - document-consolidation
---

# status-keyword-standardization 설계 문서

> 한 줄 요약: 설계 문서 프론트매터의 `status` 값 불일치를 해소하고, 인덱싱 내결함성을 확보한다.

## 1. 배경과 동기

- 설계 문서 프론트매터의 `status` 필드에 `complete`와 `completed`가 혼용되고 있다
- `design-doc-index`, `design-summary` 스킬은 `status: complete`만 필터링하므로, `completed`로 표기된 문서가 인덱싱에서 누락된다
- 현재 8개 완료 문서 중 2개(`input-interaction-consistency`, `persona-feedback-loop`)가 누락 상태
- 근본 원인: `input-interaction-consistency/plan.md`가 최종 상태를 `completed`로 명시했고, Claude가 `document-consolidation` 스킬의 `complete` 지시보다 plan의 값을 우선 적용함

## 2. 목표와 비목표

### 목표
- GOAL-001: 정규 상태값을 정의하고 쓰기 시점에서 통일한다
- GOAL-002: 읽기 시점에서 변형값을 방어적으로 수용하고 자동 수정한다
- GOAL-003: 기존 불일치 문서를 정규값으로 수정한다

### 비목표
- `status` 외 프론트매터 필드의 불일치 검증 — 불필요
- 중간 상태 도입(`in-progress`, `in-development`, `archived`) — phase 파일이 진행 추적을 대체
- Superpowers `writing-plans` 스킬 수정 — 소관 외

## 3. 확정된 요구사항

- REQ-001: 정규 상태값을 `ready-for-plan`, `complete` 2개로 확정한다 — 우선순위: HIGH
- REQ-002: `document-consolidation` 스킬에 "plan.md 등 다른 소스에 명시된 값에 관계없이 반드시 `complete`를 사용한다"는 우선순위 규칙을 추가한다 — 우선순위: HIGH
- REQ-003: `design-doc-index`, `design-summary` 스킬에 상태 정규화 전처리 단계를 추가한다. `completed` → `complete` 자동 수정 후 기존 필터링 로직 실행 — 우선순위: HIGH
- REQ-004: 기존 불일치 문서 2개의 프론트매터를 `complete`로 수정한다 — 우선순위: HIGH

## 4. 설계 개요

### 상태 라이프사이클 (2단계)

```
ready-for-plan (브레인스토밍 완료) → complete (개발+리뷰+문서통합 완료)
```

중간 상태 불필요 — phase 파일(`phase1`, `phase2`, `phase3`, `plan.md`)이 진행 추적 역할을 대체한다.

### 쓰기 쪽 (document-consolidation)

`document-consolidation` 스킬의 프론트매터 업데이트 규칙에 우선순위 규칙을 추가한다:
- 기존: `status: ready-for-plan → status: complete`
- 추가: plan.md 등 다른 소스에 명시된 값에 관계없이, 프론트매터 status는 반드시 정규값 `complete`를 사용한다

### 읽기 쪽 (design-doc-index, design-summary)

인덱싱 본 로직 전에 **상태 정규화 전처리** 단계를 분리한다:

```
[전처리] 대상 문서의 프론트매터를 순회:
  1. status 값을 읽는다
  2. `complete` → 변경 없음
  3. `completed` → 해당 파일의 프론트매터를 `complete`로 수정
  4. 그 외 값 또는 status 없음 → 스킵

[본 로직] 기존 `status: complete` 필터링 그대로 실행
```

- 전처리와 본 로직을 분리하여 기존 필터링 로직 불변
- 허용 변형: `completed` (1개만). 한국어(`완료`) 제외 — 시스템이 쓰는 메타데이터에 한국어 값이 들어갈 가능성 없음

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| design-doc-index | 설계 문서 프론트매터 | 브레인스토밍/플랜 단계 문서 참조 |
| design-summary | 설계 문서 프론트매터 | 설계 요약 생성 |
| document-consolidation | phase/plan 파일 | 설계 문서 프론트매터 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 자동 수정 위치 | 인덱싱 전 전처리 | 기존 로직 불변, Claude 이행률 향상 | 필터링 중 인라인 수정 | 부수 효과 스킵 리스크, 흐름 복잡화 |
| 허용 변형 범위 | `completed`만 | 시스템 메타데이터에 한국어 불필요 | `completed` + `완료` | 과도한 관용, 관행 유발 우려 |
| 상태 라이프사이클 | 2단계 유지 | phase 파일이 진행 추적 대체 | 3단계(`in-development` 추가) | 중복, 불필요한 복잡성 |
| 비정규값 처리 | 자동 수정(silent fix) | 사용자 개입 불필요 | 경고 후 수정 제안 | 불필요한 노이즈 |

## 7. 제약조건과 가정

- Markdown 스킬은 코드처럼 함수를 공유할 수 없으므로, 전처리 절차를 `design-doc-index`와 `design-summary` 양쪽에 동일하게 명시한다
- `writing-plans`는 Superpowers 소관이므로 plan.md에서 비정규 상태값이 사용될 가능성은 잔존한다. 쓰기 쪽 우선순위 규칙으로 방어한다
- 자동 수정은 Claude의 지시 이행에 의존하므로, 절차를 단계별로 명확히 작성해야 한다

## 8. 기술 가이드라인

- 정규 상태값: `ready-for-plan`, `complete` — 이 2개만 사용한다
- `document-consolidation` 실행 시 plan.md의 상태값에 관계없이 `complete`를 쓴다
- 전처리 절차는 양쪽 스킬에 동일한 표현으로 작성하여 유지보수 시 불일치를 방지한다
- 허용 변형 목록은 정규식이 아닌 명시적 나열로 작성한다

## 9. 구현 결과 및 일탈 사항

- 설계 대비 일탈 없음. 모든 REQ가 설계 그대로 구현됨
- REQ-004: `input-interaction-consistency.md`, `persona-feedback-loop.md` 프론트매터 `status: completed` → `complete` 수정 완료
- REQ-002: `document-consolidation/SKILL.md` Step 3에 정규값 우선순위 규칙 추가 완료
- REQ-003: `design-doc-index/SKILL.md`, `design-summary/SKILL.md`에 "상태 정규화 전처리" 섹션 추가 완료. 양쪽 동일 표현 사용
- 버전 범프: `1.3.2` → `1.3.3` (patch)

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-18 | 설계 문서 초안 작성 | 전체 | 초안 |
| 2026-03-18 | 개발 완료 — 문서 통합 | 전체 | 완료 |
