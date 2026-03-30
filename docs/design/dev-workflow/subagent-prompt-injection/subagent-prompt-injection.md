---
feature: subagent-prompt-injection
category: dev-workflow
status: ready-for-plan
created: 2026-03-26
last-updated: 2026-03-26
dependencies: []
affects:
  - skills/brainstorming/SKILL.md
  - skills/plan-stage/SKILL.md
  - skills/workflow-orchestrator/SKILL.md
---

# Subagent Prompt Injection 설계 문서

> 한 줄 요약: Ouroboros 에이전트 역할 정의를 서브에이전트에 전문 주입할 때 발생하는 비결정적 요약 현상을 프레이밍 전환으로 개선한다.

## 1. 배경과 동기

dev-workflow 플러그인의 brainstorming 스킬은 Ouroboros 에이전트 역할 정의(.md 파일)를 서브에이전트 프롬프트에 "전문"으로 주입하도록 지시한다. 그러나 실제 실행 시 Claude가 전문 대신 요약/핵심만 전달하는 현상이 비결정적으로 발생한다.

- 동일 세션에서 Ontologist는 전문 전달 성공, Socratic Interviewer는 요약 전달
- 에이전트 .md 파일은 1.5~2.7KB로 Claude의 능력 범위 안
- Ontologist 분석 결론: LLM 특성상 인정해야 하는 한계가 아니라, 지침 강화로 개선 가능한 문제

현재 `[Ouroboros agents/X.md 전문]`이라는 플레이스홀더가 LLM에게 "기계적 텍스트 대치"로 인식되지 않고, "의도를 이해하여 재구성"하는 방향으로 해석될 수 있다.

## 2. 목표와 비목표

### 목표
- GOAL-001: 서브에이전트 프롬프트 템플릿의 프레이밍을 전환하여 전문 주입 신뢰성을 유의미하게 향상시킨다
- GOAL-002: 플러그인 전체(3개 스킬)에서 에이전트 역할 정의 주입 패턴을 일관되게 적용한다
- GOAL-003: Contrarian/Hacker의 누락된 명시적 프롬프트 템플릿을 보완한다

### 비목표
- 에이전트 핵심 규칙을 SKILL.md에 인라인화하지 않는다 (외부 의존성 동기화 비용 회피)
- Ouroboros 에이전트 .md 파일 자체를 수정하지 않는다
- 프로그래매틱 삽입 메커니즘을 도입하지 않는다 (코드 없는 플러그인 한계)
- 100% 결정론적 주입을 보장하지 않는다 (LLM 비결정성 수용)

## 3. 확정된 요구사항

- REQ-001: 기존 7개 프롬프트 템플릿의 프레이밍을 전환한다 — 우선순위: HIGH
  - 대상: brainstorming (Ontologist, Socratic, Seed-Architect, Simplifier), plan-stage (Architect, Researcher), orchestrator (Evaluator)
- REQ-002: Contrarian/Hacker의 명시적 프롬프트 템플릿을 신규 작성한다 — 우선순위: HIGH
  - brainstorming Step C의 맥락에 맞는 컨텍스트 섹션 포함
- REQ-003: 피드백 루프 일반 규칙(83행)에 "수정·요약 없이 그대로 포함" 문구를 추가한다 — 우선순위: MEDIUM
  - 미래 에이전트에 대한 fallback 역할
- REQ-004: 3개 스킬 파일 전체에 동일 패턴을 일관 적용한다 — 우선순위: HIGH

## 4. 설계 개요

### 프레이밍 전환 패턴

**현재 (As-Is):**
```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/X.md 전문]
```

**변경 후 (To-Be):**
```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/X.md 전문]
===
```

### 변경 지점 (9개)

| # | 스킬 파일 | 에이전트 | 유형 |
|---|---|---|---|
| 1 | brainstorming | Ontologist | 프레이밍 전환 |
| 2 | brainstorming | Socratic Interviewer | 프레이밍 전환 |
| 3 | brainstorming | Seed-Architect | 프레이밍 전환 |
| 4 | brainstorming | Simplifier | 프레이밍 전환 |
| 5 | brainstorming | Contrarian | 신규 템플릿 |
| 6 | brainstorming | Hacker | 신규 템플릿 |
| 7 | brainstorming | 일반 규칙 (83행) | 문구 갱신 |
| 8 | plan-stage | Architect | 프레이밍 전환 |
| 9 | plan-stage | Researcher | 프레이밍 전환 |
| 10 | workflow-orchestrator | Evaluator | 프레이밍 전환 |

### Contrarian 신규 템플릿 구조

```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/contrarian.md 전문]
===

--- 도메인 컨텍스트 ---
너의 도메인: [비판 담당 페르소나명 + 도메인 설명]

--- 현재 논의 주제 ---
[현재까지의 논의 요약 + 시드 컨텍스트]

비판적 관점에서 분석하라.
반드시 대안 또는 출구를 함께 제시하라.
```

### Hacker 신규 템플릿 구조

```
[동일 프레이밍 패턴]

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/hacker.md 전문]
===

--- 교착 상태 컨텍스트 ---
[현재 교착 상태 설명 + 시도된 접근 목록]

비정통적 대안을 탐색하라.
기존 접근의 프레임을 벗어난 해결책을 제시하라.
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|---|---|---|
| brainstorming SKILL.md | Ouroboros agents/*.md (런타임 Read) | 서브에이전트 프롬프트 품질 |
| plan-stage SKILL.md | Ouroboros agents/*.md (런타임 Read) | 서브에이전트 프롬프트 품질 |
| orchestrator SKILL.md | Ouroboros agents/*.md (런타임 Read) | Evaluator QA 품질 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|---|---|---|---|---|
| 전문 주입 개선 방식 | 프레이밍 전환 (대안 C) | 외부 의존성 없음, 자동 동기화 유지 | 핵심 인라인화 (대안 A) | Ouroboros 버전업 시 수동 동기화 비용 |
| 구분자 | `===` | 물리적 경계로 LLM에 명확한 신호 | `---` (기존) | 기존 섹션 구분자와 혼동 가능 |
| 금지 문구 위치 | 템플릿 상단 (역할 정의 직전) | 프롬프트 구성 시 가장 먼저 인식 | 템플릿 하단 | 이미 내용을 요약한 뒤 읽힐 가능성 |

## 7. 제약조건과 가정

- dev-workflow는 코드 없는 문서 기반 플러그인 → SKILL.md만 수정 가능
- Ouroboros 에이전트 .md 파일은 외부 의존성 → 수정 불가
- Claude Agent 도구의 prompt 파라미터는 string 타입 → Claude가 텍스트를 "생성"하여 전달
- 2KB 수준의 verbatim 포함은 Claude의 능력 범위 안 (동일 세션에서 Ontologist 성공 사례로 입증)
- 프레이밍 전환으로 준수율이 유의미하게 향상될 것으로 가정 (100% 보장 불가)

## 8. 기술 가이드라인

1. 프레이밍 전환 패턴: `⚠️` 경고 + `===` 구분자 + "수정·요약·재구성하지 않고 파일 내용 그대로 포함" 명시
2. 모든 에이전트 호출 템플릿에 동일 패턴 일관 적용 (9개 지점 + 일반 규칙 1개)
3. 금지 문구는 역할 정의 직전에 배치 (프롬프트 구성 시 가장 먼저 인식되도록)
4. `===` 구분자는 기존 `---` 섹션 구분자와 혼동을 방지하기 위해 선택
5. Contrarian/Hacker 신규 템플릿은 Step C 맥락에 맞는 컨텍스트 섹션 포함

## 9. 구현 결과 및 일탈 사항
> 구현 완료 후 작성

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|---|---|---|---|
| 2026-03-26 | 초기 설계 문서 작성 | brainstorming, plan-stage, orchestrator | ready-for-plan |
