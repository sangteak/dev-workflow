# prose-icon-placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아이콘을 줄 첫머리의 강조로만 남기고 설명 문장 안에서 낱말을 대신하지 못하게 한다. 조사 결과 화면의 이름표 되풀이를 템플릿 모양으로 없애고, 이어 쓰던 세션에 옛 화면이 남아 있어도 새 규범이 이기게 한다.

**Architecture:** 규범 층(언어 규범 펜스 하나), 템플릿 층(plan-stage 하나), 검사 층(사후 검사 스크립트와 잔존과 도착 검사) 셋을 고친다. 펜스는 실행 시점에 워커 프롬프트로 복제되므로 별도 전파 작업이 없다. 규범 정본 자신이 백틱 대상을 갖고 있어 규칙과 스윕을 같은 커밋에 묶는다.

**Tech Stack:** Markdown, bash(Git Bash), Node 18+, git grep.

**Spec:** `docs/design/dev-workflow/prose-icon-placement/prose-icon-placement.md` (REQ-001~011, 8절 기술 가이드라인). 보조: `phase3_validation.md`.

## Global Constraints

- 언어 규범을 모든 새 문장에 적용한다 — 가운뎃점(·) 금지, 절 기호 금지, 슬래시로 잇지 않기, 저장소에 없는 낱말로 이름 짓지 않기
- 아이콘은 줄 첫머리와 이름표에서 맨몸으로 쓰고, 문장 속에서 홀로 서면 백틱으로 감싸거나 낱말로 바꾼다. 낱말과 괄호로 병기한 자리(`확인 아이콘(✔️)이`, `가운뎃점(·)을`)는 대상이 아니다
- 판정 이름표(✅ FEASIBLE, ⚠️ CAUTION, 🚫 RENEGOTIATE)와 확인 아이콘의 뜻과 자리는 그대로 둔다. 검증 규범의 이름표 문장도 고치지 않는다
- 상시 주입본 `skills/workflow-orchestrator/bootstrap.md`는 이번에 고치지 않는다
- 이모지 검사는 바이트 패턴으로 조립한다 — ✔️는 `$'\xe2\x9c\x94\xef\xb8\x8f'`, ⚠️는 `$'\xe2\x9a\xa0\xef\xb8\x8f'`. `tests/hooks/test-restatements.sh`는 파일 머리에서 `export LC_ALL=C`를 이미 하고 있다
- 커밋 메시지는 Conventional Commits, 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. 푸시하지 않는다. `git stash`를 쓰지 않는다
- 각 태스크 끝에 `bash tests/hooks/run-all.sh`가 FAIL 없이 통과해야 한다
- phase 파일과 `docs/design/**/evidence/`, `_archive/`는 수정하지 않는다
- 이 plan의 태스크에 없는 파일을 고치지 않는다. 범위 밖 발견은 `tasks/lessons.md`에 한 줄로 적어 후속으로 넘긴다

**공유 정의:**

- 홀로 선 아이콘 판별: 아이콘 바로 앞이 백틱이나 여는 괄호가 아니고 뒤에 조사(를, 을, 가, 이, 는, 은, 로, 으, 와, 과, 의, 도, 만, 에)가 바로 붙은 자리
- 판별 정규식(Node): `/(?<![(`（])[✔✅⚠❌🚫]\uFE0F?(?=[를을가이는은로으와과의도만에])/`
- 새 규범 문장(REQ-001):
  ```
  - 아이콘은 줄 첫머리와 이름표에서만 맨몸으로 쓴다 — 이름표(`✔️ 확인된 사실:`), 불릿 머리(`- ✔️`), 판정 이름표(`⚠️ CAUTION`)가 그 자리다. 설명 문장 안에서 아이콘이 낱말을 대신하지 않는다 — 판정은 주의, 통과와 재협의로, 확인 상태는 확인됨과 확인 못 함으로 쓴다. 문장 속에서 아이콘 자체를 가리켜야 하면 백틱으로 감싼다 (예: `✔️`는 확인된 사실을 뜻한다). 낱말과 괄호로 병기한 자리(확인 아이콘(✔️)이, 가운뎃점(·)을)는 낱말이 앞에 있어 대상이 아니다
  ```
- 워커 구획 머리 문장(REQ-002): `- 앞 화면의 모양이 아니라 이 구획의 규범을 따른다 — 이어 쓰던 세션의 옛 화면을 본으로 삼지 않는다`

---

### Task 1: 언어 규범 펜스와 백틱 스윕

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (펜스에 두 줄 추가, 홀로 선 아이콘 자리)
- Modify: `skills/workflow-orchestrator/references/grounding.md` (홀로 선 아이콘 자리, 고지 문구)
- Modify: `skills/brainstorming/SKILL.md` (홀로 선 아이콘 자리)
- Modify: `tests/hooks/test-restatements.sh` (도착 검사 추가)

**Interfaces:**
- Produces: 새 규범 문장과 워커 구획 머리 문장 — Task 2의 템플릿과 Task 3의 검사가 이 문장을 가리킨다

- [ ] **Step 1: 대상을 다시 센다**

Run:
```bash
cd "C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah"
python - <<'PYEOF'
import re,glob
pat=re.compile(r"(?<![(`（])[✔✅⚠❌🚫]\uFE0F?(?=[를을가이는은로으와과의도만에])")
for p in glob.glob("skills/**/*.md",recursive=True)+["README.md","CLAUDE.md"]:
    t=open(p,encoding="utf-8").read()
    for i,l in enumerate(t.split("\n"),1):
        for m in pat.finditer(l):
            if l[:m.start()].count("`")%2==1: continue
            print(f"{p}:{i}: {l.strip()[:100]}")
PYEOF
```
Expected: 12건 9행 3파일 안팎. 목록을 적어 두고 아래 Step 3의 대상으로 쓴다. 숫자가 다르면 그 목록이 정본이다

- [ ] **Step 2: 도착 검사를 먼저 적는다 (실패 확인)**

`tests/hooks/test-restatements.sh`의 마지막 `arrival` 호출 아래, `exit "$rc"` 바로 앞에 더한다:

```bash
# prose-icon-placement (REQ-001, REQ-002, REQ-009)
arrival '아이콘은 줄 첫머리와 이름표에서만 맨몸으로 쓴다' skills/workflow-orchestrator/decision-flow.md
arrival '앞 화면의 모양이 아니라 이 구획의 규범을 따른다' skills/workflow-orchestrator/decision-flow.md
arrival '확인된 사실을 뜻한다' skills/workflow-orchestrator/decision-flow.md
```

Run: `bash tests/hooks/test-restatements.sh`
Expected: 새 셋이 0건으로 실패

- [ ] **Step 3: 펜스에 두 줄을 더한다**

`skills/workflow-orchestrator/decision-flow.md`에서 `📣 언어 규범 — 모든 사용자 대면 문면과 페르소나 발언에 적용` 줄 바로 다음에 워커 구획 머리 문장을 넣는다 (공유 정의의 REQ-002 문장). 그리고 펜스의 마지막 줄(`- 가운뎃점(·)을 쓰지 않는다 — …`) 다음에 새 규범 문장을 넣는다 (공유 정의의 REQ-001 문장).

- [ ] **Step 4: 홀로 선 아이콘 자리를 고친다**

Step 1 목록의 각 자리에서 아이콘을 백틱으로 감싸거나 낱말로 바꾼다. 어느 쪽인지는 문장이 정한다 — 아이콘의 모양 자체를 말하는 자리면 백틱, 뜻을 말하는 자리면 낱말이 자연스럽다. 아래는 확인된 자리와 권하는 고침이다.

- `decision-flow.md`의 `확인 아이콘(✔️)이 한 줄도 없으면 … 이름표 자리면 이름표의 ✔️로 센다` — 앞의 괄호 병기는 그대로 두고 뒤의 `이름표의 ✔️로 센다`를 `` 이름표의 `✔️`로 센다 ``로
- `decision-flow.md`의 `**근거 첨부 의무:** ✔️에는 대조 가능한 증거가 있어야 한다` → `**근거 첨부 의무:** 확인된 사실에는 대조 가능한 증거가 있어야 한다`
- `decision-flow.md`의 `- 규약: 화면에 도달한 ✔️ = 본체 관문 통과. 세션에서 ✔️가 처음 화면에 나올 때 1회 고지한다` → `- 규약: 화면에 도달한 확인 아이콘은 본체 관문을 통과했다는 뜻이다. 세션에서 처음 나올 때 1회 고지한다`
- `decision-flow.md`의 `외부 출처 축 전체가 ⚠️로 강등된다` → `외부 출처 축 전체가 확인 못 함으로 강등된다`
- `decision-flow.md` 500행 부근과 506행 부근의 홀로 선 자리도 같은 방식으로 — Step 1 목록이 정본
- `grounding.md`의 반환 규격 서술에서 홀로 선 자리 — 백틱 또는 낱말
- `brainstorming/SKILL.md`의 `✔️와 ⚠️ 아이콘으로 확인 여부 표시` → `확인 아이콘으로 확인 여부 표시`

- [ ] **Step 5: 고지 문구를 낱말 병기로 다시 쓴다**

`grounding.md` 「고지 문구 실물」의 첫 항목을 아래로 바꾼다 (통짜 백틱 안이라 중첩 백틱을 피하고 낱말을 앞에 둔다):

```markdown
- 확인 아이콘 세션 최초 출현 시 (1회): `ℹ️ 표시 안내: 확인 아이콘 ✔️는 셈이나 저장소나 공식 문서로 확인한 사실, 확인 못 함 ⚠️는 판단이 필요한 것입니다. 근거는 "출처 보여줘"로 펼칩니다.`
```

같은 파일의 강등 고지 항목 머리 `- ✔️ 강등 고지:`도 `- 확인 아이콘 강등 고지:`로 바꾼다.

- [ ] **Step 6: 요약 사본 셋을 눈으로 본다**

Run: `LC_ALL=C grep -n "언어 규범" skills/workflow-orchestrator/SKILL.md skills/brainstorming/SKILL.md | head`
그 줄들과 `skills/brainstorming/references/templates.md`의 언어 규범 요약 자리를 열어 홀로 선 아이콘이 있는지 본다. 있으면 Step 4와 같이 고치고, 없으면 그대로 둔다. 상시 주입본은 고치지 않는다.

- [ ] **Step 7: 검사**

Run: `bash tests/hooks/test-restatements.sh && bash tests/hooks/run-all.sh`
Expected: Step 2의 도착 셋 통과, 기존 검사 전부 통과. 특히 `확인 아이콘(✔️)이 한 줄도 없으면` 도착 검사가 여전히 통과해야 한다 (괄호 병기라 안 고쳤으므로)

Run: Step 1의 명령을 다시 돌린다
Expected: 0건 (고지 문구와 괄호 병기는 판별에서 빠짐)

- [ ] **Step 8: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/references/grounding.md skills/brainstorming/SKILL.md tests/hooks/test-restatements.sh
git commit -m "feat(decision-flow): 아이콘은 줄 첫머리와 이름표에만 — 설명 문장의 낱말 대체 금지와 앞 화면 모양 금지, 홀로 선 아이콘 스윕

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: plan-stage 템플릿 셋

**Files:**
- Modify: `skills/plan-stage/SKILL.md` (판정 프롬프트 지시, 판정 출력 형식, 종합 판정 줄, Researcher 조사 결과 템플릿)
- Modify: `tests/hooks/test-restatements.sh` (도착 검사 추가)

**Interfaces:**
- Consumes: Task 1의 규범 문장
- Produces: Researcher 조사 결과 템플릿의 새 모양 — Task 3의 이름표 되풀이 검사가 이 모양을 실측 대상으로 쓴다

- [ ] **Step 1: 도착 검사를 적는다 (실패 확인)**

Task 1이 더한 절 아래에:

```bash
arrival '불릿에는 아이콘을 붙이지 않는다' skills/plan-stage/SKILL.md
arrival '종합 판정: ⚠️ CAUTION' skills/plan-stage/SKILL.md
```

Run: `bash tests/hooks/test-restatements.sh`
Expected: 둘이 0건으로 실패

- [ ] **Step 2: 판정 출력 형식과 종합 판정 줄**

`skills/plan-stage/SKILL.md`의 판정 출력 형식 블록에서 종합 판정 줄을 바꾼다:

```
[요구사항명]
  [페르소나A]: [판정 아이콘과 낱말] — [근거 1~2문장]
  [페르소나B]: [판정 아이콘과 낱말] — [근거 1~2문장]
  [페르소나C]: [판정 아이콘과 낱말] — [근거 1~2문장]
  → 종합 판정: ⚠️ CAUTION (셋 중 하나를 아이콘과 낱말로 함께 쓴다)
```

- [ ] **Step 3: 판정 프롬프트 지시**

같은 파일의 판정 프롬프트 구성 줄에서 `[정형 형식: 요구사항별 판정 + 근거 1~2문장]`을 `[정형 형식: 요구사항별 판정 — 판정은 아이콘과 낱말을 함께 쓰고(예: ⚠️ CAUTION) 그 뒤에 근거 1~2문장. 대괄호 태그를 쓰지 않는다]`로 바꾼다.

- [ ] **Step 4: Researcher 조사 결과 템플릿**

같은 파일의 조사 결과 화면 블록에서 확인된 사실 칸을 바꾼다:

```
── 🔍 제약 조건 조사 결과 [Researcher] ───────────────
[CAUTION/RENEGOTIATE 항목명]:
  ✔️ 확인된 사실:
  - [사실 1줄]
  - [사실 1줄]
  우회 가능성: [있음/없음] — [설명]
  유사 패턴: [발견/미발견] — [설명]
  결론: [FEASIBLE로 상향 가능 / CAUTION 유지 / RENEGOTIATE 유지]
──────────────────────────────────────────────────────
```

블록 아래에 한 줄을 더한다: `확인된 사실이 하나뿐이어도 이름표 뒤에 개행하고 불릿으로 쓴다. 불릿에는 아이콘을 붙이지 않는다 — 이름표에 이미 있다.`

- [ ] **Step 5: 검사와 커밋**

Run: `bash tests/hooks/test-restatements.sh && bash tests/hooks/run-all.sh`
Expected: 전부 통과

```bash
git add skills/plan-stage/SKILL.md tests/hooks/test-restatements.sh
git commit -m "feat(plan-stage): 판정은 아이콘과 낱말 병기, 조사 결과의 확인된 사실 칸은 이름표 한 번과 불릿

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: 사후 검사 두 패턴

**Files:**
- Modify: `scripts/transcript-sources.mjs`
- Modify: `tests/fixtures/transcript-sources/old-shape.jsonl`, `tests/fixtures/transcript-sources/new-shape.jsonl`
- Modify: `tests/hooks/test-transcript-sources.sh`

**Interfaces:**
- Consumes: Task 1의 판별 규칙, Task 2의 조사 결과 템플릿 모양
- Produces: `--- assistant 줄 N, main 위반 M (…, 홀로 선 아이콘 d), 이름표 되풀이 R(보고만), worker 위반 W(보고만), 제외 줄 E` 요약 줄

- [ ] **Step 1: 표본에 줄을 더한다 (실패 확인)**

`tests/fixtures/transcript-sources/old-shape.jsonl`의 assistant text에 홀로 선 아이콘 줄 하나를 더한다 (기존 텍스트 끝에 `\n- REQ-006에 ⚠️를 준 이유는 절차 길이입니다.`를 잇는다).

`tests/fixtures/transcript-sources/new-shape.jsonl`의 첫 블록 텍스트에 정상 줄 둘을 더한다:
```
\n✔️ 확인된 사실:\n- 판정 규칙은 셀 수 있는 조건만 쓴다고 정해 둔다\n\n`⚠️`는 확인 못 했다는 뜻입니다.
```

`tests/hooks/test-transcript-sources.sh`의 old-shape 검사에 한 줄을 더한다:
```bash
if ! grep -q "홀로 선 아이콘 1" "$out"; then echo "   FAIL: 홀로 선 아이콘 1건이어야 한다"; rc=1; fi
```
그리고 old-shape의 `assistant 줄` 기대 숫자를 늘어난 줄 수로 고친다. new-shape 검사에는 `이름표 되풀이 0`을 확인하는 줄을 더한다.

Run: `bash tests/hooks/test-transcript-sources.sh`
Expected: FAIL — 요약 줄에 새 항목이 없다

- [ ] **Step 2: 스크립트에 패턴 둘을 더한다**

`scripts/transcript-sources.mjs`의 정규식 선언부에 더한다:

```js
const BARE_ICON = /(?<![(`（])[✔✅⚠❌🚫]\uFE0F?(?=[를을가이는은로으와과의도만에])/;  // 홀로 선 아이콘 — 낱말 병기와 백틱은 뺀다
const LABEL_LINE = /^\s*([✔⚠]\uFE0F?)\s+\S.*:\s*$/;                                  // 이름표 줄 (콜론으로 끝남)
const SUB_BULLET = /^\s*(?:-|\d+\.)\s*([✔⚠]\uFE0F?)/;                                 // 이름표 아래 불릿에 아이콘이 다시 붙음
```

세는 쪽에 상태 둘을 더한다. 텍스트 블록마다 `labelIcon`을 null로 시작하고, 빈 줄이나 새 이름표를 만나면 리셋한다. 이름표가 선 뒤의 불릿에 같은 아이콘이 붙으면 `repeat`를 늘린다. 홀로 선 아이콘은 기존 위반 종류에 `icon`을 더해 main 출처일 때 종료 코드에 넣는다. 되풀이는 세되 종료 코드에 넣지 않는다.

요약 줄에 두 숫자를 더한다 — `홀로 선 아이콘 ${bad.icon}`을 main 위반 괄호 안에, `이름표 되풀이 ${repeat}(보고만)`을 따로.

머리 주석에 한 줄을 더한다: `홀로 선 아이콘은 종료 코드에 들어가고, 이름표 되풀이는 항목 경계를 빈 줄로 잡는 근사치라 숫자만 보고한다.`

- [ ] **Step 3: 검사**

Run: `bash tests/hooks/test-transcript-sources.sh`
Expected: PASS. old-shape는 종료 1이고 요약에 `홀로 선 아이콘 1`, new-shape는 종료 0이고 `이름표 되풀이 0`

Run: `bash tests/hooks/run-all.sh`
Expected: 전부 통과

- [ ] **Step 4: 이 세션 기록으로 잡음을 실측한다**

Run: `node scripts/transcript-sources.mjs "C:/Users/sangtakeg/.claude/projects/C--Users-sangtakeg-orca-workspaces-dev-workflow-opah/fc636680-9859-46ff-aa34-66aab1d533c0.jsonl" | tail -1`
Expected: 마지막 줄이 나온다. 그 줄을 설계 문서 9절에 "개발 세션 잡음 실측" 한 문장으로 적는다 (개발 세션이라 위반 다수가 정상)

- [ ] **Step 5: 커밋**

```bash
git add scripts/transcript-sources.mjs tests/fixtures/transcript-sources tests/hooks/test-transcript-sources.sh docs/design/dev-workflow/prose-icon-placement/prose-icon-placement.md
git commit -m "feat(scripts): 사후 검사에 홀로 선 아이콘과 이름표 되풀이 — 아이콘은 종료 코드, 되풀이는 보고만

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: 잔존 검사, 릴리스와 실사용 표

**Files:**
- Modify: `tests/hooks/test-restatements.sh` (잔존 검사)
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (스크립트 경유)
- Modify: `docs/design/dev-workflow/prose-icon-placement/prose-icon-placement.md` (9절)

**Interfaces:**
- Consumes: Task 1~3의 결과

- [ ] **Step 1: 잔존 검사를 더한다**

Task 2가 더한 도착 검사 아래에, 홀로 선 아이콘 잔존을 세는 검사를 더한다. `residue`는 `grep -cE`라 룩비하인드를 못 쓰므로, 백틱과 여는 괄호를 제외한 문자 클래스로 쓴다:

```bash
# prose-icon-placement 잔존 — 홀로 선 아이콘 (백틱과 괄호 병기는 뺀다)
bareicon=$'[^`(（]'$'\xe2\x9c\x94\xef\xb8\x8f''[를을가이는은로으와과의도만에]'
residue "$bareicon" \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/references/grounding.md \
  skills/brainstorming/SKILL.md \
  skills/plan-stage/SKILL.md
```

Run: `bash tests/hooks/test-restatements.sh`
Expected: 0건 통과 (Task 1에서 이미 스윕했으므로). 걸리는 것이 있으면 Task 1이 놓친 자리이니 같은 방식으로 고친다

- [ ] **Step 2: 릴리스**

Run: `scripts/bump-version 1.28.1 && scripts/bump-version --check`
Expected: 두 파일 모두 1.28.1, `--check` OK

- [ ] **Step 3: 9절에 실사용 표와 절차를 적는다**

설계 문서 9절에 평문 문단과 표를 더한다 (불릿 금지).

```markdown
| 확인 항목 | 판정 방법 | 결과 |
|---|---|---|
| 판정 발언에 대괄호 태그가 없고 판정이 아이콘과 낱말로 함께 나온다 | 눈 | 미완료 |
| 조사 결과 화면에서 확인된 사실 이름표가 항목당 한 번만 나온다 | 눈 | 미완료 |
| 결정 박스와 요약 문단의 설명에 아이콘이 낱말을 대신하지 않는다 | 눈 | 미완료 |
| 세션 첫 고지가 낱말 병기 모양으로 나온다 | 눈 | 미완료 |
| `node scripts/transcript-sources.mjs <세션 jsonl>` 종료 코드 0 | 스크립트 | 미완료 |
```

절차 문단: `/plugin`에서 dev-workflow Update 뒤 재시작하고, 새 세션과 이어 쓰던 세션에서 각각 브레인스토밍이나 PLAN 한 바퀴를 돌린다. 주의 판정이 나올 요구사항을 의도적으로 넣어 판정 화면과 조사 결과 화면을 만든다. 백틱이 터미널에서 어떻게 보이는지도 함께 본다. 이 한 바퀴는 미푸시 릴리스 여섯의 실사용 확인을 겸하지만, 실패하면 어느 릴리스 탓인지 증상으로 가려야 한다.

- [ ] **Step 4: 전체 검사와 커밋**

Run: `bash tests/hooks/run-all.sh && scripts/bump-version --check`
Expected: 전부 통과, 1.28.1 일치

```bash
git add tests/hooks/test-restatements.sh .claude-plugin/plugin.json .claude-plugin/marketplace.json docs/design/dev-workflow/prose-icon-placement/prose-icon-placement.md
git commit -m "chore(release): 1.28.1

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-Review

- 스펙 대조: REQ-001(T1 Step 3), REQ-002(T1 Step 3), REQ-003(T2 Step 2), REQ-004(T2 Step 2와 3), REQ-005(T2 Step 4), REQ-006(T1 Step 1과 4와 5와 6), REQ-007(T1 Step 7의 도착 검사 확인), REQ-008(T3), REQ-009(T1 Step 2, T2 Step 1, T4 Step 1), REQ-010(T4 Step 3), REQ-011(T4 Step 2)
- 자리 표시 검사: "적절히"나 "비슷하게" 없음. 편집 자리마다 원문과 새 문장을 적었다
- 이름 일관성: 판별 정규식이 T1 Step 1과 T3 Step 2에서 같다. 새 규범 문장이 T1 Step 3과 도착 검사에서 같다
- 위험: T1 Step 4의 자리 목록은 Step 1의 실측이 정본이다 — 행 번호가 아니라 인용한 원문으로 찾는다
