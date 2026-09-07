# question-numbering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 답의 후보가 닫힌 질문이 번호 선택지 없이 나가는 것을 막는다 — 세는 술어를 행위 지시로 바꾸고, 개방형을 기본값으로 밀어 주던 조항과 그 판정을 검사에서 빼 주던 조항을 걷어내고, 화면 본보기와 상시 주입 자리에 번호가 놓일 자리를 만든다.

**Architecture:** 세는 자리를 둘로 나눈다. 페르소나 서브에이전트 프롬프트가 「답의 후보」를 채워 반환하고, 본체는 그 칸이 비었거나 직접 쓴 질문일 때만 센다. 여기에 기본값 뒤집기, 면제 조항 제거, 0번 탈출구 상시 부착, 화면 본보기의 번호 줄, 상시 주입 자리의 규칙을 함께 건다.

**Tech Stack:** Markdown 규범 문서 (`skills/` 아래), bash 검사 스크립트 (`scripts/`), grep 기반 검증.

**Spec:** `docs/design/dev-workflow/question-numbering/question-numbering.md`

## Global Constraints

- 범위는 질문 트랙이다. 흔적이 안 남는 다른 판정 단계 전반(조립 전 조건·적용 등급 판정)은 대상이 아니다
- 세는 단계는 조건 없이 항상 돈다 — 먼저 통과해야 할 판단 관문을 두지 않는다
- 조항 수를 늘리지 않는다. 있는 문장을 고쳐 쓰고 하나를 지운다. REQ-019(재서술 목록 검사 스크립트)는 조항이 아니라 도구다
- `skills/brainstorming/references/agent-roles.md`는 첫 줄에 "문장 수정 금지"가 박힌 외부 정의 사본이다. 절대 수정하지 않는다
- 훅이나 MCP 도구로 강제하지 않는다
- 언어 규범을 지킨다 — 독자는 주니어와 시니어 사이의 개발자, 줄임말 금지, 절 기호 금지, 슬래시로 목록 잇기 금지
- 릴리스 버전은 **1.26.0**이다
- 각 태스크의 커밋은 워크트리 안의 체크포인트다. main 머지와 푸시는 마무리 시퀀스에서 따로 확인받는다

---

### Task 1: 세는 술어를 행위 지시로 바꾸고 개방형 기본값을 뒤집는다 (REQ-001, REQ-002)

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md:245` (조립 전 갈림 두 번째)
- Modify: `skills/workflow-orchestrator/decision-flow.md:440` (질문형 스켈레톤 아래 기본값 문장)

**Interfaces:**
- Produces: 새 술어 문면 — `답의 후보를 적어 본다. 두 줄 이상 적히면 번호를 붙인다`. Task 5가 이 문면을 사본 다섯 자리에 복제한다. Task 6이 같은 뜻을 한 줄로 줄여 `bootstrap.md`에 넣는다.

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `grep -c "답의 후보를 셀 수 있는가" skills/workflow-orchestrator/decision-flow.md && grep -c "탐색적 질문은 대개 개방형이다" skills/workflow-orchestrator/decision-flow.md`
Expected: 각각 `1` — 옛 문면이 있는 상태

- [ ] **Step 2: 245번째 줄의 술어를 바꾼다**

지금 문장:
```
  2. **답의 후보를 셀 수 있는가.** 두세 개로 셀 수 있으면 닫힌 집합이므로 번호 선택지를 붙인다 (3부 「출력 스켈레톤」의 질문형). 못 세면 개방형 그대로 둔다
```

바꾼 뒤:
```
  2. **답의 후보를 적어 본다.** 질문마다 답의 후보를 줄 단위로 적는다. 두 줄 이상 적히면 그 줄들이 번호 선택지가 된다 (3부 「출력 스켈레톤」의 질문형). 한 줄 이하로 적히면 개방형으로 둔다. 적는 것이 먼저이고 적어 본 결과가 판정이다 — 셀 수 있는지를 묻지 않는다
```

- [ ] **Step 3: 440번째 줄의 기본값을 뒤집는다**

지금 문장:
```
탐색적 질문은 대개 개방형이다 — 번호 선택지 없이 `**배경/힌트:**` 뒤에 질문 본문으로 끝나도 스켈레톤 충족으로 본다. 번호 선택지는 답이 닫힌 집합일 때만 붙인다.
```

바꾼 뒤:
```
질문을 내보내기 전에 답의 후보를 적어 본다. 두 줄 이상 적히면 그 줄들이 번호 선택지가 된다. 한 줄 이하로 적힐 때만 개방형으로 두며, 그때는 번호 선택지 없이 `**배경/힌트:**` 뒤에 질문 본문으로 끝나도 스켈레톤 충족으로 본다.
```

- [ ] **Step 4: 변경 후 상태를 확인한다**

Run: `grep -c "답의 후보를 셀 수 있는가\|탐색적 질문은 대개 개방형이다" skills/workflow-orchestrator/decision-flow.md; grep -c "답의 후보를 적어 본다" skills/workflow-orchestrator/decision-flow.md`
Expected: 첫 줄 `0`, 둘째 줄 `2` — 옛 문면이 사라지고 새 문면이 두 자리에 있음

- [ ] **Step 5: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-flow): 세는 술어를 행위 지시로 바꾸고 개방형 기본값을 뒤집는다"
```

---

### Task 2: 면제 조항을 지우고 검사의 대상 정의로 옮긴다 (REQ-003)

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md:427` (「내보내기 전 검사」 적용 밖 목록)
- Modify: `skills/workflow-orchestrator/decision-flow.md` 검사 1번 대상 서술 줄 (412행 부근)
- Modify: `skills/workflow-orchestrator/decision-flow.md` 검사 2번 「적용 자리」 줄 (418행 부근)

**Interfaces:**
- Consumes: Task 1이 확정한 새 술어 — 면제 조건이 그 술어의 결과("한 줄 이하")를 가리키지 않고 화면 상태("선택지가 붙은 질문")를 가리키게 된다
- Produces: 적용 밖 목록이 넷에서 셋으로 줄고 번호가 ①②③이 된다. Task 11이 `ux-consistency.md:203`의 사본을 같은 번호로 맞춘다

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `grep -c "선택지 없는\*\* 탐색적 질문\|선택지 없는 탐색적 질문" skills/workflow-orchestrator/decision-flow.md`
Expected: `1` 이상 — 면제 조항이 있는 상태

- [ ] **Step 2: 적용 밖 목록에서 두 번째 항목을 뺀다**

지금 문장(427행):
```
**적용 밖 (검증 기준 — 누락 0):** ① 로컬 템플릿 결정 — **설명 블록 요구만 면제.** 검사는 각 항목의 「적용 자리」를 따른다 (본 문서 「로컬 템플릿 우선」) ② **선택지 없는** 탐색적 질문 (2부 「질문 규칙」 — 대조할 선택지가 없다). 번호 선택지가 붙은 질문은 1번(선택지 낱말)과 2번(결과 줄)의 대상이며, 대조 상대는 질문 제목과 「배경/힌트」다 (아래 「칸이 없는 화면의 대조 상대」) ③ 진행 모드 '한꺼번에'와 '알아서' (항목별로 박스를 내지 않는다) ④ 선택지 생략 화이트리스트가 발동한 지점 (박스 자체가 없다)
```

바꾼 뒤:
```
**적용 밖 (검증 기준 — 누락 0):** ① 로컬 템플릿 결정 — **설명 블록 요구만 면제.** 검사는 각 항목의 「적용 자리」를 따른다 (본 문서 「로컬 템플릿 우선」) ② 진행 모드 '한꺼번에'와 '알아서' (항목별로 박스를 내지 않는다) ③ 선택지 생략 화이트리스트가 발동한 지점 (박스 자체가 없다)
```

개방형 질문은 여기서 빼지 않는다. 검사 1번과 2번의 대상이 「선택지가 붙은 화면」으로 적히므로 규칙이 애초에 안 닿는다.

- [ ] **Step 3: 검사 1번의 대상 서술 줄을 고친다**

지금 문장:
```
   - **판정형·지도형 판정형 자리는 이 검사의 대상이 아니다** — 선택지 이름이 「진행」·「의견 있음」으로 고정이라 박스 본문과 대조할 것이 없다. 판정 문장과 근거 줄이 그 자리를 대신한다 (3번의 같은 예외와 짝을 이룬다). 지도형의 후보 이름은 선택지가 아니라 지도이므로 역시 대상이 아니다
```

바꾼 뒤:
```
   - **대상은 선택지가 붙은 화면이다.** 번호 선택지가 없는 개방형 질문은 대조할 선택지 이름이 없어 이 검사가 닿지 않는다 — 면제로 빼는 것이 아니라 규칙이 그 화면에 미치지 않는다. 그리고 **판정형·지도형 판정형 자리도 대상이 아니다** — 선택지 이름이 「진행」·「의견 있음」으로 고정이라 박스 본문과 대조할 것이 없다. 판정 문장과 근거 줄이 그 자리를 대신한다 (3번의 같은 예외와 짝을 이룬다). 지도형의 후보 이름은 선택지가 아니라 지도이므로 역시 대상이 아니다
```

- [ ] **Step 4: 검사 2번의 「적용 자리」 줄을 고친다**

지금 문장:
```
   - **적용 자리:** 메뉴형 자리 전부
```

바꾼 뒤:
```
   - **적용 자리:** 메뉴형 자리 전부. **대상은 선택지가 붙은 화면이다** — 번호 선택지가 없는 개방형 질문에는 대조할 결과 줄 자체가 없어 이 검사가 닿지 않는다
```

- [ ] **Step 5: 변경 후 상태를 확인한다**

Run: `grep -c "선택지 없는 탐색적 질문" skills/workflow-orchestrator/decision-flow.md; grep -c "대상은 선택지가 붙은 화면이다" skills/workflow-orchestrator/decision-flow.md; grep -o "① 로컬 템플릿 결정.*③ 선택지 생략 화이트리스트" skills/workflow-orchestrator/decision-flow.md | wc -l`
Expected: 차례로 `0`, `2`, `1` — 면제 조항이 사라지고 대상 서술이 두 자리에 생기고 목록이 셋으로 재정렬됨

- [ ] **Step 6: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-flow): 면제 조항을 지우고 검사의 대상 정의로 옮긴다"
```

---

### Task 3: 탐색적 질문에 0번 탈출구를 늘 붙인다 (REQ-006)

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md:429` (질문형 스켈레톤 머리말과 펜스)
- Modify: `skills/workflow-orchestrator/SKILL.md:368` (닫힌 선택 블록의 0번 조건)
- Modify: `skills/workflow-orchestrator/SKILL.md:414` (공통 규칙의 0번 조건)

**Interfaces:**
- Produces: 질문형 스켈레톤이 0번 줄을 늘 갖는 모양. Task 4가 `templates.md`의 출력 형식 펜스에 같은 줄을 넣는다

`decision-flow.md:387`은 **결정형** 스켈레톤 안의 줄이므로 건드리지 않는다. 결정 박스의 0번 조건은 지금 그대로 "필요 시에만"이다.

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `sed -n '429p' skills/workflow-orchestrator/decision-flow.md; grep -n "자유 입력 탈출구 필요 시에만\|자유 입력 탈출구가 필요한 경우" skills/workflow-orchestrator/SKILL.md`
Expected: 429행이 `질문형 (첫 줄이 다르고, 💡 추천·0번 줄은 해당할 때만):`이고, `SKILL.md`에 조건 줄 둘이 나옴

- [ ] **Step 2: 질문형 스켈레톤 머리말과 펜스를 고친다**

지금:
```
질문형 (첫 줄이 다르고, 💡 추천·0번 줄은 해당할 때만):

​```
❓ 질문 [N]/[M] : [제목]

**배경:** [1-2문장]

1. [선택지] — 고르면: [결과 1줄]
2. [선택지] — 고르면: [결과 1줄]
​```
```

바꾼 뒤:
```
질문형 (첫 줄이 다르고, 💡 추천은 해당할 때만. **0번 탈출구는 탐색적 질문에 늘 붙인다** — 결정 박스의 "필요 시에만"과 다르다):

​```
❓ 질문 [N]/[M] : [제목]

**배경:** [1-2문장]

1. [선택지] — 고르면: [결과 1줄]
2. [선택지] — 고르면: [결과 1줄]
0. 이 중에 없음 — 자유롭게 말씀해주세요
​```
```

- [ ] **Step 3: `SKILL.md`의 0번 조건 사본 둘을 맞춘다**

`SKILL.md:368`의 닫힌 선택 블록 주석:
```
0. [탈출 레이블]          ← 자유 입력 탈출구 필요 시에만 추가, 항상 마지막
```
바꾼 뒤:
```
0. [탈출 레이블]          ← 항상 마지막. 탐색적 질문에는 늘 붙이고, 결정 박스에는 자유 입력 탈출구가 필요할 때만 붙인다
```

`SKILL.md:414`의 공통 규칙 줄:
```
- 0번은 닫힌 선택에서 자유 입력 탈출구가 필요한 경우에만 추가한다. 항상 목록 마지막에 배치하며, 레이블은 맥락에 맞게 변경할 수 있다
```
바꾼 뒤:
```
- 0번은 항상 목록 마지막에 배치하며 레이블은 맥락에 맞게 변경할 수 있다. **탐색적 질문에는 늘 붙인다.** 결정 박스에서는 자유 입력 탈출구가 필요한 경우에만 붙인다
```

- [ ] **Step 4: 변경 후 상태를 확인한다**

Run: `grep -c "탐색적 질문에는 늘 붙인다\|탐색적 질문에 늘 붙인다" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md; grep -c "이 중에 없음 — 자유롭게 말씀해주세요" skills/workflow-orchestrator/decision-flow.md`
Expected: `decision-flow.md` 1건, `SKILL.md` 2건, 그리고 0번 줄 1건

- [ ] **Step 5: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md
git commit -m "feat(decision-flow): 탐색적 질문에 0번 탈출구를 늘 붙인다"
```

---

### Task 4: 페르소나 반환 규격에 「답의 후보」 칸을 두고 화면 본보기에 번호 줄을 놓는다 (REQ-004, REQ-017)

**Files:**
- Modify: `skills/brainstorming/references/templates.md` 「Step A-0 Ontologist 프롬프트」 펜스 (9~28행)와 그 출력 형식 펜스 (30~38행)
- Modify: `skills/brainstorming/references/templates.md` 「Step A Socratic 프롬프트」 펜스 (46~65행)와 그 출력 형식 펜스 (67~77행)

**Interfaces:**
- Consumes: Task 1의 새 술어, Task 3의 0번 줄 모양
- Produces: 반환 형식 `답의 후보:` 블록과 화면 본보기의 조건부 번호 줄. 이 둘이 짝이다 — 반환물의 후보 줄이 본보기의 번호 줄로 옮겨 간다

`skills/brainstorming/references/agent-roles.md`는 건드리지 않는다. 첫 줄에 "문장 수정 금지"가 박혀 있고, 그 안의 Socratic 정의가 "반드시 질문으로 끝내라"를 요구하므로 칸을 질문 **앞**에 둔다.

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `grep -c "답의 후보" skills/brainstorming/references/templates.md; sed -n '29,40p;66,79p' skills/brainstorming/references/templates.md | grep -c "고르면"`
Expected: 첫 줄은 현재 값(옛 술어 인용 2건), 둘째 줄은 `0` — 출력 형식 펜스에 번호 줄이 없음

- [ ] **Step 2: Ontologist 프롬프트 펜스에 반환 지시를 더한다**

프롬프트 펜스 끝(`4. 숨겨진 가정 (Hidden Assumptions): 당연하다고 여기지만 검증되지 않은 것은?` 다음)에 아래를 넣는다:

```
질문마다 「답의 후보」를 **먼저** 적고 그다음 질문 본문을 쓴다. 후보는 한 줄에 하나씩, 각 줄에 후보와 「고르면 무엇이 달라지는지」를 함께 적는다. 후보가 한 줄도 안 적히면 「답의 후보: 없음」이라고 적는다.

반환 형식:
답의 후보:
- [후보] — 고르면: [무엇이 달라지는지]
- [후보] — 고르면: [무엇이 달라지는지]

질문: [질문 본문]
```

- [ ] **Step 3: Ontologist 출력 형식 펜스에 조건부 번호 줄을 넣는다**

지금:
```
🔬 본질 질문 [Ontologist] — ❓ 질문 [N]/4 : [Essence | Root Cause | Prerequisites | Hidden Assumptions]

**배경/힌트:** [이 관점에서 왜 묻는지 1줄]

[질문 내용]

(답하기 어려우면 "모름"/"넘어가" — 조사로 넘깁니다 · 전체 보기: "다 보여줘" · 건너뛰려면 "넘어가자")
```

바꾼 뒤:
```
🔬 본질 질문 [Ontologist] — ❓ 질문 [N]/4 : [Essence | Root Cause | Prerequisites | Hidden Assumptions]

**배경/힌트:** [이 관점에서 왜 묻는지 1줄]

[질문 내용]

1. [후보] — 고르면: [결과 1줄]
2. [후보] — 고르면: [결과 1줄]
0. 이 중에 없음 — 자유롭게 말씀해주세요

(답하기 어려우면 "모름"/"넘어가" — 조사로 넘깁니다 · 전체 보기: "다 보여줘" · 건너뛰려면 "넘어가자")
```

펜스 아래에 한 줄을 덧붙인다:
```
번호 줄과 0번 줄은 반환물의 「답의 후보」가 두 줄 이상일 때만 넣는다. 한 줄 이하면 그 세 줄을 통째로 뺀다 — 「답의 후보」라는 칸 이름은 화면에 올리지 않는다.
```

- [ ] **Step 4: Socratic 프롬프트 펜스와 출력 형식 펜스에 같은 편집을 한다**

프롬프트 펜스 끝(`이 도메인 관점에서 Socratic Interviewer로서 질문을 2~3개 생성하라.` 다음)에 Step 2와 같은 반환 지시를 넣는다.

출력 형식 펜스는 지금:
```
❓ 질문 [N]/[M] : [주제]
← [페르소나 이모지] [Socratic] (겹친 경우 + 병기)

**배경/힌트:** [답변 시 고려할 관점 1줄 — 독자 기준선(주니어와 시니어 사이의 개발자)에 맞춘 언어]

[질문 내용]

(답하기 어려우면 "모름"/"넘어가" — 조사로 넘깁니다 · 전체 보기: "다 보여줘" · 위임: "알아서")
```

바꾼 뒤에는 `[질문 내용]`과 안내줄 사이에 Step 3과 같은 세 줄(1번·2번·0번)을 넣고, 펜스 아래에 같은 조건 문장을 덧붙인다.

- [ ] **Step 5: 두 펜스의 등장 횟수를 세어 화면 누출을 막았는지 확인한다**

Run: `sed -n '29,45p;70,90p' skills/brainstorming/references/templates.md | grep -c "답의 후보"`
Expected: `0` — 출력 형식 펜스 안에 「답의 후보」라는 칸 이름이 들어가면 안 된다 (행 번호는 편집 후 밀리므로 실제로는 두 출력 형식 펜스 구간을 다시 찾아 확인한다)

Run: `grep -c "답의 후보:" skills/brainstorming/references/templates.md`
Expected: `2` — 프롬프트 펜스 둘에만 반환 형식이 있음

- [ ] **Step 6: 커밋**

```bash
git add skills/brainstorming/references/templates.md
git commit -m "feat(brainstorming): 페르소나 반환 규격에 답의 후보 칸을 두고 화면 본보기에 번호 줄을 놓는다"
```

---

### Task 5: 새 술어를 사본 다섯 자리에 반영한다 (REQ-005)

**Files:**
- Modify: `skills/brainstorming/references/templates.md:41`
- Modify: `skills/brainstorming/references/templates.md:80`
- Modify: `skills/brainstorming/SKILL.md:303`
- Modify: `skills/brainstorming/SKILL.md:362`
- Modify: `skills/workflow-orchestrator/SKILL.md:390`

**Interfaces:**
- Consumes: Task 1이 확정한 새 술어 문면

`decision-flow.md:245`는 사본이 아니라 원본이며 Task 1이 이미 고쳤다. 이 태스크의 대상이 아니다.

- [ ] **Step 1: 변경 전 잔존 건수를 센다**

Run: `grep -rnE "후보를 (두세 개로 )?셀 수 있" skills/ | wc -l`
Expected: `5` — 사본 다섯 (원본은 Task 1에서 이미 바뀜)

- [ ] **Step 2: 다섯 자리의 옛 문면을 새 문면으로 바꾼다**

다섯 자리 모두 아래 옛 문면을 담고 있다:
```
② 답의 후보를 두세 개로 셀 수 있으면 번호 선택지를 붙인다 — 못 세면 개방형 그대로 둔다
```

바꾼 뒤:
```
② 답의 후보를 적어 본다 — 두 줄 이상 적히면 그 줄들이 번호 선택지가 되고, 한 줄 이하면 개방형으로 둔다
```

`templates.md:41`과 `:80`은 그 뒤에 "서브에이전트가 '질문'으로 만들어 준 것을 그대로 내보내지 않는다" 문장이 이어진다. 그 문장은 그대로 둔다.

- [ ] **Step 3: 변경 후 잔존 건수를 센다**

Run: `grep -rnE "후보를 (두세 개로 )?셀 수 있" skills/ | wc -l; grep -rc "답의 후보를 적어 본다" skills/ | grep -v ":0"`
Expected: 첫 줄 `0`, 둘째 줄에 `decision-flow.md`·`templates.md`·`brainstorming/SKILL.md`·`workflow-orchestrator/SKILL.md`가 나옴

- [ ] **Step 4: 커밋**

```bash
git add skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md skills/workflow-orchestrator/SKILL.md
git commit -m "fix(decision-flow): 새 술어를 사본 다섯 자리에 반영한다"
```

---

### Task 6: 상시 주입되는 `bootstrap.md`에 질문 규칙을 넣는다 (REQ-018)

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md:31` (세션 불변식 블록의 질문 관련 줄)

**Interfaces:**
- Consumes: Task 1의 새 술어, Task 3의 0번 탈출구 규칙
- Produces: 세션 시작마다 읽히는 자리의 질문 규칙 한 줄

이 파일은 세션 시작에 통째로 주입되는 유일한 자리이고, 지금 질문 규칙이 0건이다.

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `grep -c "답의 후보\|탐색적 질문" skills/workflow-orchestrator/bootstrap.md`
Expected: `0`

- [ ] **Step 2: 세션 불변식 줄을 늘린다**

지금:
```
- 사용자 입력 요청에 AskUserQuestion 도구를 사용하지 않는다 (BRAINSTORM/PLAN/COMPLETION 한정) — 텍스트 번호 목록으로 질문한다
```

바꾼 뒤:
```
- 사용자 입력 요청에 AskUserQuestion 도구를 사용하지 않는다 (BRAINSTORM/PLAN/COMPLETION 한정) — 텍스트 번호 목록으로 질문한다. **질문을 내보내기 전에 답의 후보를 적어 본다 — 두 줄 이상 적히면 그 줄들이 번호 선택지가 되고, 한 줄 이하일 때만 개방형으로 둔다. 탐색적 질문에는 0번 탈출구를 늘 붙인다**
```

- [ ] **Step 3: 변경 후 상태를 확인한다**

Run: `grep -c "답의 후보를 적어 본다" skills/workflow-orchestrator/bootstrap.md; grep -c "0번 탈출구를 늘 붙인다" skills/workflow-orchestrator/bootstrap.md`
Expected: 각각 `1`

- [ ] **Step 4: 커밋**

```bash
git add skills/workflow-orchestrator/bootstrap.md
git commit -m "feat(bootstrap): 상시 주입 자리에 질문 규칙을 넣는다"
```

---

### Task 7: 산문으로 박힌 닫힌 질문 네 자리를 번호 화면으로 펴고 Yes/No 형식 정의를 고친다 (REQ-007, REQ-008)

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md:28` (세션 시작 후속 질문)
- Modify: `skills/design-doc-index/SKILL.md:50` (모드 확인)
- Modify: `skills/document-consolidation/SKILL.md:20` (문서 통합 트리거)
- Modify: `skills/workflow-orchestrator/references/completion-protocol.md:31` (README 확인)
- Modify: `skills/workflow-orchestrator/SKILL.md` Yes/No 블록 (371~378행)
- Modify: `skills/workflow-orchestrator/references/completion-protocol.md:49` (Step 3·3.5의 형식 지시)

**Interfaces:**
- Produces: Yes/No 진행 게이트가 결과 줄을 갖는 형식. 이 형식 정의가 저장소의 다른 Yes/No 화면에도 적용된다

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `grep -c "설계 문서를 제공하시겠습니까" skills/workflow-orchestrator/SKILL.md; grep -c "전체 문서를 로드할까요" skills/design-doc-index/SKILL.md; grep -c "문서 통합을 진행할까요" skills/document-consolidation/SKILL.md; grep -c "README.md 업데이트가 필요해 보입니다" skills/workflow-orchestrator/references/completion-protocol.md`
Expected: 각각 `1`

- [ ] **Step 2: Yes/No 형식 정의 둘에 결과 줄을 넣는다**

`workflow-orchestrator/SKILL.md`의 Yes/No 블록:
```
### Yes/No 질문

​```
[질문 텍스트]

1. Yes
2. No
​```
```
바꾼 뒤:
```
### Yes/No 질문

​```
[질문 텍스트]

1. Yes — 고르면: [무엇이 일어나는지 1줄]
2. No — 고르면: [무엇이 일어나는지 1줄]
​```

"Yes"와 "No"는 고르면 무슨 일이 나는지를 이름에 안 담으므로 결과 줄을 붙인다. 되돌리기 비용이 있는 게이트일수록 그렇다.
```

`completion-protocol.md:49`:
```
Step 3·3.5의 확인 문구는 Input Format Rules의 Yes/No 형식(1. Yes / 2. No)으로 출력한다
```
바꾼 뒤:
```
Step 2·3·3.5의 확인 문구는 Input Format Rules의 Yes/No 형식으로 출력한다 — 번호와 함께 「고르면 무엇이 일어나는지」 한 줄을 붙인다
```

- [ ] **Step 3: 네 자리의 산문을 번호 화면으로 편다**

`workflow-orchestrator/SKILL.md:28`:
```
   - "진행 중인 작업 없음" + 워크플로우 의도 있음 → 아래 후속 질문

     참고할 설계 문서가 있습니까?

     1. 있다 — 고르면: 그 설계 문서를 읽고 내용을 바탕으로 이어서 진행합니다
     2. 없다 — 고르면: 설계 문서 없이 지금 요청부터 바로 진행합니다
```

`design-doc-index/SKILL.md:50`:
```
- 의도가 모호하면 아래로 확인한다

  설계 문서를 어디까지 볼까요?

  1. 전체 로드 — 고르면: 해당 설계 문서를 통째로 읽어 지금 논의의 근거로 씁니다
  2. 목록만 — 고르면: 어떤 설계 문서가 있는지 제목과 한 줄 요약만 봅니다
```

`document-consolidation/SKILL.md:20`:
```
- REVIEW 완료 시 아래를 묻는다 (consolidate-main)

  문서 통합을 진행할까요?

  1. Yes — 고르면: phase 파일과 plan.md의 내용을 설계 문서로 합치고 중간 산출물을 정리합니다
  2. No — 고르면: 문서 통합을 미루고 지금 상태를 그대로 둡니다
```

`completion-protocol.md:31`:
```
- 영향 있음 → 아래를 묻고 답에 따라 처리한다

  README.md 업데이트가 필요해 보입니다. 진행할까요?

  1. Yes — 고르면: 이번 변경에 맞춰 README.md를 고칩니다
  2. No — 고르면: README.md를 그대로 두고 마무리를 이어갑니다
```

- [ ] **Step 4: 변경 후 상태를 확인한다**

Run: `scripts/sweep '설계 문서를 제공하시겠습니까, 아니면' '전체 문서를 로드할까요, 목록만' && echo OK`
Expected: `OK` — 산문 문면이 0건

Run: `grep -c "1\. Yes — 고르면:" skills/workflow-orchestrator/SKILL.md skills/document-consolidation/SKILL.md skills/workflow-orchestrator/references/completion-protocol.md`
Expected: 세 파일 모두 1건 이상

- [ ] **Step 5: 커밋**

```bash
git add skills/workflow-orchestrator/SKILL.md skills/design-doc-index/SKILL.md skills/document-consolidation/SKILL.md skills/workflow-orchestrator/references/completion-protocol.md
git commit -m "feat(input-format): 산문 닫힌 질문 네 자리를 번호 화면으로 펴고 Yes/No 게이트에 결과 줄을 붙인다"
```

---

### Task 8: 머리말의 적용 범위와 재서술 목록 경계를 고친다 (REQ-009, REQ-010)

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md:3` (적용 스킬 목록)
- Modify: `skills/workflow-orchestrator/decision-flow.md:7` (적용 범위 문장)
- Modify: `skills/workflow-orchestrator/decision-flow.md:11` (재서술 지점 목록 머리말)
- Modify: `skills/merge-to-domain/SKILL.md` (도메인 문서 갱신 책임 짝 문장)

**Interfaces:**
- Produces: 재서술 지점 목록의 경계 선언. Task 10의 검사 스크립트가 이 머리말을 파싱하고 항목 수를 대조한다

목록은 **열둘로 유지한다.** 도메인 문서를 항목으로 더하지 않는다.

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `sed -n '3p;7p;11p' skills/workflow-orchestrator/decision-flow.md`
Expected: 3행에 적용 스킬 다섯, 7행에 "merge-to-domain·design-summary의 기존 출력 형식은 별개다", 11행에 "재서술 지점 목록 (검증 기준 — 누락 0)"

- [ ] **Step 2: 적용 스킬 목록과 적용 범위 문장을 고친다**

3행의 적용 스킬 목록 끝에 아래를 더한다:
```
, design-summary(질문 규칙만 적용 — 답의 후보를 적어 두 줄 이상이면 번호를 붙인다. 나머지 출력 형식은 별개)
```

7행:
```
Superpowers 위임 단계(DEVELOP/REVIEW)와 merge-to-domain·design-summary의 기존 출력 형식은 별개다.
```
바꾼 뒤:
```
Superpowers 위임 단계(DEVELOP/REVIEW)와 merge-to-domain의 기존 출력 형식은 별개다. `design-summary`도 화면 모양은 자기 형식을 쓰지만, 답의 후보를 적어 두 줄 이상이면 번호를 붙이는 질문 규칙은 그 스킬의 질문 화면에도 걸린다.
```

- [ ] **Step 3: 재서술 지점 목록 머리말에 경계를 선언한다**

지금:
```
**재서술 지점 목록 (검증 기준 — 누락 0):** 이 문서의 규범을 **다시 적어 놓은** 자리는 아래 열둘이다. 규범의 뜻을 바꾸는 작업은 같은 차례에 이 목록을 함께 고친다.
```

바꾼 뒤:
```
**재서술 지점 목록 (바닥 검증 — 목록에 오른 자리는 빠짐없이):** 이 문서의 규범을 **다시 적어 놓은** 자리는 아래 열둘이다. 규범의 뜻을 바꾸는 작업은 같은 차례에 이 목록을 함께 고친다. 이 목록은 `skills/` 아래와 사용자 문서를 덮는다 — `docs/design/`의 도메인 문서는 `merge-to-domain`이 옮기므로 여기 넣지 않는다. 목록에 오른 자리를 빠짐없이 고쳤는지는 `scripts/check-restatements`가 센다. 목록 밖에 새 자리가 생겼는지는 기계가 못 세므로 전수 스윕이 매번 그대로 돈다.
```

- [ ] **Step 4: `merge-to-domain/SKILL.md`에 짝 문장을 둔다**

머지 결과를 커밋하는 절 근처에 아래 한 줄을 더한다:
```
> 도메인 문서에 머지된 규범 서술이 낡았으면 그것을 되살리는 것도 이 스킬의 일이다. `decision-flow.md`의 재서술 지점 목록은 `skills/` 아래와 사용자 문서만 덮으므로, `docs/design/` 아래는 여기서 옮긴다.
```

- [ ] **Step 5: 변경 후 상태를 확인한다**

Run: `grep -c "바닥 검증 — 목록에 오른 자리는 빠짐없이" skills/workflow-orchestrator/decision-flow.md; grep -c "design-summary(질문 규칙만 적용" skills/workflow-orchestrator/decision-flow.md; grep -c "재서술 지점 목록은" skills/merge-to-domain/SKILL.md; grep -c "^[0-9]*\. \`" skills/workflow-orchestrator/decision-flow.md`
Expected: 차례로 `1`, `1`, `1`, 그리고 마지막이 `12` — 목록이 열둘로 유지됨

- [ ] **Step 6: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/merge-to-domain/SKILL.md
git commit -m "feat(decision-flow): 재서술 목록에 경계를 선언하고 design-summary 적용 범위를 좁혀 넣는다"
```

---

### Task 9: 식별자에 풀이를 붙이게 한다 (REQ-020)

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` 「언어 규범」 펜스의 즉석 풀이 줄 (266행 부근)
- Modify: `skills/workflow-orchestrator/decision-flow.md` 검사 1번의 대상 서술 (Task 2가 고친 줄에 이어서)

**Interfaces:**
- Consumes: Task 2가 고친 검사 1번의 대상 서술 줄

이 줄은 페르소나 서브에이전트 프롬프트마다 복제되므로, 고치면 서브에이전트 발언에도 걸린다.

- [ ] **Step 1: 변경 전 상태를 확인한다**

Run: `grep -c "안에서만 통하는 용어만 나온 자리에서" skills/workflow-orchestrator/decision-flow.md`
Expected: `1`

- [ ] **Step 2: 언어 규범의 즉석 풀이 줄을 넓힌다**

지금:
```
- 그 개발자가 모를 수 있는 말, 곧 이 저장소·이 도메인·이 플러그인 안에서만 통하는 용어만 나온 자리에서 짧게 풀이한다 — 풀이는 병기이지 대체가 아니다. 줄임말은 쓰지 않되, 아래 줄의 코드 이름은 줄임말이라도 그대로 쓴다
```

바꾼 뒤:
```
- 그 개발자가 모를 수 있는 말, 곧 이 저장소·이 도메인·이 플러그인 안에서만 통하는 용어와 **식별자**(요구사항 번호·이슈 번호 같은 것)만 나온 자리에서 짧게 풀이한다 — 풀이는 병기이지 대체가 아니다. 식별자는 번호만 쓰지 않고 무엇인지 한 조각을 함께 적는다 (예: `REQ-013`이 아니라 `REQ-013(design-summary 범위 질문 화면 신설)`). 앞 화면에 적었다는 것은 지금 화면이 읽힌다는 근거가 아니다. 줄임말은 쓰지 않되, 아래 줄의 코드 이름은 줄임말이라도 그대로 쓴다
```

- [ ] **Step 3: 검사 1번의 대상에 박스 본문의 식별자를 더한다**

Task 2가 만든 대상 서술 줄에 아래를 이어 붙인다:
```
그리고 **박스 본문과 바로 앞 블록에 쓰인 식별자**도 이 검사의 대상이다 — 요구사항 번호나 이슈 번호가 무엇인지 한 조각 없이 홀로 있으면 실패다
```

- [ ] **Step 4: 변경 후 상태를 확인한다**

Run: `grep -c "용어와 \*\*식별자\*\*" skills/workflow-orchestrator/decision-flow.md; grep -c "박스 본문과 바로 앞 블록에 쓰인 식별자" skills/workflow-orchestrator/decision-flow.md`
Expected: 각각 `1`

- [ ] **Step 5: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(decision-flow): 식별자에 풀이를 붙이게 한다 — 언어 규범과 검사 1번의 대상을 함께 넓힌다"
```

---

### Task 10: 재서술 목록을 세는 검사 스크립트를 만든다 (REQ-019)

**Files:**
- Create: `scripts/check-restatements`
- Modify: `tests/hooks/run-all.sh` (실행 목록 편입)

**Interfaces:**
- Consumes: Task 8이 확정한 재서술 지점 목록 머리말 형식 (`N. \`경로\`` 열둘, 머리말에 "아래 열둘이다")
- Produces: 도착 검사 명령 `scripts/check-restatements '<문면 패턴>'` — Task 12가 통과 확인에서 부른다

`scripts/sweep`은 옛 문면이 사라졌는지만 센다. 이 스크립트는 새 문면이 도착했는지를 센다. 둘이 짝이라야 "지웠는데 안 넣었다"가 걸린다.

- [ ] **Step 1: 실패하는 상태를 먼저 확인한다**

Run: `ls scripts/check-restatements`
Expected: `No such file or directory`

- [ ] **Step 2: 스크립트를 만든다**

```bash
#!/usr/bin/env bash
# 재서술 지점 목록 검사 — 목록 경로 존재 · 항목 수 대조 · 문면 도착
# 사용법: scripts/check-restatements '<도착 문면 패턴>' [경로 접두어...]
set -u
SRC="skills/workflow-orchestrator/decision-flow.md"
PATTERN="${1:-}"

# 머리말이 선언한 항목 수 (한글 수사)
declare -A NUM=([열]=10 [열하나]=11 [열둘]=12 [열셋]=13 [열넷]=14 [열다섯]=15)
DECLARED_WORD=$(grep -o "아래 열[가-힣]*이다" "$SRC" | head -1 | sed 's/아래 //; s/이다//')
DECLARED=${NUM[$DECLARED_WORD]:-0}

# 목록 항목의 경로를 뽑는다 — `N. \`경로\`` 모양
mapfile -t PATHS < <(grep -oE '^[0-9]+\. `[^`]+`' "$SRC" | sed 's/^[0-9]*\. `//; s/`$//')

echo "── 목록 항목: ${#PATHS[@]}건 (머리말 선언: ${DECLARED}건)"
fail=0
[ "${#PATHS[@]}" -eq "$DECLARED" ] || { echo "   항목 수 불일치"; fail=1; }

for p in "${PATHS[@]}"; do
  [ -e "$p" ] || { echo "   경로 없음: $p"; fail=1; }
done
[ "$fail" -eq 0 ] && echo "   경로 존재: OK"

if [ -n "$PATTERN" ]; then
  echo "── 도착 검사: $PATTERN"
  for p in "${PATHS[@]}"; do
    [ -f "$p" ] || continue
    n=$(grep -c "$PATTERN" "$p" 2>/dev/null || true)
    [ "$n" -ge 1 ] || { echo "   $p: 0건"; fail=1; }
  done
  [ "$fail" -eq 0 ] && echo "   도착: OK"
fi

exit "$fail"
```

파일을 만든 뒤 실행 권한을 준다: `chmod +x scripts/check-restatements`

- [ ] **Step 3: 목록 검사만 돌려 통과를 확인한다**

Run: `scripts/check-restatements`
Expected: `목록 항목: 12건 (머리말 선언: 12건)`과 `경로 존재: OK`, 종료 코드 0

- [ ] **Step 4: 도착 검사가 실제로 가르는지 확인한다**

Run: `scripts/check-restatements '이 문면은 어디에도 없다'; echo "exit=$?"`
Expected: 여러 경로가 `0건`으로 나오고 `exit=1`

- [ ] **Step 5: `tests/hooks/run-all.sh`의 실행 목록에 넣는다**

`run-all.sh`가 `test-*.sh` 글롭으로 도는 구조이므로, 아래 래퍼를 `tests/hooks/test-restatements.sh`로 만든다:

```bash
#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../.." || exit 1
echo "== 재서술 지점 목록 검사 =="
scripts/check-restatements
```

실행 권한을 준다: `chmod +x tests/hooks/test-restatements.sh`

- [ ] **Step 6: 전체 테스트를 돌려 회귀가 없는지 본다**

Run: `bash tests/hooks/run-all.sh`
Expected: 모든 스위트 통과, 새 항목 포함

- [ ] **Step 7: 커밋**

```bash
git add scripts/check-restatements tests/hooks/test-restatements.sh
git commit -m "feat(scripts): 재서술 지점 목록의 도착을 세는 검사 스크립트를 만든다"
```

---

### Task 11: 도메인 문서의 버전 딱지를 고치고 낡은 문면에 표시를 붙인다 (REQ-011, REQ-012)

**Files:**
- Modify: `docs/design/dev-workflow/ux-consistency.md` (v1.25.0 딱지 13곳, 203행 목록 번호, 205행 표시 줄)
- Modify: `docs/design/dev-workflow/workflow-lifecycle.md` (v1.25.0 딱지 2곳)

**Interfaces:**
- Consumes: Task 2가 확정한 적용 밖 목록의 새 번호(①②③)

도메인 문서의 **규범 서술 본문 교체는 하지 않는다.** `merge-to-domain`이 하는 일이다. 여기서는 버전 딱지 정정과 낡은 문면 표시 한 줄만 한다.

- [ ] **Step 1: 변경 전 건수를 센다**

Run: `grep -c "v1\.25\.0" docs/design/dev-workflow/ux-consistency.md docs/design/dev-workflow/workflow-lifecycle.md`
Expected: `13`과 `2`

- [ ] **Step 2: 딱지 열다섯 곳을 v1.24.1로 바꾼다**

Run: `sed -i 's/v1\.25\.0/v1.24.1/g' docs/design/dev-workflow/ux-consistency.md docs/design/dev-workflow/workflow-lifecycle.md`

바꾸는 이유: 그 딱지가 가리키는 변경들은 `e6f9efb`에서 1.25.0으로 나갔다가 다음 날 `84eaf0e`가 1.24.1로 되돌렸고, 그때 바뀐 파일은 `plugin.json`과 `marketplace.json` 두 줄뿐이라 내용은 1.24.1에 그대로 들어 있다.

- [ ] **Step 3: 205번째 줄에 낡은 문면 표시를 붙인다**

그 줄 끝에 아래를 더한다:
```
 (이 문면은 1.26.0에서 교체됐다 — 원본은 `decision-flow.md`의 질문 규칙. 본문 반영은 다음 도메인 머지에서 한다)
```

- [ ] **Step 4: 203번째 줄의 적용 밖 목록 번호를 맞춘다**

Task 2가 원본에서 두 번째 항목을 뺐으므로 사본도 ①②③으로 재정렬한다. 원본과 같은 문면으로 맞춘다.

- [ ] **Step 5: 변경 후 상태를 확인한다**

Run: `grep -c "v1\.25\.0" docs/design/dev-workflow/*.md; grep -c "1.26.0에서 교체됐다" docs/design/dev-workflow/ux-consistency.md; grep -c "선택지 없는 탐색적 질문" docs/design/dev-workflow/ux-consistency.md`
Expected: 첫 줄 모든 파일 `0`, 둘째 `1`, 셋째 `0`

- [ ] **Step 6: 커밋**

```bash
git add docs/design/dev-workflow/ux-consistency.md docs/design/dev-workflow/workflow-lifecycle.md
git commit -m "fix(docs): 도메인 문서의 취소된 버전 딱지를 실제 번호로 고친다"
```

---

### Task 12: 버전을 올리고 전체를 검증한다 (REQ-014)

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: Task 1~11의 모든 편집. 이 태스크가 통과 게이트다

- [ ] **Step 1: 변경 전 버전을 확인한다**

Run: `scripts/bump-version --check`
Expected: `OK: 1.24.9`

- [ ] **Step 2: 버전을 올린다**

Run: `scripts/bump-version 1.26.0`

- [ ] **Step 3: 옛 문면 잔존을 좁힌 패턴으로 확인한다**

Run: `grep -rnE "후보를 (두세 개로 )?셀 수 있" skills/ commands/ hooks/ README.md CLAUDE.md | wc -l`
Expected: `0` — `skills` 아래 0건. `docs`는 이 기능의 phase 스냅샷이 옛 술어를 원문 인용하므로 범위에서 뺀다

Run: `grep -rn "대개 개방형" skills/ | wc -l`
Expected: `0`

- [ ] **Step 4: 도착 검사를 돌린다**

Run: `scripts/check-restatements '답의 후보를 적어'`
Expected: 종료 코드 0 — 목록 경로 열둘 중 질문 규칙을 담은 자리에 새 문면이 도착했음

목록의 열둘 중 질문 규칙을 원래 안 담는 자리(예: `context-handling/SKILL.md`)가 있으면 도착 검사가 그 자리에서 0건을 낸다. 그 경우 패턴을 그 자리가 실제로 담는 문면으로 바꿔 개별 확인하고, 결과를 커밋 메시지에 적는다.

- [ ] **Step 5: 버전 동기와 훅 테스트 회귀를 확인한다**

Run: `scripts/bump-version --check && bash tests/hooks/run-all.sh && echo OK`
Expected: `OK: 1.26.0`에 이어 모든 테스트 통과, 마지막에 `OK`

- [ ] **Step 6: 커밋**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore(release): bump to 1.26.0"
```

---

### Task 13: 재발 원인과 남는 한계를 기록한다 (REQ-016)

**Files:**
- Modify: `tasks/lessons.md`

**Interfaces:**
- Consumes: Task 1~12에서 실제로 무엇을 고쳤는지

- [ ] **Step 1: 아래 항목을 `tasks/lessons.md` 끝에 더한다**

```markdown
### 규범이 다섯 곳에 있었는데도 안 지켜졌다 — 상시 읽히는 자리에는 없었다 (2026-09-07)
- **문제:** 답의 후보가 셋으로 닫힌 질문이 번호 선택지 없이 개방형으로 나갔다. 2026-08-31에 같은 지적을 받고 「조립 전 갈림」을 신설했는데도 재발했다. 사용자 정정: "어느 순간부터 넘버링된 선택지가 안나오는데 확인해줘"
- **원인:** 셋이 겹쳤다. ① 갈림 두 번째 술어가 "답의 후보를 셀 수 있는가"라 판정하는 쪽 자신의 능력을 물었다 — "못 세겠다"가 언제나 합법인 답이었다 ② 세션 시작에 상시 주입되는 `bootstrap.md`에 질문 규칙이 0건이었다. 다섯 사본은 전부 조건부로 열리는 파일에 있었고, 그 다섯은 문자 그대로 같았다 — 사본 어긋남이 아니라 안 읽힘이 원인이었다 ③ 모델이 질문 화면을 만들 때 베끼는 `templates.md`의 출력 형식 본보기 둘에 번호 선택지를 놓을 줄이 0건이었다. 후보를 세어도 옮겨 적을 자리가 없었다
- **교훈:** **규범이 몇 곳에 적혀 있는지를 세지 말고, 그중 몇 곳이 실제로 읽히는지를 센다.** 상시 주입되는 파일에 없으면 다섯 곳에 있어도 없는 것과 같을 수 있다. 그리고 **규칙이 만들어 낸 것을 놓을 자리가 화면 본보기에 있는지 확인한다** — 세는 단계를 고쳐도 본보기가 옛 모양이면 결과가 안 바뀐다. 술어는 능력을 묻지 말고 행위를 시킨다.
- **남는 한계:** 본체가 직접 쓴 개방형 질문은 후보를 적어 봤는지가 화면에 안 남는다. 페르소나 경로도 후보가 한 줄 이하면 같다. 이 릴리스는 그 한계를 받아들이고 상시 관측을 두지 않았다 — 대신 통과 확인 때 한 번 센다.
```

- [ ] **Step 2: 커밋**

```bash
git add tasks/lessons.md
git commit -m "docs(lessons): 규범이 읽히는 자리와 화면 본보기의 자리에 대한 교훈"
```

---

### Task 14: 실물 재현으로 통과를 확인한다 (REQ-015)

**이 태스크는 main 머지 뒤 새 세션에서 실행한다.** 마켓플레이스가 저장소를 가리키는 구조라 머지 없이는 새 문면이 세션에 안 들어온다. 마무리 시퀀스에서 커밋과 머지를 마친 뒤에 진행한다.

**Files:**
- Modify: `docs/design/dev-workflow/question-numbering/question-numbering.md` 9번 절 (구현 결과 및 일탈 사항)

- [ ] **Step 1: 실행 중인 플러그인 버전을 확인한다**

Run: `grep -A2 '"dev-workflow@dev-workflow-marketplace"' ~/.claude/plugins/installed_plugins.json | grep version`
Expected: `1.26.0` — 아니면 `/plugin` Update를 돌리고 세션을 다시 연다

- [ ] **Step 2: 브레인스토밍을 한 번 돌린다**

새 세션에서 아무 주제로 브레인스토밍을 시작해 국면 1의 인터뷰까지 진행한다. 질문이 나갈 때마다 아래를 센다.

- 그 인터뷰의 질문 수
- 번호 선택지가 붙어 나간 질문 수
- 후보가 한 줄 이하로 떨어져 개방형으로 나간 질문 수
- 페르소나가 「답의 후보」 칸을 채워 반환한 수
- 그 세션에서 `templates.md`와 `decision-flow.md`가 실제로 열렸는가

- [ ] **Step 3: 결과를 9번 절에 기록한다**

`question-numbering.md`의 9번 절에 아래 모양으로 한 문단을 적는다:

```
재현 (YYYY-MM-DD): 확인한 플러그인 버전 1.26.0. 질문 N건 중 번호가 붙은 것 N건, 후보가 한 줄 이하로 떨어져 개방형으로 나간 것 N건. 페르소나가 「답의 후보」 칸을 채워 반환한 것 N건. 그 세션에서 templates.md와 decision-flow.md가 열렸는지: [열림/안 열림]. 재현으로 안 덮인 자리: REQ-006(0번 탈출구는 결정 화면에서 안 뜸)·REQ-007(네 자리 전부 브레인스토밍 밖)·REQ-008(마무리 시퀀스의 Yes/No)·REQ-012(도메인 문서 딱지).
```

번호가 안 붙었으면 「답의 후보」 칸이 채워져 왔는지로 갈래를 가른다 — 채워져 있는데 화면에 안 올라갔으면 화면 본보기 쪽 문제이고, 비어 있으면 술어 쪽 문제다.

- [ ] **Step 4: 커밋**

```bash
git add docs/design/dev-workflow/question-numbering/question-numbering.md
git commit -m "docs(question-numbering): 실물 재현 결과 기록"
```
