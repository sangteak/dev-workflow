---
feature: input-interaction-consistency
category: dev-workflow
status: completed
created: 2026-03-17
last-updated: 2026-03-17
dependencies: []
affects:
  - workflow-orchestrator
  - brainstorming
  - persona-resolution
  - context-handling
  - plan-stage
  - design-doc-index
  - design-summary
  - document-consolidation
---

# input-interaction-consistency 설계 문서

> 한 줄 요약: dev-workflow 플러그인의 사용자 입력 형식을 텍스트 기반 번호 목록으로 통일하여 환경/세션 무관 일관된 경험을 보장한다.

## 1. 배경과 동기

- dev-workflow 플러그인에서 사용자 입력을 받는 36개 지점이 4가지 서로 다른 패턴(Yes/No 텍스트, 번호/문자 선택, 자유 텍스트, AskUserQuestion 도구)으로 혼재
- 스킬 문서에 "무엇을 물어볼지"만 정의되어 있고, "어떤 도구/형식으로 물어볼지"는 미지정
- Claude가 비결정적으로 AskUserQuestion 도구 사용 여부를 결정하여 동일 사용자가 데스크톱과 노트북에서 다른 경험을 하는 문제 발생
- 팀 배포 시 팀원들이 입력 방식 불일관으로 초반에 혼란을 겪음

## 2. 목표와 비목표

### 목표
- GOAL-001: 모든 스킬에서 사용자 입력 형식을 하나의 표준으로 통일
- GOAL-002: 환경/세션/디바이스에 무관하게 동일한 입력 경험 보장
- GOAL-003: 스킬 문서에 입력 형식을 명시하여 Claude의 재량 여지를 제거

### 비목표
- 사용자의 입력 방식 강제 — 규칙은 Claude의 출력 형식에만 적용되며, 사용자는 번호 또는 자연어로 자유롭게 응답 가능
- 새로운 스킬 생성 — 기존 orchestrator에 규칙을 추가하고 기존 스킬을 수정하는 것으로 충분

## 3. 확정된 요구사항

- REQ-001: AskUserQuestion 도구를 사용하지 않는다 — 우선순위: HIGH
- REQ-002: 모든 닫힌 선택(선택지가 있는 질문)은 텍스트 기반 번호 목록 형식으로 제시한다 — 우선순위: HIGH
- REQ-003: Yes/No 질문도 번호 목록으로 통일한다 (`1. Yes  2. No`) — 우선순위: HIGH
- REQ-004: 열린 입력(자유 텍스트)은 번호 없이 예시 안내 형식으로 제시한다 — 우선순위: HIGH
- REQ-005: 닫힌 선택에서 직접 입력이 필요한 경우 0번을 "직접 입력" 예약 번호로 사용한다 — 우선순위: MEDIUM
- REQ-006: 문자 선택(A/B/C/D), 슬래시 구분(Yes / No), 괄호 안 선택지 나열을 금지한다 — 우선순위: HIGH
- REQ-007: 사용자가 번호 또는 자연어로 응답할 수 있다. 의미가 모호한 경우에만 재확인한다 — 우선순위: MEDIUM
- REQ-008: workflow-orchestrator에 Input Format Rules 섹션을 추가한다 — 우선순위: HIGH
- REQ-009: 9개 스킬의 기존 프롬프트 텍스트를 새 형식으로 일괄 수정한다 — 우선순위: HIGH

## 4. 설계 개요

### 입력 형식 표준

**■ 닫힌 선택 (선택지가 있는 질문)**
```
[질문 텍스트]

1. 선택지A
2. 선택지B
3. 선택지C
0. 직접 입력          ← 자유 입력 탈출구 필요 시만 추가
```

**■ Yes/No 질문**
```
[질문 텍스트]

1. Yes
2. No
```

**■ 열린 입력 (선택지 없는 자유 텍스트)**
```
[질문 텍스트]
> 예: "[예시 입력]"
```

### 규칙 적용 범위
- **규칙 대상:** Claude의 출력 형식 (질문 제시 방식)
- **규칙 비대상:** 사용자의 입력 방식 (번호, 자연어 모두 수용)
- **관용 모드:** 사용자가 "1", "응", "Yes", "ㅇㅇ", "첫번째" 등으로 답해도 의미가 명확하면 수용

### 적용 구조
```
workflow-orchestrator (SKILL.md)
├── CRITICAL 섹션: AskUserQuestion 도구 사용 금지
├── Input Format Rules 섹션: 입력 형식 표준 정의
└── Output Format Rules 섹션: (기존)

각 스킬 (SKILL.md)
└── 기존 프롬프트 텍스트 → 새 형식으로 교체
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| workflow-orchestrator | — | 모든 스킬 (규칙 참조) |
| brainstorming | workflow-orchestrator | — |
| persona-resolution | workflow-orchestrator | — |
| context-handling | workflow-orchestrator | — |
| plan-stage | workflow-orchestrator | — |
| design-doc-index | workflow-orchestrator | — |
| design-summary | workflow-orchestrator | — |
| document-consolidation | workflow-orchestrator | — |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 입력 도구 | 텍스트 기반 번호 목록 | 환경 의존성 제로, 선택지 개수 제한 없음, 채팅 흐름 유지 | AskUserQuestion 통일 | 2~4개 선택지 제한으로 모든 상황 적용 불가 |
| | | | AskUserQuestion-first 하이브리드 | 여전히 두 방식 혼재, 사용자 예측 불가 |
| Yes/No 처리 | 번호화 (1.Yes / 2.No) | 단일 멘탈 모델 형성 | 별도 텍스트 형식 "(Yes / No)" | 또 다른 패턴 발생, 불일관의 원인 |
| 자연어 응답 | 관용 모드 (수용) | Claude는 자연어 해석에 능숙, 사용자 입력 제한 불필요 | 엄격 모드 (번호만) | 사용 경험 저하, 자연스러운 채팅 흐름 방해 |
| 직접 입력 탈출구 | 0번 예약 | 닫힌 선택에서 열린 입력으로의 일관된 탈출구 | 마지막 선택지로 추가 | 위치가 매번 달라져 비일관 |
| 규칙 위치 | workflow-orchestrator 확장 | 모든 세션에서 로드, 별도 스킬 불필요 | 새 스킬 생성 | 과잉 — 규칙 분량 10~15줄 |
| | | | 각 스킬에 개별 명시 | 9곳 중복, 수정 시 전체 변경 필요 |

## 7. 제약조건과 가정

- Claude는 확률적 모델이므로 AskUserQuestion 금지를 100% 보장할 수 없으나, 명시적 금지 시 대부분 준수
- 규칙을 orchestrator CRITICAL 섹션에 배치하여 우선순위를 최대로 높임
- 각 스킬의 프롬프트 예시를 새 형식으로 완전 교체해야 구 형식 참조가 제거됨
- 0번의 "직접 입력" 의미는 이 플러그인 내 관례이며, 일반적 "종료/취소"와 다를 수 있음

## 8. 기술 가이드라인

- AskUserQuestion 금지를 orchestrator CRITICAL 섹션에 "~하지 않는다" 서술형으로 기재
- 각 스킬 파일의 기존 프롬프트 예시를 새 형식으로 완전 교체
- "사용자가 번호 또는 자연어로 응답할 수 있다. 의미가 모호한 경우에만 재확인한다" 명시
- 수정 시 기존 의미/맥락을 훼손하지 않도록 변환 전후 비교 검증 수행

## 9. 구현 결과 및 일탈 사항

> 구현 완료 후 작성

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-17 | 초안 작성 | 전체 | ready-for-plan |
