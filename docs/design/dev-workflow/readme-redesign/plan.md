# README Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dev-workflow README.md를 팀 오픈용 설득+사용성 문서로 전면 재작성한다.

**Architecture:** 기존 README.md를 새 섹션 구조(Why → Overview → Key Features → Quick Start → Installation → Commands Reference → Workflow Stages → Configuration → FAQ → License)로 완전 교체한다. 참조 소스(ouroboros-integration.md, context-handling/SKILL.md, commands/*.md)에서 내용을 발췌하되 팀원 언어로 편집한다. Quick Start는 현재 브레인스토밍 세션 일부를 편집하여 임팩트 훅 + 워크플로우 시뮬레이션을 구성한다.

**Tech Stack:** Markdown (GitHub README 렌더링 기준), SVG 이미지(기존 유지)

**Success Criteria:**
- README 읽은 후 "써볼 만하다"는 확신
- "오버 엔지니어링 아냐?" 우려 완화 문구 포함
- Quick Start: 게임 서버 도메인 시뮬레이션
- 커맨드 최신화 (`/dev-workflow:save`, `/dev-workflow:resume`)
- Ouroboros Enhanced Mode 설명 포함
- HANDOFF 목적 + 사용 시점 명확히
- Why 섹션이 문서 앞부분에 위치

---

## Files

- **Modify:** `README.md` — 전면 재작성 (유일한 변경 파일)
- **Reference (읽기 전용):**
  - `docs/design/dev-workflow/ouroboros-integration/ouroboros-integration.md` — Why 스니펫 ①②
  - `skills/context-handling/SKILL.md` — Why 스니펫 ③ (HANDOFF 복구 UX)
  - `commands/save.md` — Commands Reference 정확한 동작
  - `commands/resume.md` — Commands Reference 정확한 동작
  - `.claude-plugin/marketplace.json` — 버전 정보
  - `images/` — 기존 SVG 이미지 경로 확인

---

## Task 1: 소스 내용 수집 및 정리

**Files:**
- Read: `docs/design/dev-workflow/ouroboros-integration/ouroboros-integration.md`
- Read: `skills/context-handling/SKILL.md`
- Read: `commands/save.md`, `commands/resume.md`
- Read: `.claude-plugin/marketplace.json`

- [ ] **Step 1: ouroboros-integration.md에서 Why 스니펫 ①② 원문 확인**

`ouroboros-integration.md`의 §1(배경과 동기)에서 수긍 편향 목록, §4(설계 개요)에서 페르소나×에이전트 곱셈 표현을 확인한다.

기대 내용:
```
§1: 수긍 편향, 조기 수렴, 표면적 요구사항 등 구조적 약점 목록
§4: 페르소나(도메인) × 에이전트(사고방식) 합성 메커니즘 설명
```

- [ ] **Step 2: context-handling/SKILL.md에서 HANDOFF 복구 UX 원문 확인**

세션 시작 시 작업 목록 표시 형식과 복구 시 메시지 형식을 확인한다.

기대 내용:
```
📋 진행 중인 작업:
  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
  ...
```

- [ ] **Step 3: commands/save.md, resume.md 정확한 동작 확인**

각 커맨드의 실제 description과 동작 방식을 확인한다.

- [ ] **Step 4: marketplace.json에서 현재 버전 확인**

현재 버전이 `1.7.5`인지 확인한다.

- [ ] **Step 5: images/ 디렉토리 내 SVG 파일 목록 확인**

기존 이미지 경로가 변경 없이 유지되는지 확인한다.

---

## Task 2: Why 섹션 작성

**Files:**
- Modify: `README.md` (Why 섹션 신규 작성)

- [ ] **Step 1: Why 섹션 초안 작성**

수집한 소스를 팀원 언어로 편집하여 아래 구조로 작성한다:

```markdown
## Why dev-workflow?

AI와 브레인스토밍할 때 마지막엔 항상 "맞아요, 좋은 생각이에요"로 끝나지 않으셨나요?
같은 Claude가 여러 관점을 연기하다 보면 자연스럽게 합의로 수렴합니다.
dev-workflow는 이 문제를 알고 있고, 구조적으로 해결합니다.

---

**수긍 편향을 구조적으로 차단합니다**

일반적인 AI 브레인스토밍의 약점:
- 같은 AI가 여러 페르소나를 연기하면 자연스럽게 합의로 수렴 (수긍 편향)
- 해결책이 너무 빨리 나와 "진짜 문제"를 충분히 탐색하지 못함
- 사용자의 말을 그대로 수용해 숨겨진 가정이 드러나지 않음

dev-workflow는 Ouroboros 에이전트를 서브에이전트로 분리 실행하여 이 편향을 구조적으로 차단합니다.

---

**페르소나(도메인) × 에이전트(사고방식) = 다각적 관점**

```
페르소나 = 무엇을 사고하는가     예: 🎮 Game Designer, 👤 Player
에이전트 = 어떻게 사고하는가     예: Socratic Interviewer, Contrarian

Contrarian × 🎮 Game Designer  → "이게 재미있을 거라는 가정이 틀리면?"
Contrarian × 👤 Player         → "사용자가 정말 이걸 원할까?"
Socratic   × 🎮 Game Designer  → "왜 이 메커니즘이 필요한가? 더 단순한 방법은?"
```

단순 롤플레이가 아닙니다. 도메인과 사고방식의 조합으로 매번 다른 질문이 생성됩니다.

---

**세션이 끊겨도 이어집니다**

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [game-systems] inventory-system (Phase 2: Discovery) — 최근: 2026-03-30
  2. [game-systems] mail-system (Plan: Feasibility) — 최근: 2026-03-28

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

Claude Code를 열면 자동으로 이전 작업 목록이 나타납니다.
`/dev-workflow:save` → `/clear` → 새 세션 → 자동 복구.
```

- [ ] **Step 2: 성공 기준 대조 확인**

- [ ] Why 섹션이 문서 앞부분(h2 두 번째)에 위치하는가?
- [ ] 2~3문장 훅(수긍 편향 언급)이 앞에 오는가?
- [ ] 3개 스니펫(수긍 편향 해결 / 곱셈 효과 / HANDOFF 복구) 모두 포함되는가?
- [ ] 팀원 언어로 편집되었는가? (기술 용어 없음)
- [ ] 전체 분량이 과하지 않은가? (스크롤 1~2회 이내)

---

## Task 3: Key Features 업데이트 (Ouroboros Enhanced Mode 추가)

**Files:**
- Modify: `README.md` (Key Features 섹션)

- [ ] **Step 1: Ouroboros Enhanced Mode 항목 작성**

기존 Key Features 섹션의 "Persona Feedback Loop" 바로 다음에 추가한다:

```markdown
### Ouroboros Enhanced Mode

[Ouroboros](https://github.com/Q00/ouroboros) 설치 시 브레인스토밍에 전문 에이전트가 투입됩니다:

| 에이전트 | 역할 |
|---|---|
| 🔎 Socratic Interviewer | 해결책 제안 없이 질문만으로 요구사항의 본질을 파헤침 |
| ⚡ Contrarian | 모든 가정에 도전, 숨겨진 결함을 찾아냄 |
| 🌱 Seed-Architect | 대화 결과를 구조화된 스펙으로 변환 |
| 🔬 Ontologist | "이것은 진짜 무엇인가?" 본질 질문으로 탐색 시작 |

에이전트들은 서브에이전트로 독립 실행되어 수긍 편향 없이 각자의 사고방식을 유지합니다.

> **미설치 시:** Standalone Mode로 동작합니다. 페르소나 피드백 루프와 핵심 흐름은 그대로 작동하지만, 위 에이전트 기능은 적용되지 않습니다.
```

- [ ] **Step 2: Multi-Session Support 섹션 내 커맨드 표기 업데이트**

기존 `/context-handling save` → `/dev-workflow:save`로 교체, anchor link 추가:

```markdown
### Multi-Session Support (HANDOFF)

작업 중 세션이 종료되어도 걱정 없습니다. `/dev-workflow:save`로 현재 상태를 저장하면
다음 세션에서 자동으로 감지하여 중단 지점부터 이어서 진행합니다.

> 상세 사용법은 [Commands Reference](#commands-reference)를 참조하세요.
```

- [ ] **Step 3: 기존 Key Features 테이블 제거 여부 확인**

`Multi-Session Support` 섹션에 기존 커맨드 테이블(`/context-handling save`, `/context-handling resume`)이 있으면 제거한다. Commands Reference로 이동했기 때문이다.

- [ ] **Step 4: 성공 기준 대조 확인**

- [ ] Ouroboros Enhanced Mode 항목이 추가되었는가?
- [ ] 4개 에이전트(Socratic, Contrarian, Seed-Architect, Ontologist)가 모두 설명되었는가?
- [ ] 미설치 시 동작(Standalone Mode) 명시되었는가?
- [ ] Multi-Session Support의 커맨드 표기가 최신화되었는가?

---

## Task 4: Quick Start 재구성

**Files:**
- Modify: `README.md` (Quick Start 섹션 완전 재작성)

- [ ] **Step 1: 임팩트 훅 작성 (30초 훑기용)**

현재 브레인스토밍 세션에서 가장 인상적인 장면을 훅으로 추출한다.
아래는 실제 대화 발췌 편집본이다 (현 세션의 Ontologist + Contrarian 장면):

```markdown
## Quick Start

> 설치는 [Installation](#installation)을 먼저 참조하세요.

### 30초 미리보기

세션을 시작하면 이런 일이 벌어집니다:

---

**사용자:** README를 팀에 오픈하기 전에 어떻게 구성하면 좋을지 브레인스토밍하고 싶어.

**dev-workflow:**

🔬 **본질 질문 [Ontologist]:**

1. **[Essence]** README 개선이 진짜 무엇인가 — 문서 품질 향상인가, 아니면
   "이게 내 문제를 해결해줄 수 있다"고 확신하게 만드는 **설득 행위**인가?

2. **[Root Cause]** 현재 README가 부족한 이유가 정말 "최신 기능 누락" 때문인가,
   아니면 플러그인이 해결하는 문제가 텍스트로 전달하기 어려운 **추상적 개념**이기 때문인가?

3. **[Hidden Assumptions]** "팀원들이 현재 워크플로우에 불편함을 느끼고 있다"는 전제를
   깔고 있는데 — 이것을 **실제로 확인**했는가?

---

[Round 1/3] [비판: 🛠️ Claude Code Expert] [에이전트: Contrarian]

🛠️ **Claude Code Expert** [Contrarian]:

> "Why 섹션을 맨 앞에 놓으면 오버 엔지니어링 우려가 해소된다"

**이 가정은 틀렸을 가능성이 높다.** Why 섹션이 길수록
오히려 "이걸 설득해야 할 만큼 복잡하다"는 시그널로 읽힌다.
오버 엔지니어링 우려는 Quick Start의 **첫 번째 명령어 수**의 문제다.

**대안:** Why 섹션 대신 Before/After 실제 세션 로그 한 장을 맨 앞에 배치하라.

📝 **README Specialist:**

오픈소스 성공 사례들은 Why/Story를 앞에 두지만 **2~3문장으로 압축**한다.
길어지면 역효과. Contrarian의 Quick Start 지적에 강하게 동의한다.
오버 엔지니어링 우려는 FAQ가 아닌 Quick Start 체감 복잡도로 승부해야 한다.

**합의:** Why 섹션 유지하되 2~3문장으로 압축 + Quick Start는 3단계 이내.

---

이런 방식으로 **5단계 브레인스토밍**이 진행됩니다.
```

- [ ] **Step 2: 워크플로우 시뮬레이션 작성**

임팩트 훅 아래에 전체 워크플로우를 단계별로 압축한다. 각 단계는 헤더 + 핵심 출력 1개:

```markdown
### 워크플로우 시뮬레이션: 인벤토리 시스템 설계

게임 서버의 인벤토리 시스템을 처음부터 설계하는 과정입니다.

---

#### Step 1. BRAINSTORM — 5단계 브레인스토밍

세션 시작 시 페르소나가 자동으로 확정됩니다:

```
✅ 페르소나 확정:
  🎮 Game Designer / 👤 Player / 🔧 TD (Phase 3 활성화)
```

**Phase 0:** 카테고리 결정 → `game-systems`
**Phase 1~2:** 소크라테스 인터뷰 + 미정의 영역 발굴

```
📋 핵심 질문 [에이전트: Socratic]:

1. [기능 범위] 인벤토리가 관리하는 아이템의 종류는? 장비/소모품/퀘스트 아이템 분리 여부?
   ← 🎮 Game Designer [Socratic] + 👤 Player [Socratic]
   > 힌트: 아이템 타입별 동작이 다르면 구조가 달라집니다

2. [동시성] 아이템 획득/사용이 동시에 발생할 때 정합성을 어떻게 보장할 것인가?
   ← 🔧 TD [Socratic]
```

**Phase 3:** TD 기술 검증
**Phase 4:** 10섹션 설계 문서 자동 생성 → `docs/design/game-systems/inventory-system/inventory-system.md`

---

#### Step 2. PLAN — 실현 가능성 평가 + 태스크 분해

```
── Feasibility Assessment ─────────────────────────────
[아이템 타입 분리]
  🏛️ Architect: ✅ 타입 테이블 분리, 다형성 처리 가능
  🔧 Tech Lead: ⚠️ 퀘스트 아이템 고유 로직 — 별도 서비스 분리 권장
  📋 PM: ✅ Phase 1 스코프에 포함

→ 종합 판정: ⚠️ CAUTION
──────────────────────────────────────────────────────
```

→ Superpowers `writing-plans` 실행 → `plan.md` 생성

---

#### Step 3. DEVELOP — 서브에이전트 병렬 구현

```
⚙️ git-mode 감지 — worktree 생성 후 서브에이전트 병렬 실행
  Task 1: Implementer → inventory_service.py 구현
  Task 2: Code Quality Reviewer → 품질 검토
  Task 3: Spec Reviewer → 설계 문서 대비 적합성 검증

✅ 모든 태스크가 완료되었습니다. 마무리할까요?
```

---

#### Step 4. REVIEW — 코드 품질 + 스펙 적합성

Superpowers `requesting-code-review`가 자동 실행됩니다.

---

#### Step 5. COMPLETION — 마무리

**사용자:** 마무리해줘

```
→ 문서 취합 (phase/plan → inventory-system.md 통합)
→ README 영향 판단
→ 커밋+푸시 제안
```
```

- [ ] **Step 3: 성공 기준 대조 확인**

- [ ] Quick Start 최상단에 "설치 → Installation 참조" 한 줄이 있는가?
- [ ] 임팩트 훅이 30초 안에 훑을 수 있는 분량인가?
- [ ] 시뮬레이션 각 단계가 헤더 + 핵심 출력 1개로 압축되어 있는가?
- [ ] 게임 서버 도메인(인벤토리 시스템) 예시가 사용되었는가?
- [ ] 전체 Quick Start가 스캔 가능한 구조인가?

---

## Task 5: Commands Reference 신규 섹션 작성

**Files:**
- Modify: `README.md` (Commands Reference 섹션 신규 추가, Installation 섹션 다음)

- [ ] **Step 1: Commands Reference 섹션 작성**

```markdown
## Commands Reference

dev-workflow가 제공하는 슬래시 커맨드입니다. 워크플로우 자동 흐름과 별개로, 사용자가 명시적 의도를 가지고 호출하는 커맨드들입니다.

---

### `/dev-workflow:save` — 세션 저장

**언제 쓰는가:** 작업 중 세션을 종료하기 전 (컨텍스트 창이 거의 찼을 때)
**무엇을 저장하는가:** 현재 작업의 진행 단계, 확정된 결정 사항, 미완료 항목을 `HANDOFF.md`에 기록
**왜 필요한가:** Claude Code의 컨텍스트 창은 무한하지 않습니다. 긴 브레인스토밍 세션은 창을 소진합니다. 저장 없이 `/clear`하면 작업 컨텍스트가 모두 사라집니다.

```
사용자: /dev-workflow:save
→ docs/design/[카테고리]/[기능명]/HANDOFF.md 생성
```

---

### `/dev-workflow:resume` — 작업 복구

**언제 쓰는가:** 새 세션에서 이전 작업을 이어가려 할 때
**자동 감지와의 차이:** 세션 시작 시 HANDOFF.md를 자동으로 탐색하지만, 자동 감지가 안 될 경우 이 커맨드로 수동 복구합니다.

```
사용자: /dev-workflow:resume
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
**동작:** 지정한 카테고리의 설계 문서들을 분석하여 통합 요약을 생성합니다.

```
/dev-workflow:design-summary game-systems
```
```

- [ ] **Step 2: 성공 기준 대조 확인**

- [ ] `/dev-workflow:save`, `/dev-workflow:resume` 모두 포함되었는가?
- [ ] 각 커맨드에 "언제 쓰는가", "무엇을 저장하는가", "왜 필요한가"가 설명되었는가?
- [ ] HANDOFF 생명주기 다이어그램이 포함되었는가?
- [ ] 코드 블록의 커맨드가 복사-붙여넣기 즉시 동작하는 형태인가?

---

## Task 6: Workflow Stages 업데이트 + 커맨드 표기 전수 교체

**Files:**
- Modify: `README.md` (Workflow Stages 섹션 + 전체 커맨드 표기)

- [ ] **Step 1: Workflow Stages 각 단계에 담당 스킬 한 줄 추가**

각 단계 설명 끝에 아래 형식으로 추가한다:

```markdown
### BRAINSTORM (5 Phases)
...기존 설명...
> 🔧 내부 스킬: `brainstorming`, `persona-resolution`

### PLAN (4 Steps)
...기존 설명...
> 🔧 내부 스킬: `plan-stage`

### DEVELOP
...기존 설명...
> 🔧 내부 스킬: Superpowers `subagent-driven-development`

### REVIEW
...기존 설명...
> 🔧 내부 스킬: Superpowers `requesting-code-review`

### COMPLETION
...기존 설명...
> 🔧 내부 스킬: `document-consolidation`
```

- [ ] **Step 2: 구버전 커맨드 표기 전수 교체**

README 전체에서 아래 패턴을 찾아 교체한다:

| 구버전 | 신버전 |
|--------|--------|
| `/context-handling save` | `/dev-workflow:save` |
| `/context-handling resume` | `/dev-workflow:resume` |
| `context-handling save` | `/dev-workflow:save` |

검색 후 교체해야 할 위치:
- Key Features > Multi-Session Support 섹션 (현재 2곳)
- Quick Start (이미 Task 4에서 처리됨, 확인만)
- FAQ (있다면)

- [ ] **Step 3: Skills Reference 섹션 제거**

기존 `## Skills Reference` 섹션 전체(9개 스킬 테이블)를 삭제한다.

- [ ] **Step 4: 성공 기준 대조 확인**

- [ ] 각 Workflow Stage에 담당 스킬 한 줄이 추가되었는가?
- [ ] 전체 README에서 `/context-handling` 표기가 0개인가?
- [ ] Skills Reference 섹션이 제거되었는가?

---

## Task 7: Installation 최신화 + FAQ 업데이트

**Files:**
- Modify: `README.md` (Installation, FAQ 섹션)

- [ ] **Step 1: Installation 섹션 최신화**

현재 버전 표기와 커맨드를 확인하고 업데이트한다:

```markdown
## Installation

### 1. Install dev-workflow

```bash
/plugin marketplace add sangteak/dev-workflow
/plugin install dev-workflow@sangteak-dev-workflow
```

### 2. Setup Dependencies (권장)

Superpowers와 Ouroboros를 한 번에 설치합니다:

```bash
/dev-workflow:setup
```

또는 수동으로:

```bash
# Superpowers (필수) — DEVELOP/REVIEW 자동화
/plugin install superpowers@claude-plugins-official

# Ouroboros (권장) — Enhanced Mode 브레인스토밍
/plugin marketplace add Q00/ouroboros
/plugin install ouroboros@ouroboros
```

### Update

```bash
/plugin update dev-workflow@sangteak-dev-workflow
```
```

- [ ] **Step 2: FAQ에 오버 엔지니어링 관련 Q&A 추가**

기존 FAQ 섹션에 아래 항목을 추가한다:

```markdown
**Q: 설정할 게 너무 많아 보이는데, 정말 다 해야 하나요?**
A: 아닙니다. 설치 후 세션을 시작하고 아무 메시지나 입력하면 됩니다. 페르소나 확정부터 단계 감지까지 모두 자동으로 처리됩니다. Superpowers와 Ouroboros는 권장 사항이며, 없어도 브레인스토밍과 계획 단계는 완전히 동작합니다.

**Q: Superpowers나 Ouroboros를 몰라도 사용할 수 있나요?**
A: 네. dev-workflow가 이 플러그인들과의 연동을 추상화합니다. "흐름을 따라가면" 자연스럽게 결과물이 나옵니다. 내부에서 어떤 플러그인이 동작하는지 알 필요가 없습니다.
```

- [ ] **Step 3: 성공 기준 대조 확인**

- [ ] Installation의 커맨드가 최신 버전으로 정확한가?
- [ ] FAQ에 오버 엔지니어링 우려 완화 항목이 추가되었는가?
- [ ] FAQ에 "Superpowers/Ouroboros를 몰라도 됨" 항목이 포함되었는가?

---

## Task 8: Full Assembly + 최종 검수

**Files:**
- Modify: `README.md` (전체 구조 조립 + 최종 검수)

- [ ] **Step 1: 전체 README 섹션 순서 확인**

README의 최상위 섹션 헤더(##)가 아래 순서인지 확인한다:

```
1. 한 줄 소개 + Overview (h1)
2. ## Why dev-workflow?
3. ## Workflow Overview
4. ## Key Features
5. ## Quick Start
6. ## Installation
7. ## Commands Reference
8. ## Workflow Stages in Detail
9. ## File Structure
10. ## Configuration
11. ## FAQ
12. ## License
```

- [ ] **Step 2: 성공 기준 전체 대조**

| 기준 | 확인 |
|------|------|
| Why 섹션이 문서 앞부분에 위치 | |
| 수긍 편향 + 곱셈 효과 + HANDOFF 복구 스니펫 포함 | |
| "오버 엔지니어링" 우려 완화 문구 (FAQ + Quick Start 복잡도) | |
| Quick Start: 설치 분리 + 임팩트 훅 + 게임 서버 시뮬레이션 | |
| 커맨드 최신화 (/dev-workflow:save, /dev-workflow:resume) | |
| Ouroboros Enhanced Mode 설명 + 4개 에이전트 + 미적용 명시 | |
| HANDOFF 목적 + 생명주기 명확히 | |
| /context-handling 구버전 표기 0개 | |
| Skills Reference 섹션 없음 | |
| 버전 1.7.5 기준 | |

- [ ] **Step 3: 커밋**

```bash
git add README.md
git commit -m "docs: README 팀 오픈용 재작성 — Why 섹션, Ouroboros Enhanced Mode, Commands Reference 추가"
```
