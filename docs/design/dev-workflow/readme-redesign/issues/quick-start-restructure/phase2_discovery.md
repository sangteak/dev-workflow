---
feature: quick-start-restructure
category: dev-workflow
parent: readme-redesign
phase: 2
created: 2026-03-31
---

# Phase 2: 발견 — Quick Start 재설계

## Phase 2에서 새로 발견된 미정의 영역

| 영역 | 질문 | 결정 |
|---|---|---|
| BRAINSTORM 깊이 | Q&A 교환 횟수 제한 | 자연스럽게 끊길 때까지 (횟수 제한 없음) |
| PLAN 깊이 | Feasibility만 vs plan.md 생성까지 | plan.md 생성 완료까지 |
| 섹션 구성 | 도입 방식 및 구분 | 안 C: BRAINSTORM / PLAN 서브섹션 |
| 시작점 | 사용자 첫 메시지 vs 세션 시작 전체 | 세션 시작 전체 (자동 감지 → 페르소나 확정 → 대화) |

## 확정된 Quick Start 구조

```
## Quick Start

### BRAINSTORM
[세션 시작 자동 감지 출력]
[페르소나 확정 출력]
[사용자 첫 메시지: 알림 기능 추가 요구사항 포함]
[페르소나 피드백 루프 — 자연스럽게 끊길 때까지]

### PLAN
[Feasibility Assessment 출력]
[plan.md 생성 완료 출력]

→ 전체 워크플로우 보기 (링크)
```

## 페르소나 피드백 결과

- BRAINSTORM 섹션: 페르소나 확정 출력 포함 합의
- 세션 전체 흐름 노출: 자동 감지 → 페르소나 → 대화 전체를 보여줌으로써
  "설치 후 첫 세션이 이렇게 흘러간다"를 직접 전달
- Quick Start 끝에 "→ 전체 워크플로우 보기" 링크로 DEVELOP/REVIEW 안내
