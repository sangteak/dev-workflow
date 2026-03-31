# Quick Start 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** README.md의 Quick Start 섹션을 실제 대화 흐름(알림/푸시 기능 추가 예시) 기반으로 재작성하여 dev-workflow 사용법을 직관적으로 전달한다.

**Architecture:** README.md 단일 파일 수정. Quick Start 섹션(164~288행)을 BRAINSTORM / PLAN 서브섹션 구조로 교체하고, 주요 시나리오의 도메인 참조를 알림 기반으로 업데이트한다.

**Tech Stack:** Markdown (README.md)

---

## File Structure

- Modify: `README.md:164-288` — Quick Start 섹션 전체 교체 + 주요 시나리오 도메인 참조 수정

---

### Task 1: Quick Start 섹션 헤더 + BRAINSTORM 서브섹션 작성

**Files:**
- Modify: `README.md:164-193` (현재 Quick Start 상단 ~ [BRAINSTORM] 블록)

- [ ] **Step 1: Quick Start 헤더 ~ BRAINSTORM 서브섹션으로 교체**

`README.md`의 164~193행을 아래 내용으로 교체한다:

```markdown
## Quick Start

> 설치는 [Installation](#installation)을 먼저 참조하세요.
> Ouroboros Enhanced Mode 기준 예시입니다. Standalone Mode에서는 Ouroboros 관련 출력이 표시되지 않습니다.

### BRAINSTORM

새 Claude Code 세션을 시작하면 dev-workflow가 작업 상태를 자동 감지합니다:

```
📋 진행 중인 작업이 없습니다.

  0. ✨ 새 작업 시작

새 작업을 시작하세요.
```

**사용자:** 알림 기능을 추가하려 해. 요구사항은 이래:
- 알림 타입: 이메일, 푸시, SMS
- 사용자별 알림 설정 (채널 선택, 수신 여부)
- 채널별 실패 시 재시도 (채널마다 정책 다름)
- 알림 이력 30일 보관 (감사용 + 사용자 표시용 분리)

```
✅ 페르소나 확정:
  👤 Product Manager / 🔧 Backend Engineer / 📱 Client Developer (국면3 활성화)
🔗 Ouroboros 연동: Enhanced Mode
```

🔬 **본질 질문 [Ontologist]:**
> **[Essence]** 알림이 진짜 무엇인가 — 정보를 전달하는 채널인가,
> 아니면 사용자와 시스템 간 **신뢰 계약**인가?

📋 **핵심 질문 [에이전트: Socratic]:**

1. **[채널 설정]** 알림 설정을 "끄는" 사용자가 원하는 것은 알림 자체를 안 받겠다는 것인가,
   아니면 특정 채널/타입의 알림만 차단하겠다는 것인가?
   > 힌트: 마케팅 알림과 보안 알림의 수신 정책이 같아야 하는가?

2. **[재시도 정책]** "실패"의 판정 기준은 무엇인가? 네트워크 오류와 수신자 미존재를
   같은 방식으로 처리하는가?
   > 힌트: SMS 재시도 3회는 비용 3배를 의미한다.

**사용자:** 1번: 채널 선택 — 이메일은 받고 푸시는 끄는 식. 타입별로도 설정 가능해야 해.
2번: 네트워크 오류만 재시도, 수신자 없으면 즉시 실패. 채널마다 재시도 횟수 달라도 돼.

[라운드 1/3] [비판: 🔧 Backend Engineer] [에이전트: Contrarian]

👤 **Product Manager** [Socratic]:
> 채널 × 알림 타입 매트릭스 설정이라면 UI 복잡도가 올라갑니다.
> 사용자가 실제로 이 세분화가 필요한가요, 아니면 "알림 끄기"로 충분한 사용자가 더 많지 않을까요?

🔧 **Backend Engineer** [Contrarian]:
> 재시도 정책을 채널별로 분리하면 알림 발송 로직이 채널 어댑터 패턴으로 가야 합니다.
> 이미 이 패턴을 쓰고 있다면 괜찮지만, 아니라면 지금 설계해야 합니다 — 나중에 추가하면 비용이 큽니다.

📱 **Client Developer** [Socratic]:
> 30일 이력을 사용자에게 보여줄 때 어떤 정보를 표시하나요?
> "발송 성공/실패 여부"와 "사용자가 읽었는지 여부"는 다른 데이터입니다.

**합의:** 알림 설정은 `(사용자 × 채널 × 알림 타입)` 3중 매트릭스로 설계.
채널 어댑터 패턴 도입. 이력은 감사용(서버 내부) + 사용자 표시용(30일 읽음 여부 포함) 분리.
```

- [ ] **Step 2: 시각적 검토**

README.md를 열어 BRAINSTORM 서브섹션이 올바르게 렌더링되는지 확인한다:
- 코드블록이 정상적으로 닫혔는가
- 페르소나 이모지가 모두 표시되는가
- [라운드 1/3] 태그 형식이 brainstorming 스킬 포맷과 일치하는가

---

### Task 2: PLAN 서브섹션 작성 + DEVELOP/REVIEW/COMPLETION 제거

**Files:**
- Modify: `README.md:194-288` (현재 [PLAN] ~ 주요 시나리오 이전)

- [ ] **Step 1: PLAN 서브섹션으로 교체 (DEVELOP/REVIEW/COMPLETION 제거)**

`README.md`의 194~244행을 아래 내용으로 교체한다:

```markdown
### PLAN

```
── Feasibility Assessment ────────────────────────────

[채널별 재시도 정책 (채널 어댑터 패턴)]
  👤 Product Manager: ✅ 비즈니스 요구사항과 일치
  🔧 Backend Engineer: ✅ 채널 어댑터로 확장성 확보 가능
  📱 Client Developer: ✅ 클라이언트 영향 없음
  → 종합 판정: ✅ FEASIBLE

[알림 설정 3중 매트릭스 (사용자 × 채널 × 타입)]
  👤 Product Manager: ⚠️ 설정 UI 복잡도 증가 — 초기 스코프 조정 검토
  🔧 Backend Engineer: ✅ DB 스키마로 표현 가능, 조회 성능 인덱싱 필요
  📱 Client Developer: ⚠️ 설정 동기화 로직 복잡도 증가
  → 종합 판정: ⚠️ CAUTION — 초기 릴리스는 채널 단위만, 타입별 설정은 v2

── 판정 요약 ──────────────────────────────────────────
✅ FEASIBLE:    1개
⚠️ CAUTION:     1개
🚫 RENEGOTIATE: 0개
──────────────────────────────────────────────────────
```

→ plan.md 생성 완료: `docs/design/your-project/notification-feature/plan.md`

---

> DEVELOP → REVIEW → COMPLETION 단계는 [Workflow Stages in Detail](#workflow-stages-in-detail)을 참조하세요.
```

- [ ] **Step 2: 시각적 검토**

PLAN 서브섹션 코드블록이 정상 렌더링되는지 확인한다:
- Feasibility Assessment 구분선(──)이 올바르게 표시되는가
- 판정 요약 블록이 plan-stage 스킬 포맷과 일치하는가
- DEVELOP/REVIEW/COMPLETION 블록이 완전히 제거되었는가

---

### Task 3: 주요 시나리오 도메인 참조 업데이트

**Files:**
- Modify: `README.md:246-288` (주요 시나리오 섹션)

- [ ] **Step 1: 주요 시나리오 도메인 참조 교체**

`README.md`의 250~260행(이전 작업 이어가기 예시)을 아래 내용으로 교체한다:

```markdown
새 세션을 시작하면 자동으로 `HANDOFF.md`를 탐색합니다:

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [your-project] notification-feature (Phase 2: Discovery) — 최근: 2026-03-31
  2. [your-project] auth-system (PLAN 대기 · ⚠️ HANDOFF 없음) — 최근: 2026-03-28

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```
```

274~279행("기존 설계 문서 참조하기" 예시)을 아래 내용으로 교체한다:

```markdown
브레인스토밍이나 계획 중 기존 완료된 설계 문서를 참조할 수 있습니다:

```
사용자: "기존 설계 문서 목록 보여줘"
사용자: "auth-system 설계 문서 로드해줘"
```
```

- [ ] **Step 2: 시각적 검토**

주요 시나리오 섹션에 `inventory-system`, `combat-system` 등 게임 도메인 참조가 남아있지 않은지 확인한다.

---

### Task 4: 커밋

**Files:**
- `README.md`

- [ ] **Step 1: 변경 사항 확인**

```bash
git diff README.md
```

확인 사항:
- Quick Start 섹션이 BRAINSTORM / PLAN 서브섹션으로 교체되었는가
- DEVELOP / REVIEW / COMPLETION 블록이 제거되었는가
- 주요 시나리오 게임 도메인 참조가 교체되었는가

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: Quick Start 섹션 재설계 — 실제 대화 흐름 기반 알림 기능 예시"
```

---

## Self-Review

### Spec Coverage

| 요구사항 | 구현 Task |
|---|---|
| REQ-001: 예시 도메인 — 알림/푸시 기능 추가 | Task 1, 2 |
| REQ-002: 실제 스킬 출력 포맷 재현 | Task 1 (brainstorming), Task 2 (plan-stage) |
| REQ-003: BRAINSTORM / PLAN 서브섹션 | Task 1, 2 |
| REQ-004: 세션 시작 전체 흐름 포함 | Task 1 (진행 중인 작업 없음 출력 + 페르소나 확정) |
| REQ-005: BRAINSTORM Q&A 자연스럽게 완결 | Task 1 (1라운드 완결) |
| REQ-006: PLAN은 생성 완료 알림 + 경로 | Task 2 |
| REQ-007: 전체 워크플로우 링크 | Task 2 |

### 주요 결정 사항

- **Enhanced Mode 주석:** Quick Start 상단에 한 줄 주석 추가 (Standalone Mode 사용자 혼란 방지)
- **1라운드 완결:** 브레인스토밍은 1라운드만 보여주고 합의로 마무리 (가독성 vs 깊이 균형)
- **페르소나:** 알림 기능 도메인에 맞는 Product Manager / Backend Engineer / Client Developer 사용
