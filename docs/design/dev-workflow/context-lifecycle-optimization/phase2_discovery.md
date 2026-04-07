# Phase 2: 발견 — Context Lifecycle Optimization

> 생성일: 2026-04-07 | 불변 스냅샷

---

## 새로 발견된 미정의 영역

### 1. 잦은 /clear의 진짜 원인

초기 21%가 아닌 **세션 중 대화 누적**이 /clear를 유발한다는 사실 발견.

- 사용자 실제 패턴: 80% 도달 시 /clear (타이밍 못 잡아 90~100%까지 가는 경우도 있음)
- 현재 패턴: `dev-workflow:save → /clear → dev-workflow:resume`
- HANDOFF 신뢰도: 높음 (현재 방식에 신뢰하고 있음)
- 작업 중 끊기 곤란: "일을 하고 있는데 중간에 끊기가 애매해서 늦게 하는 경우가 많음"

### 2. 스킬 목록 3중 중복 발견 (인프라 이슈)

system-reminder에서 동일 스킬이 복수 네임스페이스로 반복 나열됨:
- `1ed29a03dc85:*` → `document-skills:*` → `example-skills:*` (18개 스킬 × 3)
- `ouroboros:*` 2회, `superpowers:*` 2회
- 총 150개+ 스킬 목록 → Claude Code 인프라 이슈, plugin 통제 불가

### 3. /compact 미활용

80%까지 기다리지 않고 60~70%에서 /compact로 세션을 연장할 수 있으나 현재 미활용.

## Q&A 결정 사항

| 질문 | 결정 |
|---|---|
| resume hook 제거 vs 유지? | **제거** — /dev-workflow:resume 커맨드로 단일화 |
| brainstorming 31,535B 최적화? | **현행 유지** — 3%p 절약 대비 구현 비용이 큼 (8:2 기준 미달) |
| 자동 탐색 vs /resume 단일화? | **단일화** — /clear는 "새로 시작" 의도 신호이므로 자동 탐색이 의도와 충돌 |

## brainstorming 최적화 시나리오 검토 결과

| 시나리오 | 절약 | 구현 비용 | 8:2 통과 |
|---|---|---|---|
| A: 현행 유지 (hook만 제거) | -3,000 tokens (resume 시) | 낮음 | ✅ |
| B: 국면별 파일 분리 | ~-1,884 tokens (전체) | 높음 | ❌ |
| C: 내용 압축 (리라이트) | ~-2,884 tokens | 중간 | ⚠️ |
| A+C 복합 | ~-5,884 tokens (~3%p) | 중간 | 사용자 기각 |

**사용자 최종 판단: "초기 비용 3% 절약이라면 현상 유지가 합리적"**

## 페르소나 피드백 요약

- 🛠️ Claude Code Expert: hook 제거는 기술적으로 단순 (hooks.json 1줄 수정). resume에서 orchestrator 전체 주입 불필요.
- 🎯 Workflow Designer: Contrarian 지적 반영 — /clear는 "새로 시작" 신호이므로 자동 탐색이 의도와 충돌. /compact가 "작업 중 끊기 곤란" 상황의 해결책.
- Contrarian: "아무것도 안 하는 옵션"을 제시했으나 실제 UX 마찰 확인으로 기각됨.
