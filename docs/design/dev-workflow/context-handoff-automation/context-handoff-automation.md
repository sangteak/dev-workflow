---
feature: context-handoff-automation
category: dev-workflow
status: complete
created: 2026-03-19
last-updated: 2026-03-19
dependencies:
  - context-handling
affects:
  - context-handling
---

# context-handoff-automation 설계 문서

> 한 줄 요약: 컨텍스트 한계 도달 시 HANDOFF 저장/복구를 자연어 대신 slash command로 처리하여 세션 전환 마찰을 제거한다.

## 1. 배경과 동기

컨텍스트가 가득 찼을 때 세션을 이어가기 위해 사용자가 매번 3단계를 수동 자연어로 입력해야 하는 반복적 마찰이 존재한다:

1. "HANDOFF.md 작성해줘" (자연어 지시)
2. `/clear` (세션 초기화)
3. "HANDOFF.md 읽고 작업 복귀해줘" (자연어 지시)

기존 `context-handling` 스킬에 HANDOFF 생성/탐색 로직이 이미 구현되어 있으나, 이를 직접 트리거하는 명시적 명령이 없어 사용자가 자연어로 반복 지시하고 있었다.

또한 복구 측면에서, SessionStart hook을 통한 자동 복구가 이미 동작하고 있었으나 사용자가 이를 인지하지 못하고 있었다는 사실도 확인되었다.

## 2. 목표와 비목표

### 목표
- GOAL-001: 자연어 반복 입력을 slash command로 대체하여 세션 전환 마찰 제거
- GOAL-002: 기존 `context-handling` 스킬의 로직을 재사용하여 최소 변경으로 구현

### 비목표
- 컨텍스트 부족 자동 감지 및 선제적 HANDOFF 제안 (사용자가 직접 모니터링)
- `/clear` 자동화 (Claude Code CLI 내장 명령, 프로그래밍적 호출 불가)
- 새로운 스킬 생성 (기존 스킬 확장으로 해결)

## 3. 확정된 요구사항

- REQ-001: `save` 서브커맨드 — `/context-handling save`로 HANDOFF.md 생성 — 우선순위: HIGH
- REQ-002: `resume` 서브커맨드 — `/context-handling resume`으로 HANDOFF 탐색 및 복구 — 우선순위: HIGH
- REQ-003: 기존 트리거와 공존 — orchestrator invoke(args 없음), save, resume 3개 진입점 명확 구분 — 우선순위: HIGH
- REQ-004: `save` 완료 후 안내 메시지 — `/clear` 후 자동/수동 복구 경로 안내 — 우선순위: MEDIUM
- REQ-005: description 필드 업데이트 — 서브커맨드 반영하여 자동완성 시 용도 파악 가능 — 우선순위: MEDIUM

## 4. 설계 개요

### 구현 방식
기존 `context-handling/SKILL.md`에 서브커맨드 분기를 추가한다. `document-consolidation`의 `Mode 1/Mode 2` 패턴을 그대로 적용한다.

### 진입점 구조
```
진입점 1: orchestrator invoke (args 없음)
  → 기존 동작 유지: 세션 시작 시 작업 탐색/목록 제시

진입점 2: /context-handling save
  → HANDOFF.md 생성 (기존 "트리거 조건 B" 로직)
  → 완료 후 안내 메시지 출력

진입점 3: /context-handling resume
  → HANDOFF 탐색/목록 제시/복구 (기존 "작업 탐색 및 목록 제시" + "작업 복구 흐름" 로직)
```

### 복구 이중 경로
| 경로 | 사용자 행동 | 동작 |
|------|-----------|------|
| 자동 | `/clear` → 아무 메시지 입력 | orchestrator → context-handling 자동 탐색 |
| 수동 | `/clear` → `/context-handling resume` | 직접 HANDOFF 복구 트리거 |

### save 완료 후 안내 메시지
```
✅ HANDOFF 저장 완료: docs/design/[카테고리]/[기능명]/HANDOFF.md
/clear 후 아무 메시지를 입력하면 자동으로 작업 목록이 표시됩니다.
(또는 /context-handling resume 으로 직접 복구할 수 있습니다.)
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| context-handling SKILL.md | document-consolidation (Mode 패턴 참조) | 없음 (자체 확장) |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 명령 구조 | 서브커맨드 (`save`/`resume`) | 기존 스킬 확장, 스킬 수 유지 | 별도 스킬 2개 생성 | 기능이 2개뿐이라 과잉, context-handling과 로직 중복 |
| 명령 이름 | `save`/`resume` | save-저장, resume-재개로 직관적 | `save`/`restore`, `save`/`load` | resume이 "작업 재개" 뉘앙스에 가장 부합 |
| 자동 감지 | 구현하지 않음 | 사용자가 직접 모니터링 가능 | 컨텍스트 압축 시 자동 제안 | 플랫폼에 정확한 컨텍스트 사용량 API 없음 |
| hook 자동 복구 | 추가 개선 없음 | 이미 동작 중 확인됨 | hook에서 Claude 선제 발화 | 플랫폼 제약으로 불가 |

## 7. 제약조건과 가정

- Claude Code 스킬 시스템에서 args를 통한 분기는 Markdown 지시문 기반으로 동작 (정형 파서 없음)
- `/clear`는 Claude Code CLI 내장 명령으로 프로그래밍적 호출 불가
- SessionStart hook은 `additional_context` 주입만 가능, Claude 선제 발화 트리거 불가
- 플러그인은 전역 설치되어 모든 프로젝트에서 동작 (GW 프로젝트에서 확인됨)

## 8. 기술 가이드라인

- `context-handling/SKILL.md` 수정 시 기존 3개 주요 섹션(트리거 조건, HANDOFF 생성, 작업 탐색) 구조를 유지
- 서브커맨드 분기는 스킬 파일 상단에 모드 라우팅 섹션으로 추가 (`document-consolidation` 패턴)
- `resume`은 기존 "작업 탐색 및 목록 제시" 로직과 동일 → 로직 중복 없이 진입점만 추가
- description 필드에 서브커맨드 용법을 명시하여 자동완성 지원

## 9. 구현 결과 및 일탈 사항

### 구현 완료 항목
- `skills/context-handling/SKILL.md`: 모드 라우팅 섹션, Mode: save, Mode: resume 추가 (+58줄)
- `.claude-plugin/plugin.json`: 버전 1.3.4 → 1.3.5
- `.claude-plugin/marketplace.json`: 버전 1.3.4 → 1.3.5
- description 필드: 서브커맨드 정보 포함하도록 업데이트

### 설계 대비 일탈 사항
- Mode: save Step 1에 엣지 케이스 가드 추가 (Code Quality 리뷰 피드백): 작업 컨텍스트가 없는 상태에서 호출 시 안내 메시지 출력 후 종료
- Mode 명명 규칙: `document-consolidation`의 `Mode 1: consolidate-main` 패턴 대신 `Mode: save` 형태 채택 (subcommand 기반 스킬의 특성에 맞춤)

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-19 | 초기 설계 문서 작성 | context-handling | ready-for-plan |
| 2026-03-19 | 개발 완료 — 문서 통합 | 전체 | 완료 |
