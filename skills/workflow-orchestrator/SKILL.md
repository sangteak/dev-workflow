---
name: workflow-orchestrator
description: Use when workflow intent signals appear (brainstorm/plan/develop/review/wrap-up keywords, docs/design artifacts, or resuming in-progress work) - orchestrates the full development workflow lifecycle (Brainstorm → Plan → Develop → Review → Completion) with persona-based feedback loops
---

# Dev Workflow Orchestrator

## CRITICAL

These instructions are MANDATORY across ALL projects.
If Superpowers skills exist for a task, run them FIRST. This workflow extends Superpowers — it does NOT replace it.

사용자 입력 요청에 AskUserQuestion 도구를 사용하지 않는다 (본 워크플로우가 주관하는 BRAINSTORM/PLAN/COMPLETION 한정 — Superpowers 전담 DEVELOP/REVIEW 단계는 이 금지의 적용 범위 밖이다).

---

## Session Start Protocol

orchestrator 최초 invoke 시(세션 시작 또는 대화 중 워크플로우 신호 최초 감지 시점) 아래를 실행한다. **경량 상시**는 최초 invoke 시 1회, **지연 발동**은 워크플로우 의도가 있을 때만 실행한다.

### 경량 상시 (최초 invoke 시 1회)

1. **작업 상태 확인**
   - 동일 세션에서 이미 작업 상태 확인을 수행했거나 워크플로우 단계가 진행 중이면(/compact 요약 복원 포함) → 생략하고 진행 중 흐름을 계속한다
   - 최초 invoke → invoke `dev-workflow:context-handling` skill
     (탐색, 분류, 목록 제시를 모두 처리. 탐색 과정을 직접 출력하지 않는다)
   - "진행 중인 작업 없음" + 워크플로우 의도도 없음 → 후속 질문 없이 사용자 요청에 일반 응답한다
   - "진행 중인 작업 없음" + 워크플로우 의도 있음 → "설계 문서를 제공하시겠습니까, 아니면 바로 진행할까요?" 후속 질문

2. **Lessons Review** — `tasks/lessons.md` 존재 시 내부적으로 읽고 숙지 (사용자에게 출력하지 않음)

### 지연 발동 (워크플로우 의도 감지 시에만)

**게이트:** 워크플로우 의도 신호(단계 키워드, docs/design 산출물 작업, 진행 중 작업 재개)가 전혀 없는 요청은 아래 단계를 생략하고 일반 응답한다. 이후 대화에서 신호가 등장하면 그 시점에 진입한다.

3. **Stage Detection** — 현재 워크플로우 단계 감지 (아래 Workflow Stage Detection)

4. **Persona Resolution** — **BRAINSTORM 또는 PLAN 판정 시에만** invoke `dev-workflow:persona-resolution`
   - HANDOFF 복구 시에는 HANDOFF의 "확정된 페르소나"를 그대로 적용하고 재확정을 생략한다
   - DEVELOP/REVIEW/COMPLETION은 페르소나를 사용하지 않으므로 생략한다 (단 이슈 카드 관점 1줄 예외 — orchestrator 「Issue Lifecycle」)
   - 동일 세션 내 브레인스토밍 완료 후 PLAN 전환 시 재실행 생략, PLAN 페르소나만 확정

5. **Stage Announcement** — 감지된 단계(BRAINSTORM/PLAN이면 확정 페르소나 포함) 선언 후 진행

### 지연 감지 (소비 시점 직전, 세션당 1회 캐시)

- **VCS Detection** — DEVELOP 또는 REVIEW 진입 시점(둘 중 먼저)에 실행한다. 세션 환경 컨텍스트의 "Is directory a git repo" 값을 사용한다
  - 제공되지 않은 경우에만 git 명령으로 확인한다 (`.git` 디렉토리 리터럴 검사는 linked worktree에서 오탐하므로 사용하지 않는다)
  - Yes → `git-mode` (기존 Superpowers 방식 그대로), No → `no-git-mode` (worktree 스킵, 파일 기반 체크포인트)
  - 감지 결과를 내부적으로 기록 (사용자에게 출력하지 않음)

- **Ouroboros Detection** — BRAINSTORM/PLAN에서 첫 서브에이전트 투입 직전, 또는 REVIEW의 Evaluator QA 게이트 직전(둘 중 먼저)에 실행한다
  - 판정: Ouroboros MCP 도구 사용 가능 여부만 확인한다 — 사용 가능한 도구 목록에서 `ouroboros` 포함 MCP 도구 탐색 (예: `mcp__plugin_ouroboros_ouroboros__ouroboros_interview`), 또는 ToolSearch `+ouroboros` 실행
  - MCP 사용 가능 → **Path A (MCP 연동)** — validate_seed 등 MCP 전용 도구를 추가로 사용 / MCP 미사용 → **Path B (내장 역할)** — 내장 역할 정의만으로 동일하게 동작
  - 에이전트 역할 정의는 Path와 무관하게 각 스킬의 `references/agent-roles.md` 내장본을 사용한다 (v1.16.0 — 외부 플러그인 파일 탐색 제거, 구 Standalone Mode/Path C 소멸)
  - 감지 결과를 내부적으로 기록하고, Path A일 때만 감지 완료 시점에 1회 표시: "🔗 Ouroboros 연동: MCP 모드"

---

## Workflow Stage Detection

자동 감지한다. 감지 불가 시에만 사용자에게 질문한다.

### BRAINSTORM
- 사용자 메시지: 브레인스토밍, brainstorm, 아이디어, 기획, 방향
- 요구사항이 불완전하거나 정제되지 않은 상태로 논의 요청
- 코드베이스 없이 기능/시스템 방향성 탐색 요청

→ invoke `dev-workflow:brainstorming` skill

### PLAN
- 경로 해소(`find . -maxdepth 2 -iname "docs" -type d`) 후
  `[해소된 경로]/[카테고리]/[기능명]/[기능명].md` 존재 + 태스크 목록(plan.md) 미생성
  (상세: development-principles "경로 해소 규칙" 참조)
- 사용자 메시지: 계획, plan, 설계, architecture, 구조, breakdown
- Superpowers `writing-plans` 활성화 직전

→ invoke `dev-workflow:plan-stage` skill

### DEVELOP
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물)
- 사용자 메시지: 구현, implement, 개발, 작성, coding, write

→ VCS 모드에 관계없이 `superpowers:subagent-driven-development` 실행 시 아래 공통 규칙을 컨텍스트로 전달:
  1. **단계 진입 즉시**: invoke `dev-workflow:rules-injection` with:
     - stage: develop
     - purpose: pre-stage-attach
     - target_agent: Implementer

     이 호출 결과(활성 규칙 본문 + 단계 라벨)를 `superpowers:subagent-driven-development`의 Implementer/Task Reviewer(스펙 준수 + 코드 품질 통합 리뷰) 호출 프롬프트에 함께 첨부한다. `.claude/rules/`가 없으면 자동으로 no-op이 된다.
  2. 모든 태스크 완료 후 커밋을 제안하지 않는다
  3. 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리할까요? (/dev-workflow:finish 또는 \"마무리해줘\")"
  4. 커밋·푸시는 마무리 시퀀스(Completion Protocol)에서 처리한다
  5. 규범의 의미를 바꾸는 변경(게이트 존폐·독트린 역전·명칭 개명)이 plan에 포함된 경우, 태스크 리뷰·최종 브랜치 리뷰 프롬프트에 검증 항목을 첨부한다: "구 규범 문장 잔존(스테일) 0 확인 — 범위는 skills/ 밖(README·commands·CLAUDE.md)까지" (절차 규범: development-principles 「규범 변경 스윕」)
  6. DEVELOP 중 계획 밖 결함의 처리(카드 선행·태스크 경계·대기열)는 본 스킬 「Issue Lifecycle」 절을 따른다 — 서브에이전트 리포트 수신 시 태스크 범위 밖 발견물은 대기 카드로 적재한다

→ VCS 모드에 따라 분기:

**git-mode:**
→ Superpowers `subagent-driven-development` 전담 (페르소나 없음 — 단 이슈 카드 관점 1줄 예외 — 「Issue Lifecycle」)
  - `superpowers:using-git-worktrees` 실행 후 `superpowers:subagent-driven-development` 실행
  - 기존 Superpowers 방식 그대로

**no-git-mode:**
→ Superpowers `subagent-driven-development` 전담 (페르소나 없음 — 단 이슈 카드 관점 1줄 예외 — 「Issue Lifecycle」)
  - DEVELOP 진입 시 안내: "⚙️ no-git-mode — worktree 없이 현재 디렉토리에서 진행합니다"
  - `superpowers:using-git-worktrees` 스킵
  - `superpowers:subagent-driven-development` 실행 시 아래 규칙을 컨텍스트로 전달:
    1. worktree 설정 단계를 스킵하고 현재 프로젝트 디렉토리에서 직접 작업한다
    2. 커밋 체크포인트를 파일 기반 리포트로 대체한다 — git commit 대신 Implementer 리포트 제출이 Task 체크포인트
    3. Task Reviewer에게 diff/SHA 비교 자료 대신 Implementer 리포트의 "Files changed" 목록을 전달하고, 리뷰어는 해당 파일의 코드를 직접 읽어 리뷰한다
    4. 세션에 노출된 네이티브 태스크 추적 도구로 Task 진행을 추적한다 (예: TaskCreate/TaskUpdate 계열 또는 TodoWrite — 특정 도구명에 의존하지 않는다)

### REVIEW
- 기능/태스크 구현 완료
- 사용자 메시지: 리뷰, review, 검토, 확인, check, QA

→ Superpowers `requesting-code-review` 전담 (페르소나 없음)

**📎 rules-injection 호출 (사전 + 사후):**

1. **REVIEW 진입 즉시 (사전 첨부):**
   invoke `dev-workflow:rules-injection` with:
   - stage: review
   - purpose: pre-stage-attach
   - target_agent: code-reviewer

   결과를 Superpowers `requesting-code-review` 호출 프롬프트에 첨부한다.

2. **Superpowers 리뷰 완료 후 (검증 + 자동 수정 라운드):**
   invoke `dev-workflow:rules-injection` with:
   - stage: review
   - purpose: post-review-validate

   `type: quantitative/structural` 규칙은 Ouroboros Evaluator로 라우팅되어 PASS/FAIL/PARTIAL 판정. 위반 시 `auto-fix` 메타데이터에 따라 자동 수정 라운드 실행 (별도 커밋 + 테스트 재실행 + 실패 시 자동 롤백).

**순서:** Superpowers `requesting-code-review` 완료 후 → 위 `post-review-validate`(rules-injection)를 먼저 실행 → 그 다음 아래 `Evaluator QA 게이트`를 실행한다. rules-injection에서 type:quantitative/structural 규칙을 Evaluator로 라우팅하므로, Evaluator QA 게이트는 설계 문서의 Success Criteria만 검증한다 (중복 호출 회피).

**📎 Evaluator QA 게이트:**
Superpowers 코드 리뷰 완료 후, 설계 문서의 수락 기준(Success Criteria / Acceptance Criteria)이 존재하면
Evaluator 에이전트를 서브에이전트로 실행하여 AC 충족 여부를 검증한다 (v1.16.0부터 Ouroboros 설치 여부와 무관하게 상시 실행 — 의도된 강화).
역할 정의: 본 스킬의 `references/agent-roles.md` 「Evaluator」 블록을 Read하여 사용한다.
(Read 실패 시 최소 요건: 각 수락 기준에 PASS/FAIL/PARTIAL 판정 + 근거·수정 제안)

```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 취지가 같은 섹션을 찾아 따르라.
--- 에이전트 역할 정의 --- [references/agent-roles.md 「Evaluator」 블록 전문]
--- 수락 기준 --- [설계 문서의 success_criteria 목록]
--- 구현 결과물 --- [변경 파일 목록 및 주요 변경 내용]
각 수락 기준에 PASS/FAIL/PARTIAL을 판정하고, FAIL/PARTIAL에는 근거와 수정 제안을 포함하라.
```

출력 형식:
```
── 🎯 AC 검증 결과 [Evaluator] ─── ✅ PASS: N · ⚠️ PARTIAL: N · ❌ FAIL: N
[상세 목록]
──────────────────────────────────
```

- FAIL 항목이 있으면 → 수정 후 재검증을 제안한다
- 모두 PASS → REVIEW 완료로 진행한다
- 설계 문서에 수락 기준이 없으면 Evaluator를 스킵한다

### Ambiguous

워크플로우 의도 신호는 있으나 단계가 불명확할 때만 질문한다. 신호가 전혀 없으면 질문 없이 일반 응답한다 (Session Start Protocol의 게이트).

```
현재 단계를 감지하지 못했습니다. 어느 단계인가요?

1. 브레인스토밍 — 고르면: 페르소나 인터뷰로 요구사항 탐색 시작
2. 계획 — 고르면: 설계 문서 기반 실현 가능성 평가로 진행
3. 개발 — 고르면: 태스크 목록 실행으로 진행
4. 리뷰 — 고르면: 코드 리뷰 절차로 진행
0. 해당 없음 — 하려는 작업을 자유롭게 설명해주세요
```

---

## Superpowers Delegation

| 단계 | 담당 | 페르소나 | 📎 Ouroboros 에이전트 |
|---|---|---|---|
| BRAINSTORM | dev-workflow | ✅ 사용 | Ontologist, Socratic, Seed-Architect, Contrarian, Simplifier, Hacker |
| PLAN | dev-workflow | ✅ 사용 | Architect, Researcher |
| DEVELOP (git-mode) | dev-workflow `rules-injection` → Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 (이슈 카드 관점 1줄 예외) | — |
| DEVELOP (no-git-mode) | dev-workflow `rules-injection` → Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 (이슈 카드 관점 1줄 예외) | — |
| REVIEW | dev-workflow `rules-injection` (사전+사후) → Superpowers `requesting-code-review` + Evaluator QA | ❌ 없음 | Evaluator |
| COMPLETION | dev-workflow `rules-injection` → Completion Protocol (작업자 측) + merge-to-domain (관리자 측) | ❌ 없음 | — |

- **검증 버전: Superpowers 6.1.1** — 이후 버전에서 역할 구조가 다르면 의미상 등가 역할(구현 담당 → Implementer 규칙, 태스크 리뷰 담당 → Reviewer 규칙)에 첨부하라
- Superpowers 스킬이 존재하면 FIRST 실행
- DEVELOP/REVIEW 충돌 시 → Superpowers 우선
- BRAINSTORM/PLAN 충돌 시 → 이 워크플로우 우선
- PLAN Step 4 완료 후 → Superpowers `writing-plans` 실행
- no-git-mode에서는 `using-git-worktrees` 를 호출하지 않는다
- no-git-mode에서 `subagent-driven-development` 실행 시 git 관련 단계(commit, SHA 비교)를 파일 기반으로 대체하라는 컨텍스트를 전달한다
- DEVELOP 완료 후 커밋·푸시는 Completion Protocol을 통해서만 실행한다

---

## Issue Lifecycle (이슈 생애주기)

DEVELOP 진입 후(테스트·검증 포함) 발견되는 **계획 밖 문제**를 관리한다. 이슈는 한 번에 하나만 처리한다.

### 트리거 — 카드 선행 규칙 (행동 기반)

현재 plan.md 태스크 범위 밖의 결함을 수정하기 위해 코드 수정 도구를 사용하려는 시점에는, 수정 전에 이슈 카드를 먼저 생성한다. 판정 기준은 발화 표현이 아니라 행동이다:
- 판정: "지금 하려는 수정이 plan.md의 태스크에 규정된 작업인가?" — Yes = 정상 진행 / No = 카드 선행
- 현재 태스크 범위 내에서 태스크 리뷰·fix 루프가 다루는 결함은 카드를 만들지 않는다 (Superpowers SDD가 전담)
- 서브에이전트 리포트에 태스크 범위 밖 발견물(완료 태스크의 회귀·범위 밖 부작용·Evaluator FAIL)이 포함되면 리포트 수신 시점에 대기 카드를 생성한다

### 이슈 카드 규격

경로: `docs/design/[카테고리]/[기능명]/issues/NNN-[문제명].md` (NNN = 3자리 생성 순번 — 순서를 파일명에 고정, frontmatter 없음)

```markdown
# [문제명]

## 심각도
[경미 | 중간 | 크리티컬]

## 증상
[무엇이 어떻게 잘못되는가 — 1~3줄]

## 원인
[분석 결과 — 활성화 시 기록]

## 영향 범위
[설계 문서·남은 plan 태스크·다른 코드에 미치는 영향 — 활성화 시 기록]

## 수정 방향
[구체 수정 계획 — 이 절이 수정 작업의 입력 프롬프트가 된다]
```

상태는 카드 구조가 인코딩한다 (별도 상태값 없음):
- **대기**: 심각도·증상만 기록 (생성 비용 2줄)
- **활성**: 원인~수정 방향까지 기록 — 활성 카드는 항상 1장만
- **해소**: 파일 삭제됨 — 요지는 부모 설계 문서 §10에 1~2줄이 유일 기록

### 경량 사이클 (심각도: 경미·중간)

1. **분석** — 카드의 원인·영향 범위·수정 방향을 채운다 (원인 분석은 `superpowers:systematic-debugging`의 근본 원인 우선 원칙을 따른다). 확인 직전, `.claude/personas.md`의 PLAN 세트가 있으면 페르소나별 관점을 1줄씩 병기한다 — 형식 `[이모지] [이름]: [관점 1줄]`. 관점 줄이 하나도 없는 것이 정상 상태이며 쓰는 쪽이 입증 책임을 진다 (새 근거·반례·조건 수정이 없으면 그 페르소나 줄은 만들지 않는다). personas.md가 없으면 관점 줄 전체를 생략한다 (기본 페르소나 미사용). 언어: 쉬운 한국어·용어 즉석 풀이·줄임말 금지·문단 개행 (원본: decision-flow 3부 「언어 규범」). 이어서 확인 1회: "수정 방향대로 진행할까요? 1. Yes 2. 수정 방향 조정"
2. **수정** — 카드의 "수정 방향"을 입력으로 같은 워크트리에서 구현·테스트한다. 카드 없이 계획 밖 수정을 시작하지 않는다
3. **반영** — 부모 설계 문서 §10(변경 이력)에 요약 1~2줄 추가. 설계 서술이 실제로 바뀌었으면 해당 절(§4/§6 등)도 갱신. 남은 plan 태스크에 영향이 있으면 해당 태스크만 갱신. 완료 후 카드를 삭제한다 — git-mode: 확인 없이 삭제하고 1줄 고지 `🧹 이슈 카드 [문제명]을 정리했습니다 — 요지는 §10에 기록 (기록은 git 이력에 남음 · 되돌리려면 말씀하세요)` (안전망: development-principles "자동 결정 안전망" 참조) / no-git-mode: 삭제 확인 1회
- 반영 검증 항목: **"분석(카드)이 수정에 선행했는가"** — 태스크 리뷰·최종 브랜치 리뷰에 포함한다

### 대기열 (카드 = 큐)

- 활성 이슈 진행 중 새 문제를 발견하면 현재 이슈에 섞지 않는다 — 심각도·증상 2필드만 채운 대기 카드를 즉시 생성하고 현재 이슈로 복귀한다
- 처리 순서: 번호순(FIFO) 추천을 기본으로 하되, 심각도가 높은 대기 카드가 있으면 앞당김을 제안한다
- 활성 카드가 있는 동안 신규 SDD 태스크 디스패치는 보류한다 (이슈 해소 후 재개)
- 활성 카드 해소 시 대기 카드가 있으면 다음 카드 활성화를 제안한다 — 사용자가 태스크 우선을 고르면 SDD를 재개한다 (카드는 대기 유지)

### 크리티컬 경로 (심각도: 크리티컬)

심각도가 "크리티컬"로 기록되면 판별문을 적용해 경로를 분류하고, 분류 결과를 결정 요청으로 제시한다. **감지·분류 제안은 자동, 경로 전환 실행은 사용자 확인 후** (자동 전환 금지 — 비가역 승인):

판별문: **"설계 문서 §2(목표·비목표)가 그대로 유효한가?"**

- **Yes (아키텍처만 변경) → 제자리 재계획** — 같은 feature·워크트리·브랜치 유지:
  1. 카드 분석을 바탕으로 설계 문서 §4(설계 개요)·§6(기술 결정 — 폐기 대안 기록)·§10(이력) 갱신안 제시 + 사용자 리뷰
  2. invoke `dev-workflow:plan-stage`의 재계획 진입 (명시 라우팅 — Stage Detection을 거치지 않는다: plan.md가 이미 존재해 자동 감지가 불가한 경로)
  3. 재계획 완료 후 SDD를 재개한다. 카드는 이 시점에 경량 사이클 3(반영)의 삭제 규칙에 따라 삭제한다 (§10 기록은 갱신안 반영 시 이미 완료)
- **No (목표 자체가 바뀜 = 사실상 새 기능) → 아카이브 + 승계**:
  1. 원 설계 문서 §9에 중단 사유·완료분, §10에 "중단 — [새 기능명]으로 승계" 기록
  2. feature 디렉토리를 `docs/design/[카테고리]/_archive/[기능명]/`로 이동한다 (세션 목록·머지 스캔에서 자동 제외 — 기존 `_archive/` 제외 메커니즘)
  3. 새 feature의 브랜치는 원 워크트리 브랜치의 HEAD에서 분기한다 — 커밋 히스토리를 승계하고, 무효가 된 구현은 revert 커밋으로 기록하며, 원 워크트리는 정리한다. 새 feature 브레인스토밍은 원 설계 문서를 초기 컨텍스트로 참조한다. no-git-mode에서는 분기·revert·워크트리 정리를 생략하고 새 feature 디렉토리 생성으로 대체한다.

### 경계선

- feature가 **열려 있으면**(개발 진행 중) → 이슈 카드
- feature가 **닫혔으면**(complete·도메인 머지됨) → 별도 feature로 처리 (기존 설계·도메인 문서를 참조 컨텍스트로)

### 구형 이슈 디렉토리 (호환)

`issues/[문제명]/` 디렉토리 형식(구형 — phase 파일 포함)은 잔존을 허용한다. 세션 탐색에서 발견 시 1줄 안내: "구 형식 이슈입니다 — 이어서 마무리하거나 정리하세요". 새 이슈는 항상 카드 형식으로 생성한다.

---

## Completion Protocol

DEVELOP 완료 후 마무리 시퀀스를 관리한다. 커밋·푸시는 반드시 이 시퀀스 내에서만 실행한다.

### 마무리 대기 표시 (경고등)

파일 술어가 참이면, 오케스트레이터가 통제하는 일단락 출력(이슈 카드 해소 고지·Evaluator 결과·리뷰 완료 보고) 말미에 아래 한 줄을 표기한다:

- 술어: `[기능명].md`의 status ≠ complete **이고** plan.md를 읽었을 때 잔여 태스크가 없다고 판단됨 (판단 주체는 LLM의 파일 읽기 — bash 파싱 금지)
- 표기: `🔔 마무리 대기: [기능명] — /dev-workflow:finish 또는 "마무리해줘"`
- Completion Step 1이 status를 complete로 전이하면 술어가 거짓이 되어 자동 소등된다
- 이 표시는 가시화이지 판단이 아니다 — 마무리 실행 여부는 항상 사용자가 선언한다

### 마무리 트리거 감지

사용자의 자연어 발화로 마무리 시퀀스를 시작한다. 어휘 목록 (SSOT — 훅 `hooks/completion-nudge`가 미러, diff는 `tests/hooks/test-completion-nudge.sh` 케이스 0번이 검증):

`completion-vocab: 마무리|완료|정리해|끝내자|wrap up|finish|finalize|done`

- 위 어휘가 세션 전체 작업의 마무리 의도로 발화되면 시퀀스를 시작한다 (특정 코드·파일에 대한 정리 요청은 해당 없음)
- `<completion-signal>` 주입(completion-nudge 훅)이 보이면 같은 판정을 즉시 수행한다
- `/dev-workflow:finish` 호출은 감지를 생략하고 시퀀스로 직행한다 (호출=선언)

### 마무리 시퀀스

`[플러그인 루트]/skills/workflow-orchestrator/references/completion-protocol.md`를 Read하여 그 전문을 따른다.
(Read 실패 폴백 최소 요건: Step 0 이슈 카드 잔존 검사 → Step 1 문서 취합(document-consolidation 즉시 실행, status→complete) → Step 2 README 영향 판단 → Step 2.5 rules-injection(completion) → Step 3 커밋 확인 → Step 3.5 푸시 별도 확인 → Step 4 도메인 통합은 관리자 별도)

---

## Output Format Rules

- 페르소나 이름은 항상 이모지 접두사와 함께 표시
- 합의 결론은 페르소나 토론과 명확히 분리
- 단계 진입 시 항상 명시적으로 선언
- 사용자가 합의를 확인하면 루프를 반복하지 않고 진행

**결정 요청 형식 (SSOT):** BRAINSTORM/PLAN 진입 후 첫 사용자 결정 요청 전에 반드시 `decision-flow.md`를 Read한다. 이 파일은 사용자 프로젝트가 아닌 플러그인 설치 디렉토리에 있다. 경로 해소 순서:
1. 플러그인 루트를 아는 경우 (세션 시작 컨텍스트에 주입된 "플러그인 루트" 값 사용): `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`
2. 미확보 시 동적 탐색: `find "$HOME/.claude/plugins" -path "*dev-workflow*/skills/workflow-orchestrator/decision-flow.md" -not -path "*/worktrees/*" -type f | head -1` (플러그인 캐시는 `.../dev-workflow/<버전>/skills/...` 구조로 버전 디렉토리를 포함한다)
3. Read 실패 시: Input Format Rules의 '결정 요청 폴백 형식'을 따르고, 탐색 실패를 사용자에게 노출하지 않는다

---

## Input Format Rules

사용자에게 입력을 요청할 때 아래 형식을 따른다 (도구 금지 선언은 CRITICAL 섹션이 SSOT — 여기서는 형식만 정의한다).

### 닫힌 선택 (선택지가 있는 질문)

```
[질문 텍스트]

1. 선택지A
2. 선택지B
3. 선택지C
0. [탈출 레이블]          ← 자유 입력 탈출구 필요 시에만 추가, 항상 마지막
```

### Yes/No 질문

```
[질문 텍스트]

1. Yes
2. No
```

### 열린 입력 (선택지 없는 자유 텍스트)

```
[질문 텍스트]
> 예: "[예시 입력]"
```

### decision-flow와의 경계

- 산출물(phase 파일·설계 문서·plan.md)에 기록될 결정(선택지 2개 이상)은 `decision-flow.md`의 결정 박스(D)와 순차 흐름을 따른다
- 단순 진행 확인·Yes/No 게이트는 본 섹션의 무박스 형식을 따른다. 탐색적 질문은 decision-flow.md의 질문 규칙(하나씩·❓ 질문 N/M)을 따른다
- 결정 박스 내부의 선택지 표기 규칙(번호만, 0번 조건)은 본 섹션이 담당한다

### 결정 요청 폴백 형식 (decision-flow.md Read 실패 시)

- 언어 최소 요건: 쉬운 한국어 · 전문 용어 즉석 풀이 · 줄임말 금지 · 문단 개행 · 절 기호 등 전문 표기 금지 · 슬래시 압축 금지 (원본: decision-flow 3부 「언어 규범」 — Read 실패 시에도 이 줄이 적용된다)
- 결정은 한 번에 하나만 묻는다. 사용자가 위임하거나 모드 전환("다 보여줘"/"알아서")을 요청하면 수용한다 — 노출된 선택지에만 답할 수 있으며, 하나씩 모드의 다중 값 응답은 첫 값만 반영한다 (응답이 형식을 이긴다)
- 결정 요청은 아래 스켈레톤으로 표시한다:

```
📌 결정 요청 : [결정명]

**이 결정이 다루는 문제:** [1-2문장 — 왜 지금 정하는지 + 앞선 결정과의 연결]

**확인된 사실:**
- [✔ 출처] [사실 1줄]   (없으면 이 칸에 "없음"이라고 쓴다)

**확인 못 한 것:**
- [⚠️ 확인 불가] [결정에 영향을 주는 불확실 1줄]   (없으면 "없음")

**토론 요지:** [수렴/충돌 1~3줄]

1. [선택지] — 고르면: [결과 1줄]
2. [선택지] — 고르면: [결과 1줄]
0. [탈출 레이블] (자유 입력 탈출구 필요 시에만)

💡 추천: [번호]
[추천 사유 1줄]
```

- 등급: 직전에 라운드·조사가 있었으면 4칸 상시(빈 칸 "없음"), 아니면 문제 칸+이력 칸, 로컬 템플릿·게이트는 기존 형식
- 여러 결정이 대기 중이면 결정 요청 응답 상단에 한 줄 헤더를 표시한다: `📋 확정 N/M · 진행 중: [결정명] · 재논의 K건`
- 재논의 대기열(모델이 감지했으나 즉시 처리하지 않기로 한 결정 간 충돌 항목)이 없으면 '재논의' 필드를 생략한다

### 공통 규칙

- 번호만 사용한다 (문자 선택 A/B/C/D 금지)
- 슬래시 구분 "(Yes / No)" 형식을 사용하지 않는다
- 0번은 닫힌 선택에서 자유 입력 탈출구가 필요한 경우에만 추가한다. 항상 목록 마지막에 배치하며, 레이블은 맥락에 맞게 변경할 수 있다
- 사용자가 번호 또는 자연어로 응답할 수 있다. 의미가 모호한 경우에만 재확인한다

---

## What This Workflow Does NOT Cover

아래는 Superpowers 전담:
- DEVELOP 단계 구현 및 검토 (subagent-driven-development)
- REVIEW 단계 코드 리뷰 (requesting-code-review)
- TDD (RED/GREEN/REFACTOR)
- git worktree 관리 (git-mode에서만 Superpowers 전담, no-git-mode에서는 스킵)
- Subagent 디스패치
- 태스크 세분화
- 브랜치 마무리 및 PR 생성
