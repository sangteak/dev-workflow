---
feature: ouroboros-integration
category: dev-workflow
status: complete
created: 2026-03-25
last-updated: 2026-03-26
dependencies:
  - brainstorming (기존 스킬)
  - workflow-orchestrator (기존 스킬)
affects:
  - brainstorming
  - workflow-orchestrator
  - plan-stage
  - document-consolidation (v2)
---

# Ouroboros Integration 설계 문서

> 한 줄 요약: Ouroboros 플러그인을 사고 엔진으로 활용하여 dev-workflow 브레인스토밍의 수긍 편향, 조기 수렴, 표면적 요구사항 수용 문제를 해결한다.

## 1. 배경과 동기

dev-workflow의 브레인스토밍은 페르소나 기반 피드백 루프로 동작하지만, 5가지 구조적 약점이 있다:

1. **수긍 편향** — 같은 Claude가 여러 페르소나를 연기하므로 자연스럽게 합의로 수렴
2. **조기 수렴** — 해결책 제안이 너무 빠르고, "충분히 탐색했는가?" 판단 기준 없음
3. **표면적 요구사항** — 사용자 말을 그대로 수용, 숨겨진 가정/진짜 니즈 노출 메커니즘 부재
4. **국면 전환 근거 없음** — 사용자의 감으로 전환, 구조적 판단 프레임워크 없음
5. **phase 간 일관성** — 국면이 진행되면서 원래 의도가 유실되는 추적 메커니즘 부재

Ouroboros 플러그인은 이 문제들을 해결하는 검증된 메커니즘(Socratic Interview, 에이전트 분리, 모호성 점수, 드리프트 감지)을 이미 보유하고 있다. 이를 재구축하지 않고 **조합하여 활용**한다.

## 2. 목표와 비목표

### 목표
- GOAL-001: Ouroboros의 에이전트를 서브에이전트로 활용하여 페르소나의 사고 품질 강화
- GOAL-002: 시드(Seed) 개념 도입으로 요구사항의 구조적 추적 체계 수립
- GOAL-003: 소크라테스식 인터뷰 단계 도입으로 표면적 요구사항 관행 타파
- GOAL-004: 명확도 체크리스트 도입으로 국면 전환에 구조적 근거 제공
- GOAL-005: Ouroboros 미설치 시에도 현재 대비 개선된 경험 제공 (Path C)

### 비목표
- Ouroboros의 기능을 dev-workflow 내부에 복제하지 않는다
- 자체 MCP 서버를 구축하지 않는다
- Ouroboros를 필수 의존성으로 만들지 않는다 (선택적 향상)
- 국면 2~4의 Ouroboros 연동은 MVP에 포함하지 않는다 (v2)

## 3. 확정된 요구사항

### MVP (v1)
- REQ-001: 국면 1에 Step A(인터뷰)/B(시드 추출)/C(확장 토론) 3단계 구조 도입 — 우선순위: HIGH
- REQ-002: 세션 시작 시 Ouroboros 존재 자동 감지 및 Path A/B/C 결정 — 우선순위: HIGH
- REQ-003: 시드 표준 형식(YAML) 템플릿 제공 — 우선순위: HIGH
- REQ-004: Step B에서 시드 추출 후 사용자 확인 필수화 — 우선순위: HIGH
- REQ-005: 명확도 체크리스트(✅/⚠️/❌) 국면 전환 시 표시 — 우선순위: MEDIUM
- REQ-006: Enhanced Mode에서 Ouroboros Socratic Agent를 서브에이전트로 실행하여 인터뷰 질문 생성 — 우선순위: HIGH
- REQ-007: Enhanced Mode에서 Contrarian/Hacker 에이전트를 선택적 서브에이전트로 투입 — 우선순위: MEDIUM
- REQ-008: Standalone Mode(Path C)에서 내장 소크라테스 질문 패턴(WHY-CHAIN, COUNTERFACTUAL, BOUNDARY, ESSENCE) 적용 — 우선순위: HIGH
- REQ-009: phase1 파일에 시드 + 명확도 체크리스트 포함 — 우선순위: MEDIUM
- REQ-010: 토론 리드 시스템 제거 — 비판은 라운드 로빈 + 에이전트 서브에이전트로 대체 — 우선순위: HIGH
- REQ-011: 에이전트 매칭은 2규칙 체계 (Step이 기본 에이전트 결정 + 비판 슬롯만 서브에이전트) — 우선순위: HIGH

### v2 (후속)
- REQ-012: Path A에서 Ouroboros MCP 도구(validate_seed, gate_transition, detect_drift) 직접 호출 — 우선순위: MEDIUM
- REQ-013: 국면 2~3에 Ouroboros 에이전트 매핑 확장 (국면 2: Ontologist, 국면 3: Simplifier) — 우선순위: LOW
- REQ-014: document-consolidation에 시드→설계문서 매핑 추가 — 우선순위: LOW
- REQ-015: PostToolUse 훅으로 실시간 드리프트 감지 — 우선순위: LOW

## 4. 설계 개요

### 아키텍처

```
dev-workflow (오케스트레이터)
│
├── workflow-orchestrator
│   └── Session Start: Ouroboros Detection (Path A/B/C 결정)
│
├── brainstorming (핵심 변경)
│   ├── 국면 1 Step A: 인터뷰
│   │   📎 Enhanced: Ouroboros Socratic Agent × 페르소나 (서브에이전트)
│   │   Standalone: 내장 소크라테스 질문 패턴
│   ├── 국면 1 Step B: 시드 추출
│   │   📎 Enhanced: seed-architect 패턴 차용
│   │   Standalone: 인라인 템플릿
│   ├── 국면 1 Step C: 확장 토론
│   │   📎 Enhanced: 선택적 Contrarian/Hacker 서브에이전트
│   │   Standalone: 기존 라운드 로빈 + DO/DON'T 강화
│   └── 국면 2~4: 기존 유지 (v2에서 확장)
│
└── Ouroboros (외부 플러그인, 선택적 의존성)
    ├── agents/*.md (Socratic, Contrarian, Hacker 등)
    ├── MCP 도구 (v2에서 활용)
    └── hooks (v2에서 연동)
```

### 핵심 원리: 페르소나 × 에이전트 합성

```
페르소나 = 도메인 (무엇을 사고하는가)
  예: 🎮 Game Designer, 👤 Player, 🔧 TD

Ouroboros 에이전트 = 사고방식 (어떻게 사고하는가)
  예: Socratic Interviewer, Contrarian, Hacker

합성 = 서브에이전트가 에이전트 역할 정의를 읽고 + 페르소나 도메인 컨텍스트를 주입
  결과: "게임 디자인 관점의 소크라테스식 질문"
```

**곱셈 효과:** 페르소나 N개 × 에이전트 M개 = N×M 고유 사고 조합.
같은 페르소나라도 에이전트에 따라 산출물이 완전히 달라진다:

```
🎮 Game Designer × Socratic    → 질문 (가정 노출)
🎮 Game Designer × Contrarian  → 반론 (아이디어 스트레스 테스트)
🎮 Game Designer × Researcher  → 사례 (다른 게임에서 어떻게 했는지)
```

같은 에이전트라도 페르소나에 따라 다른 영역을 탐색한다:

```
Contrarian × 🎮 Game Designer  → "이게 재미있을 거라는 가정이 틀리면?"
Contrarian × 👤 Player         → "사용자가 정말 이걸 원할까?"
Contrarian × 🔧 TD             → "이 기술 선택이 오히려 독이 되면?"
```

### 에이전트 매칭 전략

2가지 규칙으로 매칭을 결정한다:

**규칙 1 — Step이 기본 에이전트를 결정한다 (고정)**

| Step | 기본 에이전트 | 적용 범위 |
|---|---|---|
| Step A (인터뷰) | Socratic Interviewer | 전원 적용 |
| Step B (시드 추출) | 없음 (추출 작업) | - |
| Step C (확장 토론) | 없음 (자유 토론) | 비판 슬롯만 Contrarian |

**규칙 2 — 비판 담당 페르소나만 서브에이전트로 실행한다**

- Step A: 전원 서브에이전트 (Socratic이라 해결책 제안 차단 필요)
- Step C: 비판 담당만 서브에이전트 (나머지는 메인 컨텍스트)

```
국면 1 Step C 예시:

  [라운드 1] [비판: 👤 Player]
    👤 Player × Contrarian       ← 서브에이전트 (독립 컨텍스트)
    🎮 Game Designer: 자유 발언   ← 메인 컨텍스트

  [라운드 2] [비판: 🎮 Game Designer]
    🎮 Game Designer × Contrarian ← 서브에이전트 (독립 컨텍스트)
    👤 Player: 자유 발언           ← 메인 컨텍스트
```

**v2 확장 시 에이전트 종류만 교체:**

| 국면 | 비판 슬롯 에이전트 |
|---|---|
| 국면 1 Step C | Contrarian |
| 국면 2 (v2) | Ontologist |
| 국면 3 (v2) | Simplifier |

### 토론 리드 시스템 제거

Ouroboros 통합으로 기존 "토론 리드" 시스템은 **제거**한다.

리드 시스템의 원래 목적(비판 비중 강화, 토론 방향 주도)이 구조적으로 대체되었기 때문이다:

| 리드의 기능 | 대체 메커니즘 |
|---|---|
| 비판적 비중 강화 | Contrarian 서브에이전트가 독립 컨텍스트에서 구조적으로 비판 |
| 토론 방향 주도 | Step A/B/C가 국면 내 방향을 구조적으로 결정 |
| 다양성 확보 | 라운드 로빈 비판 담당 순환 (기존 유지) |

**삭제 대상 (brainstorming SKILL.md):**
- "매 주제 시작 시 사용자에게 토론 리드를 묻는다"
- "리드 선택 시: 선정 이유를 한 줄로 명시하고, 비판적 비중을 약간 높게 가져간다"
- "같은 페르소나가 연속 2회 리드하지 않는다"
- "비판적 사고 방향성: 비판 60% / 건설적 40%"

**유지 대상:**
- 라운드 로빈 비판 담당 순환
- `[비판: 🏛️ 페르소나명]` 표기
- "비판 시 반드시 대안 또는 출구를 함께 제시"
- 최대 3회 루프 제한

### 3단계 폴백 구조

| Path | 조건 | 기능 수준 |
|---|---|---|
| A | Ouroboros 설치 + MCP 활성화 | 풀 기능 (서브에이전트 + MCP 도구) |
| B | Ouroboros 설치 + MCP 비활성화 | 서브에이전트만 (agents/*.md 직접 읽기) |
| C | Ouroboros 미설치 | Standalone (내장 질문 패턴 + 시드 템플릿) |

Path C에서도 시드 개념과 소크라테스 질문 패턴이 텍스트 수준으로 적용되어, 현재 대비 개선된다.

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|---|---|---|
| brainstorming (변경) | workflow-orchestrator (Path 정보) | phase1 파일 형식 |
| workflow-orchestrator (변경) | Ouroboros 플러그인 (선택적) | brainstorming (Path 전달) |
| templates/seed.yaml (신규) | 없음 | brainstorming (참조) |
| document-consolidation (v2) | 시드 형식 | 설계 문서 생성 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|---|---|---|---|---|
| Ouroboros 기능 활용 방식 | 외부 플러그인으로 참조 | 바퀴 재발명 방지, 유지보수 비용 0 | 자체 MCP 서버 구축 | 200~300줄 코드 + 유지보수 부담 |
| 에이전트 합성 방식 | 서브에이전트 파이프라인 | 독립 컨텍스트에서 행동 제약 작동 | 프롬프트 합성 | 행동 제약(도구 차단) 미작동 |
| 비판적 사고 구현 | 선택적 서브에이전트 | 핵심 검증만 깊이, 일반 토론은 빠르게 | 모든 페르소나 서브에이전트화 | 응답 시간 과다 |
| 국면 전환 판단 | 명확도 체크리스트 | Markdown 스킬에서 구현 가능 | 프로그래밍적 게이트 | MCP 필요 (v2) |
| 폴백 전략 | 3단계 (Path A/B/C) | 모든 사용자 환경 대응 | 2단계 (있다/없다) | MCP만 없는 경우 미대응 |
| 에이전트 매칭 | Step 기반 고정 + 비판 슬롯 | 단순, 예측 가능, 기존 라운드 로빈과 자연 결합 | 동적 상황 판단 | Markdown 스킬에서 비결정적 |
| 토론 리드 | 제거 | 서브에이전트 + Step 구조가 리드의 모든 기능 대체 | 유지 (Path C만) | SKILL.md 복잡도 증가 (Path별 분기 추가) |

## 7. 제약조건과 가정

### 제약조건
- dev-workflow는 Markdown 스킬 플러그인이므로, 프로그래밍적 게이트 강제는 MCP 없이 불가
- 서브에이전트 실행은 Agent 도구에 의존하며, 병렬 실행 시 응답 시간 증가
- Ouroboros 에이전트 파일의 경로가 OS/설치 방식에 따라 다를 수 있음

### 가정 (검증됨)
- Claude Code Agent 도구로 실행된 서브에이전트는 파일 시스템 접근 가능 ✅
- 두 플러그인의 hooks는 순차 실행되며 충돌하지 않음 ✅
- MCP 서버는 동시 요청을 큐 처리하며 데드락 없음 ✅

### 가정 (완화 조치)
- Ouroboros MCP 도구명이 변경될 수 있음 → ToolSearch 동적 탐색 + 폴백
- 사용자의 두 플러그인 관리 부담 → 선택적 의존성 + 자동 감지

## 8. 기술 가이드라인

### SKILL.md 작성 규칙
- Enhanced/Standalone 분기는 📎 마커로 가시화
- Path 결정은 상단에서 1회, 이후 마커로 참조
- 기존 규칙(TD 침묵, 최대 2개 질문 등)은 Step C에 그대로 유지
- 새로운 Step A/B는 기존 국면 1 앞에 추가되는 구조 (기존 삭제 없음)

### 소크라테스 질문 패턴 (Path C 내장용)
```
WHY-CHAIN: "왜 X가 필요한가?" → 답변 → "그 이유는 왜 중요한가?" (3단계)
COUNTERFACTUAL: "X가 없다면 무엇이 달라지는가?"
BOUNDARY: "X가 절대 해서는 안 되는 것은?"
ESSENCE: "이것은 진짜 무엇인가? 본질은?"
```

### 시드 추출 후 사용자 확인 형식
```
── 시드 추출 결과 ────────────────────────────
  Goal: [핵심 목표]
  Constraints: [제약조건 목록]
  Non-goals: [비목표 목록]
  Success Criteria: [성공 기준]
  Assumptions: [노출된 가정]
  Open Questions: [미해결 질문]

  이것이 핵심 요구사항입니다. 맞습니까?
  1. Yes
  2. 수정이 필요하다
───────────────────────────────────────────────
```

### 명확도 체크리스트 형식
```
── 명확도 체크 ────────────────────────────────
  ✅ Goal Clarity: [상태 설명]
  ⚠️ Constraint Clarity: [상태 설명]
  ❌ Success Criteria: [상태 설명]
  → 다음 국면 집중 영역: [목록]
───────────────────────────────────────────────
```

## 9. 구현 결과 및 일탈 사항

### 변경된 스킬 파일

| 스킬 | 변경 유형 | 핵심 변경 |
|---|---|---|
| workflow-orchestrator | 수정 | Session Start Protocol Step 3.5 추가 (Ouroboros Detection, Path A/B/C 결정) |
| brainstorming | 대폭 수정 | 국면 1에 Step A/B/C 3단계 구조 삽입, 에이전트 매칭, 토론 리드 제거 |
| plan-stage | 수정 | Step 2에 Architect 서브에이전트, Step 3에 Researcher 서브에이전트 추가 |

### 설계 대비 일탈 사항

**1. MVP 범위 확대 — plan-stage 에이전트 통합**

설계 문서에서는 REQ-013(국면 2~3 에이전트 확장)을 v2로 분류했으나, 구현 시 plan-stage에 Architect(구조적 리스크 분석)와 Researcher(CAUTION 항목 조사)를 MVP에 포함했다. plan-stage는 국면이 아닌 별도 단계이므로 v2 범위(국면 2~4)와 직접 겹치지 않으며, 실현 가능성 평가의 품질 향상 효과가 명확하여 선적용했다.

**2. MVP 범위 확대 — brainstorming 추가 에이전트 통합**

설계 초안에서 Ontologist(본질 질문), Simplifier(스코프 정리)를 v2 후보로 언급했으나, 구현 시 국면 1에 포함했다:
- **Step A-0 (본질 질문):** 요구사항이 솔루션 중심일 때 Ontologist 서브에이전트로 본질/근본원인/전제조건/숨겨진 가정을 탐색
- **Simplifier 스코프 정리:** 요구사항 ≥8건 또는 ⚠️/❌ ≥3건일 때 핵심/선택 분류 + YAGNI 축소 제안

두 에이전트 모두 조건부 트리거(항상 실행되지 않음)로 구현되어 오버헤드가 제한적이며, 브레인스토밍 품질에 직접 기여하므로 선적용했다.

**3. Seed-Architect 직접 통합**

설계에서는 Step B의 시드 추출을 "seed-architect 패턴 차용"으로 기술했으나, 구현에서는 Seed-Architect를 정식 서브에이전트로 투입하여 YAML 구조화를 독립 컨텍스트에서 수행하도록 했다. 패턴 차용보다 에이전트 직접 실행이 일관성(다른 Step과 동일한 서브에이전트 패턴) 면에서 우수했다.

### 구현된 에이전트 매핑 (최종)

| 스킬 | Step/단계 | 에이전트 | 트리거 조건 |
|---|---|---|---|
| brainstorming | Step A-0 (본질 질문) | Ontologist | 요구사항이 솔루션 중심일 때 |
| brainstorming | Step A (인터뷰) | Socratic Interviewer | 항상 |
| brainstorming | Step B (시드 추출) | Seed-Architect | 항상 |
| brainstorming | Step C (확장 토론) | Contrarian (비판 슬롯) | 항상 |
| brainstorming | Step C (교착 해소) | Hacker | 교착 감지 시 |
| brainstorming | 국면 1→2 전환 | Simplifier | 요구사항 ≥8 또는 ⚠️/❌ ≥3 |
| plan-stage | Step 2 (실현 가능성) | Architect | 항상 |
| plan-stage | Step 3 (조사) | Researcher | CAUTION/RENEGOTIATE 항목 존재 시 |

### Path C (Standalone) 구현

Ouroboros 미설치 환경에서의 폴백이 설계대로 구현되었다:
- 소크라테스 질문 패턴(WHY-CHAIN, COUNTERFACTUAL, BOUNDARY, ESSENCE) 내장
- 시드 YAML 인라인 템플릿 제공
- 명확도 체크리스트 동일 적용
- Step C에서 DO/DON'T 제약 기반 비판 (서브에이전트 없이)

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|---|---|---|---|
| 2026-03-25 | 초안 작성 (브레인스토밍 완료) | brainstorming, workflow-orchestrator | ready-for-plan |
| 2026-03-25 | 에이전트 매칭 전략(2규칙 체계) 추가, 토론 리드 시스템 제거 결정, 곱셈 효과 설명 보강 | brainstorming 페르소나 피드백 루프 | ready-for-plan |
| 2026-03-26 | v1 MVP 구현 완료. plan-stage 에이전트 통합, Ontologist/Simplifier/Seed-Architect 선적용 | brainstorming, plan-stage, workflow-orchestrator | complete |
| 2026-03-26 | Section 9 (구현 결과 및 일탈) 작성, affects에 plan-stage 추가 | 설계 문서 | complete |
