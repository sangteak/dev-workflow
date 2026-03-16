---
feature: completion-sequence
category: dev-workflow
status: complete
created: 2026-03-16
last-updated: 2026-03-16
implemented: 2026-03-16
dependencies:
  - workflow-orchestrator
  - document-consolidation
affects:
  - workflow-orchestrator (종료 프로토콜 추가)
  - DEVELOP 단계 Superpowers 위임 (컨텍스트 주입 변경)
---

# completion-sequence 설계 문서

> 한 줄 요약: DEVELOP 완료 후 문서 취합 → README 업데이트 → 커밋+푸시의 마무리 시퀀스를 강제하여, 문서 취합이 스킵되는 문제를 해결한다.

## 1. 배경과 동기
- DEVELOP/REVIEW 완료 후 Superpowers가 커밋을 먼저 제안하여 문서 취합(document-consolidation)이 스킵되는 문제 발생
- 사용자가 매번 "마무리하고 커밋하자"라고 수동으로 개입해야 하는 마찰 존재
- 마무리 순서가 강제되지 않아 일관성 없는 워크플로우 종료

## 2. 목표와 비목표
### 목표
- GOAL-001: 마무리 시퀀스(문서 취합 → README → 커밋)의 순서를 강제한다
- GOAL-002: 사용자의 마무리 선언 한 마디로 시퀀스가 자동 진행된다
- GOAL-003: Superpowers의 조기 커밋 제안을 억제한다
### 비목표
- 자동 마무리 감지 (테스트 완료 자동 판단 등) — 프로젝트마다 사용자 확인 필요
- CHANGELOG 업데이트, 버전 범프 — 마무리 시퀀스에 포함하지 않음
- Superpowers 내부 동작 수정 — 컨텍스트 주입으로만 제어

## 3. 확정된 요구사항
- REQ-001: 사용자가 자연어로 마무리를 선언하면 시퀀스가 시작된다 — 우선순위: HIGH
- REQ-002: DEVELOP 진입 시 Superpowers에 "태스크 완료 후 커밋 제안 금지, 완료 보고만" 컨텍스트를 주입한다 — 우선순위: HIGH
- REQ-003: 마무리 시퀀스는 문서 취합 → README 업데이트 확인 → 커밋+푸시 제안 순서로 실행된다 — 우선순위: HIGH
- REQ-004: README.md 업데이트는 변경 내용이 README에 영향을 주는 경우에만 실행하며, Claude가 판단 후 사용자에게 확인한다 — 우선순위: MEDIUM
- REQ-005: 시퀀스 중 실패 발생 시 해당 지점에서 중단하고 사용자에게 알린다 (커밋 차단) — 우선순위: HIGH

## 4. 설계 개요

### 마무리 시퀀스 흐름
```
Superpowers 태스크 완료 (커밋 제안 없이 완료 보고만)
  ↓
사용자 마무리 선언 감지 ("마무리", "wrap up", "완료", "finish" 등)
  ↓
Step 1: 문서 취합 — invoke document-consolidation (consolidate-main)
  ├─ 성공 → Step 2
  └─ 실패 → 중단, 사용자에게 알림
  ↓
Step 2: README 영향 판단
  ├─ 영향 있음 → 사용자 확인 후 업데이트
  ├─ 영향 없음 → 스킵
  └─ 실패 → 중단, 사용자에게 알림
  ↓
Step 3: 커밋+푸시 제안
  └─ 사용자 확인 후 실행
```

### 오케스트레이터 역할 확장
- 기존: 세션 시작 프로토콜 (시작 → 단계 감지)
- 변경: 워크플로우 라이프사이클 관리 (시작 → 단계 감지 → **종료 프로토콜**)
- 오케스트레이터는 흐름 제어만, 실행은 기존 스킬에 위임

### Superpowers 컨텍스트 주입
- 적용 대상: DEVELOP 단계 진입 시 `subagent-driven-development` 호출
- 주입 규칙: "모든 태스크 완료 후 커밋을 제안하지 않는다. 완료 보고만 한다. 마무리 시퀀스는 오케스트레이터가 관리한다."
- 패턴: no-git-mode 컨텍스트 주입과 동일한 방식

### 자연어 감지 키워드
- 한국어: "마무리", "마무리해줘", "완료", "정리해줘", "끝내자"
- 영어: "wrap up", "finish", "finalize", "done"

## 5. 의존성 맵
| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| workflow-orchestrator | document-consolidation | DEVELOP 단계 Superpowers 위임 |
| 마무리 시퀀스 | document-consolidation 스킬 | 커밋 타이밍 |
| 컨텍스트 주입 | Superpowers subagent-driven-development | 태스크 완료 후 동작 |

## 6. 기술 결정 및 대안 검토
| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 마무리 시퀀스 제어 위치 | workflow-orchestrator | 세션 시작 프로토콜과 대칭, 중앙 관리 | 별도 스킬 신설 | 호출 체인 복잡화, 역할 분산 |
| 커밋 제안 억제 방식 | 컨텍스트 주입 | no-git-mode에서 검증된 패턴 | Superpowers 직접 수정 | 외부 플러그인이므로 수정 불가 |
| 마무리 트리거 | 자연어 감지 | 사용자 자연스러운 흐름 유지 | 명시적 명령어 | 추후 추가 가능, 초기에는 자연어로 충분 |
| README 업데이트 판단 | Claude 자동 판단 + 사용자 확인 | 불필요한 업데이트 방지 | 항상 실행 | README에 무관한 변경 시 불필요 |

## 7. 제약조건과 가정
- Superpowers 컨텍스트 주입은 텍스트 기반 지시이므로 100% 제어 보장 불가 (리스크 수용)
- document-consolidation 스킬이 정상 동작한다고 가정
- README.md가 프로젝트 루트에 존재한다고 가정 (없으면 Step 2 스킵)

## 8. 기술 가이드라인
- 오케스트레이터에 "Completion Protocol" 섹션을 추가하되, 기존 "Session Start Protocol"과 동일한 수준의 구조 유지
- 마무리 시퀀스 각 단계는 성공/실패를 명시적으로 판단
- 컨텍스트 주입은 git-mode/no-git-mode 공통 적용 (두 모드 모두 커밋 제안 억제)
- 자연어 감지 키워드는 오케스트레이터 스킬 내에 목록으로 관리

## 9. 구현 결과 및 일탈 사항
- 계획대로 `workflow-orchestrator/SKILL.md` 단일 파일 수정으로 구현 완료
- DEVELOP 섹션에 공통 컨텍스트 주입 블록 추가 (git-mode/no-git-mode 분기 이전)
- Completion Protocol 섹션 신설 (Superpowers Delegation과 Output Format Rules 사이)
- Delegation 테이블에 COMPLETION 행 및 위임 규칙 추가
- description 메타데이터에 Completion 라이프사이클 반영
- 설계 대비 일탈 사항 없음

## 10. 변경 이력
| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-16 | 초기 설계 문서 작성 | workflow-orchestrator, DEVELOP 단계 | ready-for-plan |
| 2026-03-16 | 개발 완료 — 문서 통합 | 전체 | 완료 |
