# Phase 1: 탐색 — Context Lifecycle Optimization

> 생성일: 2026-04-07 | 불변 스냅샷

---

## 탐색된 요구사항

- `/clear` 후 `/dev-workflow:resume` 실행 시 컨텍스트가 21% 사용됨 (CLAUDE.md 없음 기준)
- CLAUDE.md 포함 시 약 31%
- 목표: 전체 제거가 아닌 불필요한 부분 최적화
- 배경: 작업 세션이 길어지면 짧은 주기로 /clear가 필요한 상황 발생

## Ontologist 본질 질문 결과

| 관점 | 질문 | 확인된 답변 |
|---|---|---|
| Essence | resume이 원인인가, 인프라 기저 비용인가? | resume 자체가 원인. /clear 직후 0%, resume 후 21% |
| Root Cause | hook이 연쇄 로드하는가? | SessionStart hook → orchestrator 12,208B 강제 주입 |
| Prerequisites | 통제 가능/불가 영역 분리가 선행되어야 하는가? | Yes — 분리 측정이 필요 |
| Hidden Assumptions | 21%가 병목인가? | No — 21%보다 중간 누적이 더 큰 문제 |

## 실측 조사 결과

| 항목 | 크기 | 로드 트리거 |
|---|---|---|
| workflow-orchestrator | 12,208 B | SessionStart hook (매 세션 강제) |
| document-consolidation | 12,404 B | On-demand |
| context-handling | 10,767 B | On-demand (/resume 시) |
| plan-stage | 10,259 B | On-demand |
| brainstorming | 31,535 B | On-demand |
| persona-resolution | 3,478 B | On-demand |
| development-principles | 3,895 B | On-demand |
| design-doc-index | 7,445 B | On-demand |
| design-summary | 5,888 B | On-demand |

## 컨텍스트 비용 분류

| 항목 | Plugin 통제 가능 여부 | 상대적 비중 |
|---|---|---|
| orchestrator hook 주입 (12,208 B) | ✅ 가능 | 크다 |
| context-handling 스킬 로드 | ✅ 가능 | 보통 |
| Deferred tools 목록 (160개+) | ❌ 불가 | 크다 |
| Skills 목록 (150개+, 중복 포함) | ❌ 불가 | 크다 |
| MCP server instructions (serena 등) | ❌ 불가 | 보통 |
| CLAUDE.md | ❌ 불가 | 작다 |

## Socratic 인터뷰 핵심 결정

- Q2: resume 경로 최소 실행 집합 = **진행 중인 feature 목록 확인만** 으로 충분
- Q4: resume 후 행동 = 기존 작업 재개 OR 새 브레인스토밍
- Q1 (조사): orchestrator 중 resume 즉시 필요 섹션은 전체의 약 10~15%
- Q3 (조사): SessionStart 자동 탐색 ↔ /resume 명시적 커맨드가 실질적으로 동일한 UX 중복

## 확정된 페르소나

- 🛠️ Claude Code Expert
- 🎯 Workflow Designer

## 시드 (Step B 확정본)

```yaml
goal: "resume 경로에서 실질적으로 필요한 최소 실행 집합만 로드, 불필요한 주입 제거"
constraints:
  - "기존 BRAINSTORM/PLAN/DEVELOP/REVIEW 워크플로우 동작 유지"
  - "SessionStart hook 구조 유지 (제거 불가)"
  - "deferred tools, MCP 목록 등 Claude Code 인프라 비용은 통제 범위 밖"
success_criteria:
  - "resume 후 컨텍스트% < 현재 21%"
  - "resume 경로에서 orchestrator 전문 대신 필요 섹션만 로드"
  - "feature 목록 표시 → 기존 작업 재개 OR 새 브레인스토밍 정상 동작"
  - "SessionStart 자동 탐색 ↔ /resume UX 중복 제거"
open_questions:
  - "orchestrator를 섹션 분리할 것인가, resume 경로에서 주입 자체를 스킵할 것인가?"
  - "SessionStart 자동 탐색을 제거하고 /resume만 남길 것인가, 병존할 것인가?"
```
