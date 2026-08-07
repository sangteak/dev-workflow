# intake-routing 1판 (v1.22.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결함 발화가 dev-workflow를 발동시키고, 브레인스토밍 입구에서 성격을 확정한 뒤 질문 다섯 칸을 채워 `superpowers:systematic-debugging`으로 넘어가게 한다.

**Architecture:** 기존 단계 축(BRAINSTORM/PLAN/DEVELOP/REVIEW/COMPLETION)을 그대로 두고, 갈래 축을 문서 앞머리 `action:` 한 줄로 병기한다. 갈래 정의는 신규 `skills/workflow-orchestrator/references/actions.md` 한 파일에 블록 하나씩 모으고, 소비 스킬은 실행 시점에 그 파일을 Read한다. 개발 단계의 위임 목적지가 하드코딩에서 데이터 참조로 바뀌는 것이 이 판의 핵심 배선이다.

**Tech Stack:** Markdown 스킬 문서 (로직 대부분) · bash 훅 (`hooks/`) · bash 테스트 (`tests/hooks/`)

## Global Constraints

- **설계 문서 SSOT:** `docs/design/dev-workflow/intake-routing/intake-routing.md` — §8 「릴리스 분할」·「계획 단계 확정 (15건)」·「1판 구현 전에 문장으로 못박아야 할 것」이 이 계획의 상위 규범이다.
- **1판 범위:** REQ-001 ~ REQ-009, REQ-011 ~ REQ-018 (17건). REQ-010은 **성격 승인 게이트만** 포함하고 리뷰 확인 게이트는 2판. REQ-019~023은 2판.
- **1판에는 삭제가 없다.** 결함 갈래도 문서를 남긴다. 폴더 삭제·삭제 전 확인은 전부 2판.
- **응답 언어 한국어.** 사용자 대면 문면은 쉬운 일상어 — 내부 값(`new-feature`·`refactor` 등)을 맥락 없이 노출하지 않는다 (`decision-flow.md` 3부 「언어 규범」).
- **커밋 메시지:** Conventional Commits (`feat:`·`fix:`·`docs:`·`chore:`). 커밋 전 사용자 확인은 Completion Protocol에서 — **각 태스크의 커밋 단계는 로컬 커밋만** 수행하고 푸시하지 않는다.
- **버전:** `marketplace.json`의 `plugins[].version`이 SSOT. `scripts/bump-version <MAJOR.MINOR.PATCH>`로만 갱신하고 **수동 편집 금지**. 이 판은 **MINOR → 1.22.0**.
- **작업 위치:** 워크트리 `C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah`, 브랜치 `feature/analyzer`. **`D:/02_Workspace/98_Github/dev-workflow`(main 작업 트리)에 절대 쓰지 않는다.**
- **확정 10 (새 테스트·새 스크립트 금지)의 유일한 예외**는 Task 8의 `tests/hooks/test-intake-nudge.sh`다. 근거와 판단은 그 태스크에 적혀 있다 — 승인 없이 다른 곳으로 확대하지 않는다.
- **불변 파일:** `docs/design/**/phase1_exploration.md`·`phase2_discovery.md`·`phase3_validation.md`는 생성 후 수정 금지. 정정이 필요하면 `intake-routing.md`에 기록한다.

---

## File Structure

| 파일 | 책임 | 상태 |
|---|---|---|
| `skills/workflow-orchestrator/references/actions.md` | 갈래 정의 SSOT — 블록 하나 = 갈래 하나. 소비 계약과 정본 규정도 여기 산다 | **신규** |
| `hooks/intake-nudge` | 착수 발화 어휘 감지 → `<intake-signal>` 주입. **파일을 읽지 않는다** | **신규** |
| `tests/hooks/test-intake-nudge.sh` | 위 훅의 시나리오 + 어휘 사본 diff 검증 | **신규** |
| `skills/workflow-orchestrator/bootstrap.md` | 상시 주입 본문 — 발동 어휘·단계 표의 위임 칸 | 수정 |
| `skills/workflow-orchestrator/SKILL.md` | 단계 감지·위임 지시·어휘 SSOT·무발동 문장 | 수정 |
| `skills/brainstorming/SKILL.md` | 성격 승인 삽입 지점·국면 전환 3곳·문답 하한·phase1 포함 내용 | 수정 |
| `skills/brainstorming/references/templates.md` | 앞머리 펜스 둘·시드 확인 화면·성격 승인 화면 | 수정 |
| `skills/context-handling/SKILL.md` | HANDOFF 앞머리·상태 판정·복구 표·생존 규범 | 수정 |
| `hooks/completion-nudge` | 마무리 훅 — 오탐 창 확대 완화 | 수정 |
| `tests/hooks/test-completion-nudge.sh` | 위 완화의 회귀 검증 케이스 추가 | 수정 |
| `skills/plan-stage/SKILL.md` | 하위 에이전트 프롬프트에 행동 블록 구획 | 수정 |
| `README.md` · `CLAUDE.md` | 사용자 문서 스윕 | 수정 |

---

## Task 1: actions.md 신설 — 갈래 정의 SSOT

**Files:**
- Create: `skills/workflow-orchestrator/references/actions.md`

**Interfaces:**
- Consumes: 없음 (순수 데이터, 이 판의 첫 태스크)
- Produces: 갈래 값 넷 (`new-feature` · `spec-change` · `refactor` · `defect`), 블록 항목 여섯(설명·종료 조건·넘길 곳·남길 것·지울 것·기능명 규칙), 소비 계약 세 줄, 정본 규정. 이후 모든 태스크가 이 파일을 참조한다.

- [ ] **Step 1: 검증 스크립트를 먼저 돌려 실패를 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
F=skills/workflow-orchestrator/references/actions.md
test -f "$F" && echo "EXISTS" || echo "MISSING"
```
Expected: `MISSING`

- [ ] **Step 2: 파일을 작성한다**

`skills/workflow-orchestrator/references/actions.md`:

```markdown
> workflow-orchestrator SKILL.md의 참조 자료 (verbatim). 소비 지점의 Read 지시로 **실행 시점에** 로드된다.
> 형식 선례: `skills/brainstorming/references/templates.md:3~4` 「공통 조립 규칙」.

> **소비 계약 (REQ-014):**
> ① 소비 스킬은 갈래 이름을 나열하지 않는다 — **블록 목록을 순회한다.** 새 갈래 추가가 이 파일에 블록 하나를 더하는 것으로 끝나야 한다.
> ② **화면 표시 이름은 「설명」 칸의 첫 줄**에서 뽑는다. 별도 칸을 두지 않는다.
> ③ **「종료 조건」은 기본값과 달라지는 단계만 적는다.** 다섯 단계를 모두 나열하지 않는다 (갈래 넷 × 단계 다섯 = 스무 칸 방지).
> 적용 경로 목록 (검증 기준 — 누락 0): ① 성격 승인 화면 (brainstorming Step B 직후) ② 국면별 종료 조건 (brainstorming 국면 1~4) ③ 개발 진입 위임 (workflow-orchestrator Stage Detection) ④ 하위 에이전트 프롬프트 `--- 행동 블록 ---` 구획 (plan-stage Architect·Researcher).

> **정본 규정 (REQ-006):** 갈래 값의 **정본은 `[기능명].md` 앞머리의 `action:` 한 줄**이다.
> `seed.yaml`과 `HANDOFF.md`의 같은 칸은 **사본**이며 마무리에서 함께 삭제된다. 값이 어긋나면 정본을 따른다.
> 정본이 아직 없는 구간(성격 승인 ~ 국면 4 설계 문서 생성)에서는 `HANDOFF.md`가 **임시 정본**이다.
> 어느 자리에도 값이 없으면 `new-feature`로 읽는다 (REQ-007).

> **1판 범위 안내:** 「지울 것」 칸은 v1.22.0에서 **중간 산출물까지만** 적용된다. 기능 폴더 통째 삭제와 삭제 전 확인은 2판 대상이다.

---

## new-feature

- **설명** — 새 기능 만들기
  없던 것을 새로 만든다. 남길 것이 가장 많은 갈래이며, 값이 없을 때의 기본값이다.
- **종료 조건** — 기본값 그대로 (달라지는 단계 없음)
- **넘길 곳** — `superpowers:subagent-driven-development`
- **남길 것** — `[기능명].md` (`status: complete`) — 도메인 머지 대기
- **지울 것** — 중간 산출물 (`phase1~3.md` · `plan.md` · `seed.yaml` · `HANDOFF.md`)
- **기능명 규칙** — 기본 규칙 (시드 확인 직후 모델이 목표에서 짓고 고지 한 줄)

## spec-change

- **설명** — 기존 기능 바꾸기 (사양이 달라짐)
  이미 있는 것의 요구사항 자체가 바뀐다. 설계 문서의 내용을 고쳐야 하므로 남길 것이 많다.
- **종료 조건** — BRAINSTORM: 기본 다섯 칸에 **「바뀌는 대상 문서와 절」**을 추가로 확정한다
- **넘길 곳** — `superpowers:subagent-driven-development`
- **남길 것** — `[기능명].md` (`status: complete`) — 도메인 머지 대기
- **지울 것** — 중간 산출물
- **기능명 규칙** — 고칠 대상 이름을 물려받되 **그대로 쓰지 않는다** (도메인 문서와 기능 폴더가 카테고리 바로 아래 같은 자리에 살아 이름이 충돌한다). 대상 이름 + 바뀌는 축을 조합한다

## refactor

- **설명** — 코드 다듬기 (동작은 그대로)
  겉보기 동작을 바꾸지 않고 구조만 손본다. 되돌리기 지도가 필요하므로 태스크 목록은 반드시 만든다.
- **종료 조건** — BRAINSTORM: **「다듬을 범위」와 「동작이 바뀌지 않았음을 무엇으로 확인하는가」** 둘을 확정한다
- **넘길 곳** — `superpowers:subagent-driven-development`
- **남길 것** — `[기능명].md` (`status: complete`)
  ↳ 마무리 경량화(변경 이력 한 줄로 끝내기)는 **2판** — 1판에서는 표준 취합을 그대로 따른다
- **지울 것** — 중간 산출물
- **기능명 규칙** — 다듬을 대상 이름을 물려받되 그대로 쓰지 않는다 (spec-change와 같은 이유)

## defect

- **설명** — 문제 고치기
  돌아가던 것이 안 돌아간다. `superpowers:systematic-debugging`으로 넘어가며, 넘기기 전에 그 스킬 1단계가 요구하는 것을 미리 채운다.
- **종료 조건** — BRAINSTORM에서 아래 **다섯 칸**을 채워야 끝난다. 앞의 셋은 디버깅 스킬 1단계 요구와 **이름을 맞춘 것**이라 넘길 때 다시 물을 것이 없다.
  1. **에러 원문** — 스택 트레이스 전문, 파일 경로·줄 번호·에러 코드 포함
  2. **재현 절차와 재현성** — 정확한 실행 단계 목록 + "매번 나는가"에 대한 답
     ↳ 이 칸이 **"재현 안 됨"이면 개발 단계로 넘기지 않는다.** 국면 1 인터뷰(Step A)로 되돌아가 자료를 더 모은다 — 추측으로 넘어가지 않는다
  3. **최근 변경** — 이 증상을 만들 수 있는 변경 목록. 없으면 "없음"이라고 쓴다
  4. **대상** — 어느 문서의 어느 절에 해당하는 결함인가
  5. **수락 기준** — 2번 칸의 재현 절차를 그대로 다시 밟았을 때 증상이 안 나오는가

  "모른다"고 답한 칸은 조사로 넘긴다.
- **넘길 곳** — `superpowers:systematic-debugging`
  ↳ 넘길 때 위 다섯 칸을 프롬프트에 그대로 싣는다. 1~3번은 그 스킬 1단계의 입력이다
- **남길 것** — `[기능명].md` (`status: complete`)
  ↳ **1판에서는 남긴다.** 흔적을 지우는 것과 지우기 전 확인은 2판 대상이다
- **지울 것** — 중간 산출물
- **기능명 규칙** — 증상에서 뽑는다 (예: 랭킹에 닉네임이 안 나온다 → `ranking-nickname-missing`)
```

- [ ] **Step 3: 구조 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
F=skills/workflow-orchestrator/references/actions.md
rc=0
for b in new-feature spec-change refactor defect; do
  grep -q "^## $b\$" "$F" || { echo "❌ 블록 없음: $b"; rc=1; }
done
for k in "설명" "종료 조건" "넘길 곳" "남길 것" "지울 것" "기능명 규칙"; do
  n=$(grep -c "^- \*\*$k\*\*" "$F")
  [ "$n" -eq 4 ] || { echo "❌ 항목 '$k' 개수 $n (기대 4)"; rc=1; }
done
grep -q "소비 계약" "$F" || { echo "❌ 소비 계약 없음"; rc=1; }
grep -q "정본 규정" "$F" || { echo "❌ 정본 규정 없음"; rc=1; }
grep -q "적용 경로 목록 (검증 기준 — 누락 0)" "$F" || { echo "❌ 적용 경로 목록 없음"; rc=1; }
grep -q "systematic-debugging" "$F" || { echo "❌ 디버깅 위임 없음"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ actions.md 구조 검증 통과"
exit $rc
```
Expected: `✅ actions.md 구조 검증 통과`

- [ ] **Step 4: 커밋**

```bash
git add skills/workflow-orchestrator/references/actions.md
git commit -m "feat(intake-routing): actions.md 신설 — 갈래 정의 SSOT + 소비 계약 + 정본 규정"
```

---

## Task 2: 갈래 칸을 앞머리 셋에 만든다

**Files:**
- Modify: `skills/brainstorming/references/templates.md` (설계 문서 앞머리 펜스 · 시드 YAML 형식 펜스)
- Modify: `skills/context-handling/SKILL.md` (HANDOFF 앞머리 펜스)

**Interfaces:**
- Consumes: Task 1의 갈래 값 넷과 정본 규정
- Produces: 세 파일 형식 모두에 `action:` 칸. 이후 Task 3(승계)·Task 5(승인 화면)·Task 6(위임)이 이 칸을 읽는다.

- [ ] **Step 1: 현재 상태를 확인한다 (실패 확인)**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -c "^action:" skills/brainstorming/references/templates.md skills/context-handling/SKILL.md
```
Expected: 두 파일 모두 `0`

- [ ] **Step 2: 설계 문서 앞머리 펜스에 칸을 넣는다**

`skills/brainstorming/references/templates.md` — 「국면 4 표준 설계 문서 포맷」 펜스 안, `category:` 줄 **바로 아래**에 한 줄 추가:

```
category: [카테고리명]
action: new-feature        # new-feature | spec-change | refactor | defect — 정본 (actions.md 「정본 규정」)
status: ready-for-plan
```

- [ ] **Step 3: 시드 YAML 형식 펜스에 칸을 넣는다**

같은 파일 「시드 YAML 형식」 펜스 — `goal:` 줄 **바로 위**에 두 줄 추가:

```yaml
# 갈래 (사본 — 정본은 [기능명].md 앞머리. actions.md 「정본 규정」 참조)
action: new-feature
goal: "[핵심 목표 1문장]"
```

- [ ] **Step 4: HANDOFF 앞머리 펜스에 칸을 넣는다**

`skills/context-handling/SKILL.md` — HANDOFF 템플릿 펜스, `category:` 줄 **바로 아래**에 한 줄 추가:

```
category: [카테고리명]
action: new-feature
current-phase: "[Phase N 단계명]"
```

그리고 그 펜스 **바로 아래**에 규정 한 줄을 덧붙인다:

```markdown
> `action:` — 작업 갈래. 설계 문서가 아직 없는 구간에서는 이 칸이 **임시 정본**이다 (원본 규정: `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md` 「정본 규정」). 값이 없으면 `new-feature`로 읽는다.
```

- [ ] **Step 5: 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
grep -q "^action: new-feature" skills/brainstorming/references/templates.md || { echo "❌ 설계문서/시드 앞머리 누락"; rc=1; }
[ "$(grep -c '^action:' skills/brainstorming/references/templates.md)" -eq 2 ] || { echo "❌ templates.md의 action 칸이 2개가 아님"; rc=1; }
grep -q "^action: new-feature" skills/context-handling/SKILL.md || { echo "❌ HANDOFF 앞머리 누락"; rc=1; }
grep -q "임시 정본" skills/context-handling/SKILL.md || { echo "❌ 임시 정본 규정 누락"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 앞머리 칸 셋 검증 통과"
exit $rc
```
Expected: `✅ 앞머리 칸 셋 검증 통과`

- [ ] **Step 6: 커밋**

```bash
git add skills/brainstorming/references/templates.md skills/context-handling/SKILL.md
git commit -m "feat(intake-routing): 갈래 칸을 설계문서·시드·HANDOFF 앞머리에 신설 (REQ-006)"
```

---

## Task 3: HANDOFF 생존 규범 정정 + phase1 승계

이 태스크가 **확정 1의 유실 구간을 실제로 닫는다.** 앞머리에 칸만 만들면 [✔ `context-handling/SKILL.md:258·291`] 국면이 끝날 때 파일이 삭제되어 값이 다시 사라진다.

**Files:**
- Modify: `skills/context-handling/SKILL.md:258` (복구 절차 4번) · `:291` (주의 사항 첫 줄)
- Modify: `skills/brainstorming/SKILL.md` (국면 1 전환 확정 — phase1 포함 내용)

**Interfaces:**
- Consumes: Task 2의 `action:` 칸
- Produces: 「진행 중 HANDOFF 유지」 규범 — Task 4(마무리 훅 완화)와 Task 7(세션 재개)이 이 규범을 전제한다.

- [ ] **Step 1: 현행 문면을 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -n "국면 완료 → 해당" skills/context-handling/SKILL.md
grep -n "HANDOFF.md는 임시 파일이다" skills/context-handling/SKILL.md
```
Expected: 두 줄 모두 매칭 (각각 258행·291행 부근)

- [ ] **Step 2: 복구 절차 4번을 정정한다**

`skills/context-handling/SKILL.md` — 아래 줄을

```
4. 국면 완료 → 해당 `phase*.md` 생성 → `HANDOFF.md` 삭제 (역할 완료)
```

이렇게 바꾼다:

```
4. 국면 완료 → 해당 `phase*.md` 생성 → `HANDOFF.md`는 **유지한다** (진행 중 갈래 값의 임시 정본이므로). `current-phase`를 다음 국면으로 갱신한다
   - 삭제 시점은 **워크플로우 종료 시 한 번뿐**이다 — Completion Protocol의 중간 산출물 정리에서 `seed.yaml`과 함께 지운다
```

- [ ] **Step 3: 주의 사항 첫 줄을 정정한다**

같은 파일 — 아래 줄을

```
- HANDOFF.md는 임시 파일이다. 국면 완료 시 반드시 삭제한다 (또는 개발 완료 시 _archive/로 이동)
```

이렇게 바꾼다:

```
- HANDOFF.md는 워크플로우가 끝날 때까지 사는 파일이다. **국면 완료로 삭제하지 않는다** — 진행 중 갈래 값(`action:`)의 임시 정본이기 때문이다 (원본 규정: `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md` 「정본 규정」). 삭제는 Completion Protocol의 중간 산출물 정리 한 곳에서만 일어난다 (또는 방향 전환 시 `_archive/`로 이동)
```

- [ ] **Step 4: phase1 포함 내용에 갈래 승계 칸을 넣는다**

`skills/brainstorming/SKILL.md` — 국면 1 「전환 확정 시 즉시」의 포함 내용 목록에서

```
- 확정된 페르소나 구성
```

**바로 위**에 한 줄을 넣는다:

```
- **확정된 갈래 (`action:` 값과 그 근거 한 줄)** — 설계 문서가 생기기 전까지 이 스냅샷이 값의 사본이다
```

- [ ] **Step 5: 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
grep -q "국면 완료 시 반드시 삭제" skills/context-handling/SKILL.md && { echo "❌ 구 규범 잔존 (국면 완료 시 반드시 삭제)"; rc=1; }
grep -q "국면 완료로 삭제하지 않는다" skills/context-handling/SKILL.md || { echo "❌ 신 규범 없음"; rc=1; }
grep -q "확정된 갈래" skills/brainstorming/SKILL.md || { echo "❌ phase1 승계 칸 없음"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ HANDOFF 생존 규범 검증 통과"
exit $rc
```
Expected: `✅ HANDOFF 생존 규범 검증 통과`

- [ ] **Step 6: 구 규범 잔존 스윕**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -rn "국면 완료 시 반드시 삭제\|HANDOFF.md는 임시 파일" skills/ hooks/ commands/ README.md CLAUDE.md 2>/dev/null
```
Expected: 출력 없음 (잔존 0건)

- [ ] **Step 7: 커밋**

```bash
git add skills/context-handling/SKILL.md skills/brainstorming/SKILL.md
git commit -m "fix(intake-routing): 진행 중 HANDOFF 유지 규범으로 정정 + phase1 갈래 승계 (phase2 결정 1)"
```

---

## Task 4: 마무리 훅 오탐 창 완화

Task 3의 부작용을 닫는다. HANDOFF가 브레인스토밍 초반부터 상시 존재하게 되면 [✔ `completion-nudge:28~29`] 잔존 조건이 그때부터 참이 되어, "정리해"류 발화에 마무리 신호가 과하게 붙는다.

**Files:**
- Modify: `hooks/completion-nudge:28` (잔존 감지 인자)
- Modify: `tests/hooks/test-completion-nudge.sh` (회귀 케이스 추가)

**Interfaces:**
- Consumes: Task 3의 「진행 중 HANDOFF 유지」 규범
- Produces: 없음 (기존 훅 동작 보존이 목적)

- [ ] **Step 1: 실패하는 테스트 케이스를 먼저 쓴다**

`tests/hooks/test-completion-nudge.sh` — 픽스처 블록에 두 줄을 추가한다 (`echo h > "$TMP/projC/..."` 다음 줄):

```bash
mkdir -p "$TMP/projD/docs/design/cat/feat"
printf -- '---\nfeature: feat\naction: defect\ncurrent-phase: "Phase 1 탐색"\n---\n' > "$TMP/projD/docs/design/cat/feat/HANDOFF.md"
```

그리고 케이스 7 다음에 케이스 8을 추가한다:

```bash
# 8. 브레인스토밍 진행 중(HANDOFF만 있고 plan.md 없음) + 마무리 발화 → 침묵
#    (intake-routing v1.22.0: HANDOFF가 국면 완료로 삭제되지 않게 바뀌어 상시 존재하므로,
#     HANDOFF 단독 잔존은 "마무리할 작업"의 근거가 되지 못한다)
check "8.HANDOFF 단독 침묵" "SILENT" "$(fire "$TMP/projD" "이제 마무리하자")"
```

- [ ] **Step 2: 테스트를 돌려 실패를 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
bash tests/hooks/test-completion-nudge.sh
```
Expected: `❌ 8.HANDOFF 단독 침묵 — 기대: [SILENT] 실제: [FIRE]` 그리고 종료 코드 1

- [ ] **Step 3: 훅을 최소 수정한다**

`hooks/completion-nudge` — 아래 줄을

```bash
remnants=$("${SCRIPT_DIR}/lib/detect-remnants" "$PROJECT_ROOT" HANDOFF.md plan.md)
```

이렇게 바꾼다:

```bash
# v1.22.0(intake-routing): HANDOFF는 국면 완료로 삭제되지 않고 워크플로우 내내 산다
# (context-handling/SKILL.md 「주의 사항」). 따라서 HANDOFF 단독 존재는 "마무리할 작업"의
# 근거가 되지 못한다 — 태스크 목록(plan.md)이 있을 때만 마무리 대상으로 본다.
remnants=$("${SCRIPT_DIR}/lib/detect-remnants" "$PROJECT_ROOT" plan.md)
```

- [ ] **Step 4: 테스트를 다시 돌려 전부 통과를 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
bash tests/hooks/test-completion-nudge.sh
```
Expected: `PASS=9 FAIL=0` 그리고 종료 코드 0

> 케이스 1(`projA`, `plan.md` 있음)은 그대로 FIRE, 케이스 6(`projC`, `_archive`의 HANDOFF만)은 그대로 SILENT여야 한다. 둘 중 하나라도 깨지면 수정이 과했다는 뜻이다.

- [ ] **Step 5: 전체 훅 테스트를 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
bash tests/hooks/run-all.sh
```
Expected: 모든 테스트 파일 `FAIL=0`, 종료 코드 0

- [ ] **Step 6: 커밋**

```bash
git add hooks/completion-nudge tests/hooks/test-completion-nudge.sh
git commit -m "fix(intake-routing): HANDOFF 상시 생존에 따른 마무리 훅 오탐 창 완화 + 회귀 케이스"
```

---

## Task 5: 성격 승인 화면 + 기능명 고지 + 흔적 생성

순서를 **카테고리 확정 → 시드 확인 → 성격 승인 + 기능명 고지 → 폴더·HANDOFF 생성**으로 바꾼다. 승인과 파일 쓰기가 같은 차례에 일어나 유실 구간이 사라진다 (확정 1).

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (Step B 「시드 추출」 절 끝 — Step C 앞)
- Modify: `skills/brainstorming/references/templates.md` (성격 승인 화면 템플릿 신설)

**Interfaces:**
- Consumes: Task 1의 블록 목록·소비 계약 ②(화면 이름은 설명 칸 첫 줄), Task 2의 앞머리 칸, Task 3의 생존 규범
- Produces: 승인 시점에 확정된 `action:` 값과 기능명, 그리고 그 값을 담은 `HANDOFF.md`. Task 6의 위임 분기가 이 값을 읽는다.

- [ ] **Step 1: 화면 템플릿을 templates.md에 추가한다 (「국면 4 디렉토리 구조」 절 바로 앞)**

```markdown
## 「성격 승인 화면」

시드 확인 직후에 그린다. 선택지 이름과 괄호 풀이는 **하드코딩하지 않는다** — `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md`를 Read해 블록 목록을 순회하며 각 블록의 「설명」 칸 **첫 줄**을 그대로 쓴다 (소비 계약 ②).

추정값을 기본으로 제시하되 **승인 없이 확정하지 않는다** (REQ-005 · 건너뛸 수 없는 바닥 셋째).

```
📌 결정 요청 : 어떤 일인지 정하기

**이 결정이 다루는 문제:** 요청의 성격에 따라 이후 무엇을 묻고, 어디로 넘기고, 무엇을 남길지가 달라집니다.

**확인된 사실:**
- [시드 확인에서 확정된 목표 한 줄]

**확인 못 한 것:** [없으면 "없음"]

**토론 요지:** 없음

1. [블록 1의 설명 첫 줄] — 고르면: [블록 1의 종료 조건을 쉬운 말 한 줄로]
2. [블록 2의 설명 첫 줄] — 고르면: …
3. [블록 3의 설명 첫 줄] — 고르면: …
4. [블록 4의 설명 첫 줄] — 고르면: …

💡 추천: [추정 번호]
[추정 근거 한 줄 — 사용자 발화의 어느 부분이 근거인지]
```

**승인 직후 같은 차례에 수행한다 (왕복 순증 0):**

1. 기능명을 짓고 **고지 한 줄**로 알린다 — 답을 요구하지 않는다. 갈래별 규칙은 해당 블록의 「기능명 규칙」 칸을 따른다
   `🏷️ 기능명을 [기능명]으로 정했습니다 — 다르게 하고 싶으시면 말씀해 주세요`
2. `docs/design/[카테고리]/[기능명]/` 디렉토리를 만든다
3. 같은 경로에 `HANDOFF.md`를 만들고 `action:`·`feature:`·`category:`·`current-phase: "Phase 1 탐색"`을 채운다 — **이 파일이 국면 4까지 갈래 값의 임시 정본이다**
```

- [ ] **Step 2: brainstorming SKILL.md에 절차를 건다**

`skills/brainstorming/SKILL.md` — Step B 「시드 추출」 절의 마지막 줄

```
**명확도 체크리스트 (시드 확인과 함께 표시):** (위 Read 지시와 동일 블록 — 「명확도 체크리스트 (시드 확인과 함께 표시)」 펜스 사용)
```

**바로 아래**에 새 절을 넣는다:

```markdown
### Step B-1: 성격 승인 + 기능명 (REQ-005 · 확정 1)

**목적:** 작업 갈래를 확정하고, 그 값을 곧바로 파일에 적어 유실을 막는다.

**규칙:**
- 시드 확인 **직후**에 수행한다. 시드를 보고 추정하므로 국면 0보다 정확하다
- **건너뛸 수 없는 바닥이다** (REQ-010 셋째) — 추정만으로 갈래를 확정하지 않는다. 어떤 갈래에서도, 사용자가 서둘러 달라고 해도 이 화면은 생략하지 않는다
- 승인과 **같은 차례에** 기능명 고지 · 디렉토리 생성 · `HANDOFF.md` 작성을 마친다 — 사이에 사용자 응답을 끼우지 않는다
- 선택지는 `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md`를 Read해 **블록 목록을 순회**해 만든다. 갈래 이름을 이 파일에 나열하지 않는다 (소비 계약 ①)

**화면 전문:** 본 스킬의 references/templates.md 「성격 승인 화면」을 Read하여 사용하라.
(Read 실패 시 최소 요건: actions.md 블록 목록을 순회한 번호 목록 + 추정 기본값 + 승인 후 기능명 고지·디렉토리·HANDOFF 생성)

확정된 값은 이후 국면 1 스냅샷(`phase1_exploration.md`)에 승계되고, 국면 4에서 설계 문서 앞머리로 옮겨 가 정본이 된다.
```

- [ ] **Step 3: 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
grep -q "「성격 승인 화면」" skills/brainstorming/references/templates.md || { echo "❌ 화면 템플릿 없음"; rc=1; }
grep -q "Step B-1: 성격 승인" skills/brainstorming/SKILL.md || { echo "❌ Step B-1 절 없음"; rc=1; }
grep -q "블록 목록을 순회" skills/brainstorming/SKILL.md || { echo "❌ 소비 계약 ① 미준수"; rc=1; }
grep -q "건너뛸 수 없는 바닥" skills/brainstorming/SKILL.md || { echo "❌ 바닥 명시 없음"; rc=1; }
# 소비 계약 ① 위반 검사: 갈래 내부 값이 브레인스토밍 문서에 하드코딩되면 안 된다
grep -qE "spec-change|refactor\b" skills/brainstorming/SKILL.md && { echo "❌ 갈래 이름 하드코딩 발견"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 성격 승인 화면 검증 통과"
exit $rc
```
Expected: `✅ 성격 승인 화면 검증 통과`

- [ ] **Step 4: 커밋**

```bash
git add skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md
git commit -m "feat(intake-routing): 성격 승인 화면 신설 — 시드 확인 직후 승인+기능명+HANDOFF 동시 (REQ-005)"
```

---

## Task 6: 위임 칸을 갈래화한다 (GOAL-002 핵심)

[✔ `bootstrap.md:22`] 개발 단계의 목적지가 `Superpowers subagent-driven-development`로 못 박혀 있다. 이것이 "결함은 디버깅으로 보낸다"와 정면으로 부딪히는 **진짜 고장 지점**이다 (확정 3).

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md:22` (단계 표 위임 칸)
- Modify: `skills/workflow-orchestrator/SKILL.md:81` (DEVELOP 판정) · `:84` 부근 (위임 지시)

**Interfaces:**
- Consumes: Task 1의 「넘길 곳」 칸, Task 5가 확정한 `action:` 값
- Produces: 갈래별 개발 위임. 이 태스크 이후 결함 갈래가 실제로 `superpowers:systematic-debugging`으로 간다.

- [ ] **Step 1: 현행 하드코딩을 확인한다 (실패 확인)**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -n "Superpowers subagent-driven-development" skills/workflow-orchestrator/bootstrap.md
```
Expected: `22:| DEVELOP | 구현·개발, plan.md 존재 | Superpowers subagent-driven-development |`

- [ ] **Step 2: bootstrap.md 위임 칸을 참조로 바꾼다**

`skills/workflow-orchestrator/bootstrap.md` — 아래 줄을

```
| DEVELOP | 구현·개발, plan.md 존재 | Superpowers subagent-driven-development |
```

이렇게 바꾼다 (조건 칸은 그대로 — 순증 최소):

```
| DEVELOP | 구현·개발, plan.md 존재 | `actions.md` 갈래 블록의 「넘길 곳」 (폴백: Superpowers subagent-driven-development) |
```

> 폴백을 반드시 병기한다 — [✔ `bootstrap.md:32`]가 이미 같은 방식(참조 + Read 실패 폴백)을 쓴다. 병기하지 않으면 파일을 못 읽을 때 목적지가 통째로 사라진다.

같은 파일의 단계 표 **바로 아래**에 각주 한 줄을 넣는다:

```
> 갈래(`action:`)에 따라 각 단계의 깊이와 위임 목적지가 다르다. 어느 칸을 채워야 하는지는 `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md`의 갈래 블록이 정한다.
```

- [ ] **Step 3: SKILL.md의 위임 지시에 갈래 분기를 건다**

`skills/workflow-orchestrator/SKILL.md` — DEVELOP 절의

```
→ VCS 모드에 관계없이 `superpowers:subagent-driven-development` 실행 시 아래 공통 규칙을 컨텍스트로 전달:
```

**바로 위**에 분기를 넣는다:

```markdown
→ **위임 목적지는 갈래가 정한다** (REQ-004 · GOAL-002).
  `[플러그인 루트]/skills/workflow-orchestrator/references/actions.md`를 Read해 현재 `action:` 값의 블록에서 「넘길 곳」을 읽는다.
  값 해소 순서: `[기능명].md` 앞머리(정본) → `HANDOFF.md` 앞머리(임시 정본) → 없으면 `new-feature` (REQ-007).
  Read에 실패하면 `superpowers:subagent-driven-development`로 폴백한다.

  - 「넘길 곳」이 `superpowers:systematic-debugging`인 경우: 그 블록의 **「종료 조건」 다섯 칸을 채운 값 그대로** 호출 프롬프트에 싣는다. 1~3번 칸은 그 스킬 1단계의 입력이므로 다시 물을 것이 없다. 워크트리·태스크 루프 규칙은 적용하지 않는다
  - 그 외(태스크 목록 실행형): 아래 공통 규칙을 그대로 따른다

→ 태스크 목록 실행형 위임 시, VCS 모드에 관계없이 `superpowers:subagent-driven-development` 실행 시 아래 공통 규칙을 컨텍스트로 전달:
```

그리고 원래의 `→ VCS 모드에 관계없이 …` 줄은 **삭제한다** (위 마지막 줄이 대체한다).

- [ ] **Step 4: DEVELOP 판정 문구를 정리한다**

같은 파일의

```
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물)
```

을 이렇게 바꾼다:

```
- 태스크 목록 존재 (Superpowers `writing-plans` 산출물) — 갈래와 무관하게 PLAN Step 4가 항상 생성한다 (`plan-stage/SKILL.md` Step 4)
```

- [ ] **Step 5: 저장소 방식 감지 트리거를 행위 기준으로 바꾼다 (REQ-017)**

현행 트리거는 단계 이름에 묶여 있다. 갈래에 따라 개발·리뷰 진입 모양이 달라지면 감지가 늦거나 건너뛰어질 수 있다.

`skills/workflow-orchestrator/SKILL.md` — 아래 줄을

```
- **VCS Detection** — DEVELOP 또는 REVIEW 진입 시점(둘 중 먼저)에 실행한다. 세션 환경 컨텍스트의 "Is directory a git repo" 값을 사용한다
```

이렇게 바꾼다:

```
- **VCS Detection** — **코드 파일을 처음 고치기 직전, 또는 DEVELOP·REVIEW 진입 중 먼저 오는 시점**에 실행한다 (단계 이름이 아니라 행위가 트리거다 — 갈래에 따라 진입 모양이 달라져도 감지를 놓치지 않는다). 세션 환경 컨텍스트의 "Is directory a git repo" 값을 사용한다
```

- [ ] **Step 6: 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
grep -q '`actions.md` 갈래 블록의 「넘길 곳」' skills/workflow-orchestrator/bootstrap.md || { echo "❌ 위임 칸 미교체"; rc=1; }
grep -q "코드 파일을 처음 고치기 직전" skills/workflow-orchestrator/SKILL.md || { echo "❌ REQ-017 트리거 미교체"; rc=1; }
grep -q "폴백: Superpowers subagent-driven-development" skills/workflow-orchestrator/bootstrap.md || { echo "❌ 폴백 병기 없음"; rc=1; }
grep -q "위임 목적지는 갈래가 정한다" skills/workflow-orchestrator/SKILL.md || { echo "❌ SKILL.md 분기 없음"; rc=1; }
grep -q "systematic-debugging" skills/workflow-orchestrator/SKILL.md || { echo "❌ 디버깅 경로 없음"; rc=1; }
grep -q "값 해소 순서" skills/workflow-orchestrator/SKILL.md || { echo "❌ 값 해소 순서 없음"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 위임 갈래화 검증 통과"
exit $rc
```
Expected: `✅ 위임 갈래화 검증 통과`

- [ ] **Step 7: 상시 주입 순증을 측정해 기록한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
echo "현재: $(wc -c < skills/workflow-orchestrator/bootstrap.md) bytes"
echo "이전: $(git show HEAD:skills/workflow-orchestrator/bootstrap.md | wc -c) bytes"
```
Expected: 순증 수치가 출력된다. 이 값을 커밋 메시지 본문에 적는다 — 목표를 세우지 않고 **전량 분류**로 다루는 규범(`plugin-architecture.md:48`)을 따른다.

- [ ] **Step 8: 커밋**

```bash
git add skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md
git commit -m "feat(intake-routing): 개발 위임을 갈래 참조로 교체 + VCS 감지를 행위 기준으로 (GOAL-002·REQ-016·REQ-017)"
```

---

## Task 7: 세션 재개 무성 탈락 수리

[✔ `context-handling/SKILL.md:154`] 여섯 번째 규칙이 "위 어디에도 해당하지 않음 → 목록에서 제외"다. 흔적이 적은 상태가 **에러도 경고도 없이** 사라진다.

**Files:**
- Modify: `skills/context-handling/SKILL.md:148~154` (상태 판정 우선순위) · 복구 동작 표

**Interfaces:**
- Consumes: Task 2의 HANDOFF `action:` 칸, Task 3의 생존 규범
- Produces: 갈래 라벨이 붙은 재개 목록. 이후 태스크 없음.

- [ ] **Step 1: 현행 규칙 6을 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -n "위 어디에도 해당하지 않음" skills/context-handling/SKILL.md
```
Expected: `154:   6) 위 어디에도 해당하지 않음 → 목록에서 제외`

- [ ] **Step 2: 규칙 6을 라벨 표시로 바꾼다**

`skills/context-handling/SKILL.md` — 아래 줄을

```
   6) 위 어디에도 해당하지 않음 → 목록에서 제외
```

이렇게 바꾼다:

```
   6) 위 어디에도 해당하지 않지만 산출물이 하나라도 있음 → **목록에서 빼지 않는다.** 라벨: `[갈래 표시 이름] 진행 중 (상태 불명)` — 갈래 이름은 `HANDOFF.md`의 `action:` 값으로 `actions.md` 블록의 「설명」 첫 줄을 찾아 쓴다. 값이 없으면 `진행 중 (상태 불명)`
   7) 산출물이 하나도 없음 → 목록에서 제외
```

- [ ] **Step 3: 라벨을 목록 항목에 병기한다**

같은 파일 4번 절차

```
4. HANDOFF 없는 항목에는 `⚠️ HANDOFF 없음` 태그를 부착한다
```

**바로 아래**에 한 줄을 넣는다:

```
4-1. 모든 항목에 갈래 표시 이름을 앞에 병기한다 (예: `문제 고치기 · Phase 1 완료`). `action:` 값이 없으면 병기를 생략한다
```

- [ ] **Step 4: 복구 동작 표에 대응 행을 추가한다**

같은 파일 「HANDOFF 없는 경우」의 표

```
| DEVELOP 진행 중 | plan.md 로드 → 태스크 체크리스트 확인 후 재개 |
```

**바로 아래**에 행을 추가한다:

```
| [갈래] 진행 중 (상태 불명) | 디렉토리의 파일을 전부 확인해 가장 진행된 지점을 판정하고, 그 지점을 1줄로 고지한 뒤 재개한다 |
```

- [ ] **Step 5: 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
grep -q "목록에서 빼지 않는다" skills/context-handling/SKILL.md || { echo "❌ 규칙 6 미교체"; rc=1; }
grep -q "상태 불명" skills/context-handling/SKILL.md || { echo "❌ 라벨 없음"; rc=1; }
[ "$(grep -c '상태 불명' skills/context-handling/SKILL.md)" -ge 3 ] || { echo "❌ 판정·병기·복구표 셋 중 누락"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 세션 재개 수리 검증 통과"
exit $rc
```
Expected: `✅ 세션 재개 수리 검증 통과`

- [ ] **Step 6: 커밋**

```bash
git add skills/context-handling/SKILL.md
git commit -m "fix(intake-routing): 세션 재개 무성 탈락 수리 — 조용한 제외를 갈래 라벨 표시로 (REQ-016)"
```

---

## Task 8: 발동 훅 intake-nudge 신설

훅은 **파일을 한 번도 읽지 않는다** (확정 6). 낱말만 보고 안내문을 주입하며, 진행 중인지 새 일인지는 **안내문이 두 갈래로 적어 모델이 가른다.**

> **확정 10의 예외 — 이 태스크의 테스트 파일에만 적용된다.**
> 확정 10("새 테스트도 새 스크립트도 만들지 않는다")은 **스킬 문서 검사 하네스**를 겨눈 판단이었다. 여기서 만드는 것은 그것이 아니라 [✔ `tests/hooks/`] 이미 넷이 돌고 있는 **훅 테스트의 다섯 번째**이고, [✔ `tests/hooks/run-all.sh:5`] 글롭 `test-*.sh` 안이라 실행 주체가 이미 있다.
> 근거: [✔ `hooks/completion-nudge:23~24` + `tests/hooks/test-completion-nudge.sh` 케이스 0] 이 저장소는 **어휘 사본이 위험하다는 것을 알고 전용 검사를 붙여 값을 이미 치렀다.** 새 훅도 같은 사본을 만든다.
> 이 예외를 다른 태스크로 확대하지 않는다.

**Files:**
- Create: `hooks/intake-nudge`
- Create: `tests/hooks/test-intake-nudge.sh`
- Modify: `hooks/hooks.json:20~30` (UserPromptSubmit 배열)
- Modify: `skills/workflow-orchestrator/SKILL.md` (어휘 SSOT 라인 신설)

**Interfaces:**
- Consumes: 없음 (독립)
- Produces: `<intake-signal>` 태그. `intake-vocab:` SSOT 라인 — 테스트가 이 라인과 훅의 `INTAKE_WORDS`를 대조한다.

- [ ] **Step 1: 어휘 SSOT 라인을 SKILL.md에 만든다**

`skills/workflow-orchestrator/SKILL.md` — 기존 `completion-vocab:` 라인(299행 부근) **바로 아래**에 한 줄을 넣는다:

```
`intake-vocab: 버그|버그가|에러|오류|안 나와|안나와|안 떠|재현|리팩터링|리팩토링|고쳐줘|문제 확인`
```

> 어휘 선정 근거: `안 돼`·`안돼`는 일상 대화에 흔해 오탐 1순위라 **뺐다**. 영문 `refactor`는 [✔ 커밋 타입 `refactor:`]와 부딪혀 뺐다. 완곡 표현(`이상해`·`튕겨`)은 상시 주입이 뜻으로 잡는 몫으로 남겼다.

- [ ] **Step 2: 실패하는 테스트를 먼저 쓴다**

`tests/hooks/test-intake-nudge.sh`:

```bash
#!/usr/bin/env bash
# intake-nudge 시나리오 테스트 (0번: 어휘 SSOT diff)
# 이 훅은 파일을 읽지 않는다 — 저장소 상태와 무관하게 어휘만으로 판정한다 (intake-routing 확정 6)
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
HOOK="${REPO_ROOT}/hooks/intake-nudge"
SKILL="${REPO_ROOT}/skills/workflow-orchestrator/SKILL.md"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi }
fire() { # $1=프로젝트루트 $2=프롬프트 → 발동 시 "FIRE", 침묵 시 "SILENT"
  out=$(printf '{"prompt": "%s", "cwd": "%s"}' "$2" "$1" | CLAUDE_PROJECT_DIR="$1" bash "$HOOK")
  [ -n "$out" ] && echo "FIRE" || echo "SILENT"
}

# 픽스처: 빈 프로젝트 하나, 진행 중 산출물이 있는 프로젝트 하나
mkdir -p "$TMP/empty" "$TMP/busy/docs/design/cat/feat"
echo p > "$TMP/busy/docs/design/cat/feat/plan.md"

echo "[intake-nudge]"
# 0. 어휘 SSOT diff: SKILL.md의 intake-vocab 라인과 훅의 INTAKE_WORDS 일치
ssot=$(grep -o 'intake-vocab: .*' "$SKILL" | sed 's/intake-vocab: //' | tr -d '`')
mirror=$(grep -o "INTAKE_WORDS='[^']*'" "$HOOK" | sed "s/INTAKE_WORDS='//; s/'$//")
check "0.어휘 SSOT diff" "$ssot" "$mirror"
# 1. 빈 저장소 + 결함 발화 → 발동 (파일을 안 보므로 저장소가 비어도 울린다)
check "1.빈 저장소+결함" "FIRE" "$(fire "$TMP/empty" "랭킹에 닉네임이 안 나와")"
# 2. 진행 중 산출물 있음 + 결함 발화 → 발동 (잔존이 훅을 죽이지 않는다 — 확정 6의 핵심)
check "2.진행중+결함" "FIRE" "$(fire "$TMP/busy" "이 버그 고쳐줘")"
# 3. 리팩터링 발화 → 발동
check "3.리팩터링" "FIRE" "$(fire "$TMP/empty" "이 부분 리팩터링하자")"
# 4. 무관 발화 → 침묵
check "4.무관 발화" "SILENT" "$(fire "$TMP/empty" "오늘 날씨 어때")"
# 5. '안 돼'는 어휘에서 제외됨 → 침묵 (의도된 미탐 — 오탐 1순위라 뺐다)
check "5.안돼 제외" "SILENT" "$(fire "$TMP/empty" "그건 안 돼")"
# 6. 하네스 주입 블록 → 침묵 (사용자 발화가 아니다)
check "6.알림 오탐 차단" "SILENT" "$(fire "$TMP/empty" "<task-notification>버그 수정 완료</task-notification>")"
# 7. 주입문에 두 갈래 경계선이 모두 들어 있다
out=$(printf '{"prompt": "이 버그 고쳐줘", "cwd": "%s"}' "$TMP/empty" | CLAUDE_PROJECT_DIR="$TMP/empty" bash "$HOOK")
printf '%s' "$out" | grep -q "이슈 카드" && a=YES || a=NO
printf '%s' "$out" | grep -q "workflow-orchestrator" && b=YES || b=NO
check "7.경계선 두 갈래" "YES:YES" "$a:$b"

echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 3: 테스트를 돌려 실패를 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
bash tests/hooks/test-intake-nudge.sh
```
Expected: 전 케이스 실패 (훅 파일이 없어 빈 출력 → 대부분 `SILENT`), 종료 코드 1

- [ ] **Step 4: 훅을 작성한다**

`hooks/intake-nudge`:

```bash
#!/usr/bin/env bash
# UserPromptSubmit hook — 착수 발화 감지 (intake-routing REQ-002)
# 발동: 착수 어휘만. **파일을 읽지 않는다** — 저장소 상태 검사가 세션 범위 질문에 답할 수 없어
# 훅이 조용히 죽던 문제를 없앤다 (intake-routing 확정 6).
# 진행 중인지 새 일인지의 경계는 주입 문면이 두 갈래로 적고, 판정은 모델에 맡긴다.
# 미충족 시 빈 출력. 항상 exit 0 (차단 금지 — deny형 개입 배제 독트린).
set -u

hook_input=$(cat 2>/dev/null || true)
if command -v jq >/dev/null 2>&1; then
    prompt=$(printf '%s' "$hook_input" | jq -r '.prompt // empty' 2>/dev/null || true)
else
    prompt=$(printf '%s' "$hook_input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -1)
fi
[ -z "$prompt" ] && exit 0

# 하네스 주입 블록 제외 — 백그라운드 에이전트 완료 알림은 사용자 발화가 아니다 (이슈 카드 001과 동일 사유)
case "$prompt" in *"<task-notification>"*) exit 0;; esac

# 어휘 미러 — SSOT: skills/workflow-orchestrator/SKILL.md 「마무리 트리거 감지」의 intake-vocab 라인.
# 변경 시 양쪽 동시 수정 (tests/hooks/test-intake-nudge.sh 케이스 0번이 diff 검증)
INTAKE_WORDS='버그|버그가|에러|오류|안 나와|안나와|안 떠|재현|리팩터링|리팩토링|고쳐줘|문제 확인'
printf '%s' "$prompt" | grep -qiE "$INTAKE_WORDS" || exit 0

cat <<'EOF'
<intake-signal>
사용자 입력에 착수 어휘(결함·리팩터링 계열)가 감지되었다. 아래 두 갈래 중 하나로 판정하라.

1) 이미 진행 중인 feature의 개발 도중에 발견된 문제라면 — 이 신호는 해당 없음이다.
   dev-workflow:workflow-orchestrator 「Issue Lifecycle」의 이슈 카드 경로를 따르라.

2) 새로 들어온 일이라면 — 자체 판단으로 곧장 고치거나 디버깅 스킬을 부르지 말고,
   dev-workflow:workflow-orchestrator를 invoke해 브레인스토밍 입구로 라우팅하라.
   그 입구에서 작업 성격을 확정하고, 결함이면 넘기기 전에 종료 조건 다섯 칸을 채운다.

어느 쪽인지 불분명하면 2)를 택하라 — 사용자에게 묻는 비용이 잘못 고치는 비용보다 싸다.
</intake-signal>
EOF
exit 0
```

- [ ] **Step 5: 실행 권한을 주고 테스트를 통과시킨다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
chmod +x hooks/intake-nudge
bash tests/hooks/test-intake-nudge.sh
```
Expected: `PASS=8 FAIL=0`, 종료 코드 0

- [ ] **Step 6: hooks.json에 등록한다**

`hooks/hooks.json` — `UserPromptSubmit` 배열의 `hooks` 안, `completion-nudge` 항목 **다음**에 추가:

```json
          {
            "type": "command",
            "command": "'${CLAUDE_PLUGIN_ROOT}/hooks/completion-nudge'",
            "async": false
          },
          {
            "type": "command",
            "command": "'${CLAUDE_PLUGIN_ROOT}/hooks/intake-nudge'",
            "async": false
          }
```

- [ ] **Step 7: JSON 파싱과 전체 테스트를 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8')); console.log('✅ hooks.json 파싱 OK')"
bash tests/hooks/run-all.sh
```
Expected: `✅ hooks.json 파싱 OK` 그리고 모든 테스트 `FAIL=0`

- [ ] **Step 8: 커밋**

```bash
git add hooks/intake-nudge hooks/hooks.json tests/hooks/test-intake-nudge.sh skills/workflow-orchestrator/SKILL.md
git commit -m "feat(intake-routing): intake-nudge 훅 신설 — 파일 미접근·어휘만·경계선은 주입문이 가름 (REQ-002)"
```

---

## Task 9: 발동 어휘 확장 + 무발동 문장 5곳 정비

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md:8` (단계 키워드) · `:12` (무발동 문장)
- Modify: `skills/workflow-orchestrator/SKILL.md:27` · `:34` · `:167`
- Modify: `README.md:132`

**Interfaces:**
- Consumes: Task 8의 `intake-vocab` 어휘
- Produces: 상시 주입 쪽 그물. Task 8의 훅과 이중으로 작동한다.

- [ ] **Step 1: 대상 5곳을 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -n "신호가 전혀 없" skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md
grep -n "워크플로우 의도도 없음" skills/workflow-orchestrator/SKILL.md
grep -n "게이트:" skills/workflow-orchestrator/SKILL.md
grep -n "일반 질문·단순 수정 세션" README.md
```
Expected: 5곳 모두 매칭

- [ ] **Step 1-1: 착수 어휘를 자기 절로 분리한다 (Task 8 리뷰 이관 — Important)**

Task 8이 `intake-vocab:` 라인을 `### 마무리 트리거 감지` 절 안에 넣었다(브리프 지시). 그 결과 **그 절의 서술이 착수 어휘에 대해 사실이 아니게 됐다:**

- 절 서두가 `어휘 목록 (SSOT — 훅 hooks/completion-nudge가 미러, diff는 tests/hooks/test-completion-nudge.sh 케이스 0번이 검증)`인데, 착수 어휘를 미러하는 것은 `hooks/intake-nudge`이고 검증하는 것은 `test-intake-nudge.sh`다
- 이어지는 불릿 `위 어휘가 세션 전체 작업의 마무리 의도로 발화되면`의 "위 어휘"가 문법적으로 착수 어휘까지 포함한다

`intake-vocab:` 줄을 그 절에서 **빼서** `### 마무리 트리거 감지` 절이 끝난 다음(`### 마무리 시퀀스` 앞)에 형제 절로 옮긴다:

```markdown
### 착수 트리거 감지

새로 들어온 일을 워크플로우 입구로 보낸다. 어휘 목록 (SSOT — 훅 `hooks/intake-nudge`가 미러, diff는 `tests/hooks/test-intake-nudge.sh` 케이스 0번이 검증):

`intake-vocab: 버그|버그가|에러|오류|안 나와|안나와|안 떠|재현|리팩터링|리팩토링|고쳐줘|문제 확인`

- 위 어휘가 보이면 자체 판단으로 곧장 고치지 말고 브레인스토밍 입구로 라우팅한다 — 그 입구에서 작업 성격을 확정한다
- **이미 진행 중인 작업의 개발 도중에 발견된 결함은 해당 없음** — 「Issue Lifecycle」의 이슈 카드 경로를 따른다
- `<intake-signal>` 주입(intake-nudge 훅)이 보이면 같은 판정을 즉시 수행한다
- 어느 쪽인지 불분명하면 입구로 보낸다 — 묻는 비용이 잘못 고치는 비용보다 싸다
```

↳ 옮긴 뒤 `### 마무리 트리거 감지` 절의 서두와 불릿이 **`completion-vocab` 하나만** 가리키는지 확인한다.

- [ ] **Step 2: bootstrap.md 단계 키워드에 착수 계열을 추가한다**

아래 줄을

```
- 단계 키워드: 브레인스토밍·아이디어·기획 / 계획·설계 / 구현·개발 / 리뷰·검토 / 마무리·wrap up
```

이렇게 바꾼다:

```
- 단계 키워드: 브레인스토밍·아이디어·기획 / 계획·설계 / 구현·개발 / 리뷰·검토 / 마무리·wrap up
- 착수 신호: 결함·문제 제기(버그·에러·안 나와·재현·고쳐줘) / 사양 변경 / 리팩터링·리팩토링 — **답이 이미 정해진 요청이 아니면 발동한다**
```

- [ ] **Step 3: 무발동 문장 5곳을 "이미 답이 정해진 요청" 취지로 정비한다**

각 위치의 현행 문면 → 새 문면:

`bootstrap.md`:
```
신호가 전혀 없는 요청(일반 질문, 단순 수정, 조사)은 워크플로우를 발동하지 않고 일반 응답한다.
```
→
```
답이 이미 정해진 요청(사실 조회, 지시가 구체적인 단순 수정, 조사)은 워크플로우를 발동하지 않고 일반 응답한다. **무엇을 고칠지 아직 정해지지 않은 문제 제기는 답이 정해진 요청이 아니다** — 발동한다.
```

`SKILL.md` (Session Start Protocol):
```
   - "진행 중인 작업 없음" + 워크플로우 의도도 없음 → 후속 질문 없이 사용자 요청에 일반 응답한다
```
→
```
   - "진행 중인 작업 없음" + 답이 이미 정해진 요청 → 후속 질문 없이 사용자 요청에 일반 응답한다
```

`SKILL.md` (지연 발동 게이트):
```
**게이트:** 워크플로우 의도 신호(단계 키워드, docs/design 산출물 작업, 진행 중 작업 재개)가 전혀 없는 요청은 아래 단계를 생략하고 일반 응답한다. 이후 대화에서 신호가 등장하면 그 시점에 진입한다.
```
→
```
**게이트:** 워크플로우 의도 신호(단계 키워드, **착수 신호**, docs/design 산출물 작업, 진행 중 작업 재개)가 전혀 없고 **답이 이미 정해진 요청**은 아래 단계를 생략하고 일반 응답한다. 이후 대화에서 신호가 등장하면 그 시점에 진입한다.
```

`SKILL.md` (Ambiguous):
```
워크플로우 의도 신호는 있으나 단계가 불명확할 때만 질문한다. 신호가 전혀 없으면 질문 없이 일반 응답한다 (Session Start Protocol의 게이트).
```
→
```
워크플로우 의도 신호는 있으나 단계가 불명확할 때만 질문한다. 답이 이미 정해진 요청이면 질문 없이 일반 응답한다 (Session Start Protocol의 게이트).
```

`README.md`:
```
일반 질문·단순 수정 세션에는 워크플로우 의식이 개입하지 않습니다.
```
→
```
답이 이미 정해진 요청(사실 조회, 지시가 구체적인 단순 수정)에는 워크플로우 의식이 개입하지 않습니다. 반대로 "이게 왜 안 되지" 같은 **문제 제기는 답이 정해지지 않은 요청**이라 워크플로우가 발동합니다.
```

- [ ] **Step 4: 구 문구 잔존 스윕**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -rn "신호가 전혀 없는 요청(일반 질문\|일반 질문·단순 수정 세션에는\|워크플로우 의도도 없음" \
  skills/ hooks/ commands/ README.md CLAUDE.md 2>/dev/null
```
Expected: 출력 없음 (잔존 0건)

- [ ] **Step 5: 정비 결과를 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
# 문자열 개수를 세지 않는다 — 다섯 곳을 각각 그 자리의 고유 문맥으로 확인한다.
# (개수 세기는 아무 문장이나 넣어도 통과한다 — Task 7 리뷰 지적)
grep -q "무엇을 고칠지 아직 정해지지 않은 문제 제기는 답이 정해진 요청이 아니다" skills/workflow-orchestrator/bootstrap.md \
  || { echo "❌ ① bootstrap 무발동 문장 미정비"; rc=1; }
grep -q '"진행 중인 작업 없음" + 답이 이미 정해진 요청' skills/workflow-orchestrator/SKILL.md \
  || { echo "❌ ② Session Start Protocol 미정비"; rc=1; }
grep -q "착수 신호\*\*, docs/design 산출물 작업" skills/workflow-orchestrator/SKILL.md \
  || { echo "❌ ③ 지연 발동 게이트 미정비"; rc=1; }
grep -q "답이 이미 정해진 요청이면 질문 없이 일반 응답한다" skills/workflow-orchestrator/SKILL.md \
  || { echo "❌ ④ Ambiguous 절 미정비"; rc=1; }
grep -q "문제 제기는 답이 정해지지 않은 요청" README.md \
  || { echo "❌ ⑤ README 미정비"; rc=1; }
grep -q "^- 착수 신호:" skills/workflow-orchestrator/bootstrap.md \
  || { echo "❌ 착수 신호 어휘 줄 없음"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 무발동 문장 5곳 + 착수 어휘 정비 완료"
exit $rc
```
Expected: `✅ 무발동 문장 5곳 정비 완료`

- [ ] **Step 6: 커밋**

```bash
git add skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md README.md
git commit -m "feat(intake-routing): 착수 신호 어휘 추가 + 무발동 문장 5곳을 '답이 정해진 요청' 취지로 정비 (REQ-002·003)"
```

---

## Task 10: 브레인스토밍 경량화 — 국면 전환 3곳 + 문답 하한 분기

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (국면 1·2·3 전환 제안 · Step A 문답 하한)

**Interfaces:**
- Consumes: Task 1의 「종료 조건」 칸, Task 5가 확정한 `action:` 값
- Produces: 없음 (마지막 절차 태스크)

> **REQ-009는 새 규칙을 만들지 않는 것으로 충족된다.** "이미 충분한 요청이면 건너뛴다"를 별도 규칙으로 만들지 않고, `actions.md` 「종료 조건」이 이미 채워진 상태가 곧 스킵이 되게 둔다. 이 태스크에서 스킵 규칙을 추가하지 마라.
> 단, [✔ 설계 문서 §8 「판정이 무너뜨린 것 ①」] **REQ-009가 승인 화면 수를 줄이지는 못한다** — 바닥은 상수다. 줄어드는 것은 국면 1~4의 질문 왕복뿐이다. 이 사실을 문서에 다르게 적지 마라.

- [ ] **Step 0: 결함 종료 조건 다섯 칸의 기록 자리를 만든다 (Task 6 리뷰 이관 — Important)**

Task 6이 "「종료 조건」 다섯 칸을 **채운 값 그대로** 디버깅 스킬에 싣는다"를 배선했는데, **그 채운 값을 어디에 적어 두는지가 저장소 어디에도 없다.** 개발이 다른 세션에서 시작되면 값을 복구할 수 없어 디버깅 1단계에서 다시 묻게 된다 — 이 판이 없애려던 상태다.

`skills/brainstorming/SKILL.md` 국면 1 「전환 확정 시 즉시」 포함 내용 목록에서 Task 3이 넣은

```
- **확정된 갈래 (`action:` 값과 그 근거 한 줄)** — 설계 문서가 생기기 전까지 이 스냅샷이 값의 사본이다
```

**바로 아래**에 한 줄을 넣는다:

```
- **종료 조건 충족 내역** — `actions.md`의 해당 갈래 블록이 요구한 칸을 **채운 값 그대로** 옮겨 적는다. 개발 단계가 하위 스킬에 넘길 때 이 자리에서 읽는다 (읽는 순서: `workflow-orchestrator/SKILL.md` DEVELOP 절 참조)
```

↳ 갈래 이름을 쓰지 않는다 — 「종료 조건」 칸을 요구하는 갈래면 무엇이든 같은 자리를 쓴다 (소비 계약 ①).

- [ ] **Step 1: 대상 4곳을 확인한다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
grep -n "종료 조건 충족 내역" skills/brainstorming/SKILL.md
grep -n "최소 3회 Q&A 후에만" skills/brainstorming/SKILL.md
grep -n "전환 제안:" skills/brainstorming/SKILL.md
grep -n "추가로 논의할 요구사항이 있으신가요" skills/brainstorming/SKILL.md
```
Expected: 하한 1곳 + 전환 제안 3곳

- [ ] **Step 2: 문답 하한에 갈래 분기를 건다**

`skills/brainstorming/SKILL.md` — 아래 줄을

```
- 최소 3회 Q&A 후에만 Step B 전환 가능
```

이렇게 바꾼다:

```
- 최소 3회 Q&A 후에만 Step B 전환 가능
  - **갈래별 하한은 내리지 않고 올린다** — 안전장치를 빼는 방향의 경량화는 하지 않는다. `actions.md` 블록의 「종료 조건」이 기본 다섯 칸보다 많은 것을 요구하면, 그 칸이 다 찰 때까지 3회를 넘겨 계속 묻는다
  - 성격 승인(Step B-1)은 시드 확인 뒤에 오므로, 이 단계에서는 아직 갈래를 모른다. 갈래별 추가 문답은 국면 1(Step C)에서 이어 간다
```

- [ ] **Step 3: 국면 전환 3곳을 "진행 후 이의"로 바꾼다**

세 곳 모두 같은 형식으로 바꾼다. [✔ `brainstorming/SKILL.md:410`]의 기존 문형("자동 진행합니다 (원치 않으시면 말씀하세요)")을 복제한다.

국면 1 → 2 (`"추가로 논의할 요구사항이 있으신가요, 아니면 다음 단계로 넘어갈까요?"`):
```
전환 고지: "요구사항의 윤곽이 잡혔습니다. 국면 2(발견)로 자동 진행합니다 — 더 논의할 요구사항이 있으면 말씀하세요."
```

국면 2 → 3 (`전환 제안: "요구사항이 구체화되었습니다. TD를 불러서 …"`):
```
전환 고지: "요구사항이 구체화되었습니다. 기술 검토(국면 3: 검증)로 자동 진행합니다 — 원치 않으시면 말씀하세요."
```

국면 3 → 4 (`전환 제안: "기술 검토까지 완료되었습니다. 지금까지의 논의를 …"`):
```
전환 고지: "기술 검토까지 완료되었습니다. 설계 문서로 정리(국면 4)를 자동 진행합니다 — 원치 않으시면 말씀하세요."
```

각 고지 아래에 공통 한 줄을 덧붙인다:

```
(안전망: development-principles "자동 결정 안전망" — 고지 후 이의가 오면 즉시 중단하고 이전 국면으로 되돌린다. 이의를 받는 창은 **다음 국면의 첫 사용자 응답까지**다)
```

- [ ] **Step 4: 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
[ "$(grep -c '전환 고지:' skills/brainstorming/SKILL.md)" -eq 3 ] || { echo "❌ 전환 고지가 3곳이 아님"; rc=1; }
grep -q "전환 제안:" skills/brainstorming/SKILL.md && { echo "❌ 구 전환 제안 잔존"; rc=1; }
grep -q "하한은 내리지 않고 올린다" skills/brainstorming/SKILL.md || { echo "❌ 하한 분기 방향 미명시"; rc=1; }
grep -q "다음 국면의 첫 사용자 응답까지" skills/brainstorming/SKILL.md || { echo "❌ 이의 창 길이 미명시"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 경량화 검증 통과"
exit $rc
```
Expected: `✅ 경량화 검증 통과`

- [ ] **Step 5: 커밋**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(intake-routing): 국면 전환 3곳을 진행 후 이의로 + 문답 하한 갈래 분기 (REQ-013)"
```

---

## Task 11: 하위 에이전트 행동 블록 구획 + 적용 경로 등록

**Files:**
- Modify: `skills/plan-stage/SKILL.md` (Architect 프롬프트 펜스 · Researcher 프롬프트 펜스)
- Modify: `skills/brainstorming/references/templates.md:3~4` (공통 조립 규칙의 적용 경로 목록)

**Interfaces:**
- Consumes: Task 1의 소비 계약과 적용 경로 목록
- Produces: 하위 에이전트가 갈래 규범을 보는 경로 (REQ-004 · 확정 4)

- [ ] **Step 1: Architect 프롬프트에 구획을 넣는다**

`skills/plan-stage/SKILL.md` — Architect 프롬프트 펜스의

```
--- 프로젝트 규칙 ---
```

**바로 위**에 두 줄을 넣는다:

```
--- 행동 블록 ---
[workflow-orchestrator/references/actions.md의 현재 action: 값에 해당하는 블록 전문 — Read 실패 시 최소 요건: 갈래 이름 + 종료 조건 + 넘길 곳]
```

- [ ] **Step 2: Researcher 프롬프트에 같은 구획을 넣는다**

같은 파일 Researcher 프롬프트 펜스의

```
--- 언어 규범 ---
```

**바로 위**에 두 줄을 넣는다:

```
--- 행동 블록 ---
[workflow-orchestrator/references/actions.md의 현재 action: 값에 해당하는 블록 전문 — Read 실패 시 최소 요건: 갈래 이름 + 종료 조건 + 넘길 곳]
```

- [ ] **Step 3: 적용 경로 목록에 등록한다**

`skills/brainstorming/references/templates.md` — 적용 경로 목록 줄의 끝에 문장을 덧붙인다:

```
> 행동 블록 구획 적용 경로 (검증 기준 — 누락 0): ① brainstorming 성격 승인 화면 ② brainstorming 국면별 종료 조건 ③ workflow-orchestrator 개발 위임 ④ plan-stage Architect ⑤ plan-stage Researcher.
```

- [ ] **Step 4: 누락 0 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
[ "$(grep -c -- '--- 행동 블록 ---' skills/plan-stage/SKILL.md)" -eq 2 ] || { echo "❌ plan-stage 구획이 2곳이 아님"; rc=1; }
grep -q "행동 블록 구획 적용 경로" skills/brainstorming/references/templates.md || { echo "❌ 적용 경로 목록 미등록"; rc=1; }
# 적용 경로 5곳이 실제로 actions.md를 참조하는지 대조
for f in skills/brainstorming/SKILL.md skills/workflow-orchestrator/SKILL.md skills/plan-stage/SKILL.md; do
  grep -q "actions.md" "$f" || { echo "❌ actions.md 미참조: $f"; rc=1; }
done
[ "$rc" -eq 0 ] && echo "✅ 행동 블록 적용 경로 누락 0"
exit $rc
```
Expected: `✅ 행동 블록 적용 경로 누락 0`

- [ ] **Step 5: 커밋**

```bash
git add skills/plan-stage/SKILL.md skills/brainstorming/references/templates.md
git commit -m "feat(intake-routing): 하위 에이전트 행동 블록 구획 + 적용 경로 목록 등록 (확정 4·10)"
```

---

## Task 12: 문서 스윕 · 검증 버전 정정 · 버전 범프

**Files:**
- Modify: `README.md` (단계 표 · 갈래 소개)
- Modify: `CLAUDE.md` (훅 목록 · 스킬 참조 자료 · 핵심 패턴)
- Modify: `skills/workflow-orchestrator/SKILL.md` (검증 버전 6.1.1 → 6.2.0)
- Modify: `.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` (**`scripts/bump-version`으로만**)

**Interfaces:**
- Consumes: Task 1~11 전부
- Produces: 릴리스 가능한 상태

- [ ] **Step 0: 세션 시작 훅 둘의 실행 비트를 세운다 (Task 8 리뷰 이관 — Critical, 이 판 밖의 기존 결함)**

[✔ `git ls-files -s hooks/`] `hooks/session-start`와 `hooks/inject-rules`가 **`100644`(실행 불가)**다. 형제 훅 넷(`completion-nudge`·`intake-nudge`·`lib/detect-remnants`·`statusline/dev-workflow-status`)은 전부 `100755`다.

[✔ `git ls-tree` 최초 커밋] 둘 다 **처음 커밋된 순간부터 계속 644**였다 — 이 판이 만든 문제가 아니다.

**왜 Critical인가:**
- [✔ `hooks/hooks.json:9·14`] 두 훅은 `"command": "'${CLAUDE_PLUGIN_ROOT}/hooks/session-start'"` 형태로, 인터프리터 없이 **경로 자체가 명령**이다
- [✔ 각 파일 1행] 둘 다 `#!/usr/bin/env bash` 셔뱅을 갖는다 — 직접 실행을 전제한다
- POSIX 셸에서 실행 비트 없는 파일을 이렇게 부르면 `Permission denied`다. **리눅스·맥에 이 플러그인을 설치한 모든 사용자에게 세션 시작 훅 둘이 통째로 죽어 있을 수 있다** — 오케스트레이터 자동 주입과 규칙 주입이 그 둘이다
- 윈도우(`core.filemode=false`)에서는 증상이 안 보이고, 테스트는 `bash "$HOOK"`로 직접 부르므로 이 결함을 못 잡는다

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
git update-index --chmod=+x hooks/session-start
git update-index --chmod=+x hooks/inject-rules
git ls-files -s hooks/ | grep -E "session-start|inject-rules"
```
Expected: 두 줄 모두 `100755`

그리고 나머지 훅도 전수 확인한다:
```bash
git ls-files -s hooks/ | awk '$1=="100644" && $4 !~ /\.json$/ {print "❌ 실행 비트 없음: "$4; f=1} END {exit f+0}' && echo "✅ 훅 실행 비트 전수 정상"
```
Expected: `✅ 훅 실행 비트 전수 정상` (`hooks.json`은 데이터 파일이라 644가 맞다)

- [ ] **Step 0-1: 끊긴 읽는 순서를 고친다 (Task 10 리뷰 이관 — Critical)**

Task 6이 `skills/workflow-orchestrator/SKILL.md:90` 부근에 결함 종료 조건 다섯 칸의 **읽는 순서**를 세 자리로 적었다. 리뷰가 세 자리를 하나씩 확인한 결과:

| 자리 | 상태 |
|---|---|
| `phase1_exploration.md`의 「종료 조건 충족 내역」 | ✅ Task 10이 만들었다 — 이름까지 일치 |
| `[기능명].md` §3 | ❌ **끊겼다** |
| `HANDOFF.md` 본문 | ⚠️ 이름 붙은 칸은 없으나 자유 서술 목록이라 적을 수는 있다 |

[✔ `brainstorming/references/templates.md:350`] **§3은 「확정된 요구사항」이고 `REQ-001: [명세] — 우선순위: HIGH` 형식 전용**이다. 다섯 칸(에러 원문 전문·재현 절차·최근 변경 목록·대상·수락 기준)은 요구사항이 아니라 브레인스토밍에서 모은 입력이라 형태가 전혀 다르다. [✔ `brainstorming/SKILL.md:425~444`] 국면 4 절차 어디에도 "§3에 종료 조건 값을 옮겨 적는다"는 지시가 없다.

**§3을 읽는 순서에서 뺀다.** 새 서식을 §3에 만드는 것보다 이쪽이 옳다 — 그 절은 요구사항 목록이고, 다섯 칸은 요구사항이 아니다. 그리고 [✔ `context-handling/SKILL.md:264·298`] 국면 파일은 마무리 한 곳에서만 지워지므로 개발 진입 시점에 첫 번째 자리가 살아 있다.

`skills/workflow-orchestrator/SKILL.md`의

```
    - 채운 값의 해소 순서: `phase1_exploration.md`의 「종료 조건 충족 내역」 → `[기능명].md` §3 → `HANDOFF.md` 본문. 어느 자리에도 없으면 **개발로 넘기지 말고** 브레인스토밍 Step A(인터뷰)로 되돌아가 채운다
```

을 이렇게 바꾼다:

```
    - 채운 값의 해소 순서: `phase1_exploration.md`의 「종료 조건 충족 내역」 → `HANDOFF.md` 본문의 「확정된 항목」. 어느 자리에도 없으면 **개발로 넘기지 말고** 브레인스토밍 Step A(인터뷰)로 되돌아가 채운다
```

- [ ] **Step 0-2: 진행 후 이의에서 되돌릴 때 국면 파일을 어떻게 하는지 적는다 (Task 10 리뷰 이관 — Important)**

Task 10이 국면 전환을 "묻고 기다리기"에서 "진행하고 이의 받기"로 바꿨다. 그 결과 **확인 없이 불변 국면 파일이 먼저 만들어지고** 그 뒤에 이의 창이 열린다. 그런데 이의가 왔을 때 방금 만든 파일을 어떻게 하는지가 없다 — [✔ `CLAUDE.md` 「Phase 파일 불변성」] "생성 후 수정 불가" 규범과 처음 부딪히는 지점이다.

`skills/brainstorming/SKILL.md`의 전환 고지 세 곳에 붙은 공통 안전망 줄에서

```
(안전망: development-principles "자동 결정 안전망" — 고지 후 이의가 오면 즉시 중단하고 이전 국면으로 되돌린다. 이의를 받는 창은 **다음 국면의 첫 사용자 응답까지**다)
```

의 괄호 안에 한 문장을 덧붙인다 (세 곳 모두):

```
되돌릴 때 방금 만든 `phase*.md`는 지운다 — 불변 규범은 **국면이 확정된 뒤**의 파일에 적용되며, 이의 창 안의 파일은 아직 확정 전이다.
```

- [ ] **Step 1: 검증 버전 표기를 정정한다**

[✔ `~/.claude/plugins/installed_plugins.json`] 실제 설치본은 6.2.0인데 문서는 6.1.1로 적혀 있다.

`skills/workflow-orchestrator/SKILL.md` — 아래 줄을

```
- **검증 버전: Superpowers 6.1.1** — 이후 버전에서 역할 구조가 다르면 의미상 등가 역할(구현 담당 → Implementer 규칙, 태스크 리뷰 담당 → Reviewer 규칙)에 첨부하라
```

이렇게 바꾼다:

```
- **검증 버전: Superpowers 6.2.0** — 이후 버전에서 역할 구조가 다르면 의미상 등가 역할(구현 담당 → Implementer 규칙, 태스크 리뷰 담당 → Reviewer 규칙)에 첨부하라
  - `systematic-debugging` 1단계 요구 셋(에러 원문·재현 절차·최근 변경)에 `actions.md`의 결함 종료 조건 1~3번이 이름을 맞추고 있다. 상위 버전에서 이 셋이 바뀌면 블록의 해당 칸도 함께 고친다
```

- [ ] **Step 1-1: 개발 위임 목적지를 서술한 곳을 정정한다 (Task 6 리뷰 이관)**

Task 6이 개발 단계의 목적지를 `actions.md` 참조로 바꿨는데, 그것을 서술하는 문장 둘이 옛말로 남았다.

**① `CLAUDE.md`의 「Workflow Stage → Delegation」 표** — DEVELOP 행이 `Superpowers subagent-driven-development` 고정 서술이다. 갈래에 따라 목적지가 갈린다는 사실을 반영한다:

```
| DEVELOP | `actions.md` 갈래 블록의 「넘길 곳」 — 기본은 Superpowers `subagent-driven-development`, 결함 갈래는 `systematic-debugging` | ❌ 없음 (이슈 카드 관점 1줄 예외) |
```

**② `README.md`의 DEVELOP 절** — 갈래 안내가 없다. 그 절에 한 줄을 덧붙인다:

```
작업 갈래가 **문제 고치기**이면 구현 대신 Superpowers 디버깅으로 넘어갑니다 — 넘기기 전에 에러 원문·재현 절차·최근 변경을 브레인스토밍에서 미리 채웁니다.
```

**③ 리뷰가 추가로 찾은 스윕 대상** — 개발 단계가 "무조건 태스크 목록 실행형"이라고 서술하는 곳들이다. 각각 "갈래에 따라 갈린다"는 사실을 반영한다:

| 파일:행 | 지금 문면의 문제 |
|---|---|
| `README.md:85` | 단계 표 DEVELOP 셀 — "태스크마다 구현→리뷰→수정 반복" |
| `README.md:89` | 절 서두 — "태스크마다 구현→리뷰→수정 루프가 돌고" |
| `README.md:155` | "DEVELOP 단계에서 Superpowers는 `git worktree`를 사용해…" |
| `README.md:159~162` | 환경별 DEVELOP 동작 표 두 행 — 양쪽 다 worktree/구현 전제 |
| `README.md:187` | 규칙 주입 표의 DEVELOP 행 |
| `skills/rules-injection/SKILL.md:11, 44` | "DEVELOP 진입 시" 무조건 서술 + **"첨부 대상은 Superpowers Implementer"** — 결함 경로엔 Implementer가 없다 |
| `skills/development-principles/SKILL.md:149` | "첨부 주체: … DEVELOP 위임 컨텍스트 공통 규칙 5" 상호 참조 — 이제 태스크 목록 실행형에만 걸린다 |

↳ `docs/design/dev-workflow/workflow-lifecycle.md`도 같은 서술을 담고 있으나 **도메인 문서라 이 판에서 고치지 않는다** — 정규 경로는 `merge-to-domain`이다.

- [ ] **Step 2: CLAUDE.md를 갱신한다**

훅 설명 줄에 새 훅을 더한다:

```
- **`hooks/`** — 세션 시작 시 `workflow-orchestrator` 스킬을 자동 주입하는 bash 스크립트 + 마무리 어휘 감지 시 라우팅 지시를 주입하는 completion-nudge 훅 + **착수 어휘 감지 시 갈래 판정을 지시하는 intake-nudge 훅 (파일 미접근)** (공용 잔존 감지: `hooks/lib/detect-remnants`)
```

「Key Patterns」 절에 한 줄을 더한다:

```
- **갈래 축 (v1.22.0)**: 단계 축과 직교하는 두 번째 축. 문서 앞머리 `action:` 한 줄로 병기하고, 정의는 `skills/workflow-orchestrator/references/actions.md`에 블록 하나씩 모은다. 정본은 `[기능명].md` 앞머리, 설계 문서가 없는 구간에서는 `HANDOFF.md`가 임시 정본. 값이 없으면 `new-feature` (상세: 해당 파일 「정본 규정」)
```

- [ ] **Step 3: README에 갈래 소개를 추가한다**

「Automatic Session Start」 절 **바로 아래**에 새 절을 넣는다:

```markdown
### 작업 갈래 (v1.22.0)

요청의 성격에 따라 이후 흐름이 달라집니다. 브레인스토밍 입구에서 시드를 확인한 직후 한 번 여쭙고 확정합니다.

| 갈래 | 어떤 일인가 | 개발 단계에서 어디로 |
|---|---|---|
| 새 기능 만들기 | 없던 것을 새로 만든다 | Superpowers 구현 |
| 기존 기능 바꾸기 | 사양 자체가 달라진다 | Superpowers 구현 |
| 코드 다듬기 | 동작은 그대로 두고 구조만 손본다 | Superpowers 구현 |
| 문제 고치기 | 돌아가던 것이 안 돌아간다 | **Superpowers 디버깅** — 넘기기 전에 에러 원문·재현 절차·최근 변경을 먼저 채웁니다 |

다섯 단계(브레인스토밍 → 계획 → 개발 → 리뷰 → 마무리)는 갈래와 무관하게 전부 지나갑니다. 갈래가 정하는 것은 각 단계에서 무엇을 확정해야 끝인지, 어디로 넘기는지입니다.
```

- [ ] **Step 3-1: Task 2 리뷰가 잡은 잔존 둘을 닫는다**

계획서가 빠뜨린 곳이다. Task 2 리뷰에서 발견됐고 Task 2 브리프 범위 밖이라 여기서 처리한다.

**① `templates/seed.yaml`** (Important) — [✔ `skills/brainstorming/SKILL.md:269` · `references/templates.md:133`] 두 곳이 이 파일을 "참조"로 가리키는데 갈래 칸을 모른다.

필드 설명 목록의 `#   goal:` 줄 **바로 위**에 한 줄을 넣는다:

```
#   action: 작업 갈래 (사본 — 정본은 [기능명].md 앞머리). new-feature | spec-change | refactor | defect
```

그리고 `goal: ""` 줄 **바로 위**에 두 줄을 넣는다:

```yaml
action: new-feature
goal: ""
```

**①-2 `README.md:46`** (Important — Task 3 리뷰 이관) — 인수인계 파일을 **"Phase 진행 중 어쩔 수 없이 `/clear`해야 할 때"** 쓰는 선택 파일로 설명한다. Task 3이 규범을 뒤집고 Task 5가 성격 승인 시점에 자동 생성하게 만들었으므로, 이제는 **상시 존재하는 필수 파일**이다. 해당 줄을 새 규범에 맞게 고친다:

```
| HANDOFF.md (`/dev-workflow:save`) | 작업 갈래와 진행 국면을 담아 워크플로우 내내 유지되는 파일. 성격 승인 시 자동으로 만들어지고, 마무리에서 정리됩니다 |
```

(실제 표 형식은 그 자리의 기존 열 구성을 따를 것 — 위는 내용 기준이다.)

**② `skills/brainstorming/SKILL.md:418`** (Minor) — 「국면 4 표준 설계 문서 포맷」 Read 실패 폴백 문구에 갈래 칸이 없다.

```
(Read 실패 시 최소 요건: 10섹션 표준 — ①배경과 동기 ②목표와 비목표 ③확정된 요구사항 ④설계 개요 ⑤의존성 맵 ⑥기술 결정 및 대안 검토 ⑦제약조건과 가정 ⑧기술 가이드라인 ⑨구현 결과 및 일탈 사항 ⑩변경 이력 + frontmatter status: ready-for-plan)
```

의 `status: ready-for-plan`을 `status: ready-for-plan · action: [갈래 값, 없으면 new-feature]`로 바꾼다.

- [ ] **Step 4: 전체 검증을 돌린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
rc=0
grep -q "검증 버전: Superpowers 6.2.0" skills/workflow-orchestrator/SKILL.md || { echo "❌ 검증 버전 미정정"; rc=1; }
grep -q "^action: new-feature" templates/seed.yaml || { echo "❌ templates/seed.yaml 갈래 칸 누락"; rc=1; }
grep -q "action: \[갈래 값" skills/brainstorming/SKILL.md || { echo "❌ 폴백 문구 갈래 미언급"; rc=1; }
grep -q "6.1.1" skills/workflow-orchestrator/SKILL.md && { echo "❌ 6.1.1 잔존"; rc=1; }
grep -q "intake-nudge" CLAUDE.md || { echo "❌ CLAUDE.md 훅 미등록"; rc=1; }
grep -q "갈래 축" CLAUDE.md || { echo "❌ CLAUDE.md 패턴 미등록"; rc=1; }
grep -q "작업 갈래" README.md || { echo "❌ README 갈래 절 없음"; rc=1; }
bash tests/hooks/run-all.sh || { echo "❌ 훅 테스트 실패"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 전체 검증 통과"
exit $rc
```
Expected: `✅ 전체 검증 통과`

- [ ] **Step 5: 적용 경로 누락 0을 최종 확인한다**

확정 10의 검증 방식이다 — 새 테스트 대신 적용 경로 목록과 실제 파일을 대조한다.

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
echo "── actions.md 적용 경로 5곳 대조 ──"
rc=0
grep -q "actions.md" skills/brainstorming/SKILL.md          || { echo "❌ ① 성격 승인 화면"; rc=1; }
grep -q "actions.md" skills/brainstorming/references/templates.md || { echo "❌ ② 종료 조건"; rc=1; }
grep -q "actions.md" skills/workflow-orchestrator/SKILL.md   || { echo "❌ ③ 개발 위임"; rc=1; }
grep -q "actions.md" skills/workflow-orchestrator/bootstrap.md || { echo "❌ ③ 개발 위임(상시)"; rc=1; }
grep -q "actions.md" skills/plan-stage/SKILL.md              || { echo "❌ ④⑤ 하위 에이전트"; rc=1; }
grep -q "actions.md" skills/context-handling/SKILL.md        || { echo "❌ 세션 재개 라벨"; rc=1; }
[ "$rc" -eq 0 ] && echo "✅ 적용 경로 누락 0"
exit $rc
```
Expected: `✅ 적용 경로 누락 0`

- [ ] **Step 6: 버전을 올린다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
scripts/bump-version 1.22.0
scripts/bump-version --check
```
Expected: 두 파일 버전이 `1.22.0`으로 동시 갱신되고 `--check`가 일치를 보고

- [ ] **Step 7: 커밋**

```bash
git add README.md CLAUDE.md skills/workflow-orchestrator/SKILL.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore(release): 문서 스윕 + Superpowers 검증 버전 6.2.0 정정 + bump to 1.22.0"
```

---

## 확인 절차 (라이브 스모크)

[✔ `~/.claude/plugins/installed_plugins.json`] 실제로 도는 것은 이 워크트리가 아니라 캐시 사본이고, **마켓플레이스 소스는 `D:/02_Workspace/98_Github/dev-workflow`(main 체크아웃)**다. 그래서 위 태스크를 다 끝내도 **이 세션에서는 새 훅이 돌지 않는다.**

라이브 확인은 리뷰 통과 후 다음 순서로 한다:

1. 이 브랜치를 main에 병합하고 푸시한다 (Completion Protocol의 커밋·푸시 승인을 거친다)
2. Claude Code에서 `/plugin` → dev-workflow **Update**
3. Claude Code **재시작**
4. 새 세션에서 결함 발화로 스모크: `"랭킹에 닉네임이 안 나와"` → 성격 승인 화면이 뜨는지, 승인 후 `HANDOFF.md`에 `action: defect`가 적히는지 확인
5. 진행 중 작업이 있는 상태에서 같은 발화를 반복해 **훅이 죽지 않는지** 확인 (확정 6의 핵심 — 잔존이 있어도 울려야 한다)

## 2판으로 넘긴 것 (이 계획의 범위 밖)

- REQ-010 리뷰 확인 게이트 — [✔ `workflow-orchestrator/SKILL.md:92`] 리뷰를 언급하지 않고 마무리를 권하는 개발 완료 보고 문구와, [✔ `:308` 대 `completion-protocol.md:1~4`] 두 곳에 이중으로 있는 마무리 단계 나열까지 함께 고쳐야 한다
- REQ-019 결함 폴더 삭제 + 삭제 전 확인 — [✔ `document-consolidation/SKILL.md:93~94` · `merge-to-domain/SKILL.md:421`] **폴더를 지우는 주체가 둘이 되고 요구사항 번호까지 REQ-019로 같다.** 명문으로 풀어야 한다
- REQ-020 리팩터링 마무리 경량화
- REQ-021 방향 전환 하나의 흐름 — **재협의 미해소.** [✔ `SKILL.md:262~265` · `plan-stage/SKILL.md:268~270`] 제자리 재계획 절이 호출자 없는 고아가 된다. 그리고 [✔ `merge-to-domain` 전문 검색] 머지 스캔에 아카이브 제외 규칙이 없어 비목표의 근거가 절반만 사실이다
- REQ-022 `/finish`의 갈래 인지 · REQ-023 도메인 머지된 기능의 후속
- status만 보는 하류 셋(`merge-to-domain:54` · `context-handling:164` · `design-doc-index` 색인 2순위)에 갈래 인지 추가
