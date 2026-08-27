# decision-verdict Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 답을 이미 아는 결정 자리에서 모델의 판정과 근거를 먼저 보이고 틀린 곳만 짚게 하며, 메뉴로 남는 자리의 선택지 이름과 결과 줄에 이번 요청의 대상을 넣는다.

**Architecture:** 이 저장소는 코드가 아니라 Markdown 스킬 문서로 동작을 정의한다. `skills/workflow-orchestrator/decision-flow.md`가 결정 화면 규범의 원본이고, 같은 규범을 다시 적어 둔 자리가 열 개 있다. 이번 변경은 원본의 규범 절을 고치고 그 열 자리를 같은 차례에 맞춘 뒤, **다시 적은 자리 목록 자체를 원본 안에 박아** 다음 릴리스가 세는 대신 물려받게 한다.

**Tech Stack:** Markdown 문서. 검증 도구는 `scripts/sweep`(고정 범위 문자열 검색)과 `grep`. 훅 시험(`tests/hooks/run-all.sh`)은 이번 변경과 무관하지만 회귀 확인용으로 마지막에 돌린다.

**Spec:** `docs/design/dev-workflow/decision-verdict/decision-verdict.md`

## Global Constraints

- **자동 시험이 없다.** 스킬 Markdown을 검사하는 시험은 이 저장소에 없다 (`tests/`의 넷은 전부 훅 대상). 각 태스크의 검증은 아래에 적힌 `grep`/`sweep` 명령과 그 기대 출력이다. "테스트를 돌린다"를 다른 것으로 대체하지 말 것.
- **기준 커밋(BASE):** `b3f9c6308fa660f68510b6a2d2482521e9f3ee69`. 잔존 스윕에서 "이번 작업이 바꾼 범위"를 볼 때 이 해시를 쓴다. `HEAD~N` 표기를 쓰지 말 것 — 태스크당 커밋 수가 하나라는 보장이 없다.
- **main worktree에 절대 쓰지 않는다.** 작업 경로는 `C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah`이고 브랜치는 `feature/analyzer`다. `D:/02_Workspace/98_Github/dev-workflow`는 읽기도 하지 않는다.
- **도메인 문서를 고치지 않는다.** `docs/design/dev-workflow/*.md`(카테고리 바로 아래의 `ux-consistency.md` 등)는 merge-to-domain 담당이다. 앞선 릴리스에서 이 경계를 넘었다가 되돌린 전례가 있다 (`66414ee`).
- **불변 파일:** `docs/design/dev-workflow/decision-verdict/phase1_exploration.md`·`phase2_discovery.md`·`phase3_validation.md`는 생성 후 수정하지 않는다.
- **언어 규범:** 새로 쓰는 모든 문면은 한국어 일상어, 전문 용어는 그 자리에서 풀이, 절 기호(§) 금지, 목록을 슬래시로 잇지 않기. 원본은 `decision-flow.md`의 「언어 규범」 펜스다.
- **커밋 메시지:** Conventional Commits. 이 작업의 접두어는 `feat(decision-verdict):` 또는 `fix(decision-verdict):`.
- **버전 파일을 손으로 고치지 않는다.** `scripts/bump-version <버전>`을 쓴다.

## 요구사항 대응표 (검증 기준 — 누락 0)

설계 문서 3장의 요구사항 열여섯이 어느 태스크에서 구현되는지. 태스크를 하나만 보는 실행자가 자기 태스크가 무엇을 갚는지 알 수 있게 한다.

| 요구사항 | 태스크 |
|---|---|
| REQ-001 성격 승인 판정형 | Task 3 |
| REQ-002 재협의 판정형 | Task 4 |
| REQ-003 「고칠 게 있다」 자유 응답 | Task 3 · Task 4 · Task 5 |
| REQ-004 무엇이 달라지는가 한 줄 | Task 2(스켈레톤) · Task 3(만들어지는 것) · Task 4(남는 상태) |
| REQ-005 갈림 기준과 조립 전 조건 | Task 2(기준) · Task 5(조건) |
| REQ-006 다섯 자리에 값 박기 | Task 2 |
| REQ-007 두 번 틀리면 메뉴형 · 오답 횟수 보존 | Task 5 (원본 + `context-handling` 템플릿 칸) |
| REQ-008 선택지 대상 규칙 | Task 7(검사) · Task 9(적용) · Task 3(판정 문장) |
| REQ-009 결과 줄 규칙 복원 | Task 7 (검사 2번 — 메뉴형 자리 전부) · Task 6 (실물 예시 정합) |
| REQ-010 로컬 템플릿 면제 네 자리 | Task 8 |
| REQ-011 설명 블록 문단형 | Task 6(원본·실물 예시) · Task 10(사본) |
| REQ-012 재서술 지점 목록 (열 자리) | Task 1 |
| REQ-013 금지 조항 교체 | Task 1 |
| REQ-014 읽기 실패 폴백 | Task 3 |
| REQ-015 망설일 때의 기본값 | Task 3 |
| REQ-016 성공 기준 헛통과 방지 | Task 7(적용 자리를 메뉴형 표로 한정) · Task 11(실물 판정) |

## File Structure

| 파일 | 이 작업에서의 책임 |
|---|---|
| `skills/workflow-orchestrator/decision-flow.md` | 규범 원본. 재서술 지점 목록 · 갈림 기준과 다섯 자리 · 조립 전 조건 · 설명 블록 · 내보내기 전 검사 · 로컬 템플릿 면제 · 상태 보존 · 실물 예시 |
| `skills/development-principles/SKILL.md` | 재서술 지점 목록을 금지하던 조항을 허용 조항으로 교체 |
| `skills/brainstorming/references/templates.md` | 「성격 승인 화면」 실물을 판정형으로 |
| `skills/brainstorming/SKILL.md` | 위 화면의 읽기 실패 폴백 |
| `skills/plan-stage/SKILL.md` | 「재협의 선택지」 실물을 판정형으로 |
| `skills/workflow-orchestrator/SKILL.md` | 결정 요청 폴백 스켈레톤 정합 · Ambiguous 단계 감지에 대상 규칙 적용 |
| `skills/workflow-orchestrator/bootstrap.md` | 세션 시작 상시 주입본 정합 |
| `skills/workflow-orchestrator/references/grounding.md` | 등급 경계 사례 · 로컬 템플릿 면제 정합 |
| `skills/workflow-orchestrator/references/actions.md` | 소비 계약 적용 경로에서 성격 승인 항목 정합 |
| `skills/context-handling/SKILL.md` | HANDOFF 「결정 흐름 상태」 섹션에 판정 오답 횟수 칸 |
| `skills/merge-to-domain/SKILL.md` | 결정 박스와 설명 블록의 적용 범위 조항 정합 |
| `README.md` | 사용자 문서의 결정 화면 설명 정합 |
| `.claude-plugin/plugin.json` · `marketplace.json` | 버전 1.25.0 (스크립트로 갱신) |

## 계획 시점 정정 (설계 문서 4장 대비)

설계 문서 4장은 「내보내기 전 검사」가 **선택지 낱말 · 선택지 대상** 둘로 남는다고 적고, REQ-009는 **결과 줄 규칙**을 통과 검사로 되돌린다고 적는다. 셋이 되어 서로 어긋난다.

**검사를 셋으로 둔다.** 둘로 합치려던 안은 기각했다 — 대조 상대는 같지만 **적용 자리가 다르기 때문**이다. 합치면 하나의 범위가 다른 하나에 강제로 씌워지고, 그러면 사용자가 정한 범위(성격 승인과 단계 감지 둘)가 저장소의 모든 로컬 템플릿으로 번진다. 그 템플릿들에는 대조 상대인 칸 자체가 없어 검사가 구조적으로 통과 불가능해진다.

검사마다 **자기 적용 자리를 바로 옆에 적는다.** 면제를 따로 모은 표를 두지 않는다 — 규칙별 면제가 규칙 옆에 살아야 다음 릴리스가 스윕할 자리도 한곳에 모인다.

| 검사 | 적용 자리 |
|---|---|
| 1. 선택지 낱말 | 모든 결정 박스 (기존 그대로) |
| 2. 결과 줄 (REQ-009 복원) | 「판정형과 메뉴형」 표에서 메뉴형으로 박힌 자리 전부 |
| 3. 선택지 대상 (REQ-008 신설) | 「성격 승인 화면」과 「Ambiguous 단계 감지」 둘. 나머지는 다음 릴리스 |

Task 7이 이 모양으로 구현하고, Task 12가 설계 문서 4장과 `seed.yaml`의 성공 기준을 이에 맞춘다.

---

## Task 1: 재서술 지점 목록을 원본에 박고 금지 조항을 교체한다

먼저 한다. 이후 모든 태스크가 이 목록을 보고 사본을 찾는다.

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (머리말 — 8행 「문서 구성」 줄 바로 뒤)
- Modify: `skills/development-principles/SKILL.md:150` (「규범 변경 스윕」 3항)

**Interfaces:**
- Produces: `decision-flow.md` 머리말의 「재서술 지점 목록 (검증 기준 — 누락 0)」 열 항목. Task 10의 스윕이 이 목록을 대조표로 쓴다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -c "재서술 지점 목록" skills/workflow-orchestrator/decision-flow.md
```
Expected: `0` — 목록이 아직 없다.

Run:
```bash
grep -n "영속화하지 않는다" skills/development-principles/SKILL.md
```
Expected: `150:3. 인벤토리 산출물(grep 패턴 목록)은 해당 작업 전용 일회용이다 — 영속화하지 않는다 (스테일 체크리스트의 신뢰 오염 방지)`

- [ ] **Step 2: `decision-flow.md` 머리말에 목록을 넣는다**

`skills/workflow-orchestrator/decision-flow.md`의 8행, 즉 아래 줄

```
**문서 구성:** 1부(결정 규칙)·2부(질문 규칙)는 3부(공통 형식·언어)의 스켈레톤과 언어 규범을 결정·질문에 각각 적용한 것이다 — 형식·언어의 원본은 3부가 유일하다. 3부는 「언어 규범」(원본 펜스)과 「결정·질문 구조 규범」으로 구성된다.
```

**바로 뒤에** 빈 줄 하나를 두고 아래를 넣는다:

```markdown
**재서술 지점 목록 (검증 기준 — 누락 0):** 이 문서의 규범을 **다시 적어 놓은** 자리는 아래 열이다. 규범의 뜻을 바꾸는 작업은 같은 차례에 이 열을 함께 고친다. 원본을 가리키기만 하는 줄(예: brainstorming SKILL.md의 "형식은 decision-flow.md가 정의한다")은 재서술이 아니므로 목록에 넣지 않는다.

1. `skills/workflow-orchestrator/bootstrap.md` — 세션 시작 상시 주입본의 결정 요청 형식 폴백
2. `skills/workflow-orchestrator/SKILL.md` — 「결정 요청 폴백 형식」의 스켈레톤 전문·결정 정의·설명 블록·등급
3. `skills/workflow-orchestrator/references/grounding.md` — 등급 경계 사례와 로컬 템플릿 면제
4. `skills/workflow-orchestrator/references/actions.md` — 소비 계약의 적용 경로 목록
5. `skills/brainstorming/SKILL.md` — 성격 승인 화면의 읽기 실패 폴백
6. `skills/brainstorming/references/templates.md` — 「성격 승인 화면」 실물
7. `skills/plan-stage/SKILL.md` — 「재협의 선택지」 실물
8. `skills/merge-to-domain/SKILL.md` — 결정 박스와 설명 블록의 적용 범위 조항
9. `skills/context-handling/SKILL.md` — HANDOFF 「결정 흐름 상태」 섹션의 보존 항목 목록
10. `README.md` — 사용자 문서의 결정 화면 설명

이 목록은 **바닥이지 천장이 아니다.** 규범 변경 스윕은 매번 새로 돌리고, 목록에 없는 자리를 찾으면 그 릴리스에서 이 목록에 더한다. 절차 원본은 development-principles의 「규범 변경 스윕」이다.
```

- [ ] **Step 3: `development-principles/SKILL.md`의 3항을 교체한다**

`skills/development-principles/SKILL.md:150`의 아래 줄을

```
3. 인벤토리 산출물(grep 패턴 목록)은 해당 작업 전용 일회용이다 — 영속화하지 않는다 (스테일 체크리스트의 신뢰 오염 방지)
```

아래로 통째로 바꾼다:

```
3. **원본이 있는 규범은 재서술 지점 목록을 원본 안에 둔다** — 목록에 없는 자리를 찾으면 그 릴리스에서 목록에 더한다. 목록은 **바닥이지 천장이 아니므로** 1항의 전수 스윕은 매번 그대로 돈다 — 낡은 목록을 믿고 새 자리를 놓치는 일은 목록을 천장으로 쓸 때 생긴다. 원본이 없는 일회성 문구 정리의 검색 패턴만 일회용이다
   ↳ 실측 근거: 목록이 없는 `decision-flow.md`는 두 릴리스 연속으로 재서술 자리를 모자라게 셌다 (1→6, 3→9). `README.md`의 결정 화면 설명은 v1.24.0 계획서 목록에 없다가 그 릴리스의 최종 리뷰 커밋 `da8e585`에서 들어왔다 — 목록이 릴리스 도중에 늘어나는데 안 남겨서 다음 작업이 늘기 전 숫자를 물려받았다. 목록을 가진 `references/actions.md`는 샌 적이 없다
```

- [ ] **Step 4: 검증한다**

Run:
```bash
grep -c "재서술 지점 목록" skills/workflow-orchestrator/decision-flow.md
```
Expected: `1` 이상

Run:
```bash
grep -c "영속화하지 않는다" skills/development-principles/SKILL.md
```
Expected: `0` — 옛 문장이 사라졌다.

Run:
```bash
grep -n "재서술 지점 목록을 원본 안에 둔다" skills/development-principles/SKILL.md
```
Expected: 150행 부근에 한 건.

Run — 목록의 열 파일이 전부 실재하는지:
```bash
for f in skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/references/grounding.md skills/workflow-orchestrator/references/actions.md skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md skills/plan-stage/SKILL.md skills/merge-to-domain/SKILL.md skills/context-handling/SKILL.md README.md; do test -f "$f" && echo "OK $f" || echo "MISSING $f"; done
```
Expected: 열 줄 모두 `OK`.

- [ ] **Step 5: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/development-principles/SKILL.md
git commit -m "feat(decision-verdict): 재서술 지점 목록을 원본에 두고 금지 조항을 교체"
```

---

## Task 2: 갈림 기준과 다섯 자리를 원본에 박는다

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (「결정·질문 구조 규범」 안 — 「설명 블록」 절 **앞**)

**Interfaces:**
- Consumes: Task 1의 재서술 지점 목록 (이 태스크는 원본만 건드리므로 사본 정합은 Task 10 몫)
- Produces: 「판정형과 메뉴형」 절과 그 안의 다섯 자리 표. Task 3·4가 판정형 행을, Task 9가 메뉴형 행을, Task 7이 검사 적용 자리를, Task 11이 재현 대상을 이 표에서 읽는다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
grep -c "판정형" skills/workflow-orchestrator/decision-flow.md
```
Expected: `0`

- [ ] **Step 2: 「결정·질문 구조 규범」 헤딩 바로 뒤에 절을 넣는다**

`skills/workflow-orchestrator/decision-flow.md`에서 아래 헤딩을 찾는다:

```
### 결정·질문 구조 규범
```

그 헤딩과 그 아래 `**설명 블록 (결정 전용 — 박스 바로 앞):**` 사이에 아래를 넣는다:

```markdown
**판정형과 메뉴형 (갈림 — 설계 시점에 박는다):**

결정 요청에는 두 모양이 있다.

- **메뉴형** — 선택지를 늘어놓고 고르게 한다. 기본값이다
- **판정형** — 모델이 내린 판정과 그 근거를 먼저 보이고, 「그대로 진행」과 「고칠 게 있다」 둘로 받는다. 답을 이미 아는 자리에서 쓴다

갈림 기준은 **「근거를 댈 수 있나」**다 — 저장소나 대화에서 확인 태그(`[✔ 출처]`)를 붙일 수 있는 근거를 만들 수 있으면 판정형, 못 만들면 메뉴형이다.

**이 기준을 실행할 때마다 매기지 않는다.** 아래 다섯 자리에 값이 박혀 있고, 그 값을 그대로 쓴다.

| 자리 | 모양 |
|---|---|
| 「성격 승인 화면」 (`brainstorming/references/templates.md`) | 판정형 |
| 「재협의 선택지」 (`plan-stage/SKILL.md`) | 판정형 |
| 「Ambiguous 단계 감지」 (`workflow-orchestrator/SKILL.md`) | 메뉴형 |
| 재논의 대기열 노출 (본 문서 5부) | 메뉴형 |
| 일반 결정 박스 (아래 「출력 스켈레톤」) | 메뉴형 |

새 결정 지점을 만들 때는 이 표에 행을 더한다. 표에 없는 자리는 메뉴형으로 읽는다.

**판정형 출력 스켈레톤 (고정 — 이 모양 그대로):**

```
📌 확인 : [모델이 내린 판정 한 줄]

- [✔ 출처] [그렇게 본 근거 1줄]
- [✔ 출처] [근거 1줄]

[그대로 진행하면 무엇이 달라지는가 — 한 줄. 만들어지는 파일이 있으면 그것을 적고,
없으면 그 대상이 어떤 상태로 남는지를 적는다]

1. 그대로 진행
2. 고칠 게 있다
```
```

- [ ] **Step 3: 검증한다**

Run:
```bash
grep -c "판정형" skills/workflow-orchestrator/decision-flow.md
```
Expected: `6` — 절 제목 · 판정형 불릿 · 갈림 기준 문장 · 표의 판정형 행 둘 · 출력 스켈레톤 제목.

Run — 다섯 자리가 전부 표에 있는지:
```bash
for s in "성격 승인 화면" "재협의 선택지" "Ambiguous 단계 감지" "재논의 대기열 노출" "일반 결정 박스"; do
  printf '%s: ' "$s"; grep -c "| 「\?$s" skills/workflow-orchestrator/decision-flow.md
done
```
Expected: 다섯 줄 모두 `1`.

Run — 판정형 화면의 선택지 이름 둘이 있는지:
```bash
grep -c "1. 그대로 진행" skills/workflow-orchestrator/decision-flow.md
grep -c "2. 고칠 게 있다" skills/workflow-orchestrator/decision-flow.md
```
Expected: 각각 `1`.

- [ ] **Step 4: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-verdict): 판정형·메뉴형 갈림 기준과 다섯 자리 표 신설"
```

---

## Task 3: 「성격 승인 화면」을 판정형으로 바꾼다

여기부터 두 태스크가 **두 화면에 확인 태그 붙은 칸을 만든다.** Task 5의 조립 전 조건은 이 칸들이 생긴 뒤에 넣어야 한다 — 순서를 뒤집으면 판정형으로 만들려는 두 자리가 둘 다 메뉴형으로 떨어진다.

**Files:**
- Modify: `skills/brainstorming/references/templates.md` (「성격 승인 화면」 절 전체)
- Modify: `skills/brainstorming/SKILL.md:290` (읽기 실패 폴백 한 줄)
- Modify: `skills/workflow-orchestrator/references/actions.md:8` (소비 계약 적용 경로 첫 항목)

**Interfaces:**
- Consumes: Task 2의 「판정형 출력 스켈레톤」
- Produces: 확인 태그가 붙은 근거 줄을 가진 성격 승인 화면. Task 5의 조립 전 조건이 이 칸을 본다. Task 11이 이 화면을 실물로 재현한다.
- 이 태스크가 담는 요구사항: REQ-001 · REQ-003 · REQ-004(만들어지는 것) · REQ-014(읽기 실패 폴백) · REQ-015(망설일 때의 기본값)

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
sed -n '/^## 「성격 승인 화면」/,/^## 「국면 4 디렉토리 구조」/p' skills/brainstorming/references/templates.md
```
Expected: `📌 결정 요청 : 어떤 일인지 정하기`로 시작하는 블록에 번호 선택지 넷(`1.`~`4.`)과 `💡 추천:`이 보인다. 확인 태그 `[✔`는 한 건도 없다.

- [ ] **Step 2: 화면 템플릿을 통째로 바꾼다**

`skills/brainstorming/references/templates.md`에서 `## 「성격 승인 화면」` 헤딩부터 `**승인 직후 같은 차례에 수행한다 (왕복 순증 0):**` **바로 앞**까지를 아래로 바꾼다. (그 아래 세 항목 — 기능명 고지·디렉토리 생성·HANDOFF 작성 — 은 그대로 둔다.)

````markdown
## 「성격 승인 화면」

시드 확인 직후에 그린다. **판정형이다** (원본: `decision-flow.md` 「판정형과 메뉴형」 표).

갈래 넷 중 어느 것인지는 모델이 저장소를 확인해 판정한다. 화면에 **갈래 이름 목록을 뿌리지 않는다** — 사용자가 분류표를 대신 채우는 자리가 아니다. `actions.md`를 Read해 블록 목록을 순회하는 것은 판정에 쓰고, 화면에는 판정 결과만 낸다.

근거는 저장소에서 만든다. 시드의 목표 문장에 나온 대상을 저장소에서 찾아 "이미 있는가"를 확인하고, 그 결과를 확인 태그와 파일 경로로 적는다.

```
📌 확인 : [대상]을 [갈래 판정 — 새로 만드는 · 바꾸는 · 다듬는 · 고치는] 일로 봤습니다

- [✔ 출처] [그렇게 본 근거 1줄 — 저장소에서 확인한 것]
- [✔ 출처] [근거 1줄]

그대로 가면 방금 확정한 시드로 설계를 이어 가고,
`docs/design/[카테고리]/[기능명]/` 폴더와 이어받기 파일이 만들어집니다.

1. 그대로 진행
2. 고칠 게 있다
```

- 첫 줄의 판정 문장에 **시드의 목표 문장에 나온 대상**을 넣는다 — "새 기능으로 봤습니다"가 아니라 "매칭 진입 경로를 새로 만드는 일로 봤습니다"
- 확인 태그 붙은 근거 줄이 **하나도 안 만들어지면 메뉴형으로 조립한다** (원본: `decision-flow.md` 「조립 전 조건」). 그때는 `actions.md` 블록 목록을 순회한 번호 목록을 내고, 각 선택지 이름에도 위와 같이 대상을 넣는다
- **「고칠 게 있다」를 받으면** 근거를 다시 보이고 자유 응답만 받는다 — 갈래 이름 목록을 붙이지 않는다. 받은 말을 갈래로 옮겨 다시 이 화면으로 확인받는다. 판정이 두 번 틀리면 그 자리에서 메뉴형으로 넘어간다
- **읽기 실패 폴백:** `actions.md`를 못 읽으면 갈래를 `new-feature`로 판정하고, 판정 문장에 "갈래 정의 파일을 못 읽어 기본값으로 두었습니다"를 근거 줄로 적는다 — 화면을 생략하지 않는다
- **망설이면 새로 만드는 쪽으로 판정한다** — [✔ `actions.md`의 new-feature 블록] 새 기능이 "남길 것이 가장 많은 갈래이며, 값이 없을 때의 기본값"이다. 두 갈래 사이에서 판단이 안 서면 남길 것이 많은 쪽을 잡고, 그 사실을 근거 줄에 적는다
````

- [ ] **Step 3: `brainstorming/SKILL.md`의 폴백 줄을 맞춘다**

`skills/brainstorming/SKILL.md:290`의 아래 줄을

```
(Read 실패 시 최소 요건: actions.md 블록 목록을 순회한 번호 목록 + 추정 기본값 + 승인 후 기능명 고지·디렉토리·HANDOFF 생성)
```

아래로 바꾼다:

```
(Read 실패 시 최소 요건: 판정형 한 줄 — `📌 확인 : [대상]을 새로 만드는 일로 봤습니다` + 확인 태그 붙은 근거 줄 + 「그대로 진행」·「고칠 게 있다」 + 승인 후 기능명 고지·디렉토리·HANDOFF 생성. 갈래 이름 목록을 뿌리지 않는다)
```

같은 파일 `:285`의 아래 줄에 판정형이라는 사실을 덧붙인다:

```
- **건너뛸 수 없는 바닥이다** (REQ-010 셋째) — 추정만으로 갈래를 확정하지 않는다. 어떤 갈래에서도, 사용자가 서둘러 달라고 해도 이 화면은 생략하지 않는다
```

→

```
- **건너뛸 수 없는 바닥이다** (REQ-010 셋째) — 추정만으로 갈래를 확정하지 않는다. 어떤 갈래에서도, 사용자가 서둘러 달라고 해도 이 화면은 생략하지 않는다. 이 화면은 **판정형**이다 — 모델이 판정하고 근거를 보인 뒤 승인을 받는다 (원본: `decision-flow.md` 「판정형과 메뉴형」)
```

- [ ] **Step 4: `actions.md`의 소비 계약을 맞춘다**

`skills/workflow-orchestrator/references/actions.md:6`의 아래 줄을

```
> ② **화면 표시 이름은 「설명」 칸의 첫 줄**에서 뽑는다. 별도 칸을 두지 않는다.
```

아래로 바꾼다:

```
> ② **화면에 갈래 이름을 표시할 때는 「설명」 칸의 첫 줄**에서 뽑는다. 별도 칸을 두지 않는다. 성격 승인 화면은 판정형이라 갈래 이름을 표시하지 않으므로 이 조항의 대상이 아니다 — 세션 재개 라벨이 이 조항의 소비자다.
```

같은 파일 `:8`의 적용 경로 목록에서 첫 항목을 바꾼다:

```
> 적용 경로 목록 (검증 기준 — 누락 0): ① 성격 승인 화면 (brainstorming Step B-1) ②
```

→

```
> 적용 경로 목록 (검증 기준 — 누락 0): ① 성격 승인 화면의 **갈래 판정** (brainstorming Step B-1 — 판정에 블록 목록을 순회하되 화면에는 이름을 내지 않는다) ②
```

- [ ] **Step 5: 검증한다**

Run — 갈래 이름 목록이 화면에서 사라졌는지:
```bash
sed -n '/^## 「성격 승인 화면」/,/^## 「국면 4 디렉토리 구조」/p' skills/brainstorming/references/templates.md | grep -cE "^[1-4]\. \[블록"
```
Expected: `0`

Run — 판정형 선택지 둘이 있는지:
```bash
sed -n '/^## 「성격 승인 화면」/,/^## 「국면 4 디렉토리 구조」/p' skills/brainstorming/references/templates.md | grep -c "그대로 진행"
```
Expected: `1` 이상

Run — 확인 태그 칸이 생겼는지:
```bash
sed -n '/^## 「성격 승인 화면」/,/^## 「국면 4 디렉토리 구조」/p' skills/brainstorming/references/templates.md | grep -c '\[✔ 출처\]'
```
Expected: `2`

Run — 승인 직후 세 항목이 그대로 남아 있는지:
```bash
grep -c "승인 직후 같은 차례에 수행한다" skills/brainstorming/references/templates.md
grep -c "이 파일이 국면 4까지 갈래 값의 임시 정본이다" skills/brainstorming/references/templates.md
```
Expected: 각각 `1`.

Run — 폴백과 소비 계약이 맞춰졌는지:
```bash
grep -c "갈래 이름 목록을 뿌리지 않는다" skills/brainstorming/SKILL.md
grep -c "세션 재개 라벨이 이 조항의 소비자다" skills/workflow-orchestrator/references/actions.md
```
Expected: 각각 `1`.

- [ ] **Step 6: 커밋**

```bash
git add skills/brainstorming/references/templates.md skills/brainstorming/SKILL.md skills/workflow-orchestrator/references/actions.md
git commit -m "feat(decision-verdict): 성격 승인 화면을 판정형으로 · 폴백과 소비 계약 정합"
```

---

## Task 4: 「재협의 선택지」를 판정형으로 바꾼다

**Files:**
- Modify: `skills/plan-stage/SKILL.md:216~231` (「재협의 선택지 (🚫 RENEGOTIATE 항목)」 절)

**Interfaces:**
- Consumes: Task 2의 「판정형 출력 스켈레톤」, Task 3이 세운 판정 문장 관용구
- Produces: 확인 태그 붙은 칸을 가진 재협의 화면. Task 5의 조립 전 조건이 이 칸을 본다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
sed -n '/^### 재협의 선택지/,/사용자 응답 없이 Step 4로/p' skills/plan-stage/SKILL.md
```
Expected: `── 재협의 필요 항목 ─`로 시작하는 괘선 블록에 번호 선택지 넷이 보인다. 확인 태그 `[✔`도 「확인된 사실」 칸도 없다.

- [ ] **Step 2: 절을 통째로 바꾼다**

`skills/plan-stage/SKILL.md`에서 `### 재협의 선택지 (🚫 RENEGOTIATE 항목)` 헤딩부터 그 아래 코드 펜스가 끝나는 줄까지를 아래로 바꾼다. (`사용자 응답 없이 Step 4로 넘어가지 않는다.` 줄은 그대로 둔다.)

````markdown
### 재협의 선택지 (🚫 RENEGOTIATE 항목)

**판정형이다** (원본: `../workflow-orchestrator/decision-flow.md` 「판정형과 메뉴형」 표).

바로 앞의 Researcher 증거 조사가 근거를 만든다. 그 조사 결과에서 확인 태그 붙은 줄을 골라 화면에 싣고, **어떻게 할지를 모델이 판정해서 먼저 보인다.** 넷을 늘어놓고 고르게 하지 않는다.

```
📌 확인 : [요구사항명]을 [판정 — 설계로 되돌리는 · 이번 범위에서 빼는 · 경고를 달고 남기는 · 대안을 찾는] 쪽으로 봤습니다

- [✔ 출처] [그렇게 본 근거 1줄 — 조사에서 확인한 것]
- [✔ 출처] [근거 1줄]

그대로 가면 [이 요구사항이 어떤 상태로 남는지 한 줄 — 예: "이 요구사항은 이번 구현
대상에서 빠지고, 설계 문서 10장에 뺀 사유가 한 줄로 남습니다"]

1. 그대로 진행
2. 고칠 게 있다
```

- 판정 문장에 **요구사항 이름**을 넣는다 — "빼는 쪽으로 봤습니다"가 아니라 "REQ-012 분량 상한을 이번 범위에서 빼는 쪽으로 봤습니다"
- **"그대로 가면" 줄에 만들어지는 파일을 적지 않는다.** 이 자리는 파일이 생기지 않는다. 대신 **그 요구사항이 어떤 상태로 남는지**를 적는다 — 이 자리는 잘못 끄덕이면 되돌리기가 파일 되돌리기가 아니라 국면 하나를 다시 여는 일이라, 다섯 자리 중 되돌리기 비용이 가장 크다
- 확인 태그 붙은 근거 줄이 하나도 안 만들어지면 메뉴형으로 조립한다 (원본: `decision-flow.md` 「조립 전 조건」). 그때 쓰는 네 선택지는 아래와 같고, 각 이름에 요구사항 이름을 넣는다

  ```
  1. [요구사항명]을 설계로 되돌려 고친다 — 고르면: 브레인스토밍 문서를 고치고 다시 검토합니다
  2. [요구사항명]을 이번 범위에서 뺀다 — 고르면: 이번 구현에서 빠지고 문서에 뺀 사유가 남습니다
  3. [요구사항명]을 경고만 달고 남긴다 — 고르면: CAUTION 상태로 구현 대상에 남습니다
  4. [요구사항명]의 대안을 찾는다 — 고르면: 페르소나가 대안을 만들어 다시 여쭙니다
  ```

- **「고칠 게 있다」를 받으면** 근거를 다시 보이고 자유 응답만 받는다 — 위 네 이름 목록을 붙이지 않는다. 받은 말을 넷 중 하나로 옮겨 다시 이 화면으로 확인받는다. 판정이 두 번 틀리면 그 자리에서 메뉴형으로 넘어간다
````

- [ ] **Step 3: 검증한다**

Run — 판정형으로 바뀌었는지:
```bash
sed -n '/^### 재협의 선택지/,/사용자 응답 없이 Step 4로/p' skills/plan-stage/SKILL.md | grep -c "그대로 진행"
```
Expected: `1` 이상

Run — 확인 태그 칸이 생겼는지:
```bash
sed -n '/^### 재협의 선택지/,/사용자 응답 없이 Step 4로/p' skills/plan-stage/SKILL.md | grep -c '\[✔ 출처\]'
```
Expected: `2`

Run — 옛 괘선 블록이 사라졌는지:
```bash
grep -c "── 재협의 필요 항목 ─" skills/plan-stage/SKILL.md
```
Expected: `0`

Run — 메뉴형 폴백 선택지 넷에 요구사항 이름 자리가 있는지:
```bash
sed -n '/^### 재협의 선택지/,/사용자 응답 없이 Step 4로/p' skills/plan-stage/SKILL.md | grep -cE "^  [1-4]\. \[요구사항명\]"
```
Expected: `4`

Run — 다음 줄이 그대로 남아 있는지:
```bash
grep -c "사용자 응답 없이 Step 4로 넘어가지 않는다" skills/plan-stage/SKILL.md
```
Expected: `1`

- [ ] **Step 4: 커밋**

```bash
git add skills/plan-stage/SKILL.md
git commit -m "feat(decision-verdict): 재협의 선택지를 판정형으로 · 되돌리기 비용을 화면에 노출"
```

---

## Task 5: 조립 전 조건·되묻기 지시·상태 보존 항목을 넣는다

Task 3·4가 두 화면에 확인 태그 칸을 만든 **뒤에** 한다.

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (Task 2가 만든 「판정형과 메뉴형」 절 끝 — 「판정형 출력 스켈레톤」 펜스 뒤)
- Modify: `skills/workflow-orchestrator/decision-flow.md` (6부 「상태 보존」의 HANDOFF 저장 항목)
- Modify: `skills/context-handling/SKILL.md` (「결정 흐름 상태」 섹션 — 재서술 지점 아홉째)

**Interfaces:**
- Consumes: Task 2의 「판정형과 메뉴형」 절, Task 3·4가 만든 확인 태그 칸
- Produces: 「조립 전 조건」과 「되묻기」 문장. Task 10의 스윕이 이 문장을 사본과 대조한다.
- 이 태스크가 담는 요구사항: REQ-005(조립 전 조건) · REQ-007(두 번 틀리면 · 오답 횟수 보존 · 재서술 지점 아홉째 정합)

- [ ] **Step 1: 두 화면에 칸이 실제로 생겼는지 먼저 확인한다 (순서 확인)**

Run:
```bash
grep -c '\[✔ 출처\]' skills/brainstorming/references/templates.md
grep -c '\[✔ 출처\]' skills/plan-stage/SKILL.md
```
Expected: 각각 `2` 이상. **하나라도 0이면 여기서 멈추고 Task 3·4를 먼저 끝낸다** — 칸이 없는 상태로 조립 전 조건을 넣으면 두 화면이 둘 다 메뉴형으로 떨어진다.

- [ ] **Step 2: 조립 전 조건과 되묻기를 넣는다**

Task 2가 넣은 「판정형 출력 스켈레톤」 코드 펜스가 끝난 **바로 뒤에** 아래를 넣는다:

```markdown
**조립 전 조건 (실행 시점 안전망):** 판정형으로 박힌 자리인데 「확인된 사실」에 해당하는 근거 줄에 확인 태그(`[✔ 출처]`)가 **한 줄도 없으면 메뉴형으로 조립한다.** 이 판정은 박스를 조립하기 **전에** 한다 — 판정형이냐 메뉴형이냐가 박스 모양 자체를 바꾸므로, 조립을 끝낸 뒤 아래 「내보내기 전 검사」에서 발견하면 되돌아가 처음부터 다시 조립하는 일이 되고 그것은 검사가 아니라 재작성이다.

**되묻기:** 「고칠 게 있다」를 받으면 근거를 다시 보이고 **자유 응답만 받는다** — 선택지 이름 목록을 붙이지 않는다. 받은 말을 값으로 옮기는 것은 모델 몫이고, 옮긴 결과를 다시 판정형으로 확인받는다. **판정이 두 번 틀리면 그 자리에서 메뉴형으로 넘어간다** — 두 번 틀렸다는 것은 근거가 틀렸다는 뜻이므로 횟수 상한이 아니라 이 조건이 멈춤을 만든다.

이 되묻기는 1부 「응답 주권」의 "이미 답한 항목을 재질문하지 않는다"가 금지한 재질문이 **아니다.** 같은 결정의 판정을 갱신하는 것이라 새 결정 번호를 매기지 않고, 헤더의 확정 개수(N/M)도 움직이지 않는다.
```

- [ ] **Step 3: 상태 보존 항목에 오답 횟수를 더한다**

`skills/workflow-orchestrator/decision-flow.md:128`에서 아래 조각을 찾는다:

```
결정 박스 등급 판정 근거(직전 라운드·조사 유무)·발언 재실행 이력(라운드별 상한 소진)·[✔] 최초 고지 완료 여부도 함께 기록한다 — 유실 시 보수적으로 재판정한다 (등급은 4칸 쪽, 고지는 재고지 쪽).
```

아래로 바꾼다:

```
결정 박스 등급 판정 근거(직전 라운드·조사 유무)·발언 재실행 이력(라운드별 상한 소진)·[✔] 최초 고지 완료 여부·**판정형 자리의 판정 오답 횟수**도 함께 기록한다 — 유실 시 보수적으로 재판정한다 (등급은 4칸 쪽, 고지는 재고지 쪽, 오답 횟수는 0 쪽 — 두 번 틀림 판정을 넘겨짚어 메뉴형으로 떨어뜨리지 않는다).
```

- [ ] **Step 4: `context-handling/SKILL.md`의 HANDOFF 템플릿에 칸을 만든다**

원본에 보존 항목을 더해도 실제로 저장되는 템플릿에 칸이 없으면 값이 갈 곳이 없다. `skills/context-handling/SKILL.md`의 「결정 흐름 상태」 섹션에서 아래 두 줄을

```
- [✔] 최초 고지: [완료/미완료]
<!-- 유실 시 보수적으로 재판정 (등급은 4칸 쪽, 고지는 재고지 쪽) — 결정 규범 문서의 상태 보존 절 -->
```

아래로 바꾼다:

```
- [✔] 최초 고지: [완료/미완료]
- 판정 오답 횟수: [판정형 자리별 오답 횟수 — 진행 중 결정만]
<!-- 유실 시 보수적으로 재판정 (등급은 4칸 쪽, 고지는 재고지 쪽, 오답 횟수는 0 쪽) — 결정 규범 문서의 상태 보존 절 -->
```

- [ ] **Step 5: 검증한다**

Run — 템플릿에 칸이 생겼는지:
```bash
grep -c "판정 오답 횟수" skills/context-handling/SKILL.md
grep -c "오답 횟수는 0 쪽" skills/context-handling/SKILL.md
```
Expected: 각각 `1`.

Run:
```bash
grep -c "조립 전 조건" skills/workflow-orchestrator/decision-flow.md
grep -c "판정이 두 번 틀리면" skills/workflow-orchestrator/decision-flow.md
grep -c "판정형 자리의 판정 오답 횟수" skills/workflow-orchestrator/decision-flow.md
```
Expected: 각각 `1` 이상.

Run — 조립 전 조건이 「내보내기 전 검사」보다 앞에 있는지 (층위 확인):
```bash
a=$(grep -n '^\*\*조립 전 조건' skills/workflow-orchestrator/decision-flow.md | head -1 | cut -d: -f1)
b=$(grep -n '^\*\*내보내기 전 검사' skills/workflow-orchestrator/decision-flow.md | head -1 | cut -d: -f1)
test "$a" -lt "$b" && echo "OK 조립 전 조건이 앞선다" || echo "FAIL 순서가 뒤집혔다"
```
Expected: `OK 조립 전 조건이 앞선다`

- [ ] **Step 6: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/context-handling/SKILL.md
git commit -m "feat(decision-verdict): 조립 전 조건·되묻기 지시·판정 오답 횟수 보존"
```

---

## Task 6: 설명 블록을 이름표 없는 문단으로 바꾼다

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (「설명 블록 (결정 전용 — 박스 바로 앞):」 절 전체)
- Modify: `skills/workflow-orchestrator/decision-flow.md` (「실물 예시」의 🧭 설명 부분)

**Interfaces:**
- Consumes: 없음
- Produces: 문단형 설명 블록 규정. Task 7의 검사 항목이 이 규정을 더 이상 세지 않는다. Task 10이 사본 다섯 자리를 이 문장에 맞춘다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
grep -c "설명 네 항목" skills/workflow-orchestrator/decision-flow.md
```
Expected: `2` (규정 하나 + 검사 항목 하나)

Run:
```bash
grep -cE "^\*\*(왜|무엇을|어떻게|언제)\*\* —" skills/workflow-orchestrator/decision-flow.md
```
Expected: `8` — 「설명 블록」 규정 안 템플릿의 넷과 「실물 예시」의 넷. **두 자리를 다 지운다.**

- [ ] **Step 2: 설명 블록 규정을 바꾼다**

`skills/workflow-orchestrator/decision-flow.md`에서 `**설명 블록 (결정 전용 — 박스 바로 앞):**`부터 그 아래 불릿 **넷**이 끝나는 줄(`- 항목 안의 줄 수에 상한을 두지 않는다. 네 항목이라는 모양 자체가 상한 노릇을 한다`)까지를 아래로 바꾼다:

````markdown
**설명 블록 (결정 전용 — 박스 바로 앞):**

결정 박스 앞에 **짧은 문단**으로 설명을 쓴다. 사전 브리핑(F)이 있으면 브리핑 → 설명 블록 → 박스 순이다.

```
🧭 **설명**

[짧은 문단. 이름표를 붙이지 않는다.]
```

- **담을 내용의 점검표:** 왜 · 무엇을 · 어떻게 · 언제. **넷을 다 채우려 하지 않는다** — 그 결정에 필요한 것만 쓴다. 이 넷은 쓸 내용을 고르는 점검표이지 화면 모양이 아니다. 이름표를 붙여 항목으로 나누지 않는다
- **요구 시점:** 아래 「적용 등급」의 판정 질문을 그대로 쓴다 — "이 결정 직전에 페르소나 라운드 또는 조사가 있었는가?"가 "있었다"면 블록 필수, "없었다"면 생략. 등급과 별개로, 사용자가 더 풀어 달라고 하면 등급과 무관하게 낸다 (3부 「초심자 구조 기본값」의 재설명 경로에 잇는다 — 새 어휘 목록을 만들지 않는다)
- **연결 한 줄을 두지 않는다** — 앞선 결정과의 연결은 박스 첫 칸이 담당한다. 블록은 문단이고 박스 첫 칸은 그 한 줄 요약이라 층이 다르다
- 고르는 데 영향을 주지 않는 내용은 쓰지 않는다 — 3부 「검증 규범」의 선별 침묵을 블록 전체로 넓힌 것이다 (그 규칙은 원래 확인 불가 항목에만 걸린다 — **범위 확대이지 재적용이 아니다**)
- **분량 상한을 두지 않는다.** 이름표를 뗀 자리에 새 상한을 만들지 않는다 — 분량을 세는 어떤 문장도 뜻 판정이 되어 「내보내기 전 검사」의 "주관 술어를 쓰지 않는다"와 부딪힌다. 상한 없이 가는 것의 부작용은 관측 항목이다
````

- [ ] **Step 3: 실물 예시의 설명 부분을 문단으로 바꾼다**

「실물 예시」 절에서 아래 여덟 줄(이름표 넷과 그 사이 빈 줄)을

```
🧭 **설명**

**왜** — 질문을 하나씩 내는 방식에서 사용자가 앞질러 답하면, 그 답을 어디에 넣을지가 정해져 있지 않습니다.

**무엇을** — 질문 순회 절차와 응답 처리 규칙 둘이 걸립니다. 순회는 다음 질문을 고르고, 응답 처리는 받은 값을 어느 질문에 매기는지 정합니다.

**어떻게** — 응답이 오면 처리 규칙이 먼저 값을 세고, 그다음 순회가 다음 질문을 냅니다. 값이 여러 개면 처리 규칙이 몇 개를 받아들일지 정한 뒤 순회에 넘깁니다.

**언제** — 하나씩 모드로 질문을 내는 도중, 사용자 응답을 받은 직후입니다.
```

아래로 바꾼다:

```
🧭 **설명**

질문을 하나씩 내는 도중에 사용자가 앞질러 답하면, 그 답을 어디에 넣을지가 정해져 있지 않습니다. 걸리는 것은 질문 순회 절차와 응답 처리 규칙 둘입니다. 응답이 오면 처리 규칙이 먼저 받은 값을 세고, 그다음 순회가 다음 질문을 냅니다.
```

**같은 절의 선택지 1번 결과 줄도 고친다.** Task 7이 새로 거는 결과 줄 검사를 이 예시가 통과하지 못한다 — 박스의 문제 칸 명사는 {질문, 사용자, 답, 경우}인데 지금 결과 줄에 하나도 없다. 규범 원본이 자기 예시로 위반 사례를 보이면 안 된다.

```
1. 받아준다 — 고르면: 순서대로 배정하고 배정 결과표로 확인
```

→

```
1. 받아준다 — 고르면: 앞질러 온 답을 질문 순서대로 배정하고 배정 결과표로 확인
```

(2번 「답 하나만 받는다 — 고르면: 나머지는 순서대로 다시 질문」은 "질문"이 들어 있어 그대로 통과한다.)

같은 절 첫 줄의 안내 문구도 맞춘다:

```
**실물 예시 (규범이 적용된 결정 요청 — 이 예시는 「있었다」 등급이다. 「없었다」 등급에서는 블록 없이 "이 결정이 다루는 문제" 칸만 쓴다):**
```

→ 그대로 둔다 (등급 설명이 여전히 맞다).

- [ ] **Step 4: 검증한다**

Run — 이름표 규정이 원본에서 사라졌는지:
```bash
grep -c "이름표와 함께 쓴다" skills/workflow-orchestrator/decision-flow.md
grep -cE "^\*\*(왜|무엇을|어떻게|언제)\*\* —" skills/workflow-orchestrator/decision-flow.md
```
Expected: 각각 `0`.

Run — 점검표로 남았는지:
```bash
grep -c "담을 내용의 점검표" skills/workflow-orchestrator/decision-flow.md
grep -c "넷을 다 채우려 하지 않는다" skills/workflow-orchestrator/decision-flow.md
```
Expected: 각각 `1`.

Run — 실물 예시가 문단이 됐는지:
```bash
sed -n '/^\*\*실물 예시/,/추천: 2/p' skills/workflow-orchestrator/decision-flow.md | grep -cE "^\*\*(왜|무엇을|어떻게|언제)\*\*"
```
Expected: `0`

Run — 예시의 결과 줄이 새 검사를 통과하는지:
```bash
grep -c "앞질러 온 답을 질문 순서대로 배정하고" skills/workflow-orchestrator/decision-flow.md
```
Expected: `1`

- [ ] **Step 5: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-verdict): 설명 블록을 이름표 없는 문단으로 · 실물 예시 정합"
```

---

## Task 7: 「내보내기 전 검사」를 세 항목으로 다시 짠다

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (「내보내기 전 검사」 절 전체 — 검사 항목 둘·실패 처리·작성 지침 문단까지)

**Interfaces:**
- Consumes: Task 2의 다섯 자리 표(메뉴형 행이 이 검사의 적용 자리), Task 5의 조립 전 조건(근거 태그는 여기서 세지 않는다), Task 6의 문단형 설명 블록(이름표 검사가 사라진다)
- Produces: 검사 세 항목 — 「선택지 낱말」(모든 박스) · 「결과 줄」(메뉴형 전부) · 「선택지 대상」(두 화면). Task 9가 Ambiguous 화면을 이 셋에 맞춘다. Task 11이 이 셋으로 실물을 판정한다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
sed -n '/^\*\*내보내기 전 검사/,/^\*\*적용 밖/p' skills/workflow-orchestrator/decision-flow.md
```
Expected: 검사 항목 둘이 보이고 1번이 「설명 네 항목」이며, 아래에 `작성 지침 (검사 아님)` 문단이 있고 그 안에 "이 항목은 세지 않는다"가 있다.

- [ ] **Step 2: 절을 통째로 바꾼다**

`**내보내기 전 검사 (본체 담당 — 박스를 조립한 뒤 화면에 올리기 전):**`부터 `작성 지침 (검사 아님): …이 항목은 세지 않는다.` 줄까지를 아래로 바꾼다. (`**적용 밖 …**` 줄은 Task 8이 다룬다 — 여기서는 건드리지 않는다.)

````markdown
**내보내기 전 검사 (본체 담당 — 박스를 조립한 뒤 화면에 올리기 전):**

아래 셋을 센다. 주관 술어를 쓰지 않는다. 근거 태그 유무는 여기서 세지 않는다 — 그것은 위 「조립 전 조건」이 조립 **전에** 본다.

**검사마다 적용 자리가 다르다.** 면제를 따로 모으지 않고 각 검사 옆에 적는다.

1. **선택지 낱말** — 선택지 이름에 쓰인 낱말 중, 이 박스와 바로 앞 블록 본문에 한 번도 안 나오고 풀이도 안 붙은 말이 하나라도 있으면 실패
   - 풀이란 그 낱말의 뜻을 그 자리에서 푸는 문장을 말한다. 선택지의 "고르면:" 줄은 결과를 적는 자리이므로 풀이로 치지 않는다
   - "나온다"는 어간이 같으면 나온 것으로 센다 — 예를 들어 블록에 "받은 값"이 있으면 선택지의 "받아준다"는 나온 것이다

2. **결과 줄** — 선택지의 "고르면:" 줄에 「이 결정이 다루는 문제」 칸이나 「확인된 사실」 칸에 나온 명사가 하나도 안 들어 있으면 실패
   - **대조 상대는 이 두 칸이다.** "사용자가 겪는 차이인가"를 뜻으로 판정하지 않는다 — 그러면 주관 술어가 된다
   - 걸러내는 것은 워크플로우 절차만 적은 줄과 파일 이름·자료 구조 이름만 적은 줄이다. "고르면: 묻는 것이 기본 그대로입니다"는 걸리고 "고르면: 항목별로 페르소나 토론을 다시 엽니다"는 통과한다(문제 칸에 "항목"이 있다)
   - 명사 대조도 어간이 같으면 나온 것으로 센다 (1번과 같은 규칙)
   - **적용 자리:** 위 「판정형과 메뉴형」 표에서 **메뉴형**으로 박힌 자리 전부. 로컬 템플릿도 포함한다 — 결과 줄은 문장을 고쳐 쓰는 것뿐이라 화면 무게가 안 는다

3. **선택지 대상** — 선택지 **이름**에 「이 결정이 다루는 문제」 칸이나 「확인된 사실」 칸에 나온 명사가 하나도 안 들어 있으면 실패
   - 걸러내는 것은 어떤 요청에도 똑같이 쓸 수 있는 이름이다. "새 기능 만들기"·"계획"은 걸리고 "매칭 진입 경로 새로 만들기"·"매칭 진입 계획 세우기"는 통과한다
   - **적용 자리:** 「성격 승인 화면」과 「Ambiguous 단계 감지」 **둘.** 나머지 메뉴형 자리는 이번 릴리스의 대상이 아니다 — 문제가 보고된 적이 없고, 범위를 다 열고 세다가 놓치는 실패를 이 저장소가 두 번 겪었다
   - 판정형 자리(성격 승인)는 선택지 이름이 「그대로 진행」·「고칠 게 있다」로 고정이므로, 대상은 선택지가 아니라 **판정 문장**에 들어간다. 근거를 못 만들어 메뉴형으로 떨어진 경우에만 선택지 이름을 센다

실패하면 채운다. 채울 재료가 없으면 조사한다. 조사하고도 못 채우면 「확인 못 한 것」 칸에 그 사실을 적고 진행한다 — **1회 한정** (본 문서 「원문 전달 원칙」의 재실행 1회 한정과 같은 모양). **설명을 못 한다는 이유로 묻기를 건너뛰지 않는다.**
````

- [ ] **Step 3: 검증한다**

Run — 이름표 검사가 사라지고 대상 검사가 생겼는지:
```bash
sed -n '/^\*\*내보내기 전 검사/,/^\*\*적용 밖/p' skills/workflow-orchestrator/decision-flow.md | grep -c "설명 네 항목"
```
Expected: `0`

```bash
sed -n '/^\*\*내보내기 전 검사/,/^\*\*적용 밖/p' skills/workflow-orchestrator/decision-flow.md | grep -c "선택지 대상"
```
Expected: `1`

Run — 결과 줄 규칙이 검사 안으로 들어왔는지:
```bash
grep -c "작성 지침 (검사 아님)" skills/workflow-orchestrator/decision-flow.md
grep -c "이 항목은 세지 않는다" skills/workflow-orchestrator/decision-flow.md
```
Expected: 각각 `0` — 강등 문장이 사라졌다.

```bash
sed -n '/^\*\*내보내기 전 검사/,/^\*\*적용 밖/p' skills/workflow-orchestrator/decision-flow.md | grep -c '"고르면:" 줄'
```
Expected: `2` 이상 (1번의 풀이 예외 + 2번의 대조 대상)

Run — 검사 항목이 정확히 셋인지:
```bash
sed -n '/^\*\*내보내기 전 검사/,/^\*\*적용 밖/p' skills/workflow-orchestrator/decision-flow.md | grep -cE "^[0-9]\. \*\*"
```
Expected: `3`

Run — 검사마다 적용 자리가 붙어 있는지:
```bash
sed -n '/^\*\*내보내기 전 검사/,/^\*\*적용 밖/p' skills/workflow-orchestrator/decision-flow.md | grep -c "적용 자리:"
```
Expected: `2` — 2번과 3번. 1번은 모든 결정 박스라 따로 적지 않는다.

Run — 「설명 네 항목」이 저장소 전체에서 몇 건 남았는지 (아직 사본이 남아 있어야 정상):
```bash
grep -rn "설명 네 항목" --include=*.md skills/ README.md | wc -l
```
Expected: `3` — `bootstrap.md`·`workflow-orchestrator/SKILL.md`·`grounding.md`. `README.md`는 같은 규정을 "왜·무엇을·어떻게·언제 네 줄 설명"이라는 다른 표현으로 쓰고 있어 이 검색에 안 잡힌다. Task 10이 이 셋과 README까지 넷을 0으로 만든다.

- [ ] **Step 4: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-verdict): 내보내기 전 검사를 낱말·결과 줄·대상 셋으로"
```

---

## Task 8: 로컬 템플릿 면제를 네 자리에서 쪼갠다

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md:178` (「로컬 템플릿 우선」)
- Modify: `skills/workflow-orchestrator/decision-flow.md:276` (「적용 등급」 셋째 줄)
- Modify: `skills/workflow-orchestrator/decision-flow.md` (「적용 밖」 첫째 항목)
- Modify: `skills/workflow-orchestrator/references/grounding.md:25` (등급 경계 셋째 줄)

**Interfaces:**
- Consumes: Task 7의 검사 두 항목
- Produces: 로컬 템플릿이 설명 블록만 면제받고 검사는 각 항목의 적용 자리를 따르는 상태. Task 3·4가 고친 두 화면이 이 규칙과 어긋나지 않게 된다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
grep -n "로컬 템플릿" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/references/grounding.md
```
Expected: `decision-flow.md`에서 다섯 건 — 적용 스킬 머리말 · 「로컬 템플릿 우선」("문서 그대로 출력한다") · 적용 등급 셋째 줄("기존 형식 그대로 … 변경 없음") · 경계 예시 · 「적용 밖」 첫 항목("① 로컬 템플릿 결정"). `grounding.md`에서 두 건(25·26행).

> **줄 번호를 믿지 말 것.** Task 1·2·5·6이 `decision-flow.md`를 앞쪽에서 늘렸으므로 이 시점에는 178·276·292가 모두 밀려 있다. 이 계획의 모든 편집은 줄 번호가 아니라 **고유한 리터럴 문자열**로 자리를 찾는다.

- [ ] **Step 2: `decision-flow.md:178`을 고친다**

아래 줄 끝에 문장 하나를 더한다:

```
**로컬 템플릿 우선:** … D 박스는 템플릿이 지정되지 않은 결정 요청에 적용한다.
```

→

```
**로컬 템플릿 우선:** … D 박스는 템플릿이 지정되지 않은 결정 요청에 적용한다. **다만 「내보내기 전 검사」는 각 항목의 「적용 자리」를 따른다** — 로컬 템플릿이라는 이유로 통째로 면제되지 않는다. 선택지 낱말 검사는 모든 박스에, 결과 줄 검사는 메뉴형 자리 전부에 걸린다. 템플릿을 그대로 출력한다는 것은 모양을 재조립하지 않는다는 뜻이지, 그 안의 결과 줄을 이번 요청에 맞게 쓰지 않아도 된다는 뜻이 아니다. 면제되는 것은 설명 블록 요구뿐이다.
```

- [ ] **Step 3: `decision-flow.md:276`을 고친다**

```
- 로컬 템플릿 결정·단순 승인 게이트 → 기존 형식 그대로 (본 문서 「로컬 템플릿 우선」·orchestrator Input Format Rules 관할 — 변경 없음)
```

→

```
- 로컬 템플릿 결정·단순 승인 게이트 → 칸 구성은 기존 형식 그대로이고 **설명 블록은 면제**다 (본 문서 「로컬 템플릿 우선」·orchestrator Input Format Rules 관할). 「내보내기 전 검사」는 각 항목의 「적용 자리」를 따른다
```

- [ ] **Step 4: 「적용 밖」 첫째 항목을 쪼갠다**

```
**적용 밖 (검증 기준 — 누락 0):** ① 로컬 템플릿 결정 (본 문서 「로컬 템플릿 우선」) ② 탐색적 질문 …
```

→

```
**적용 밖 (검증 기준 — 누락 0):** ① 로컬 템플릿 결정 — **설명 블록 요구만 면제.** 검사는 각 항목의 「적용 자리」를 따른다 (본 문서 「로컬 템플릿 우선」) ② 탐색적 질문 …
```

- [ ] **Step 5: `grounding.md:25`를 고친다**

```
- 국면 0 카테고리 확정·시드 확인 등 로컬 템플릿 결정 → 기존 템플릿 그대로
```

→

```
- 국면 0 카테고리 확정·시드 확인 등 로컬 템플릿 결정 → 칸 구성은 기존 템플릿 그대로, 설명 블록은 면제. 「내보내기 전 검사」는 각 항목의 「적용 자리」를 따른다 (선택지 낱말은 모든 박스, 결과 줄은 메뉴형 전부, 선택지 대상은 성격 승인과 단계 감지 둘)
```

- [ ] **Step 6: 검증한다**

Run — 네 자리가 전부 바뀌었는지:
```bash
grep -c "면제되는 것은 설명 블록 요구뿐이다" skills/workflow-orchestrator/decision-flow.md
grep -c "「내보내기 전 검사」는 각 항목의 「적용 자리」를 따른다" skills/workflow-orchestrator/decision-flow.md
grep -c "설명 블록 요구만 면제" skills/workflow-orchestrator/decision-flow.md
grep -c "각 항목의 「적용 자리」를 따른다" skills/workflow-orchestrator/references/grounding.md
```
Expected: 각각 `1` 이상.

Run — 옛 문장이 사라졌는지:
```bash
grep -c "기존 형식 그대로 (본 문서" skills/workflow-orchestrator/decision-flow.md
grep -c "로컬 템플릿 결정 → 기존 템플릿 그대로$" skills/workflow-orchestrator/references/grounding.md
```
Expected: 각각 `0`.

- [ ] **Step 7: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/references/grounding.md
git commit -m "fix(decision-verdict): 로컬 템플릿 면제를 네 자리에서 설명 블록만으로 좁힘"
```

---

## Task 9: 「Ambiguous 단계 감지」에 대상 규칙을 적용한다

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md:176~187` (「Ambiguous」 절)

**Interfaces:**
- Consumes: Task 2의 다섯 자리 표(이 자리는 메뉴형), Task 7의 검사 2번
- Produces: 대상이 들어간 선택지 넷. Task 11이 이 화면을 실물로 재현한다.

- [ ] **Step 1: 지금 상태를 확인한다 (실패 확인)**

Run:
```bash
sed -n '/^### Ambiguous/,/^## Superpowers Delegation/p' skills/workflow-orchestrator/SKILL.md
```
Expected: 선택지 넷이 "1. 브레인스토밍 — 고르면: 페르소나 인터뷰로 요구사항 탐색 시작" 형태이고, 어느 이름에도 이번 요청의 대상이 없다.

- [ ] **Step 2: 절을 바꾼다**

`### Ambiguous` 헤딩 아래 본문과 코드 펜스를 아래로 바꾼다:

````markdown
### Ambiguous

워크플로우 의도 신호는 있으나 단계가 불명확할 때만 질문한다. 답이 이미 정해진 요청이면 질문 없이 일반 응답한다 (Session Start Protocol의 게이트).

**메뉴형이다** (원본: `decision-flow.md` 「판정형과 메뉴형」 표) — 이 화면은 근거를 못 대는 것이 발동 조건이라 판정형을 쓰지 않는다. 대신 **선택지 이름과 결과 줄에 사용자 요청의 대상을 넣는다** (원본: 같은 문서 「내보내기 전 검사」 2번). `[대상]`은 사용자 발화에서 뽑은 이번 일의 이름이다.

```
지금 무엇을 하려는 것인지 잡지 못했습니다. 어느 쪽인가요?

1. [대상]을 처음부터 짚기 — 고르면: 무엇을 만들지 아직 안 정해졌으니 [대상]의 요구사항부터 캡니다
2. [대상] 계획 세우기 — 고르면: [대상]의 설계 문서가 이미 있으니 할 일 목록을 짭니다
3. [대상] 만들기 — 고르면: [대상]의 할 일 목록이 있으니 바로 구현으로 넘어갑니다
4. [대상] 살펴보기 — 고르면: 이미 만든 [대상]의 코드를 검토합니다
0. 이 중에 없음 — 하려는 일을 자유롭게 설명해주세요
```
````

- [ ] **Step 3: 검증한다**

Run — 대상 자리가 들어갔는지:
```bash
sed -n '/^### Ambiguous/,/^## Superpowers Delegation/p' skills/workflow-orchestrator/SKILL.md | grep -cE "^[1-4]\. \[대상\]"
```
Expected: `4`

Run — 결과 줄에도 대상이 들어갔는지:
```bash
sed -n '/^### Ambiguous/,/^## Superpowers Delegation/p' skills/workflow-orchestrator/SKILL.md | grep -c "고르면: .*\[대상\]"
```
Expected: `3` 이상

Run — 옛 선택지가 사라졌는지:
```bash
grep -c "1. 브레인스토밍 — 고르면: 페르소나 인터뷰로 요구사항 탐색 시작" skills/workflow-orchestrator/SKILL.md
```
Expected: `0`

Run — 자유 입력 탈출구가 남아 있는지:
```bash
sed -n '/^### Ambiguous/,/^## Superpowers Delegation/p' skills/workflow-orchestrator/SKILL.md | grep -c "^0\. 이 중에 없음"
```
Expected: `1`

- [ ] **Step 4: 커밋**

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "feat(decision-verdict): 단계 감지 화면 선택지에 요청 대상을 넣음"
```

---

## Task 10: 사본 다섯 자리를 정합하고 잔존 0을 검증한다

Task 1이 원본에 박아 둔 재서술 지점 목록 **열** 중, 앞선 태스크가 이미 고친 다섯(`templates.md`·`brainstorming/SKILL.md`·`actions.md`·`plan-stage/SKILL.md`·`context-handling/SKILL.md`)을 뺀 **다섯**을 여기서 맞춘다.

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md:35`
- Modify: `skills/workflow-orchestrator/SKILL.md` (「결정 요청 폴백 형식」 — 설명 블록 줄과 등급 줄)
- Modify: `skills/workflow-orchestrator/references/grounding.md:26`
- Modify: `skills/merge-to-domain/SKILL.md:40`
- Modify: `README.md:493`

**Interfaces:**
- Consumes: Task 1의 목록, Task 5~8이 확정한 원본 문장
- Produces: 잔존 0. Task 11이 이 상태에서 실물을 재현한다.

- [ ] **Step 1: 잔존을 센다 (실패 확인)**

Run:
```bash
bash scripts/sweep '설명 네 항목' '이름표' '왜·무엇을·어떻게·언제' 2>&1 | grep -v '^docs/design' | tail -40
```
Expected: `skills/workflow-orchestrator/bootstrap.md`·`skills/workflow-orchestrator/SKILL.md`·`skills/workflow-orchestrator/references/grounding.md`·`README.md`에서 잔존이 잡힌다. `docs/design/` 아래 건은 설계 스냅샷이라 대상이 아니다.

- [ ] **Step 2: `bootstrap.md:35`를 고친다**

줄 끝의 아래 조각을

```
· 자가 응답 금지 · 라운드·조사 선행 시 박스 앞에 「설명 네 항목」(왜·무엇을·어떻게·언제))
```

아래로 바꾼다:

```
· 자가 응답 금지 · 라운드·조사 선행 시 박스 앞에 짧은 설명 문단(이름표 없이 — 왜·무엇을·어떻게·언제는 담을 내용의 점검표) · 선택지 이름과 결과 줄에 문제 칸·확인된 사실 칸의 명사를 하나 이상 넣기 · 판정형으로 지정된 자리(성격 승인·재협의)는 판정 한 줄 + 확인 태그 근거 + 「그대로 진행」·「고칠 게 있다」)
```

- [ ] **Step 3: `workflow-orchestrator/SKILL.md`의 두 줄을 고친다**

설명 블록 줄:

```
- 설명 블록: 직전에 라운드·조사가 있었으면 박스 앞에 「설명 네 항목」(왜 · 무엇을 · 어떻게 · 언제)을 이름표와 함께 쓴다. 선택지 이름에 이 박스와 그 블록에 안 나오고 풀이도 없는 낱말이 있으면 고쳐 쓴다 (원본: decision-flow 3부 「결정·질문 구조 규범」 — Read 실패 시에도 이 줄이 적용된다)
```

→

```
- 설명 블록: 직전에 라운드·조사가 있었으면 박스 앞에 **짧은 설명 문단**을 쓴다 — 이름표를 붙이지 않는다. 왜·무엇을·어떻게·언제는 담을 내용의 점검표이고 넷을 다 채우려 하지 않는다 (원본: decision-flow 3부 「결정·질문 구조 규범」 — Read 실패 시에도 이 줄이 적용된다)
- 내보내기 전 검사 셋: ① 선택지 이름에 이 박스와 앞 블록에 안 나오고 풀이도 없는 낱말이 있으면 고쳐 쓴다 (모든 박스) ② 선택지의 "고르면:" 줄이 「이 결정이 다루는 문제」 칸이나 「확인된 사실」 칸의 명사를 하나 이상 담는다 (메뉴형 자리 전부) ③ 선택지 **이름**도 그 두 칸의 명사를 하나 이상 담는다 (성격 승인·단계 감지 둘 — 나머지는 다음 릴리스)
- 판정형과 메뉴형: 「성격 승인 화면」과 「재협의 선택지」는 판정형이다 — 판정 한 줄과 확인 태그 붙은 근거를 먼저 내고 「그대로 진행」·「고칠 게 있다」 둘로 받는다. 그 근거를 한 줄도 못 만들면 메뉴형으로 조립한다. 나머지 자리는 메뉴형이다
```

등급 줄:

```
- 등급: 직전에 라운드·조사가 있었으면 4칸 상시(빈 칸 "없음"), 아니면 문제 칸+이력 칸, 로컬 템플릿·게이트는 기존 형식
```

→

```
- 등급: 직전에 라운드·조사가 있었으면 4칸 상시(빈 칸 "없음"), 아니면 문제 칸+이력 칸. 로컬 템플릿·게이트는 칸 구성이 기존 형식이고 설명 블록만 면제 — 검사는 각 항목의 적용 자리를 따른다
```

- [ ] **Step 4: `grounding.md:26`을 고친다**

```
- 등급 판정 질문("직전에 라운드·조사가 있었는가")은 박스 칸 수와 설명 블록 요구를 함께 정한다 — "있었다"면 4칸에 더해 「설명 네 항목」, "없었다"면 블록 없음. 다만 사용자가 더 풀어 달라고 하면 등급과 무관하게 블록을 낸다. 로컬 템플릿은 둘 다 적용 밖
```

→

```
- 등급 판정 질문("직전에 라운드·조사가 있었는가")은 박스 칸 수와 설명 블록 요구를 함께 정한다 — "있었다"면 4칸에 더해 **짧은 설명 문단**(이름표 없이), "없었다"면 블록 없음. 다만 사용자가 더 풀어 달라고 하면 등급과 무관하게 블록을 낸다. 로컬 템플릿은 설명 블록만 적용 밖이고 칸 수와 「내보내기 전 검사」 둘은 그대로 적용된다
```

- [ ] **Step 5: `merge-to-domain/SKILL.md:40`을 고친다**

```
적용 범위: dry-run의 [사용자 결정 항목] 목록이 사전 브리핑(F)을 대체하는 로컬 템플릿이며, 개별 결정 요청에는 결정 박스(D)와 설명 블록을 적용한다.
```

→

```
적용 범위: dry-run의 [사용자 결정 항목] 목록이 사전 브리핑(F)을 대체하는 로컬 템플릿이며, 개별 결정 요청에는 결정 박스(D)와 짧은 설명 문단, 그리고 「내보내기 전 검사」 둘을 적용한다. 이 스킬의 결정 지점은 전부 메뉴형이다.
```

- [ ] **Step 6: `README.md:493`을 고친다**

문단 끝의 아래 문장을

```
그 결정 전에 토론이나 조사가 있었던 경우에는, 화면 맨 위에 **왜·무엇을·어떻게·언제** 네 줄 설명이 먼저 나옵니다 (왜 이 문제가 생겼는지, 무엇이 걸려 있는지, 어떻게 풀리는지, 언제 일어나는 일인지).
```

아래로 바꾼다:

```
그 결정 전에 토론이나 조사가 있었던 경우에는, 화면 맨 위에 짧은 설명 문단이 먼저 나옵니다 — 왜 이 문제가 생겼는지, 무엇이 걸려 있는지, 그것들이 어떤 순서로 움직이는지, 흐름의 어느 자리에서 벌어지는 일인지 중에서 그 결정에 필요한 것만 담습니다. 그리고 선택지 이름에는 지금 하고 있는 일의 이름이 들어갑니다 — "새 기능 만들기"가 아니라 "매칭 진입 경로 새로 만들기"처럼요. 답을 이미 아는 자리(작업 성격 확정, 계획 단계의 재협의)에서는 선택지를 늘어놓는 대신 이렇게 파악했다는 판정과 그 근거를 먼저 보여 주고, 그대로 갈지 고칠 게 있는지만 물어봅니다.
```

- [ ] **Step 7: 잔존 0을 검증한다**

Run:
```bash
bash scripts/sweep '설명 네 항목' '이름표와 함께' '왜·무엇을·어떻게·언제 네 줄' 2>&1 | grep -vE '^docs/design/dev-workflow/(decision-prebrief|decision-verdict)/' | grep -E '^(skills|commands|hooks|README)' | wc -l
```
Expected: `0`

Run — 새 문장이 사본 다섯에 다 들어갔는지:
```bash
grep -c "짧은 설명 문단" skills/workflow-orchestrator/bootstrap.md
grep -c "짧은 설명 문단" skills/workflow-orchestrator/SKILL.md
grep -c "짧은 설명 문단" skills/workflow-orchestrator/references/grounding.md
grep -c "짧은 설명 문단" skills/merge-to-domain/SKILL.md
grep -c "짧은 설명 문단" README.md
```
Expected: 다섯 줄 모두 `1` 이상.

Run — 재서술 지점 목록의 열 자리가 전부 이번 작업에서 손댔는지:
```bash
git diff --name-only b3f9c6308fa660f68510b6a2d2482521e9f3ee69 | sort
```

> `..HEAD`를 붙이지 않는다. 붙이면 커밋끼리만 비교해서, 아직 커밋 안 된 이 태스크의 편집 다섯이 목록에서 빠진다. 이 검사는 Step 9(커밋)보다 먼저 돌기 때문이다.
Expected: 아래 **열**이 전부 포함된다 — `README.md` · `skills/brainstorming/SKILL.md` · `skills/brainstorming/references/templates.md` · `skills/context-handling/SKILL.md` · `skills/merge-to-domain/SKILL.md` · `skills/plan-stage/SKILL.md` · `skills/workflow-orchestrator/SKILL.md` · `skills/workflow-orchestrator/bootstrap.md` · `skills/workflow-orchestrator/references/actions.md` · `skills/workflow-orchestrator/references/grounding.md`. 여기에 원본 `skills/workflow-orchestrator/decision-flow.md`와 `skills/development-principles/SKILL.md`가 더 있다.

**열 중 하나라도 빠졌으면 멈추고 그 자리를 고친다.** 목록이 있는데도 빠졌다면 목록이 틀린 것이므로, 고친 뒤 Task 1의 목록도 함께 갱신한다.

- [ ] **Step 8: 훅 회귀를 확인한다**

Run:
```bash
bash tests/hooks/run-all.sh
```
Expected: 모든 시험 파일 `FAIL=0`, 종료 코드 `0`. 이번 변경은 훅을 건드리지 않으므로 실패하면 다른 원인이다.

- [ ] **Step 9: 커밋**

```bash
git add skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/references/grounding.md skills/merge-to-domain/SKILL.md README.md
git commit -m "fix(decision-verdict): 재서술 지점 사본 다섯 정합 — 잔존 0"
```

---

## Task 11: 실물 화면 재현으로 완료를 판정한다

> **이 태스크는 위임하지 않는다.** 사용자와 직접 대화하는 메인 세션이 수행한다. 하위 에이전트는 사용자에게 물을 수 없으므로, 위임하면 답을 지어내거나 빈손으로 돌아오고 Task 12가 그 답을 완료 문서에 그대로 옮겨 적는다 — 이 릴리스의 **유일한 완료 조건이 위조된다.**

문서 정합만으로 통과를 선언하지 않는다. 앞 릴리스가 그렇게 하고 첫 사용에서 무너졌다.

**Files:**
- 없음 (판정 전용). 결과는 Task 12가 설계 문서 9장에 기록한다.

**Interfaces:**
- Consumes: Task 3·4·9가 고친 세 화면, Task 7의 검사 셋
- Produces: 사용자 응답. 이것이 이 릴리스의 완료 조건이다.

- [ ] **Step 1: 성격 승인 화면을 새 규범으로 그린다**

사용자가 실제로 고르지 못했던 상황을 그대로 쓴다 — 아웃게임 매칭 진입. 확정된 시드 목표는 "아웃게임 서비스에 매칭 진입 경로를 만든다 — 리전 목록을 내려주고, 매칭 준비 요청을 받아 토큰을 발급해 매치 상태에 남기고, 로그인에서 진행 중인 게임이 있는 사람을 가려낸다"였다.

새 규범대로 그리면 이렇게 나온다. 이 문면을 사용자에게 보인다:

```
📌 확인 : 매칭 진입 경로를 새로 만드는 일로 봤습니다

- [✔ api/public/outgame 파일 목록] 아웃게임의 공개 통신 규격이 로그인과 유저 둘뿐이고
  매칭 관련 규격이 하나도 없습니다
- [✔ items.md:435-437] H-8의 정의가 "리전 이름 목록과 각 리전의 핑 대상 주소를 그대로
  반환하는 읽기 전용 API"입니다 — 고칠 대상이 아니라 없던 것입니다

그대로 가면 방금 확정한 시드로 설계를 이어 가고,
docs/design/outgame/matching-entry/ 폴더와 이어받기 파일이 만들어집니다.

1. 그대로 진행
2. 고칠 게 있다
```

- [ ] **Step 2: 단계 감지 화면을 새 규범으로 그린다**

같은 상황에서 단계를 못 잡았다고 가정하고 그린다:

```
지금 무엇을 하려는 것인지 잡지 못했습니다. 어느 쪽인가요?

1. 매칭 진입을 처음부터 짚기 — 고르면: 무엇을 만들지 아직 안 정해졌으니 매칭 진입의 요구사항부터 캡니다
2. 매칭 진입 계획 세우기 — 고르면: 매칭 진입의 설계 문서가 이미 있으니 할 일 목록을 짭니다
3. 매칭 진입 만들기 — 고르면: 매칭 진입의 할 일 목록이 있으니 바로 구현으로 넘어갑니다
4. 매칭 진입 살펴보기 — 고르면: 이미 만든 매칭 진입의 코드를 검토합니다
0. 이 중에 없음 — 하려는 일을 자유롭게 설명해주세요
```

- [ ] **Step 3: 두 화면에 검사 셋을 직접 돌려 본다**

성격 승인 화면 — 판정형이라 선택지 이름이 「그대로 진행」·「고칠 게 있다」로 고정이고 결과 줄이 없다. 검사 1번(선택지 낱말)만 본다: 선택지 이름 「그대로 진행」·「고칠 게 있다」에 쓰인 낱말이 전부 일상어이고 풀이가 필요 없다 → 통과.

단계 감지 화면 — 메뉴형이고 대상 규칙 적용 자리이므로 셋 다 본다.
- 1번(낱말): "짚기"·"세우기"·"만들기"·"살펴보기" 모두 일상어 → 통과
- 2번(결과 줄): 네 결과 줄에 전부 "매칭 진입"이 들어 있다 → 통과
- 3번(선택지 이름): 네 이름에 전부 "매칭 진입"이 들어 있고, 그 말은 사용자 발화의 대상이다 → 통과

- [ ] **Step 4: 사용자에게 판정을 받는다**

두 화면을 보이고 묻는다: **"이 화면에서 고를 수 있습니까?"**

- "고를 수 있다" → 완료 조건 충족. Task 12로 간다
- "여전히 못 고르겠다" → **멈춘다.** 무엇이 부족한지 받아 적고, 설계 문서 9장에 일탈로 기록한 뒤 재계획으로 되돌아간다. 이 판정을 건너뛰고 릴리스를 닫지 않는다

- [ ] **Step 5: 자유 응답 경로도 함께 보인다**

「고칠 게 있다」를 골랐을 때 무엇이 나오는지 한 번 더 보인다:

```
어느 부분이 다르게 보이시는지 말씀해 주세요. 제가 이렇게 본 근거는 이것입니다.

- [✔ api/public/outgame 파일 목록] 매칭 관련 통신 규격이 하나도 없습니다
- [✔ items.md:435-437] H-8이 읽기 전용 API를 새로 만드는 것으로 정의돼 있습니다
```

여기에 갈래 이름 목록이 붙지 않는지 확인받는다.

- [ ] **Step 6: 커밋 (판정 결과 기록만 — 코드 변경 없음)**

이 태스크는 파일을 바꾸지 않는다. 결과는 Task 12가 설계 문서에 적는다.

---

## Task 12: 설계 문서를 마무리하고 버전을 올린다

**Files:**
- Modify: `docs/design/dev-workflow/decision-verdict/decision-verdict.md` (4장 검사 항목 수 정정 · 9장 구현 결과 · 10장 이력)
- Modify: `.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` (스크립트로)

**Interfaces:**
- Consumes: Task 11의 사용자 판정
- Produces: `status: complete`인 설계 문서와 1.25.0 버전. 마무리 시퀀스가 이 상태를 본다.

- [ ] **Step 1: 설계 문서와 시드의 어긋난 숫자를 정정한다**

**(1) 4장의 검사 항목 수.** 아래 문장을

```
그래서 검사는 두 항목으로 남는다 — **선택지 낱말 · 선택지 대상.** 근거 태그 세기는 검사가 아니라 조립 전 조건이다.
```

아래로 바꾼다:

```
그래서 검사는 **세 항목**이다 — 선택지 낱말(모든 박스) · 결과 줄(메뉴형 자리 전부) · 선택지 대상(성격 승인과 단계 감지 둘). 근거 태그 세기는 검사가 아니라 조립 전 조건이다. 셋을 둘로 합치려던 안은 기각했다 — 대조 상대는 같지만 적용 자리가 달라, 합치면 한쪽 범위가 다른 쪽에 강제로 씌워진다.
```

**(2) 2장 비목표의 "여섯 자리".** 실제로 일곱을 열거하므로 "일곱 자리"로 고친다.

**(3) 5장 의존성 맵에 행을 더한다.**

```
| `context-handling/SKILL.md` HANDOFF 결정 흐름 상태 | decision-flow 6부 「상태 보존」 | 세션 이관·압축 후 복원 |
```

**(4) 앞머리 `affects:`에 `skills/context-handling`을 더한다.**

**(5) REQ-012의 목록을 아홉에서 열로 고친다** — `skills/context-handling/SKILL.md` 「결정 흐름 상태」 섹션을 아홉째로 넣는다.

**(6) `seed.yaml`의 성공 기준 넷째와 다섯째를 적용 자리에 맞춘다.**

```
  - "REQ-006이 메뉴형으로 박은 세 자리(...)의 '고르면:' 줄이 사용자가 겪는 차이를 말한다 — 목록이 요구사항 안에 있어 검증 시점에 다시 세지 않는다"
  - "성격 승인과 Ambiguous 단계 감지의 선택지 이름에 이번 요청의 대상이 들어 있다 — 「내보내기 전 검사」 두 번째 항목으로, 박스의 문제 칸·확인된 사실 칸과 대조해 세어진다"
```

→

```
  - "메뉴형으로 박힌 세 자리(Ambiguous 단계 감지·재논의 대기열·일반 결정 박스)의 '고르면:' 줄이 박스의 문제 칸이나 확인된 사실 칸의 명사를 하나 이상 담는다 — 검사 두 번째 항목"
  - "성격 승인과 Ambiguous 단계 감지의 선택지 이름에 이번 요청의 대상이 들어 있다 — 검사 세 번째 항목. 나머지 메뉴형 자리는 다음 릴리스"
  - "재서술 지점 목록이 열 자리이고, 그 열이 함께 갱신되어 어느 것을 읽어도 같은 모양이 나온다"
```

- [ ] **Step 2: 9장 「구현 결과 및 일탈 사항」을 채운다**

아래 틀에 실제 결과를 적는다:

```markdown
## 9. 구현 결과 및 일탈 사항

### 셀 수 있는 검사

- 이름표 규정 잔존: [실측] 건 (목표 0)
- 재서술 지점 열 자리 중 이번 작업에서 손댄 자리: [실측] / 10
- 「내보내기 전 검사」 항목 수: [실측] (목표 3)
- 「판정형과 메뉴형」 표의 행 수: [실측] (목표 5)

### 실물 판정

- 성격 승인 화면 재현 → 사용자 응답: [그대로 옮김]
- 단계 감지 화면 재현 → 사용자 응답: [그대로 옮김]
- 자유 응답 경로 재현 → 사용자 응답: [그대로 옮김]

### 일탈 사항

- 검사를 셋으로 두고 각 항목 옆에 적용 자리를 적었다. 계획 초안은 REQ-008과 REQ-009를 한 항목으로 합쳤으나 기각했다 — 대조 상대는 같지만 적용 자리가 달라, 합치면 사용자가 정한 범위(두 화면)가 저장소의 모든 로컬 템플릿으로 번지고 대조할 칸이 없는 템플릿에서 통과 불가능해진다
- 재서술 지점을 아홉으로 세었다가 열로 고쳤다 — `context-handling/SKILL.md`의 HANDOFF 「결정 흐름 상태」 섹션이 `decision-flow.md`의 보존 항목 목록을 다시 적어 둔 자리인데 초안이 빠뜨렸다. 이 릴리스가 막으려던 과소 계수가 계획서 자체에서 한 번 더 일어났고, 계획 검증에서 잡았다
- [구현 중 생긴 다른 일탈을 여기에 적는다]

### 남은 위험

- 설명 블록에 분량 상한이 없다 — 이름표가 하던 상한 노릇이 사라졌고 대체물을 두지 않기로 했다. 화면이 길어지는지 관측한다
- 선택지 대상 규칙이 아래 **일곱** 자리에는 아직 안 걸려 있다 — 다음 릴리스 대상. 재논의 대기열 · merge-to-domain 실행 모드 · setup 안내 · Simplifier 스코프 정리 · 카테고리 선택 · 미답변 조사 여부 · 이슈 카드 잔존 (설계 문서 2장 비목표가 "여섯"이라고 적었으나 실측은 일곱이다 — Task 12 Step 1에서 함께 고친다)
- 최초 요구였던 왕복 수는 이번 범위 밖이다 — 이 릴리스가 남기는 실물 화면이 다음 작업의 비교 기준선이다
```

- [ ] **Step 3: 10장에 이력을 더하고 앞머리를 닫는다**

10장 표에 행을 더한다:

```
| 2026-08-27 | 구현 완료 — 재서술 지점 목록(열) 신설 · 판정형 두 자리 · 검사 세 항목 · 면제 네 자리 쪼갬 · 사본 열 정합 | 구현 | 완료 |
```

앞머리의 `status:`를 바꾼다:

```
status: ready-for-plan
```
→
```
status: complete
```

`last-updated:`를 구현을 끝낸 날짜로 맞춘다.

- [ ] **Step 4: 버전을 올린다**

Run:
```bash
bash scripts/bump-version 1.25.0
bash scripts/bump-version --check
```
Expected: `--check`가 두 파일의 버전이 같다고 확인한다.

> 등급 근거: 요구사항 전부가 문서 문장 편집이고 사용자 프로젝트의 `docs/design/` 구조를 바꾸는 항목이 0건이다. 기존 흐름의 동작이 바뀌므로 PATCH가 아니라 MINOR다.

- [ ] **Step 5: 검증한다**

Run:
```bash
grep -n "^status:" docs/design/dev-workflow/decision-verdict/decision-verdict.md
grep -n '"version"' .claude-plugin/plugin.json .claude-plugin/marketplace.json
```
Expected: `status: complete`, 두 파일 모두 `1.25.0`.

Run — 9장에 남은 자리표시가 없는지:
```bash
grep -nE "\[실측\]|\[그대로 옮김\]|\[구현 중 생긴" docs/design/dev-workflow/decision-verdict/decision-verdict.md
```
Expected: 출력 없음 — 전부 실제 값으로 채워졌다.

- [ ] **Step 6: 커밋**

```bash
git add docs/design/dev-workflow/decision-verdict/decision-verdict.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore(release): decision-verdict 구현 완료 · bump to 1.25.0"
```

---

## 되돌릴 때 주의

설명 블록 문단화는 **원본이 Task 6, 사본 다섯이 Task 10**에서 커밋된다. 그 사이(Task 7·8·9 커밋 시점)에는 원본이 「문단」이라 하고 `bootstrap.md`·`workflow-orchestrator/SKILL.md`·`grounding.md`가 「설명 네 항목·이름표」라고 반대말을 한다. 브랜치를 중간에 배포하지 않으므로 실사용 위험은 없지만, **Task 6이나 Task 10 하나만 되돌리면 저장소가 모순 상태로 남는다.** 되돌릴 때는 둘을 함께 되돌린다.

## 마무리 안내

이 계획을 다 실행한 뒤에는 **자체 판단으로 정리하지 않는다.** `/dev-workflow:finish` 또는 마무리 발화로 Completion Protocol에 넘긴다 — 중간 산출물 삭제(`phase1~3.md` · `plan.md` · `seed.yaml` · `HANDOFF.md`)와 `[기능명].md` 보존은 그 절차가 맡는다. 도메인 문서 머지는 그 뒤 별도로 `/dev-workflow:merge-to-domain dev-workflow`가 맡는다.

푸시는 하지 않는다 — 로컬 main worktree에 머지해 먼저 써 보는 것이 이 저장소의 현재 운영 방식이다.
