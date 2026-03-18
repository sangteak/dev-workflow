# Phase 1: 탐색 (Exploration)

> 기능명: status-keyword-standardization
> 카테고리: dev-workflow
> 날짜: 2026-03-18
> 페르소나: 🛠️ Claude Code Expert / 🎯 Workflow Designer

---

## 탐색된 요구사항

### REQ-1: 상태 키워드 정규값 통일
- 설계 문서 프론트매터의 `status` 필드에 사용되는 값을 정규화한다
- 정규 상태값: `ready-for-plan`, `complete` (2단계 라이프사이클)
- 중간 상태(`in-progress`, `in-development` 등)는 불필요 — phase 파일이 진행 추적 역할을 대체

### REQ-2: 쓰기 시점 정규값 강제
- `document-consolidation` 스킬이 상태를 쓸 때 반드시 `complete`만 사용하도록 강조 보강
- 불일치 원인: Claude가 스킬 지시를 정확히 따르지 않아 `completed`를 쓴 케이스 존재
- 사용자는 `status`를 직접 쓰지 않음 — "마무리하자" 트리거만 발동

### REQ-3: 읽기 시점 방어적 수용 + 자동 수정
- `design-doc-index`, `design-summary` 스킬에서 변형값을 방어적으로 수용
- 허용 변형 목록: `complete`, `completed`, `완료`
- 비정규값 발견 시 자동 수정(silent fix): 해당 파일의 프론트매터를 `complete`로 정정 후 인덱싱 계속
- 자동 수정은 단계별 절차로 명시하여 Claude 이행 확률을 높임

### REQ-4: 기존 불일치 문서 수정
- `input-interaction-consistency.md`: `status: completed` → `status: complete`
- `persona-feedback-loop.md`: `status: completed` → `status: complete`

---

## 명시적으로 제외한 항목

- `status` 외 프론트매터 필드(`category`, `feature` 등)의 불일치 검증 — 불필요
- 중간 상태 도입(`in-progress`, `in-development`, `archived`) — phase 파일이 대체
- 경고 메시지 출력 방식 — 자동 수정(silent fix)으로 결정

---

## 페르소나 구성

- 🛠️ Claude Code Expert: 스킬 메커니즘 제약, 기술적 실현 가능성
- 🎯 Workflow Designer: 사용자 경험, 흐름 일관성

---

## 페르소나 피드백 요약

### 주제: 쓰기 vs 읽기 시점 해결
- **합의**: 쓰기 시점 정규값 강제 + 읽기 시점 제한적 변형 허용(명시적 목록 기반)

### 주제: 상태 라이프사이클 단계 수
- **합의**: `ready-for-plan → complete` 2단계 유지. 중간 상태 불필요.

### 주제: 비정규값 발견 시 처리 방식
- **합의**: 자동 수정(silent fix) + 단계별 절차 명시. 경고 출력 불필요.

### 주제: 변경 스코프
- **합의**: 3개 스킬(`design-doc-index`, `design-summary`, `document-consolidation`) + 2개 기존 문서 수정
