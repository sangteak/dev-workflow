> 워크플로우의 사고 품질을 강화하는 메커니즘을 관리한다. 페르소나의 구조적 약점(수긍 편향, 조기 수렴, 표면적 요구사항)을 외부 사고 엔진과 내장 패턴으로 보완한다.

## 시스템 개요

dev-workflow는 페르소나 기반 피드백 루프로 BRAINSTORM/PLAN 단계를 운영한다. 그러나 같은 Claude가 여러 페르소나를 연기하는 구조적 한계로 수긍 편향, 조기 수렴, 표면적 요구사항 수용 문제가 존재했다. 이를 해결하기 위해 Ouroboros 플러그인을 선택적 사고 엔진으로 통합했다. v1.16.0부터는 에이전트 역할 정의가 플러그인에 내장되어 Ouroboros 미설치 환경에서도 서브에이전트 사고 제약이 동일하게 적용된다 (초기의 3단계 폴백 구조는 내장으로 대체 — 아래 연동 절 참조).

핵심 원리는 **페르소나 × 에이전트 합성**이다. 페르소나가 "무엇을 사고하는가"(도메인)를 결정하고, Ouroboros 에이전트가 "어떻게 사고하는가"(방식)를 결정한다. 이 곱셈 효과로 N개 페르소나 × M개 에이전트 = N×M 고유 사고 조합이 생성된다.

## Ouroboros 연동 (2-Path — 내장 역할)

workflow-orchestrator가 Ouroboros MCP 도구 사용 가능 여부를 자동 감지하여 Path를 결정한다 (v1.12.0부터 지연 감지 — 첫 서브에이전트 투입 직전 1회, v1.16.0부터 판정 기준은 MCP 유무만).

- **Path A (MCP 연동)**: Ouroboros MCP 사용 가능 — validate_seed 등 MCP 전용 도구를 추가로 사용한다
- **Path B (내장 역할)**: MCP 미사용 — 내장 역할 정의만으로 동일하게 동작한다

에이전트 역할 정의는 Path와 무관하게 각 스킬의 `references/agent-roles.md` 내장본(Ouroboros 0.39.0 verbatim)을 사용한다. 초기 구조(v1.12.0~v1.15.x)는 설치·파일 발견 여부에 따른 3단계 폴백(Path A/B/C — C는 내장 소크라테스 패턴의 Standalone Mode)이었으나, **v1.16.0에서 역할 내장으로 대체됐다** — 외부 파일 glob 탐색·경로 미확보 리스크·Read 실패 폴백 의존이 함께 소멸했고, Ouroboros 미설치 사용자도 서브에이전트 사고 제약을 그대로 받는다. 내장본 갱신은 Ouroboros 메이저 업데이트 인지 시 수동 1회 대조로 한다 (상시 대조 절차 없음 — 죽은 절차 방지).

내장 후에도 유효한 제약 두 가지: dev-workflow는 Markdown 스킬이므로 프로그래밍적 게이트 강제는 MCP 없이 불가능하고(LLM의 지시 준수에 의존), 서브에이전트는 Agent 도구에 의존하며 병렬 실행 시 응답 시간이 증가한다. 구 제약이던 "에이전트 파일 경로가 OS/설치 방식마다 다름"은 내장으로 소멸했다. 서브에이전트의 파일시스템 접근, 두 플러그인 훅의 순차 실행 무충돌, MCP 동시 요청 큐 처리는 구현 시 실측 검증되었다.

## 브레인스토밍 3단계 구조

국면 1(Exploration)에 Step A/B/C 3단계 구조를 도입하여 탐색의 깊이와 구조를 강화했다.

### Step A-0: 본질 질문 (조건부)

요구사항이 솔루션 중심("X를 만들어줘")일 때 자동 트리거된다. Ontologist 서브에이전트가 본질(이것은 진짜 무엇인가?), 근본 원인(왜 필요한가?), 전제조건(무엇이 먼저 존재해야 하는가?), 숨겨진 가정(당연하다고 여기는 것은?)을 탐색한다.

### Step A: 인터뷰

Socratic Interviewer 서브에이전트가 각 페르소나별로 병렬 실행되어 도메인 특화 질문을 생성한다 (역할 정의는 내장본 사용 — v1.16.0부터 단일 경로).

에이전트 매칭 규칙: Step A에서는 전원이 서브에이전트로 실행된다. 소크라테스 인터뷰 특성상 해결책 제안을 구조적으로 차단해야 하기 때문이다.

### Step B: 시드 추출

인터뷰 결과를 구조화된 시드(Seed) YAML로 추출한다. Seed-Architect 서브에이전트가 독립 컨텍스트에서 Goal, Constraints, Non-goals, Success Criteria, Assumptions, Open Questions를 정리한다. 추출 후 사용자 확인이 필수이며, 명확도 체크리스트(✅/⚠️/❌)가 함께 표시된다.

### Step C: 확장 토론

기존 라운드 로빈 비판 구조를 유지하되, 비판 슬롯에 Contrarian 서브에이전트를 투입한다. 비판 담당 페르소나만 서브에이전트로 실행되고, 나머지는 메인 컨텍스트에서 자유 발언한다. 교착 상태 감지 시 Hacker 서브에이전트가 우회 경로를 제안한다.

기존 토론 리드 시스템은 제거했다. Contrarian 서브에이전트 + Step 구조가 리드의 모든 기능(비판 강화, 방향 주도, 다양성 확보)을 구조적으로 대체하기 때문이다.

### Simplifier 스코프 정리 (국면 1→2 전환 시, 조건부)

요구사항이 8건 이상이거나 명확도 체크리스트에서 ⚠️/❌가 3건 이상일 때 트리거된다. Simplifier 서브에이전트가 핵심/선택 요구사항을 분류하고 YAGNI 기반 축소를 제안한다.

## PLAN 단계 에이전트 통합

plan-stage의 실현 가능성 평가에 두 에이전트를 통합했다.

- **Architect** (Step 2): 구조적 리스크(결합도, 책임 분리, 추상화 수준)를 분석하여 실현 가능성 평가에 구조적 근거를 추가한다.
- **Researcher** (Step 3): CAUTION/RENEGOTIATE 판정 항목에 대해 사례 조사와 대안 탐색을 수행한다. v1.16.0부터 **미실측 수치·구조적 상한 가정을 근거로 한 FEASIBLE(낙관) 판정**도 조사 대상에 포함된다 — 전원 낙관 일치가 실측 없이 통과한 계획 결함의 실증 경로를 막는 조건 확장이며, plan-stage의 전원 일치 조기 종료에도 같은 예외(근거 미실측 시 실측·추정 근거 1줄 요구)가 적용된다.

## 에이전트 매칭 전략

2가지 규칙으로 매칭을 결정한다:

- **규칙 1:** Step이 기본 에이전트를 결정한다 (고정). Step A → Socratic, Step B → Seed-Architect, Step C → Contrarian(비판 슬롯만).
- **규칙 2:** 비판 담당 페르소나만 서브에이전트로 실행한다. 예외: Step A는 전원 서브에이전트.

구현된 최종 매핑:

| 스킬 | Step/단계 | 에이전트 | 트리거 조건 |
|---|---|---|---|
| brainstorming | Step A-0 (본질 질문) | Ontologist | 요구사항이 솔루션 중심일 때 |
| brainstorming | Step A (인터뷰) | Socratic Interviewer | 항상 |
| brainstorming | Step B (시드 추출) | Seed-Architect | 항상 |
| brainstorming | Step C (확장 토론) | Contrarian (비판 슬롯) | 항상 |
| brainstorming | Step C (교착 해소) | Hacker | 교착 감지 시 |
| brainstorming | 국면 1→2 전환 | Simplifier | 요구사항 ≥8 또는 ⚠️/❌ ≥3 |
| plan-stage | Step 2 (실현 가능성) | Architect | 항상 |
| plan-stage | Step 3 (조사) | Researcher | CAUTION/RENEGOTIATE 존재 시 + 미실측 수치·상한 가정 포함 FEASIBLE 판정 (v1.16.0) |

시드와 명확도 체크리스트는 phase1 파일에 포함되어 국면 간 의도 추적의 기준점이 된다. 후속 확장 여지(v2 범위)로 Ouroboros MCP 도구 직접 호출(validate_seed, gate_transition, detect_drift), 국면 2~3 에이전트 매핑 확장(Ontologist/Simplifier), PostToolUse 훅 실시간 드리프트 감지가 식별되어 있다.

> v1 MVP는 2026-03 ouroboros-integration feature로 구현되었고, 2026-07-08 본 도메인 문서에 통합 완료되었다.

## 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-07-08 | 기존 문서 — 신규 머지 시작 이전 | - | - |
| 2026-07-08 | ouroboros-integration 통합 (작성자: 권상택) | 연동·매칭 섹션, 변경 이력 신설 | 완료 |
| 2026-07-10 | verification-realignment 통합 (작성자: Sangtaek Kwon (권상택)) — 3단계 폴백→2-Path·역할 내장 대체 | 시스템 개요, Ouroboros 연동 절 재작성, Step A·Researcher 현행화 | 완료 |
