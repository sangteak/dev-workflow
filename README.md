# dev-workflow

> Claude Code plugin for structured development workflows with persona-based feedback loops.

**dev-workflow**는 소프트웨어 개발의 전체 라이프사이클을 **Brainstorm → Plan → Develop → Review → Completion** 5단계로 구조화하는 Claude Code 플러그인입니다. 각 단계에서 다양한 페르소나(Game Designer, Player, Tech Director 등)가 라운드 로빈 방식으로 피드백을 제공하여, 혼자서도 다각적인 관점의 의사결정이 가능합니다.

---

## Why dev-workflow?

AI와 브레인스토밍하면 결국 "맞아요, 좋은 생각이에요"로 끝난 경험이 있을 것입니다. dev-workflow는 이 수긍 편향을 구조적으로 차단합니다.

### 수긍 편향을 구조적으로 차단합니다

AI 브레인스토밍의 구조적 약점 중 핵심 3가지:

- **수긍 편향** — 아이디어를 제안하면 AI는 기본적으로 동의합니다. 비판적 관점이 없습니다.
- **조기 수렴** — 첫 번째 그럴듯한 해결책에 너무 빨리 정착합니다. 대안 탐색이 부족합니다.
- **표면적 요구사항** — "이 기능을 원한다"는 말 뒤에 숨겨진 진짜 문제를 파헤치지 않습니다.

dev-workflow는 [Ouroboros](https://github.com/Q00/ouroboros) 에이전트를 **서브에이전트로 분리 실행**합니다. 메인 컨텍스트와 독립된 에이전트가 각자의 사고방식을 유지하며 비판하기 때문에, 같은 대화 흐름에서 발생하는 편향이 차단됩니다.

### 페르소나(도메인) × 에이전트(사고방식) = 다각적 관점

```
페르소나 = 무엇을 사고하는가     예: 🎮 Game Designer, 👤 Player
에이전트 = 어떻게 사고하는가     예: Socratic Interviewer, Contrarian

Contrarian × 🎮 Game Designer  → "이게 재미있을 거라는 가정이 틀리면?"
Contrarian × 👤 Player         → "사용자가 정말 이걸 원할까?"
Socratic   × 🎮 Game Designer  → "왜 이 메커니즘이 필요한가?"
```

페르소나 N개 × 에이전트 M개 = N×M 고유 사고 조합. 단순히 역할을 나눈 게 아니라, 도메인 지식과 사고방식이 교차하는 조합입니다.

### 세션이 끊겨도 이어집니다

Claude Code를 새로 열면 자동으로 이전 작업 목록이 나타납니다:

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [game-systems] inventory-system (Phase 2: Discovery) — 최근: 2026-03-30
  2. [game-systems] mail-system (Plan: Feasibility) — 최근: 2026-03-28

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

`/dev-workflow:save` → `/clear` → 새 세션 → 자동 복구. 자동 감지가 안 될 경우 `/dev-workflow:resume`으로 직접 복구할 수 있습니다. 긴 브레인스토밍 세션도 컨텍스트 창 제한 없이 이어갈 수 있습니다.

---

## Workflow Overview

<p align="center">
  <img src="images/workflow-overview.svg" alt="Development Workflow Pipeline" width="100%"/>
</p>

5단계 파이프라인이 자동으로 감지되어 실행됩니다:

| 단계 | 담당 | 설명 |
|:---:|:---:|---|
| **BRAINSTORM** | dev-workflow | 아이디어 탐색, 요구사항 발굴, 페르소나 피드백 (5 phases) |
| **PLAN** | dev-workflow | 실현 가능성 평가, 설계 방향 수립, 태스크 분해 |
| **DEVELOP** | Superpowers | Git worktree 기반 서브에이전트 구현 (git/no-git 모드) |
| **REVIEW** | Superpowers | 코드 품질 리뷰 + 스펙 적합성 검증 |
| **COMPLETION** | dev-workflow | 문서 취합(feature→domain 통합), README 업데이트, 커밋+푸시 |

---

## Key Features

### Persona Feedback Loop

<p align="center">
  <img src="images/persona-feedback-loop.svg" alt="Persona Feedback Loop" width="85%"/>
</p>

Brainstorm과 Plan 단계에서는 **페르소나 기반 피드백 루프**가 활성화됩니다:

- 토픽당 최대 3라운드의 라운드 로빈 토론
- 매 라운드마다 다른 페르소나가 비평 역할(Critical Role)을 담당
- 각 라운드 끝에 합의(Consensus) 도출
- 사용자가 합의를 승인하거나, 추가 라운드를 요청하거나, 방향을 변경 가능

**기본 페르소나:**

| 단계 | 페르소나 |
|---|---|
| Brainstorm (Phase 1-2) | Game Designer, Player |
| Brainstorm (Phase 3) | Game Designer, Player, Tech Director |
| Plan | Architect, Tech Lead, PM |

> 프로젝트별로 `.claude/personas.md`에서 페르소나를 커스터마이징할 수 있습니다.

### Ouroboros Enhanced Mode

[Ouroboros](https://github.com/Q00/ouroboros) 설치 시 브레인스토밍에 전문 에이전트가 투입됩니다:

| 에이전트 | 역할 |
|---|---|
| 🔎 Socratic Interviewer | 해결책 제안 없이 질문만으로 요구사항의 본질을 파헤침 |
| ⚡ Contrarian | 모든 가정에 도전, 숨겨진 결함을 찾아냄 |
| 🌱 Seed-Architect | 대화 결과를 구조화된 스펙으로 변환 |
| 🔬 Ontologist | "이것은 진짜 무엇인가?" 본질 질문으로 탐색 시작 |

에이전트들은 서브에이전트로 독립 실행되어 수긍 편향 없이 각자의 사고방식을 유지합니다.

> **미설치 시 (Standalone Mode):** 페르소나 피드백 루프와 핵심 흐름은 그대로 작동하지만, 위 에이전트 기능은 적용되지 않습니다.

### Automatic Session Start

<p align="center">
  <img src="images/session-start-protocol.svg" alt="Session Start Protocol" width="80%"/>
</p>

세션이 시작될 때마다 자동으로 7단계 프로토콜이 실행됩니다. 이전 세션의 컨텍스트를 복구하고, Ouroboros 설치 여부를 감지하여 Enhanced/Standalone Mode를 결정하고, 현재 단계를 자동으로 이어갑니다.

### Multi-Session Support (HANDOFF)

작업 중 세션이 종료되어도 걱정 없습니다. `HANDOFF.md`를 저장하면 다음 세션에서 자동으로 감지하여 중단 지점부터 이어서 진행합니다.

```
/dev-workflow:save  → HANDOFF.md 생성 → /clear → 아무 메시지 입력 → 자동 복구
```

| 명령 | 동작 |
|------|------|
| `/dev-workflow:save` | 현재 작업 상태를 HANDOFF.md로 저장 |
| `/dev-workflow:resume` | HANDOFF.md를 탐색하여 작업 복구 |

`save` 후 `/clear`로 세션을 초기화하면, 다음 입력 시 자동으로 작업 목록이 표시됩니다. 자동 복구가 안 될 경우 `/dev-workflow:resume`으로 직접 복구할 수 있습니다.

> 상세 사용법은 [Commands Reference](#commands-reference)를 참조하세요.

### Git / Non-Git Support

게임 서버처럼 Git이 없는 레거시 환경이나 단순 스크립트 프로젝트에서도 dev-workflow를 그대로 사용할 수 있도록, `.git` 존재 여부를 자동으로 감지하여 구현 방식을 전환합니다.

| 환경 | 동작 |
|---|---|
| `.git` 존재 (git-mode) | Superpowers worktree + subagent 방식 — 격리된 브랜치에서 안전하게 구현 |
| `.git` 없음 (no-git-mode) | 파일 기반 체크포인트, worktree 스킵 — 현재 디렉토리에서 직접 작업 |

---

## Quick Start

> 설치는 [Installation](#installation)을 먼저 참조하세요.

### 인벤토리 시스템 설계 — 처음부터 끝까지

**사용자:** 인벤토리 시스템 브레인스토밍하고 싶어.

---

**[BRAINSTORM]** 페르소나 자동 확정 후 본질 질문부터 시작합니다:

```
✅ 페르소나 확정:
  🎮 Game Designer / 👤 Player / 🔧 TD (Phase 3 활성화)
🔗 Ouroboros 연동: Enhanced Mode
```

🔬 **본질 질문 [Ontologist]:**
> **[Essence]** 인벤토리가 진짜 무엇인가 — 아이템을 담는 그릇인가,
> 아니면 플레이어의 **소유와 선택**을 관리하는 시스템인가?

[Round 1/3] [비판: 🎮 Game Designer] [에이전트: Contrarian]

🎮 **Game Designer** [Contrarian]:
> "아이템 슬롯 수를 고정하면 구현이 단순해진다"는 가정이 틀리면?
> 장비/소모품/퀘스트 아이템이 각각 다른 규칙으로 동작하는 순간 이 설계는 붕괴됩니다.

**합의:** 아이템 타입별 동작 정책을 먼저 정의한 후 슬롯 구조를 결정. Phase 4에서 `inventory-system.md` 생성.

---

**[PLAN]** 실현 가능성을 평가합니다:

```
── Feasibility Assessment ──────────────────────────
[동시성 처리]
  🏛️ Architect: ✅ 낙관적 잠금으로 해결 가능
  🔧 Tech Lead: ⚠️ 분산 락 필요 — Redis 도입 권장
  📋 PM:        ✅ Phase 1 스코프 포함 가능
→ 판정: ⚠️ CAUTION — 접근 방식 합의 후 진행
────────────────────────────────────────────────────
```

→ `plan.md` 생성

---

**[DEVELOP]** 서브에이전트가 병렬로 구현합니다:

```
⚙️ git-mode — worktree 생성 후 병렬 실행
  Task 1: Implementer    → inventory_service.py
  Task 2: Quality Review → 코드 품질 검토
  Task 3: Spec Review    → 설계 문서 적합성 검증

✅ 모든 태스크가 완료되었습니다. 마무리할까요?
```

---

**[REVIEW]** AC 자동 검증:

```
── 🎯 AC 검증 결과 [Evaluator] ──────────────────────
  ✅ PASS:    8개
  ⚠️ PARTIAL: 1개 — 동시성 엣지 케이스 보완 필요
─────────────────────────────────────────────────────
```

---

**[COMPLETION]** 사용자: "마무리해줘"

```
→ 문서 취합 (phase/plan → inventory-system.md 통합)
→ README 영향 판단
→ 커밋+푸시 제안
```

---

### 주요 시나리오

#### 이전 작업 이어가기

새 세션을 시작하면 자동으로 `HANDOFF.md`를 탐색합니다:

```
> HANDOFF가 감지되었습니다:
> 1. inventory-system (Phase 2: Discovery)
> 2. combat-system (Plan: Feasibility)
> 0. 새 작업 시작
>
> 어느 작업을 이어서 진행할까요?
```

`/dev-workflow:save`로 현재 작업 상태를 저장하고, `/clear` 후 새 메시지를 입력하면 자동 복구됩니다.

#### 설계 문서가 이미 있는 경우

설계 문서를 제공하면 BRAINSTORM을 건너뛰고 PLAN부터 시작합니다:

```
사용자: "이 설계 문서로 계획 세워줘" (설계 문서 경로 제공)
```

#### 기존 설계 문서 참조하기

브레인스토밍이나 계획 중 기존 완료된 설계 문서를 참조할 수 있습니다:

```
사용자: "기존 설계 문서 목록 보여줘"
사용자: "combat-system 설계 문서 로드해줘"
```

#### 페르소나 커스터마이징

`.claude/personas.md`를 생성하면 프로젝트에 맞는 페르소나를 사용할 수 있습니다. 세션 종료 시 자동으로 저장을 제안합니다.

#### 이슈/핫픽스 서브워크플로우

완료된 기능에 문제가 발생하면 `issues/` 하위에서 별도 워크플로우를 진행하고, 완료 후 부모 설계 문서에 병합합니다.

---

## Installation

### 1. Install dev-workflow

```bash
/plugin marketplace add sangteak/dev-workflow
/plugin install dev-workflow@sangteak-dev-workflow
```

### 2. Setup Dependencies

권장 플러그인([Superpowers](https://github.com/obra/superpowers), [Ouroboros](https://github.com/Q00/ouroboros))을 한 번에 설치합니다:

```bash
/dev-workflow:setup
```

또는 수동으로 설치할 수 있습니다:

```bash
# Superpowers (필수) — DEVELOP/REVIEW 자동화
/plugin install superpowers@claude-plugins-official

# Ouroboros (권장) — 페르소나 강화 브레인스토밍
/plugin marketplace add Q00/ouroboros
/plugin install ouroboros@ouroboros
```

### Update

```bash
/plugin update dev-workflow@sangteak-dev-workflow
```

### Manual Installation (Alternative)

마켓플레이스 설치가 동작하지 않을 경우:

```bash
git clone https://github.com/sangteak/dev-workflow.git
```

프로젝트의 `.claude/settings.json`에 추가:

```json
{
  "extraKnownMarketplaces": {
    "dev-workflow": {
      "source": {
        "source": "local",
        "directory": "/path/to/dev-workflow"
      }
    }
  },
  "enabledPlugins": {
    "dev-workflow@dev-workflow": true
  }
}
```

---

## Commands Reference

dev-workflow가 제공하는 슬래시 커맨드입니다. 워크플로우 자동 흐름과 별개로, 사용자가 명시적 의도를 가지고 호출하는 커맨드들입니다.

---

### `/dev-workflow:save` — 세션 저장

**언제 쓰는가:** 작업 중 세션을 종료하기 전 (컨텍스트 창이 거의 찼을 때)

**무엇을 저장하는가:** 현재 작업의 진행 단계, 확정된 결정 사항, 미완료 항목을 `HANDOFF.md`에 기록

**왜 필요한가:** Claude Code의 컨텍스트 창은 무한하지 않습니다. 긴 브레인스토밍 세션은 창을 소진합니다. 저장 없이 `/clear`하면 작업 컨텍스트가 모두 사라집니다.

```
/dev-workflow:save
→ docs/design/[카테고리]/[기능명]/HANDOFF.md 생성
```

---

### `/dev-workflow:resume` — 작업 복구

**언제 쓰는가:** 새 세션에서 이전 작업을 이어가려 할 때

**자동 감지와의 차이:** 세션 시작 시 HANDOFF.md를 자동으로 탐색하지만, 자동 감지가 안 될 경우 이 커맨드로 수동 복구합니다.

```
/dev-workflow:resume
→ HANDOFF.md 탐색 → 작업 목록 표시 → 선택한 작업 재개
```

---

### HANDOFF 생명주기

```
작업 중 컨텍스트가 부족해짐
  ↓
/dev-workflow:save          → HANDOFF.md 생성
  ↓
/clear                      → 세션 초기화
  ↓
새 메시지 입력               → HANDOFF.md 자동 감지
  ↓
작업 목록 표시               → 이어서 진행
```

저장 후 `/clear`로 세션을 초기화하면, 다음 입력 시 **자동으로 작업 목록이 표시됩니다.** 자동 복구가 안 될 경우 `/dev-workflow:resume`으로 직접 복구할 수 있습니다.

---

### `/dev-workflow:design-summary` — 설계 문서 통합 요약

**언제 쓰는가:** 여러 설계 문서의 내용을 한눈에 파악하고 싶을 때

```
/dev-workflow:design-summary game-systems
```

---

> **설치 커맨드** (`/dev-workflow:setup`)는 [Installation](#installation)을 참조하세요.

---

## Workflow Stages in Detail

### BRAINSTORM (5 Phases)

| Phase | 이름 | 산출물 | 설명 |
|:---:|---|---|---|
| 0 | Category | - | kebab-case 카테고리 결정 |
| 1 | Exploration | `phase1_exploration.md` | 제약 없이 요구사항 탐색 |
| 2 | Discovery | `phase2_discovery.md` | 미정의 영역 발굴 및 보완 |
| 3 | Validation | `phase3_validation.md` | 기술적 실현 가능성 검증 |
| 4 | Consolidation | `[feature].md` | 10섹션 표준 설계 문서 생성 |

- Phase 1~3에서 페르소나 피드백 루프 활성화
- Phase 파일은 생성 후 **불변** (수정 불가, 스냅샷 역할)
- Phase 4에서 모든 내용을 통합한 설계 문서(SSOT) 자동 생성

> 🔧 내부 스킬: `brainstorming`, `persona-resolution`

### PLAN (4 Steps)

| Step | 내용 |
|:---:|---|
| 1 | 브레인스토밍 문서 분석 |
| 2 | OPEN_QUESTIONS 해소 |
| 3 | 실현 가능성 평가 (Architect, Tech Lead, PM) |
| 4 | 설계 방향 수립 → Superpowers `writing-plans` 실행 |

- 요구사항별 판정: ✅ FEASIBLE / ⚠️ CAUTION / 🚫 RENEGOTIATE
- RENEGOTIATE 항목은 사용자 결정 없이 진행하지 않음
- CAUTION 항목은 페르소나 피드백 루프를 통해 접근 방식 합의

> 🔧 내부 스킬: `plan-stage`

### DEVELOP

Superpowers `subagent-driven-development`에 위임됩니다:

- **git-mode**: worktree를 생성하여 격리된 환경에서 구현
- **no-git-mode**: 현재 디렉토리에서 직접 작업, 파일 기반 체크포인트
- 모든 태스크 완료 후 커밋하지 않고 Completion Protocol로 전달

> 🔧 내부 스킬: Superpowers `subagent-driven-development`

### REVIEW

Superpowers `requesting-code-review`에 위임됩니다:

- Code Quality Review (코드 품질)
- Spec Compliance Review (설계 문서 대비 적합성)

> 🔧 내부 스킬: Superpowers `requesting-code-review`

### COMPLETION

마무리 트리거("마무리해줘", "wrap up" 등) 감지 시 자동 실행:

1. **consolidate-main** — phase/plan 파일을 feature 설계 문서에 통합, domain 병합 제안 또는 feature 디렉토리 삭제
2. **consolidate-domain** — feature 설계 문서를 category 레벨의 domain.md에 통합 (사용자 선택)
3. **README 영향 판단** — 변경 내용에 따라 README 업데이트 제안
4. **커밋+푸시 제안** — 사용자 확인 후 실행

> 🔧 내부 스킬: `document-consolidation`

---

## File Structure

<p align="center">
  <img src="images/file-structure.svg" alt="Design Document Structure" width="85%"/>
</p>

**개발 중** — feature 디렉토리에 문서가 생성됩니다:

```
docs/design/[category]/[feature]/
├── phase1_exploration.md   ← Phase 1 완료 시 생성, 불변
├── phase2_discovery.md     ← Phase 2 완료 시 생성, 불변
├── phase3_validation.md    ← Phase 3 완료 시 생성, 불변
├── [feature].md            ← 최종 설계 문서 (SSOT)
├── plan.md                 ← PLAN 단계에서 생성
├── HANDOFF.md              ← 세션 중단 시 저장 (임시)
├── issues/                 ← 핫픽스 서브워크플로우 (선택)
│   └── [issue-name]/
```

**통합 완료** — domain.md로 통합되면 feature 디렉토리는 삭제됩니다:

```
docs/design/[category]/
├── [domain].md             ← 여러 feature를 통합한 SSOT
├── [domain].md
└── [feature]/              ← 아직 통합되지 않은 진행 중 feature
```

> consolidate-main(feature 내 통합) → consolidate-domain(domain.md 통합) 순서로 진행됩니다.

**Commands (슬래시 명령 별칭):**

```
commands/
├── save.md                 ← /dev-workflow:save 즉시 실행
├── resume.md               ← /dev-workflow:resume 즉시 실행
└── design-summary.md       ← /dev-workflow:design-summary → 설계 문서 통합 요약
```

> 콘솔 자동완성에서 `/save` 입력 → `dev-workflow:save` 선택 → 엔터로 즉시 실행됩니다.

**보조 파일:**

```
.claude/personas.md         ← 프로젝트별 페르소나 오버라이드 (선택)
tasks/lessons.md            ← 세션 간 학습 누적 (자기개선 루프)
tasks/todo.md               ← Superpowers writing-plans 산출물
```

---

## Configuration

### Custom Personas

프로젝트 루트에 `.claude/personas.md`를 생성하여 페르소나를 커스터마이징할 수 있습니다:

```markdown
## brainstorm
- 🎮 Game Designer: 게임 메커니즘과 플레이어 경험 전문가
- 👤 Player: 최종 사용자 관점 대변
- 🔧 Tech Director: 기술적 실현 가능성 검증

## plan
- 🏛️ Architect: 시스템 아키텍처 설계
- 🔧 Tech Lead: 기술 리더십 및 구현 전략
- 📋 PM: 일정, 리소스, 리스크 관리
```

### Self-Improvement Loop

세션에서 수정을 받을 때마다 `tasks/lessons.md`에 자동으로 교훈이 기록됩니다. 다음 세션 시작 시 이 교훈을 내부적으로 읽고 같은 실수를 반복하지 않습니다.

---

## FAQ

**Q: 설정할 게 너무 많아 보이는데, 정말 다 해야 하나요?**
A: 아닙니다. 설치 후 세션을 시작하고 아무 메시지나 입력하면 됩니다. 페르소나 확정부터 단계 감지까지 모두 자동으로 처리됩니다. Superpowers와 Ouroboros는 권장 사항이며, 없어도 브레인스토밍과 계획 단계는 완전히 동작합니다.

**Q: Superpowers나 Ouroboros를 몰라도 사용할 수 있나요?**
A: 네. dev-workflow가 이 플러그인들과의 연동을 추상화합니다. 흐름을 따라가면 자연스럽게 결과물이 나옵니다. 내부에서 어떤 플러그인이 동작하는지 알 필요가 없습니다.

**Q: Superpowers 없이도 사용할 수 있나요?**
A: BRAINSTORM과 PLAN 단계는 독립적으로 동작합니다. 하지만 DEVELOP과 REVIEW 단계는 Superpowers가 필요합니다.

**Q: Git이 없는 프로젝트에서도 동작하나요?**
A: 네. `.git`이 없으면 자동으로 no-git-mode로 전환되어 worktree 없이 파일 기반으로 진행합니다.

**Q: 페르소나를 바꿀 수 있나요?**
A: 세션 시작 시 페르소나 확정 단계에서 변경할 수 있고, `.claude/personas.md`로 프로젝트별 기본값을 설정할 수 있습니다.

**Q: 여러 기능을 동시에 작업할 수 있나요?**
A: 네. 각 기능은 `docs/design/[category]/[feature]/` 하위에 독립적으로 관리되며, HANDOFF.md를 통해 세션 간 전환이 가능합니다.

---

## License

MIT
