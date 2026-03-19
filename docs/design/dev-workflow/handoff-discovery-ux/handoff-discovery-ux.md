---
feature: handoff-discovery-ux
category: dev-workflow
status: complete
created: 2026-03-19
last-updated: 2026-03-19
dependencies:
  - context-handling
  - workflow-orchestrator
affects:
  - context-handling (SKILL.md 전면 개편)
  - workflow-orchestrator (Session Start Protocol Step 2 축소)
---

# handoff-discovery-ux 설계 문서

> 한 줄 요약: 세션 시작 시 HANDOFF 탐색 과정을 사용자에게 노출하지 않고, 진행 중인 모든 작업(HANDOFF 유무 무관)을 하나의 일관된 템플릿으로 제시한다.

## 1. 배경과 동기

- `/clear` 후 "HANDOFF.md 읽고 작업 복귀해줘" 실행 시 다음 문제가 발생:
  1. 1차 glob 탐색 실패 메시지가 노출됨 ("docs/design/ 경로에 없습니다")
  2. sequential-thinking MCP 내부 로그가 그대로 노출되어 가독성 극도 저하
  3. 최종 HANDOFF 목록이 context-handling 스킬의 정의된 템플릿을 따르지 않음
- HANDOFF.md를 작성하지 않은 채 세션이 종료되면 진행 중인 작업이 목록에 나타나지 않음
- orchestrator와 context-handling에 탐색 로직이 분산되어 출력 일관성 유지가 어려움

## 2. 목표와 비목표

### 목표
- GOAL-001: 탐색 과정(glob 실패, 재탐색 등)을 사용자에게 절대 노출하지 않는다
- GOAL-002: HANDOFF 유무와 관계없이 진행 중인 모든 작업을 하나의 통합 목록으로 제시한다
- GOAL-003: 출력 템플릿을 context-handling 스킬 한 곳에서만 관리한다

### 비목표
- status 체계 확장 (기존 `ready-for-plan` / `complete` 2개 유지)
- HANDOFF 1개일 때 자동 복귀 (항상 목록 제시로 일관성 유지)
- 외부 설계 문서 제공 질문 개편 (기존 orchestrator 후속 처리 유지)

## 3. 확정된 요구사항

- REQ-001: 탐색 과정을 사용자에게 출력하지 않는다 — 우선순위: HIGH
- REQ-002: 결과만 정의된 템플릿 형식으로 일관되게 제시한다 — 우선순위: HIGH
- REQ-003: HANDOFF 없는 미완료 작업도 같은 목록에 통합 표시한다 — 우선순위: HIGH
- REQ-004: `_archive/` 하위 항목은 제외한다 — 우선순위: MEDIUM
- REQ-005: orchestrator Step 2의 폴백 체인을 context-handling에 일원화한다 — 우선순위: HIGH
- REQ-006: HANDOFF 유무에 따라 복구 안내 메시지를 구분한다 — 우선순위: MEDIUM

## 4. 설계 개요

### 4.1 구조 변경: 책임 일원화

**변경 전:**
- orchestrator Step 2: 4단계 분기 (HANDOFF glob → phase 감지 → 설계문서 감지 → 미존재)
- context-handling: HANDOFF 발견 시에만 invoke

**변경 후:**
- orchestrator Step 2: 단순 invoke만 수행
- context-handling: 탐색, 분류, 목록 제시, 폴백을 모두 처리

```
orchestrator Step 2 (수정 후):
  - 동일 세션 내 브레인스토밍 완료 직후 → 생략
  - 신규 세션 → invoke `dev-workflow:context-handling` skill
```

### 4.2 탐색 절차 (context-handling 내부)

```
Step 1: 전체 탐색 (사용자에게 출력하지 않음)
  - docs/design/ 하위 전체를 한 번에 스캔
  - glob 수집 대상:
    a) **/HANDOFF.md
    b) **/phase*.md
    c) 각 기능 디렉토리의 [기능명].md, plan.md
  - _archive/ 경로 포함 항목 즉시 제거
  - 디렉토리별로 그룹핑

Step 2: 분류
  - 완료 항목 제외: status: complete 또는 _archive/ 존재
  - HANDOFF 있는 항목: current-phase + last-updated 추출
  - HANDOFF 없는 항목: 파일 조합으로 단계 추론
  - issues/ 항목: parent-feature 하위로 연결

Step 3: 정렬 및 출력
  - last-updated 역순 정렬
  - issues/ 항목은 부모 하위에 들여쓰기
  - 통합 목록 템플릿으로 출력
```

### 4.3 통합 출력 템플릿

**진행 중인 작업이 있는 경우:**
```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (현재 단계)
  2. [카테고리] 기능명 (Phase 1 완료 · ⚠️ HANDOFF 없음) — 최근: YYYY-MM-DD
  3. [카테고리] 기능명 (PLAN 대기 · ⚠️ HANDOFF 없음) — 최근: YYYY-MM-DD

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

**진행 중인 작업이 없는 경우:**
```
📋 진행 중인 작업이 없습니다.

  0. ✨ 새 작업 시작

새 작업을 시작하세요.
```

### 4.4 파일 조합 기반 라벨 규칙

| 파일 조합 | 라벨 |
|-----------|------|
| `status: complete` (HANDOFF 유무 무관) | 완료 (목록에서 제외) |
| HANDOFF 있음 + `status` ≠ `complete` | HANDOFF의 `current-phase` 값 그대로 |
| `phase1.md`만 존재 | Phase 1 완료 |
| `phase1.md` + `phase2.md` | Phase 2 완료 |
| `phase1.md` + `phase2.md` + `phase3.md` | Phase 3 완료 |
| `[기능명].md` + `status: ready-for-plan` | PLAN 대기 |
| `plan.md` 존재 + `status` ≠ `complete` | DEVELOP 진행 중 |
| `_archive/` 존재 | 완료 (목록에서 제외) |
| 위 어디에도 해당 안 됨 | 목록에서 제외 |

- HANDOFF 없는 항목에는 `⚠️ HANDOFF 없음` 태그를 부착한다

### 4.5 복구 흐름

**사용자가 목록에서 항목 선택 시:**

HANDOFF 있는 경우:
```
⚠️ 이전 세션이 [국면명] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?
```

HANDOFF 없는 경우:
```
⚠️ 이 작업에는 HANDOFF.md가 없습니다.
마지막으로 완료된 단계는 [Phase N / PLAN 대기 / DEVELOP]입니다.
[다음 단계명]부터 새로 시작합니다. 계속할까요?
```

**복구 동작 매핑:**

| 라벨 | 복구 동작 |
|------|----------|
| Phase N 완료 · ⚠️ HANDOFF 없음 | phase 파일 로드 → Phase N+1부터 시작 |
| PLAN 대기 · ⚠️ HANDOFF 없음 | [기능명].md 로드 → PLAN 단계 진입 |
| DEVELOP 진행 중 · ⚠️ HANDOFF 없음 | plan.md 로드 → 태스크 체크리스트 확인 후 재개 |

### 4.6 출력 억제 규칙

context-handling 스킬에 아래를 명시한다:

```
⛔ 금지 출력 (탐색 ~ 목록 제시 사이에 다음을 출력하지 않는다):
- "탐색합니다", "검색 중", "파일을 찾고 있습니다"
- glob 실행 결과 (파일 수, 경로 목록)
- "HANDOFF.md가 없습니다", "다른 위치에서 찾겠습니다"
- sequential-thinking 등 내부 추론 과정
- 탐색 성공/실패 중간 보고

✅ 유일한 출력: 위 통합 목록 템플릿
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| context-handling | docs/design/ 파일 구조 | orchestrator (Step 2 호출) |
| orchestrator | context-handling (invoke) | 없음 (로직 제거됨) |
| 설계 문서 frontmatter | brainstorming (status 설정) | context-handling (status 읽기) |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 탐색 책임 | context-handling 일원화 | 출력 템플릿 한 곳 관리 | orchestrator 분산 유지 | 출력 일관성 보장 어려움 |
| 상태 판단 | status + 파일 조합 | 기존 status 체계 유지 | status 확장 (in-plan, in-dev 등) | 오버엔지니어링, 2개 정규값으로 충분 |
| HANDOFF 1개 시 | 항상 목록 제시 | 일관성 + 새 작업 선택지 보장 | 자동 복귀 | 사용자 의도 확인 불가 |
| 탐색 방식 | 단일 패스 glob | 단계적 실패 제거 | 순차 탐색 (1차 실패 → 2차) | 중간 실패 메시지 노출 원인 |

## 7. 제약조건과 가정

- Markdown 스킬은 Claude의 행동을 "지시"할 뿐 강제할 수 없다. 출력 억제는 100% 보장이 불가능하며, 발생 빈도를 줄이는 것이 목표다
- frontmatter 파싱은 파일 상위 10줄로 제한한다
- `_archive/` 존재 여부가 완료/미완료 구분의 1차 기준이다
- status 정규값은 `ready-for-plan`과 `complete` 2개만 존재한다

## 8. 기술 가이드라인

- context-handling SKILL.md의 "새 세션에서 HANDOFF 탐색 및 복구" 섹션을 전면 개편한다
- orchestrator SKILL.md의 Session Start Protocol Step 2를 단순 invoke로 축소한다
- 출력 시점을 하나로 제한한다: 탐색 완료 후 템플릿 출력만 허용
- 금지 출력 패턴을 스킬 지시문에 명시적으로 나열한다
- 복구 안내 메시지 템플릿을 스킬에 삽입하고 "그대로 사용한다"를 명시한다
- 탐색 지시를 단일 문단으로 압축한다 — 여러 스텝으로 나누면 Claude가 스텝별 진행 보고를 하는 경향이 있음
- 파일 조합 판단을 우선순위 기반 if-else 체인으로 작성한다 — 테이블보다 Claude 해석에 적합

## 9. 구현 결과 및 일탈 사항

### 수정된 파일
- `skills/context-handling/SKILL.md` — 메타데이터, 트리거 조건, 탐색 절차, 복구 흐름 전면 개편
- `skills/workflow-orchestrator/SKILL.md` — Session Start Protocol Step 2 축소

### 설계 대비 일탈 사항
- 없음. 모든 요구사항이 설계대로 구현됨

### 검증 결과
- Spec Review (context-handling): 16/16 통과
- Spec Review (orchestrator): 11/11 통과
- 시나리오 검증: 9/9 통과
- 크로스파일 일관성 검증: 3/3 통과

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-19 | 초안 작성 | context-handling, orchestrator | ready-for-plan |
| 2026-03-19 | 개발 완료 — 문서 통합 | context-handling, orchestrator | 완료 |
| 2026-03-19 | status:complete 필터를 최우선순위로 이동 (HANDOFF 잔존 무관) | context-handling | 완료 |
| 2026-03-19 | 잔존 HANDOFF 정리 제안 추가 (complete인데 HANDOFF 남아있으면 삭제 제안) | context-handling | 완료 |
