---
feature: context-lifecycle-optimization
category: dev-workflow
status: ready-for-plan
created: 2026-04-07
last-updated: 2026-04-07
dependencies: []
affects:
  - hooks/hooks.json
  - skills/brainstorming/SKILL.md
  - skills/context-handling/SKILL.md
---

# Context Lifecycle Optimization 설계 문서

> 한 줄 요약: 세션 시작 컨텍스트 중복 비용을 제거하고, Phase 경계에서 /compact·/clear 전략을 안내하여 잦은 /clear 사이클의 UX 마찰을 줄인다.

---

## 1. 배경과 동기

`/clear` 후 `/dev-workflow:resume` 실행 시 컨텍스트가 21% 소비된다 (CLAUDE.md 없음 기준, 있으면 ~31%). 작업 세션이 길어지면 80%+ 도달 시 `/clear`가 필요한데, 작업 중 타이밍을 잡기 어려워 90~100%까지 이어지는 경우가 빈번하다.

분석 결과:
- 21% 중 약 35%는 plugin 통제 가능 비용 (orchestrator hook 주입이 핵심)
- 나머지 65%는 Claude Code 인프라 비용 (deferred tools, skills 목록 중복, MCP 인스트럭션)
- 잦은 /clear의 진짜 원인은 초기 21%가 아닌 **세션 중 대화 누적**
- `/compact`가 "작업 흐름을 끊지 않고 컨텍스트를 회복"하는 수단으로 미활용 중

---

## 2. 목표와 비목표

### 목표
- GOAL-001: Phase 완료 시점에 /compact 또는 /clear 선택 안내를 자동 제공
- GOAL-002: /compact·HANDOFF·phase 파일 역할 분담을 문서화하여 사용자가 전략적으로 선택 가능하게 함
- GOAL-003: (단계 2) 스킬 파일 간 중복 내용 제거로 스킬 로드 비용 절감 — REQ-003·004 효과 측정 후 진행

### 비목표
- SessionStart hook 구조 변경 (hook은 모든 세션 진입 경로에 필수)
- brainstorming 스킬 파일 압축/분리 (8:2 기준 미달)
- Claude Code 인프라 비용(skills 목록 중복, deferred tools, MCP 인스트럭션) 개선
- 전체 21%를 0으로 만드는 것

---

## 3. 확정된 요구사항

- REQ-003: brainstorming 스킬의 각 Phase 전환 완료 시점에 컨텍스트 관리 안내를 출력한다 — 우선순위: HIGH
- REQ-004: /compact·HANDOFF·phase 파일 역할 분담 문서를 README 또는 setup 안내에 포함한다 — 우선순위: HIGH
- REQ-005: 스킬 파일 간 유지보수 중복 정리 — 우선순위: LOW (컨텍스트 절약 효과 없음, 유지보수 안전성 목적. 별도 이슈로 추적)

**철회된 요구사항:**
- ~~REQ-001: SessionStart hook에서 resume 트리거 제거~~ — hook은 모든 세션 진입 경로(startup/resume/clear/compact)에서 반드시 1회 실행됨. 제거 시 특정 경로에서 orchestrator 미주입 → 워크플로우 파손
- ~~REQ-002: /dev-workflow:resume 커맨드 단독 처리~~ — hook과 커맨드의 역할 분담이 올바르게 설계되어 있음

---

## 4. 설계 개요

### REQ-003: Phase 완료 시 컨텍스트 관리 안내

brainstorming 스킬의 각 Phase 전환 완료 출력 직후 다음 블록을 추가한다:

```
💡 컨텍스트 관리
   계속 진행: `/compact` — 대화를 압축하고 현재 상태 유지
   새 세션:  `/dev-workflow:save` → `/clear` → `/dev-workflow:resume`
```

적용 위치: phase1_exploration.md 생성 직후, phase2_discovery.md 생성 직후, phase3_validation.md 생성 직후

### REQ-004: /compact · /clear · HANDOFF 역할 분담 문서화

세 도구는 대체 관계가 아닌 보완 관계다.

| 도구 | 저장 위치 | /clear 생존 | 용도 |
|---|---|---|---|
| `/compact` | 컨텍스트 내 (메모리) | ❌ 소실 | 세션 내 연장 |
| HANDOFF.md | 파일 (디스크) | ✅ 생존 | 세션 간 이동 |
| phase*.md / plan.md | 파일 (디스크) | ✅ 생존 | 단계 완료 기록 (불변) |

**핵심 전략: "Phase 경계에서 /clear, Phase 중간에는 /compact"**

- Phase 완료 → phase*.md 생성됨 → **이 파일이 외부 메모리**
  - /compact: 파일 + 압축 컨텍스트로 계속 진행 ✅
  - /clear + /resume: context-handling이 phase 파일 탐지 → 자동 복구 ✅
  - HANDOFF 불필요
- Phase 진행 중
  - /compact: 세션 연장 ✅ (HANDOFF 불필요)
  - 어쩔 수 없이 /clear: `/dev-workflow:save`로 HANDOFF 먼저 생성 필수
- DEVELOP 중: 코드가 파일에 있으므로 /compact 안전 ✅

**HANDOFF의 존재 이유:**
> Phase 진행 중 어쩔 수 없이 /clear를 해야 할 때만 사용하는 "긴급 세이브"

| 상황 | 권장 |
|---|---|
| Phase 완료 후 → 같은 feature 계속 | `/compact` |
| Phase 완료 후 → 완전히 새로 시작 | `/clear` → `/resume` (HANDOFF 불필요) |
| DEVELOP 중 컨텍스트 부족 | `/compact` |
| Phase 진행 중 + 어쩔 수 없이 중단 | `save` → `/clear` → `/resume` |
| 권장 /compact 타이밍 | 60~70% (80%까지 기다리지 않음) |

---

### REQ-005: 스킬 파일 간 중복 내용 제거 (단계 2)

대상: 9개 스킬 파일에 반복되는 규칙 (경로 해소, 페르소나 표시, 파일 경로 규칙 등)
접근: 중복 항목 목록화 → 단일 출처(development-principles 또는 별도 공통 파일) 참조로 교체
선행 조건: REQ-003·004 구현 완료 + 실제 효과 측정 후 결정

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|---|---|---|
| skills/brainstorming/SKILL.md | Phase 전환 로직 | 브레인스토밍 출력 |
| README.md 또는 setup 안내 | — | 신규 사용자 온보딩 |

---

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|---|---|---|---|---|
| hook 변경 여부 | 현행 유지 | hook은 모든 진입 경로(startup/resume/clear/compact 첫 메시지)에서 orchestrator를 보장하는 유일한 수단 | resume 트리거 제거 | 특정 경로에서 orchestrator 미주입 → 워크플로우 파손 |
| brainstorming 최적화 | 현행 유지 | 8:2 기준 미달, 스킬 간 중복 제거가 더 안전한 대안 | 국면별 분리, 내용 압축 | 유지보수 비용 > 절약 효과, 동작 깨짐 위험 |
| 안내 방식 | 출력 블록 추가 | 동작 변경 없이 UX 개선 | 자동 /compact 실행 | Claude Code가 /compact를 자동 실행 불가 |
| 실행 순서 | REQ-003·004 먼저 | 변수를 하나씩 바꿔야 효과 측정 가능 | 전체 동시 추진 | 효과 측정 불가, 과도한 변경 위험 |

---

## 7. 제약조건과 가정

- Claude Code의 `/compact`는 system-reminder(21% baseline)를 압축하지 않는다 — 대화 히스토리만 압축
- SessionStart hook의 matcher 형식이 `startup|resume|clear|compact` 키워드 기반이라고 가정
- `/compact` 후 context-handling이 현재 작업 상태를 요약에 포함한다고 가정 (검증 필요)

---

## 8. 기술 가이드라인

- hooks.json 수정 시 `startup` 트리거는 반드시 유지한다 (신규 세션에 orchestrator 필요)
- brainstorming 안내 블록은 phase*.md 생성 직후, PLAN 단계 진입 제안 전에 출력한다
- 안내 블록은 사용자 결정을 강제하지 않는다 — "계속 진행 또는 새 세션" 선택지만 제시

---

## 9. 구현 결과 및 일탈 사항

> 구현 완료 후 작성

---

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|---|---|---|---|
| 2026-04-07 | 초안 작성 | — | ready-for-plan |
| 2026-04-07 | /compact·HANDOFF·phase 파일 역할 분담 명확화 | 섹션 4 REQ-004 | ready-for-plan |
| 2026-04-07 | REQ-001·002 철회 (hook 동작 원리 확인), REQ-005 추가, 실행 순서 원칙 수립 | 전체 | ready-for-plan |
