---
phase: 1
title: 탐색 (Exploration)
feature: project-rules-injection
category: dev-workflow
created: 2026-05-14
immutable: true
---

# Phase 1: 탐색 (Exploration)

## 확정된 페르소나 구성

- 🛠️ Claude Code Expert — Claude Code 플랫폼 제약, 스킬/훅/플러그인 메커니즘 관점
- 🎯 Workflow Designer — 워크플로우 UX, 단계 흐름, 페르소나 상호작용 설계 관점
- 🔍 Ecosystem Analyst — 경쟁 플러그인 비교, 생태계 트렌드 분석 (Phase 3 활성화 예정)

## 사용자 초기 요구사항

> dev-workflow를 이용해 이미 코딩 규칙 및 프로젝트 개발에 필요한 다양한 정책과 도구가 제공되는 상황에서 이걸 직접적으로 주입할 수 있는 방법이 없는거 같아. 그래서 `.claude/rules` 등의 디렉토리에 coding-style.md, workflow.md 와 같이 특정 규칙들을 설정하면 이것들을 dev-workflow에 주입됐으면 해. (...) 부담 없이 하네스를 구성하고 사용할 수 있게 하고 싶어.

## Step A-0: 본질 질문 (Ontologist)

| 관점 | 질문 | 답변 요약 |
|---|---|---|
| Essence | 단순 전달 vs 강제(enforcement)? | **강제**. 특히 코딩 스타일 중심 |
| Root Cause | CLAUDE.md 비대화의 진짜 통증? | 도메인 분리 + 직접 주입 이점 있을 때만. 이점 없으면 CLAUDE.md 유지 |
| Prerequisites | 어느 시점에 주입? | DEVELOP 단계 (Superpowers 코딩 시점) + 커밋 시점 |
| Hidden Assumptions | Claude Code 책임 vs dev-workflow 책임? | 페르소나 토론으로 검증됨 → dev-workflow 책임 |

## 미답변 질문 조사 결과 (Hidden Assumptions)

### Claude Code 기존 메커니즘 점검 (확신도: 높음)
- CLAUDE.md `@import`: 수동 명시 필요, glob 자동 발견 불가
- Skills description 트리거: 워크플로우 스킬 실행 중 자동 활성화 보장 안 됨
- **SessionStart 훅 `additionalContext`만이 자동 주입 경로**
- Memory 시스템: 특정 파일 자동 로드 불가

### 유사 플러그인 사례 (확신도: 중간)
| 플러그인 | 메커니즘 | 한계 |
|---|---|---|
| feature-dev (89K+) | CLAUDE.md만, Phase 6에서만 검사 | 단계별 강제 없음 |
| Superpowers | "기존 코드 패턴 관찰" 추론 방식 | 명시적 규칙 파일 미사용 |
| hookify (Anthropic) | `.claude/hookify.*.local.md` + event hooks | 가장 자동화됨 |
| centminmod 템플릿 | `.claude/rules/core-rules.md` 분리 | 단계 매핑 없음 |
| clauroboros | 스킬 본문에 가이드라인 번들 | 프로젝트별 분리 불가 |

**dev-workflow 차별화 포인트:**
- 단계별 규칙 슬라이스 주입 (BRAINSTORM/PLAN/DEVELOP/REVIEW마다 다른 규칙) — 어떤 플러그인도 미구현
- 페르소나-규칙 매핑 (Architect는 아키텍처 규칙, PM은 커밋 규칙)

### Superpowers/Ouroboros 연동 검증 (확신도: 높음)
- DEVELOP: `subagent-driven-development` 호출 시 컨텍스트 전달 패턴 존재 → 규칙 첨부 가능
- PLAN: Architect/Researcher 호출 시 컨텍스트 임베드 패턴 존재
- REVIEW: Evaluator AC에 규칙 준수 추가 가능
- **불가능**: git pre-commit 훅 레벨 강제 (Superpowers 내부 수정 필요)

### 신뢰성 검토 (확신도: 높음)
- SessionStart `additionalContext`: 매 세션 재실행, 위치 상단 → 신뢰도 중간~높음
- **서브에이전트 컨텍스트 미상속**: 가장 큰 리스크 (working directory의 CLAUDE.md는 자동 로드되나 행동 강제 없음)
- Lost-in-the-middle 위험 인정됨
- PreToolUse 훅이 가장 강한 강제력 (v1 범위 외)

## Phase 1 페르소나 토론 결과

### Round 1 (비판 담당: 🎯 Workflow Designer / Contrarian)

**사용자 제안:** "Superpowers 작업 마무리 후 코딩 스타일 검증/수정 단계 추가"

**Workflow Designer 비판:**
- 새 6번째 단계는 책임 분리의 위장된 중복 — REVIEW의 Evaluator AC에 한 줄 추가로 충분
- 단계는 늘리기 쉽고 줄이기 정치적으로 불가능
- 자동 수정 위험: 포매팅과 시맨틱 경계 모호 → 검증이 검토를 부르는 자동화의 역설
- 대안: (1) DEVELOP 사전 보강, (2) REVIEW code-review 호출에 규칙 전달, (3) Evaluator AC 통합

**Claude Code Expert 의견:**
- 사전 강제가 항상 싸다는 원칙 동의
- 단, Evaluator AC 한 줄 통합으로 끝낼 수 없음 — 자연어 규칙은 별도 reviewer 컨텍스트가 적합
- code-reviewer가 자연어 평가, Evaluator가 정량 판정 → 자연스러운 분담

**합의:**
- 신규 6번째 단계 신설 안 함 → REVIEW 강화로 흡수
- DEVELOP에서 Superpowers Implementer 호출 시 코딩 규칙 사전 첨부
- REVIEW에서 type 메타데이터로 검증자 라우팅 (semantic→code-reviewer, quantitative/structural→Evaluator)
- 자동 수정 라운드 옵션화 (auto-fix 메타데이터)

## Phase 1 사용자 결정

1. ✅ **옵션 B**: REVIEW 강화로 흡수 (별도 단계 추가 안 함)
2. ✅ **자동 수정 포함**
3. ✅ **검증자 분담**: 현재 구조 유지 + frontmatter 메타데이터로 라우팅 명시

## Open Questions 해소 (Phase 1 종료 직전 처리)

| OQ | 결정 |
|---|---|
| OQ1. SessionStart 훅 통합 vs 분리 | **분리** — 새 훅 `hooks/inject-rules` 독립 |
| OQ2. Superpowers 확장 지점 | dev-workflow workflow-orchestrator SKILL에 컨트롤러 가이드 명시 (Superpowers 미수정) |
| OQ3. Evaluator AC 입력 포맷 | **자연어 AC**로 통합. 별도 DSL 없음 |
| OQ4. auto-fix: confirm UX | 번호 선택 패턴 (AskUserQuestion 도구 금지) |
| OQ5. applies-to v1 범위 | `develop`, `review`, `completion`, `all` (PLAN/BRAINSTORM은 v2) |
| OQ6. 3중 노출 관리 | 단계별 필터링 — `all` 규칙은 SessionStart만, 단계 특화는 1차+2차 모두 |
| OQ7. 폴백 동작 | 조용히 skip (Unix 철학) |

## 사용자 본질 질문 (Phase 1 마무리 직전)

> "CLAUDE.md에 'YOU MUST docs/team_standards.md 읽어라' 적으면 같은 효과?"

**결론:** "메인+서브에이전트 모두 명령을 인지하지만, '인지'와 '행동 강제'는 별개. dev-workflow 메커니즘은 인지가 아닌 행동/자동화를 보장한다."

CLAUDE.md "YOU MUST"가 제공하지 못하는 것:
- 행동 강제 (Read 호출 보장)
- 단계별 적시 재강조
- 자동 검증 + 자동 수정 라운드
- frontmatter 정밀 제어

→ 사용자 결정: **시드 유지, 가치 정당화 인정**.

## Phase 1 확정 시드

```yaml
goal: ".claude/rules/*.md 도메인 규칙 파일을 dev-workflow가 자동 주입·전파·검증하는 3계층 Defense in Depth 메커니즘을 구현하여, CLAUDE.md 비대화 없이 코딩 규칙을 강제한다"

constraints:
  - "dev-workflow는 코드 없는 Markdown 스킬 플러그인 형식 유지 (모든 로직은 skills/*/SKILL.md)"
  - "기존 5단계 워크플로우(BRAINSTORM → PLAN → DEVELOP → REVIEW → COMPLETION) 변경 없음"
  - "Superpowers(subagent-driven-development, requesting-code-review) 위임 패턴 유지"
  - "자동 주입은 Claude Code SessionStart 훅의 additionalContext만 사용 (v1)"
  - "규칙 파일은 frontmatter(type/applies-to/auto-fix)로 검증자 라우팅"
  - "서브에이전트는 메인 컨텍스트 비상속이므로 호출 프롬프트에 규칙 명시 첨부"
  - "MAJOR 버전 업 없도록 후방 호환 유지"
  - "applies-to v1 범위: develop, review, completion, all"
  - "SessionStart 훅은 기존 orchestrator 훅과 분리하여 독립 스크립트"
  - "Evaluator는 자연어 AC만 사용 (별도 DSL 없음)"
  - "Superpowers 확장은 workflow-orchestrator SKILL의 컨트롤러 가이드 명시로 구현"

non_goals:
  - "워크플로우 6번째 단계 신설 안 함 (REVIEW 강화로 흡수)"
  - "pre-commit git hook 레벨 강제 안 함"
  - "시맨틱 규칙의 100% 강제 보장 안 함 (LLM 판단 의존)"
  - "PreToolUse/UserPromptSubmit 훅 추가 안 함 (v2 검토)"
  - "CLAUDE.md 대체 안 함 (도메인 분리 이점 있는 규칙만 .claude/rules/로 이동)"
  - "Claude Code 외 IDE/도구로 규칙 강제 안 함"
  - "applies-to에 PLAN/BRAINSTORM 단계 포함 안 함 (v2)"

success_criteria:
  - ".claude/rules/*.md 존재 시 SessionStart에 자동 주입 (훅 로그 검증)"
  - "DEVELOP에서 Superpowers 호출 시 applies-to 매칭 규칙이 서브에이전트 프롬프트에 명시 첨부"
  - "REVIEW에서 type 메타데이터로 검증자 라우팅 (semantic→code-reviewer, quantitative/structural→Evaluator)"
  - "위반 검출 시 auto-fix 메타데이터에 따라 자동 수정 라운드 실행"
  - "규칙 파일 없는 기존 프로젝트도 동일 동작 (후방 호환)"
  - "샘플 규칙 1개 + 정량 규칙 1개 + 통합 테스트 시나리오가 docs/design/ 하위에 작성"

assumptions:
  - "SessionStart additionalContext는 컨텍스트 최상위 배치되어 lost-in-the-middle 최소화"
  - "dev-workflow가 Superpowers 호출 시 컨트롤러 위치에서 프롬프트 가공 가능 (확장 지점)"
  - "Ouroboros Evaluator AC는 자연어로 받아 자동 검증 가능"
  - "규칙 파일 5~10개 수준으로 컨텍스트 위협 없음"
  - "사용자는 frontmatter 규약 학습 의지 있음"
  - "코딩 스타일 강제가 주된 동기, 다른 도메인은 후속 확장"

open_questions: []  # Phase 1에서 모두 해소

context: |
  dev-workflow 사용자가 프로젝트별 코딩 규칙(특히 스타일)을 CLAUDE.md에 누적할수록 파일이 비대해지고
  모든 컨텍스트에 무차별 주입되는 문제를 겪고 있다.

  해결책은 .claude/rules/*.md로 도메인 분리하고, dev-workflow가 (1) SessionStart 훅 자동 주입,
  (2) Superpowers/Ouroboros 서브에이전트 호출 시 프롬프트 명시 전파, (3) REVIEW 단계 위반 검증 +
  자동 수정 라운드를 수행하는 Defense in Depth 3계층 메커니즘이다.

  CLAUDE.md "YOU MUST" 패턴이 명령 인지는 보장하지만 행동 강제는 별개라는 점,
  서브에이전트 컨텍스트 비상속이 가장 큰 리스크라는 점이 조사로 확인되었다.
  dev-workflow의 가치는 단계별 적시 재강조 + 자동 검증/수정 + frontmatter 정밀 제어에 있다.
```

## 명확도 체크 (Phase 1 종료 시점)

- ✅ **Goal Clarity** — 3계층 메커니즘으로 구체화, 측정 가능
- ✅ **Constraint Clarity** — 기술 제약 + 비목표 명확
- ⚠️ **Success Criteria** — v1 시드로는 충분, 구현 디테일은 Phase 2~3에서 확정

**Ambiguity Score: 0.18** (임계값 0.2 이하 — 진행 가능)

## Phase 1에서 명시적으로 제외된 항목

| 항목 | 제외 이유 |
|---|---|
| 6번째 워크플로우 단계 | UX 비용, REVIEW 강화로 흡수 가능 |
| pre-commit git hook 강제 | Superpowers 내부 수정 필요, 범위 외 |
| PreToolUse/UserPromptSubmit 훅 | v2 검토, v1은 SessionStart만 |
| PLAN/BRAINSTORM 단계 규칙 적용 | 코드 작성 전 단계라 가치 낮음 |
| 100% 강제 보장 | LLM 판단 의존 불가피, best-effort만 |
| Claude Code 외부 도구 강제 | dev-workflow 범위 외 |
