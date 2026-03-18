---
feature: issue-handoff-scope
category: dev-workflow
status: complete
created: 2026-03-18
last-updated: 2026-03-18
dependencies:
  - context-handling
affects:
  - context-handling
---

# issue-handoff-scope 설계 문서

> 한 줄 요약: 이슈 서브워크플로우에서 HANDOFF 저장 시 부모 Feature의 HANDOFF까지 수정되는 문제를 격리 규칙으로 해결한다.

## 1. 배경과 동기

- Feature 개발 중 이슈를 생성하여 issues/ 서브워크플로우에 진입한 상태에서, 컨텍스트 보존을 위해 "HANDOFF 저장해줘"를 요청하면 이슈의 HANDOFF.md뿐만 아니라 부모 Feature의 HANDOFF.md까지 수정되고 있다
- 부모 HANDOFF에 이슈 진행 내용이 섞여 들어가면서 맥락 경계가 무너짐
- 원인: context-handling 스킬에 이슈 HANDOFF 저장 시 부모 HANDOFF에 대한 명시적 격리 규칙이 없어 Claude가 "더 많이 저장하는 게 안전하다"고 넓게 해석

## 2. 목표와 비목표

### 목표
- GOAL-001: 이슈 HANDOFF 저장 시 부모 HANDOFF를 수정하거나 새로 생성하지 않도록 격리 규칙을 추가한다
- GOAL-002: 중간 결정 사항 업데이트 시에도 현재 작업 위치의 HANDOFF만 대상으로 한정한다

### 비목표
- issues/ 서브워크플로우 로직의 스킬 배치 재검토 (brainstorming에서 분리 여부) — 별도 기능으로 추후 논의
- 이슈 생성 시 부모 HANDOFF 자동 저장 — DEVELOP 상태는 기존 산출물(plan.md, git, TodoWrite)로 복구 가능하므로 불필요

## 3. 확정된 요구사항

- REQ-001: issues/ 서브워크플로우에서 HANDOFF 생성·업데이트 시 부모 Feature의 HANDOFF.md를 수정하거나 새로 생성하지 않는다 — 우선순위: HIGH
- REQ-002: "중간 결정 사항 업데이트" 시 현재 작업 위치의 HANDOFF.md만 대상으로 한정한다 — 우선순위: HIGH

## 4. 설계 개요

- context-handling 스킬(HANDOFF 정책의 SSOT) 1개만 수정
- 수정 위치 2곳:
  1. "HANDOFF.md 생성 규칙" 섹션 — 경로 분기 직후에 격리 규칙 추가
  2. "중간 결정 사항 업데이트" 섹션 — 스코프 한정 보강
- 규칙 형식: 금지 규칙 + 근거 (각 2줄)
- 부모-이슈 관계 표시는 이슈 측 메타데이터(`is-issue`, `parent-feature`)와 세션 시작 목록 로직으로 이미 충분

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| context-handling | — | 이슈 HANDOFF 생성·업데이트 동작 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 격리 방식 | 명시적 금지 규칙 추가 | Claude는 명시적 단정 규칙을 잘 따름 | 시나리오별 가이드 | 해석 여지를 넓혀 오히려 역효과 |
| 수정 대상 | context-handling만 | HANDOFF 정책의 SSOT | brainstorming에도 추가 | DRY 위반, 정책 분산 |
| 이슈 생성 시 부모 HANDOFF 자동 저장 | 불필요 | DEVELOP 산출물로 복구 가능 | 자동 저장 | 오버엔지니어링, 이슈는 DEVELOP에서만 발생 |
| 부모 HANDOFF에 이슈 참조 기록 | 불필요 | is-issue + parent-feature 메타데이터로 충분 | 부모에 참조 한 줄 추가 | 중복 기록, 이슈 삭제 후 잔여 데이터 위험 |

## 7. 제약조건과 가정

- 코드 없는 문서 기반 플러그인이므로 Markdown 규칙 추가만으로 동작 변경 가능
- Claude가 명시적 금지 규칙을 근거와 함께 제시하면 해당 규칙을 준수한다는 가정
- 이슈 서브워크플로우는 DEVELOP 단계에서만 진입한다는 설계 전제

## 8. 기술 가이드라인

- 격리 규칙은 "HANDOFF.md 생성 규칙" 섹션의 경로 분기(`메인 워크플로우` / `issues/ 서브 워크플로우`) 직후에 배치
- 금지 규칙에는 반드시 근거를 함께 명시 (Claude의 자체 판단 방지)
- "중간 결정 사항 업데이트" 섹션의 "HANDOFF.md"를 "현재 작업 위치의 HANDOFF.md"로 한정

## 9. 구현 결과 및 일탈 사항

설계대로 구현 완료. 일탈 사항 없음.

- `skills/context-handling/SKILL.md` 74~76행: issues/ HANDOFF 부모 격리 규칙 추가
- `skills/context-handling/SKILL.md` 131행: 중간 업데이트 스코프 한정 ("현재 작업 위치의" 추가)

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-18 | 초안 작성 | context-handling 스킬 | ready-for-plan |
| 2026-03-18 | 개발 완료 — 문서 통합 | context-handling 스킬 | 완료 |
