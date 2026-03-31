---
feature: quick-start-restructure
category: dev-workflow
parent-feature: readme-redesign
status: ready-for-plan
created: 2026-03-31
last-updated: 2026-03-31
is-issue: true
---

# Quick Start 재설계 — 이슈 설계 문서

> 한 줄 요약: 실제 대화 흐름을 보여주는 Quick Start로 dev-workflow 사용법을 직관적으로 전달한다

## 1. 배경과 동기

현재 README의 Quick Start는 사용자 입력 이후 흐름이 마치 자동 진행처럼 보이는 서술 구조다.
실제 대화 흐름이 누락되어 있어, BRAINSTORM → PLAN → DEVELOP 단계가 어떻게 이어지는지 독자가 경험할 수 없다.
특히 브레인스토밍에서 페르소나가 개입하여 빈틈을 찾고 해결하는 핵심 가치가 전혀 드러나지 않는다.

## 2. 목표와 비목표

### 목표
- GOAL-001: 독자가 Quick Start만 읽고 첫 번째 프롬프트를 어떻게 입력해야 하는지 알 수 있다
- GOAL-002: BRAINSTORM 대화에서 예외/빈틈 발견 → 해결 흐름이 명확히 드러난다
- GOAL-003: 세션 시작부터 PLAN 완료까지 실제 대화 흐름을 1회 완결 형태로 보여준다

### 비목표
- dev-workflow의 가치 증명 또는 설득 (사용법 전달이 목적)
- DEVELOP / REVIEW 단계 상세 설명
- 단계 구조를 명시적으로 레이블링하거나 교육하는 것

## 3. 확정된 요구사항

- REQ-001: 예시 도메인은 "알림/푸시 기능 추가" — 우선순위: HIGH
- REQ-002: 실제 dev-workflow 출력 포맷을 정확히 재현 (임의 창작 금지) — 우선순위: HIGH
- REQ-003: 섹션 구성: `### BRAINSTORM` / `### PLAN` 서브섹션 — 우선순위: HIGH
- REQ-004: 세션 시작 전체 흐름 포함 (자동 감지 → 페르소나 확정 → 대화) — 우선순위: HIGH
- REQ-005: BRAINSTORM Q&A 교환은 자연스럽게 끊길 때까지 (횟수 제한 없음) — 우선순위: MEDIUM
- REQ-006: PLAN은 plan.md 생성 완료까지 보여주되, 내용 전체가 아닌 "생성 완료 알림 + 경로" — 우선순위: MEDIUM
- REQ-007: Quick Start 마지막에 "→ 전체 워크플로우 보기" 링크 — 우선순위: HIGH

## 4. 설계 개요

### Quick Start 섹션 구조

```
## Quick Start

### BRAINSTORM
[세션 시작 자동 감지 출력 — workflow-orchestrator 실제 포맷 재현]
[페르소나 확정 출력]

**사용자:** [알림 기능 추가 구체적 요구사항 포함 첫 메시지]

[페르소나 피드백 루프 — 빈틈 발견 → 해결 과정 포함, 자연스럽게 완결]

### PLAN
[Feasibility Assessment 출력]
[→ plan.md 생성 완료: docs/design/.../plan.md]

---
> 전체 워크플로우 (DEVELOP → REVIEW → COMPLETION)는 [여기](#workflow)를 참조하세요.
```

### 핵심 설계 원칙

1. **대화 자체가 단계를 드러냄** — 별도 단계 설명 텍스트 불필요
2. **실제 출력 포맷 재현** — brainstorming 스킬 출력 형식 그대로 사용
3. **완결된 흐름** — BRAINSTORM과 PLAN 각각이 시작과 끝이 있는 하나의 흐름

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| README Quick Start | workflow-orchestrator 출력 포맷 | README.md |
| README Quick Start | brainstorming 스킬 출력 포맷 | README.md |
| README Quick Start | plan-stage 스킬 출력 포맷 | README.md |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 섹션 구성 | 서브섹션 방식 | 단계가 명확히 구분됨 | 도입 없이 바로 대화, 한 줄 도입 + 대화 | 구분이 덜 명확 |
| 예시 도메인 | 알림/푸시 기능 추가 | 범용 신규 기능 개발 경험 | 인벤토리 시스템, 메타 예시, 할 일 앱 | 게임 특화/혼란/너무 단순 |
| DEVELOP 처리 | Quick Start에서 제거 + 링크 | 시선 이탈 방지 | 태스크 진행 예시 한 줄 포함 | 불필요한 범위 확장 |
| 시작점 | 세션 시작 전체 | 설치 후 첫 경험 정확히 전달 | 사용자 첫 메시지부터, 페르소나 확정부터 | 흐름 누락 |

## 7. 제약조건과 가정

- 실제 workflow-orchestrator, brainstorming, plan-stage 스킬의 출력 포맷이 Quick Start 작성 시점에 안정화되어 있다고 가정
- README 독자는 dev-workflow를 설치 완료한 상태로 Quick Start를 읽는다고 가정

## 8. 기술 가이드라인

- README 작성 시 실제 스킬 파일 출력 포맷을 직접 참조하여 재현한다
- plan.md 내용 전체를 Quick Start에 포함하지 않는다 — 생성 완료 알림 + 경로만
- Ouroboros Enhanced Mode 출력(`🔗 Ouroboros 연동: Enhanced Mode`)은 포함한다

## 9. 구현 결과 및 일탈 사항

> 구현 완료 후 작성

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-31 | 초안 작성 | README.md Quick Start 섹션 | ready-for-plan |
