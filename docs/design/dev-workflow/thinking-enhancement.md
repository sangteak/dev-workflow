> 워크플로우의 사고 품질을 강화하는 메커니즘을 관리한다. 페르소나의 구조적 약점(수긍 편향, 조기 수렴, 표면적 요구사항)을 외부 사고 엔진과 내장 패턴으로 보완한다.

## 시스템 개요

dev-workflow는 페르소나 기반 피드백 루프로 BRAINSTORM/PLAN 단계를 운영한다. 그러나 같은 Claude가 여러 페르소나를 연기하는 구조적 한계로 수긍 편향, 조기 수렴, 표면적 요구사항 수용 문제가 존재했다. 이를 해결하기 위해 Ouroboros 플러그인을 선택적 사고 엔진으로 통합하고, 미설치 환경에서도 내장 패턴으로 개선된 경험을 제공하는 3단계 폴백 구조를 도입했다.

핵심 원리는 **페르소나 × 에이전트 합성**이다. 페르소나가 "무엇을 사고하는가"(도메인)를 결정하고, Ouroboros 에이전트가 "어떻게 사고하는가"(방식)를 결정한다. 이 곱셈 효과로 N개 페르소나 × M개 에이전트 = N×M 고유 사고 조합이 생성된다.

## Ouroboros 연동과 3단계 폴백

세션 시작 시 workflow-orchestrator가 Ouroboros 플러그인 존재를 자동 감지하여 Path를 결정한다.

- **Path A** (Enhanced + MCP): Ouroboros 설치 + MCP 활성화. 서브에이전트 + MCP 도구 풀 기능
- **Path B** (Enhanced): Ouroboros 설치 + MCP 비활성화. agents/*.md 직접 읽기로 서브에이전트만
- **Path C** (Standalone): Ouroboros 미설치. 내장 소크라테스 질문 패턴 + 시드 템플릿

감지 방식은 `**/ouroboros/agents/socratic-interviewer.md` glob 탐색 후 `+ouroboros` ToolSearch로 MCP 로드를 시도하는 2단계이다. Path C에서도 시드 개념과 소크라테스 질문 패턴이 텍스트 수준으로 적용되어 기존 대비 개선된다.

## 브레인스토밍 3단계 구조

국면 1(Exploration)에 Step A/B/C 3단계 구조를 도입하여 탐색의 깊이와 구조를 강화했다.

### Step A-0: 본질 질문 (조건부)

요구사항이 솔루션 중심("X를 만들어줘")일 때 자동 트리거된다. Ontologist 서브에이전트가 본질(이것은 진짜 무엇인가?), 근본 원인(왜 필요한가?), 전제조건(무엇이 먼저 존재해야 하는가?), 숨겨진 가정(당연하다고 여기는 것은?)을 탐색한다.

### Step A: 인터뷰

Enhanced Mode에서는 Socratic Interviewer 서브에이전트가 각 페르소나별로 병렬 실행되어 도메인 특화 질문을 생성한다. Standalone Mode에서는 WHY-CHAIN, COUNTERFACTUAL, BOUNDARY, ESSENCE 네 가지 내장 패턴을 적용한다.

에이전트 매칭 규칙: Step A에서는 전원이 서브에이전트로 실행된다. 소크라테스 인터뷰 특성상 해결책 제안을 구조적으로 차단해야 하기 때문이다.

### Step B: 시드 추출

인터뷰 결과를 구조화된 시드(Seed) YAML로 추출한다. Enhanced Mode에서는 Seed-Architect 서브에이전트가 독립 컨텍스트에서 Goal, Constraints, Non-goals, Success Criteria, Assumptions, Open Questions를 정리한다. 추출 후 사용자 확인이 필수이며, 명확도 체크리스트(✅/⚠️/❌)가 함께 표시된다.

### Step C: 확장 토론

기존 라운드 로빈 비판 구조를 유지하되, 비판 슬롯에 Contrarian 서브에이전트를 투입한다. 비판 담당 페르소나만 서브에이전트로 실행되고, 나머지는 메인 컨텍스트에서 자유 발언한다. 교착 상태 감지 시 Hacker 서브에이전트가 우회 경로를 제안한다.

기존 토론 리드 시스템은 제거했다. Contrarian 서브에이전트 + Step 구조가 리드의 모든 기능(비판 강화, 방향 주도, 다양성 확보)을 구조적으로 대체하기 때문이다.

### Simplifier 스코프 정리 (국면 1→2 전환 시, 조건부)

요구사항이 8건 이상이거나 명확도 체크리스트에서 ⚠️/❌가 3건 이상일 때 트리거된다. Simplifier 서브에이전트가 핵심/선택 요구사항을 분류하고 YAGNI 기반 축소를 제안한다.

## PLAN 단계 에이전트 통합

plan-stage의 실현 가능성 평가에 두 에이전트를 통합했다.

- **Architect** (Step 2): 구조적 리스크(결합도, 책임 분리, 추상화 수준)를 분석하여 실현 가능성 평가에 구조적 근거를 추가한다.
- **Researcher** (Step 3): CAUTION/RENEGOTIATE 판정 항목에 대해 사례 조사와 대안 탐색을 수행한다.

## 에이전트 매칭 전략

2가지 규칙으로 매칭을 결정한다:

- **규칙 1:** Step이 기본 에이전트를 결정한다 (고정). Step A → Socratic, Step B → Seed-Architect, Step C → Contrarian(비판 슬롯만).
- **규칙 2:** 비판 담당 페르소나만 서브에이전트로 실행한다. 예외: Step A는 전원 서브에이전트.

## 관련 feature

- [ouroboros-integration](ouroboros-integration/ouroboros-integration.md) — v1 MVP 구현 (2026-03-26 완료)
