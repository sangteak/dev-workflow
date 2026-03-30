# Phase 1: Exploration — Subagent Prompt Injection

> 탐색 완료 시점의 불변 스냅샷

## 배경

dev-workflow 플러그인의 brainstorming 스킬에서 Ouroboros 에이전트 역할 정의(.md 파일)를 서브에이전트 프롬프트에 "전문"으로 주입하도록 지시하고 있지만, Claude가 전문 대신 요약/핵심만 전달하는 현상이 비결정적으로 발생한다.

## 탐색된 요구사항

### 확정

- REQ-001: SKILL.md의 서브에이전트 프롬프트 템플릿에서 `[X 전문]` 플레이스홀더의 프레이밍을 전환하여 전문 주입 신뢰성을 높인다
- REQ-002: 외부 파일 참조(런타임 Read) 방식을 유지한다 (Ouroboros 업데이트 자동 반영)
- REQ-003: "수정·요약·재구성 없이 그대로 포함" 등 명시적 부정 제약을 포함한다
- REQ-004: 물리적 구분자(===)로 역할 정의의 경계를 명확히 표시한다
- REQ-005: 모든 에이전트 호출 템플릿(Ontologist, Socratic, Seed-Architect, Contrarian, Hacker, Simplifier)에 동일한 패턴을 적용한다

### 사용자가 명시적으로 제외한 항목

- 에이전트 핵심 규칙 인라인화 (대안 A) — 외부 의존성 동기화 비용 회피
- Ouroboros 에이전트 .md 파일 자체 수정
- 구조 변경 경로 (코드 없는 플러그인 한계)

## 페르소나 구성

- 🛠️ Claude Code Expert
- 🎯 Workflow Designer
- 🔍 Ecosystem Analyst (국면 3 활성화)

## 페르소나 피드백 결과

### Step A-0 (Ontologist 본질 분석)
- 본질: "자연어 기반 플러그인 시스템에서 기계적 텍스트 대치를 자연어 지시로 달성하려는 구조적 취약성"
- 두 해결 경로 제안: (1) 지시 강화 (2) 구조 변경
- 숨겨진 가정: 전문이 필수인지 vs 규격 준수 문제인지

### Step A (Socratic 인터뷰)
- 합의: LLM 특성상 인정해야 하는 한계가 아님. 2KB 파일의 verbatim 포함은 능력 범위 안
- 품질 영향: 경미 (페르소나별 질문은 정상 수행). 지침 준수 관점에서 개선 필요

### Step C (Contrarian 확장 토론)
- 대안 A(인라인화): 확실하지만 외부 의존성 동기화 비용 → 사용자가 제외
- 대안 B(아무것도 안 함): 품질 영향 경미하지만 "지침은 지키기 위해 존재" 원칙에 위배 → 제외
- **대안 C(프레이밍 전환): 확정** — 외부 파일 참조 유지 + 지시 구조/구분자 개선

## 시드

```yaml
goal: "brainstorming 스킬의 [X 전문] 플레이스홀더 프레이밍을 전환하여 서브에이전트 전문 주입 신뢰성 향상"
constraints:
  - "수정 대상은 SKILL.md의 프롬프트 템플릿만"
  - "외부 파일 참조(런타임 Read) 방식 유지"
  - "Ouroboros 에이전트 .md 파일 수정 불가"
  - "기존 워크플로우 흐름(Phase 0~3) 변경 없음"
non_goals:
  - "에이전트 핵심 규칙 인라인화 (외부 의존성 동기화 비용)"
  - "프로그래매틱 삽입 메커니즘 도입"
success_criteria:
  - "모든 서브에이전트 호출 템플릿에 프레이밍 전환 패턴 적용"
  - "명시적 부정 제약(요약/축약/재구성 금지) 포함"
  - "물리적 구분자로 역할 정의 경계 명시"
assumptions:
  - "2KB 수준의 verbatim 포함은 Claude 능력 범위 안"
  - "프레이밍 전환으로 준수율 유의미하게 향상 가능"
open_questions:
  - "전문의 경계 — frontmatter 포함 여부"
  - "검증 방법 — 비결정적 특성상 반복 기준 필요"
context: "dev-workflow는 코드 없는 문서 기반 플러그인. 대안 C(프레이밍 전환) 확정."
```

## 명확도 체크리스트

- ✅ Goal Clarity: 명확 — 프레이밍 전환으로 전문 주입 신뢰성 향상
- ✅ Constraint Clarity: 명확 — SKILL.md만 수정, 외부 파일 참조 유지
- ⚠️ Success Criteria: 검증 방법 미정의
