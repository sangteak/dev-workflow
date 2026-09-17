# middle-dot-removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모델이 읽는 글 전체와 docs/design에서 가운뎃점(·) 나열을 없애고, 언어 규범에 새 나열 규칙을 넣고, 재발을 상시 검사로 막는다.

**Architecture:** 정본(decision-flow 언어 규범 펜스)에 규칙 한 줄과 예시를 넣으면 워커 프롬프트 열한 곳에 실행 시점 복제로 도착한다. 45개 파일 626줄의 점은 허용 연산 셋(구분자 치환, 층 나누기, 어순 재배치)으로만 고치고, 여러 파일이 같은 모양이어야 하는 자리는 아래 「치환 고정표」가 값을 정한다. 검사 도구 셋(잔존 헬퍼, 대조 스크립트, transcript 스크립트)을 먼저 만들어 모든 뒤 태스크의 리뷰 도구로 쓴다.

**Tech Stack:** Markdown, bash(msys, Windows), git grep, node 24 (jq 없음), Superpowers subagent-driven-development, 모델 티어링(researcher = sonnet, grunt = haiku)

**Spec:** `docs/design/dev-workflow/middle-dot-removal/middle-dot-removal.md` (REQ-001~021, 6절 기술 결정, 8절 가이드라인)

## Global Constraints

- 릴리스 1.27.2. 버전은 `scripts/bump-version 1.27.2`로만 올린다 (Task 9)
- 이 계획의 모든 편집은 워크트리 `C:/Users/sangtakeg/orca/workspaces/dev-workflow/opah` (브랜치 `feature/analyzer`)에서 한다. `D:/02_Workspace/98_Github/dev-workflow`(main)는 건드리지 않는다. 시작 커밋: `f6ab1a9`
- **워커는 Edit 도구만 쓴다.** Write로 파일을 통째로 다시 쓰지 않는다 (줄 끝 보존)
- **허용 연산 셋** — (1) 가운뎃점(·)을 쉼표나 "와/과"나 "나/이나"로 바꾸기 (2) 항목이 쉼표나 줄표를 품거나 나열이 두 층이면 줄을 나눠 `- ` 불릿으로 내리기 — 이때 이음말("중 하나", "셋")과 줄표를 머리 줄로 옮기는 것은 허용 (3) 항목 안 쉼표를 피하는 어순 재배치. 그 밖에 낱말을 더하거나 빼거나 바꾸지 않는다. 예외는 아래 고정표 자리와 bootstrap 폴백뿐이며 거기서만 "진행 중:" 같은 이름표 낱말 추가를 허용한다
- **규칙 문장** — 문장 안 나열은 쉼표와 "와/과"로 잇고 "와/과"는 마지막 한 번만. "또는" 뜻이면 "나/이나". 표 칸(`|`로 시작하는 줄)과 커밋 제목과 한 줄 표시는 쉼표만. 따옴표 항목은 층이 아니다. 술어(동사구) 나열은 쉼표로만 잇고 "와/과"를 붙이지 않는다. "그리고"는 층 나누기에 쓰지 않는다
- **도메인 문서(`docs/design/dev-workflow/*.md` 최상위 일곱)와 complete feature 문서 넷(code-name-lookup, reask-reassembly, question-numbering, decision-label-linebreak)의 평문 단락은 불릿으로 내리지 않는다** — 쉼표와 "와/과"나 어순 재배치로 한 문장을 유지한다 (도메인 머지의 digest가 불릿을 정책 항목으로 센다)
- **이름 문구 `가운뎃점(·)`은 절대 건드리지 않는다** — 규칙에서 이름을 부르는 유일한 자리이며 잔존 검사가 이 문구를 지운 뒤 센다
- 면제 경로 셋(수정 금지): `docs/design/**/phase[0-9]_*.md`, `docs/design/**/_archive/**`, `docs/design/**/evidence/**`
- 옛 화면 인용은 치환하지 않는다 — evidence 행 번호 참조로 바꾸고 참조 줄에 화면 조각을 0자로 둔다 (Task 7)
- 디스패치 프롬프트에 예시 문구를 넣지 않는다. 고정표 값과 규칙 문장만 준다 (tasks/lessons.md 2026-09-14 교훈)
- 기존 도착 검사 조각 넷은 불릿 경계에서 끊지 않는다: `식별자는 즉석 풀이`, `풀이 없는 것`, `다시 씀: `, `코드 자리에서 1건 이상`
- 검사 실행: Task 2~8 동안은 `DOT_GATE=off bash tests/hooks/run-all.sh`로 돌리고(잔존 헬퍼가 건수만 보고), Task 9에서 `DOT_GATE` 없이 돌려 0건과 rc=0을 확인한다
- 커밋: 태스크마다 하나. 메시지는 Conventional Commits, 제목에 가운뎃점(·)을 쓰지 않는다. 마지막 줄 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
- 도메인 머지(merge-to-domain)는 이 릴리스 안에서 하지 않는다

### 리뷰어 점검 항목 (모든 태스크 공통)

1. `node scripts/diff-check.mjs <이전 커밋>` 결과에서 `FAIL`이 0건인가. `READ`(층 나누기, 어순 재배치, 고정표 자리) hunk는 눈으로 읽었는가
2. 쉼표만으로 끝난 문장 안 나열이 있는가 — 마지막은 "와/과"여야 한다. **자리 예외:** 한 줄 표시(헤더, 안내줄, 검증 결과 줄)와 표 칸과 술어 나열은 쉼표만이 정상
3. "와/과"가 한 나열에 두 번 이상 나오는가
4. 받침이 맞는가 ("문서과", "스크립트와"는 결함)
5. 고정표 자리 밖에서 낱말이 더해지거나 빠지거나 바뀌었는가
6. "또는" 뜻 자리가 "와/과"로 바뀌지 않았는가 (고정표의 아홉 자리 + 워커가 새로 찾은 자리는 보고서에 적는다)
7. 도메인 문서와 feature 문서에 새 `- ` 불릿이 생기지 않았는가 (diff-check가 `DOMAIN-BULLET`으로 표시)
8. 층 나누기가 없는 파일에서 `git diff --stat`의 변경 줄 수가 점이 든 줄 수와 같은가
9. 기존 도착 조각 넷이 그대로 있는가 (`DOT_GATE=off bash tests/hooks/run-all.sh`에서 잔존 헬퍼 밖의 실패가 0인가)

### 치환 고정표 (여러 파일이 같은 모양을 가져야 하는 자리 — 값을 그대로 쓴다)

행 번호는 시작 커밋 `f6ab1a9` 기준. 편집 뒤 밀리므로 앞 조각으로 찾는다. "옛"은 점으로 이은 현재 모양이다.

| # | 파일:행 | 앞 조각 | 새 값 |
|---|---|---|---|
| G1 | decision-flow.md:50 | `📋 확정 N/M` | `📋 확정 N/M, 진행 중: [현재 결정명], 다시 볼 것 K건` |
| G2 | workflow-orchestrator/SKILL.md:436 | `한 줄 헤더를 표시한다: ` | `` `📋 확정 N/M, 진행 중: [결정명], 다시 볼 것 K건` `` |
| G3 | bootstrap.md:36 (폴백 안) | `헤더 ` | `헤더 \`📋 확정 N/M, 진행 중: [결정명]\`` (낱말 추가 허용 자리) |
| G4 | context-handling/SKILL.md:84 | `- 헤더: 확정 [N]/[M]` | `- 헤더: 확정 [N]/[M], 진행 중: [결정명], 다시 볼 것 [K]건` |
| G5 | context-handling/SKILL.md:86 | `- ❓ 질문 진행: [N]/[M]` | `- ❓ 질문 진행: [N]/[M], 국면: [국면명]` |
| G6 | context-handling/SKILL.md:88 | `- 블라인드 첫 루프:` | `- 블라인드 첫 루프: [완료/미완료], 국면: [국면명]` |
| G7 | context-handling/SKILL.md:116 | `- 자리: [가장 긴 공통 접두 디렉토리]` | `- 자리: [가장 긴 공통 접두 디렉토리], 개수: [N]개, 뽑은 국면: [국면] (자리 재확인: [국면])` (이름표 추가 허용 자리) |
| G8 | decision-flow.md:253 | `❓ 질문 진행: [N]/[M]` | `` `❓ 질문 진행: [N]/[M], 국면: [국면명]` `` |
| G9 | decision-flow.md:249 | `첫 질문에만 진행 안내 1줄을 붙인다: ` | `` `(답하기 어려우면 "모름"이나 "넘어가"라고 하면 조사로 넘깁니다. 전체 보기는 "다 보여줘", 위임은 "알아서")` `` |
| G10 | brainstorming/references/templates.md:56 | `(답하기 어려우면` | `(답하기 어려우면 "모름"이나 "넘어가"라고 하면 조사로 넘깁니다. 전체 보기는 "다 보여줘", 건너뛰려면 "넘어가자")` |
| G11 | workflow-orchestrator/SKILL.md:172 | `── 🎯 AC 검증 결과 [Evaluator] ───` | `── 🎯 AC 검증 결과 [Evaluator] ─── ✅ PASS: N, ⚠️ PARTIAL: N, ❌ FAIL: N` |
| G12 | decision-flow.md:489 | `**전치 태그 — 항목 첫머리 고정:**` | `` `[✔ 출처]` 확인됨, `[⚠️ 확인 불가]` 확인 수단 없음, `[✘ 반증 — 출처]` 확인 결과 틀림, `[추측]` 발언자 자백. `` (뒤 문장은 그대로) |
| G13 | decision-flow.md:360 | `둘 이상이면` | `둘 이상이면 앞은 쉼표로, 마지막만 "와/과"로 잇는다 (예: \`(다시 씀: 왜 문제인지와 고르면 어떻게 되는지)\`, 셋이면 \`(다시 씀: 낱말 풀이, 왜 문제인지와 고르면 어떻게 되는지)\`)` — 같은 줄 뒤의 갈래 이름 나열은 쉼표와 "와" |
| G14 | decision-flow.md:355 표 칸 | `\| 근거 \|` | 둘째 칸 `"왜?", "이게 왜 문제지?", "이유가 뭐야"` |
| G15 | decision-flow.md:356 표 칸 | `\| 결과 줄 \|` | 둘째 칸 `"조건이 뭐야?", "차이가 뭐야?", "고르면 어떻게 되는데"` |
| G16 | decision-flow.md:357 표 칸 | `\| 흐름 \|` | 둘째 칸 `"뭘 하려는 거야", "이 질문이 왜 나와", "전체 그림이 뭐야"`, 셋째 칸의 "왜"와 "언제"를 점으로 이은 자리 → `왜와 언제` |
| G17 | decision-flow.md:268 | `- 그 개발자가 모를 수 있는 말` | `이 저장소, 이 도메인, 이 플러그인 안에서만 통하는 용어와 **식별자**(요구사항 번호나 이슈 번호 같은 것)` — 같은 줄 뒤의 후보 괄호도 같은 모양 |
| G18 | decision-flow.md:429 | `1. **선택지 낱말과 식별자**` | `(이 저장소, 이 도메인, 이 플러그인 안에서만 통하는 용어와 식별자 — 식별자는 모양으로 센다: \`REQ-\`, \`GOAL-\`, 이슈 번호, 백틱으로 감싼 이름)` |
| G19 | decision-flow.md:257 헤딩 | `## 공통 형식` | `## 공통 형식과 언어 (결정과 질문 공통 — 형식과 언어의 원본)` |
| G20 | decision-flow.md:277 헤딩 | `### 결정` | `### 결정과 질문 구조 규범` |
| G21 | decision-flow.md:164 헤딩 | `## 6. 상태 보존` | `## 6. 상태 보존 (세션 이관과 컨텍스트 압축)` |
| G22 | workflow-orchestrator/SKILL.md:265 헤딩 | `### 경량 사이클` | `### 경량 사이클 (심각도: 경미나 중간)` |
| G23 | brainstorming/SKILL.md:288 헤딩 | `### Step B-1:` | `### Step B-1: 작업 방향 확인 + 기능명 (REQ-005, 확정 1)` |
| G24 | 절 이름 참조 열다섯 줄 | `「결정` 또는 `「공통 형식` | `「결정과 질문 구조 규범」`, `「공통 형식과 언어」` — decision-flow 9, 80, 160행, SKILL 431행, ux-consistency 157, 167, 179, 248, 325, 329행, reask-reassembly 78행 등 옛 이름 둘을 `git grep -n`으로 전수 검색 |
| G25 | "또는" 자리 아홉 | 아래 | decision-flow:54 `조사나 무관 주제로`. bootstrap:36 `라운드나 조사 선행 시`(둘). SKILL:431과 435 `라운드나 조사가 있었으면`. grounding.md:26 `라운드나 조사가 있었는가`. context-handling:90 `라운드나 조사 유무`. hooks/intake-nudge:27 `결함이나 리팩터링 계열`. brainstorming/SKILL.md:67 `코드 이름(백틱이나 대문자 식별자)이나 경로 조각`. hooks/completion-nudge:40 `코드나 파일에 대한` |
| G26 | bootstrap.md:8 | `- 단계 키워드:` | `- 단계 키워드: 아래 단계 감지 요약 표의 「신호」 열을 그대로 쓴다` |
| G27 | bootstrap.md:36 구조 | `- 결정 요청 형식 상세는` | 첫 줄은 `...를 Read하여 따른다. 폴백:`으로 끝내고, 괄호 안 항목을 들여쓴 하위 불릿으로 나눈다(괄호 없음). 검사 다섯은 `내보내기 전 검사 여섯 —` 아래 ①~⑥ 각각 한 줄 |
| G28 | code-name-lookup.md:124 | `> 📋 확정 3/7` | `> 📋 확정 3/7, 진행 중: \`Backfill\`(...) 경로의 짧은 틈을 어떻게 다룰 것인가 — ...` (뒤는 규칙대로) |
| G29 | reask-reassembly.md:136 | `📋 확정 0/1` | `📋 확정 0/1, 진행 중: 갈래 축을 어떻게 넣을 것인가` |
| G30 | ux-consistency.md:217 | `❓ 질문 진행: [N]/[M]` | `❓ 질문 진행: [N]/[M], 국면: [국면명]` |
| G31 | README.md:363, context-handling/SKILL.md:241 | `(PLAN 대기` / `(Phase 1 완료` | `(PLAN 대기, ⚠️ HANDOFF 없음)` / `(Phase 1 완료, ⚠️ HANDOFF 없음)` |
| G32 | README.md:113 | `**기본값 예:**` | 두 불릿 — `- 브레인스토밍: 🎮 Game Designer, 👤 Player, 🔧 TD(기술 검증 담당 — Phase 3 합류)` / `- 계획: 🏛️ Architect, 🔧 Tech Lead, 📋 PM` + 뒤 문장은 그대로 한 줄 |
| G33 | 언어 규범 요약 자리 넷 (bootstrap:32, SKILL:267과 404, templates:3, brainstorming/SKILL.md 페르소나 공통 줄) | `표준 용어는 그대로` | 술어 나열을 쉼표로: `표준 용어는 그대로, 저장소에 없는 낱말로 개념에 이름 붙이지 않기, 코드에 적히는 이름 번역 금지, 저장소 고유 용어와 식별자는 즉석 풀이(병기) — 번호만 쓰지 않고 무엇인지 한 조각을 함께 적는다 — 내보내기 전에 풀이 없는 것을 센다 — 도메인 명사는 세션 목록 또는 코드 자리에서 1건 이상, 가운뎃점(·) 금지 — 나열은 쉼표와 와/과, 줄임말 금지, 문단 개행, 화면 폭에 맞춘 임의 줄바꿈 금지` (조각 넷 보존) |
| G34 | 검사 여섯째 조각 (bootstrap:36 폴백, SKILL:432) | `⑤` 뒤 | `⑥ 화면에 가운뎃점(·)이 있으면 쉼표와 와/과나 줄 나눔으로 고쳐 쓰기(모든 화면)` 그리고 `검사 다섯` → `검사 여섯` |

### 새 규범 문면 (Task 2가 정본에 넣는 값)

언어 규범 펜스 마지막 줄 뒤에 추가:

```
- 가운뎃점(·)을 쓰지 않는다 — 문장 안 나열은 쉼표와 "와/과"로 잇고 "와/과"는 마지막 한 번만 쓴다. "또는" 뜻이면 "나/이나"로 잇는다. 항목이 쉼표나 줄표를 품거나 나열이 두 층이면 줄을 나눠 불릿으로 쓴다. 표 칸, 커밋 제목과 한 줄 표시처럼 줄을 못 나누는 자리는 쉼표로 잇고, 항목 안에 쉼표가 들면 어순을 바꿔 없앤다. 술어 나열은 쉼표로만 잇는다. "그리고"는 층 나누기에 쓰지 않는다 (예: "스테이징 대상은 스크립트, 시나리오와 설계 문서 세 파일이고, matching.csv는 제외합니다")
```

「내보내기 전 검사」 5번 블록 뒤에 추가:

```
6. **가운뎃점** — 화면 전체에서 이름 부르기 "가운뎃점(·)"을 뺀 가운뎃점(·)이 1개라도 있으면 실패 — 「언어 규범」의 가운뎃점 줄대로 쉼표와 "와/과"나 줄 나눔으로 고쳐 쓴 뒤 내보낸다. 이미 써 둔 문장을 다시 보는 검사라 별도 생성이 없다
   - **적용 자리:** 모든 사용자 대면 화면 — 박스가 없는 통보문과 페르소나 발언 나열도 포함한다
```

---

### Task 1: 검사 도구 셋과 스크립트 주석

**모델:** researcher(sonnet) — 스크립트 작성은 판단이 든다

**Files:**
- Modify: `tests/hooks/test-restatements.sh` (헬퍼 하나, 도착 검사 여섯, 주석 8줄: 2, 83, 116, 128, 172, 180, 188, 194행)
- Create: `scripts/diff-check.mjs`
- Create: `scripts/transcript-dots.mjs`
- Modify: `scripts/sweep:21`, `scripts/check-restatements:2`, `scripts/bump-version:56`, `tests/hooks/test-completion-nudge.sh:37` (주석이나 echo 문자열의 점만)

**Interfaces:**
- Produces: `dot_residue` (bash 함수, `DOT_GATE=off`면 건수만 보고), `node scripts/diff-check.mjs <base-ref>` (stdout에 hunk마다 `OK|READ|FAIL|DOMAIN-BULLET <file> <line> <reason>`), `node scripts/transcript-dots.mjs <session.jsonl>` (stdout에 `<출처> <줄 원문>`과 마지막 요약)
- Consumes: 없음 (첫 태스크)

- [ ] **Step 1: `tests/hooks/test-restatements.sh`에 잔존 헬퍼를 더한다**

`residue()` 함수 정의 바로 아래(48행 뒤)에 추가:

```bash
# 가운뎃점(·) 잔존 — 포함 목록 아홉과 제외 경로 셋. 이름 문구 "가운뎃점(...)"을 지운 뒤 남는 것을 센다.
# 패턴은 바이트로 조립해 이 스크립트 자신이 0건을 유지한다. DOT_GATE=off면 건수만 보고하고 rc를 올리지 않는다.
dot=$'\xc2\xb7'
dot_residue() {
  echo "== 가운뎃점 잔존 검사 (이름 문구 제외) =="
  local hits n
  hits=$(git grep -nI --untracked -e "$dot" -- \
      skills commands hooks README.md CLAUDE.md tasks/lessons.md tests scripts docs/design \
      ':(exclude)**/phase[0-9]_*.md' ':(exclude)**/_archive/**' ':(exclude)**/evidence/**' 2>/dev/null \
    | sed "s/가운뎃점(${dot})//g" | grep -e "$dot" || true)
  n=$(printf '%s' "$hits" | grep -c . || true)
  if [ "${n:-0}" -eq 0 ]; then
    echo "   0건"
  else
    printf '%s\n' "$hits" | cut -c1-120 | head -40
    echo "   ${n}건 — 가운뎃점이 남아 있다"
    [ "${DOT_GATE:-on}" = off ] || rc=1
  fi
}
```

파일 끝 `exit "$rc"` 바로 앞에 호출을 추가:

```bash
# 가운뎃점 — 잔존 0건과 도착 여섯 (middle-dot-removal 1.27.2)
dot_residue
arrival '가운뎃점(' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/bootstrap.md
arrival_min 2 '가운뎃점(' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md
arrival '확정 N/M, 진행 중:' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md
arrival '확정 \[N\]/\[M\], 진행 중:' \
  skills/context-handling/SKILL.md
arrival '확정 N/M,' \
  skills/workflow-orchestrator/bootstrap.md
arrival '결정과 질문 구조 규범' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md
arrival '공통 형식과 언어' \
  skills/workflow-orchestrator/decision-flow.md
arrival '다시 씀: 왜 문제인지와 고르면 어떻게 되는지' \
  skills/workflow-orchestrator/decision-flow.md
```

- [ ] **Step 2: 검사 스크립트의 주석과 문자열에서 점을 지운다**

`tests/hooks/test-restatements.sh` 주석 8줄(2, 83, 116, 128, 172, 180, 188, 194행), `scripts/sweep` 21행 주석, `scripts/check-restatements` 2행 주석, `scripts/bump-version` 56행 echo 문자열, `tests/hooks/test-completion-nudge.sh` 37행을 규칙 문장대로 쉼표와 "와/과"로 고친다. 검사 패턴 문자열은 건드리지 않는다.

- [ ] **Step 3: 헬퍼가 지금 저장소에서 626줄 안팎을 보고하고 rc를 올리지 않는지 확인한다**

Run: `DOT_GATE=off bash tests/hooks/test-restatements.sh | tail -30; echo rc=$?`
Expected: `가운뎃점 잔존 검사` 아래 600줄 안팎의 건수, 새 도착 검사 여섯은 아직 0건이라 실패로 표시되지만 `DOT_GATE=off`와 무관하게 rc=1이다 — 이 태스크에서는 **잔존 헬퍼가 rc를 올리지 않는 것**(`DOT_GATE=off`일 때)과 **스크립트 자신이 잔존 목록에 없는 것**만 확인한다: `bash tests/hooks/test-restatements.sh 2>/dev/null | grep -c 'tests/hooks/test-restatements.sh'` → `0`

- [ ] **Step 4: 대조 스크립트를 만든다**

`scripts/diff-check.mjs`:

```js
#!/usr/bin/env node
// 스윕 diff의 hunk마다 뜻 보존을 기계로 본다 (middle-dot-removal REQ-017).
// 사용: node scripts/diff-check.mjs <base-ref> [-- <경로>...]
// 출력: 한 줄에 하나 — OK | READ | FAIL | DOMAIN-BULLET, 파일, 새 줄 번호, 사유
import { execFileSync } from "node:child_process";

const DOT = "\u00B7";
const [base, ...rest] = process.argv.slice(2);
if (!base) { console.error("usage: diff-check.mjs <base-ref> [-- paths]"); process.exit(2); }
const diff = execFileSync("git", ["diff", "-U0", "--no-color", base, "--", ...rest.filter(p => p !== "--")], { encoding: "utf8", maxBuffer: 1 << 28 });

const DOMAIN = /^docs\/design\/[^/]+\/[^/]+\.md$/;            // 도메인 문서 최상위
const FEATURE = /^docs\/design\/[^/]+\/(code-name-lookup|reask-reassembly|question-numbering|decision-label-linebreak)\//;
const ALLOW_NEW = new Set([",", " ", "\n", "-", "와", "과", "나", "이"]); // "이나"의 "이"
const strip = s => s.replace(/\r/g, "");

function jongseong(ch) { const c = ch.codePointAt(0); if (c < 0xac00 || c > 0xd7a3) return null; return (c - 0xac00) % 28; }
function particleErrors(text) {
  const errs = [];
  for (const m of text.matchAll(/(\S)(와|과)(?=\s|$)/g)) {
    const j = jongseong(m[1]); if (j === null) continue;
    if ((j === 0 && m[2] === "과") || (j !== 0 && m[2] === "와")) errs.push(m[1] + m[2]);
  }
  return errs;
}
function counts(s) { const m = new Map(); for (const ch of s) m.set(ch, (m.get(ch) || 0) + 1); return m; }

let file = null, out = [];
const lines = diff.split("\n");
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (L.startsWith("+++ b/")) { file = L.slice(6); continue; }
  const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(L);
  if (!h) continue;
  const newLine = Number(h[1]);
  let old = [], neu = [];
  for (i++; i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff "); i++) {
    if (lines[i].startsWith("-")) old.push(strip(lines[i].slice(1)));
    else if (lines[i].startsWith("+")) neu.push(strip(lines[i].slice(1)));
  }
  i--;
  const o = old.join("\n"), n = neu.join("\n");
  const oc = counts(o), nc = counts(n);
  const onlyOld = [], onlyNew = [];
  for (const [ch, k] of oc) { const d = k - (nc.get(ch) || 0); if (d > 0) onlyOld.push([ch, d]); }
  for (const [ch, k] of nc) { const d = k - (oc.get(ch) || 0); if (d > 0) onlyNew.push([ch, d]); }
  const dots = oc.get(DOT) || 0;
  const reasons = [];
  if (onlyOld.some(([ch]) => ch !== DOT)) reasons.push("옛 쪽에만 남는 글자: " + onlyOld.filter(([c]) => c !== DOT).map(([c, d]) => `${JSON.stringify(c)}x${d}`).join(" "));
  if (onlyNew.some(([ch]) => !ALLOW_NEW.has(ch))) reasons.push("새 쪽에만 남는 글자: " + onlyNew.filter(([c]) => !ALLOW_NEW.has(c)).map(([c, d]) => `${JSON.stringify(c)}x${d}`).join(" "));
  const newParticles = onlyNew.filter(([c]) => c === "와" || c === "과" || c === "나").reduce((a, [, d]) => a + d, 0);
  if (newParticles > dots) reasons.push(`새 조사 ${newParticles} > 지운 점 ${dots}`);
  const pe = particleErrors(n); if (pe.length) reasons.push("받침: " + pe.join(" "));
  const newBullet = neu.some(l => /^\s*- /.test(l)) && !old.some(l => /^\s*- /.test(l));
  const isDoc = DOMAIN.test(file) || FEATURE.test(file);
  // 분류: 도메인 문서의 새 불릿 → DOMAIN-BULLET. 글자 차이 사유가 있으면 층 나누기(줄이 늘고 점이 있었음)는 READ, 아니면 FAIL.
  // 사유가 없어도 줄 수가 달라졌거나(층 나누기) 구분자를 뺀 글자 순서가 달라졌으면(어순 재배치) READ. 그 밖은 OK.
  const core = t => [...t].filter(c => c !== DOT && !ALLOW_NEW.has(c)).join("");
  const reordered = core(o) !== core(n);
  let tag;
  if (isDoc && newBullet) tag = "DOMAIN-BULLET";
  else if (reasons.length) tag = (neu.length > old.length && dots > 0) ? "READ" : "FAIL";
  else if (neu.length !== old.length || reordered) tag = "READ";
  else tag = "OK";
  out.push(`${tag}\t${file}\t${newLine}\t${reasons.join("; ")}`);
}
const tally = {};
for (const l of out) { const t = l.split("\t")[0]; tally[t] = (tally[t] || 0) + 1; }
console.log(out.join("\n"));
console.log("--- " + Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(", "));
process.exit(tally.FAIL || tally["DOMAIN-BULLET"] ? 1 : 0);
```

- [ ] **Step 5: 대조 스크립트를 픽스처로 검증한다**

스크래치에 임시 저장소를 만들어 네 hunk를 만든다 — (a) 평탄 치환: "사과, 배, 복숭아"를 점으로 이은 줄 → `사과, 배와 복숭아` (b) 낱말 훼손: "결과 보고, 확인"을 점으로 이은 줄 → `결 보고, 확인` (c) 받침 오류: "사과, 배"를 점으로 이은 줄 → `사과과 배` (d) `docs/design/x/y.md` 평문에 새 불릿 셋:

Run: `dot=$'\xc2\xb7' && d=$(mktemp -d) && cd "$d" && git init -q && mkdir -p docs/design/x && printf "사과${dot}배${dot}복숭아\n결과 보고${dot}확인\n사과${dot}배\n" > a.md && printf "계산${dot}논리, 코드${dot}문서\n" > docs/design/x/y.md && git add -A && git commit -qm base && printf '사과, 배와 복숭아\n결 보고, 확인\n사과과 배\n' > a.md && printf -- '- 계산과 논리\n- 코드와 문서\n' > docs/design/x/y.md && git add -A && git commit -qm new && node <워크트리>/scripts/diff-check.mjs HEAD~1; echo rc=$?`
Expected: 첫 줄 `OK`, 둘째 `FAIL ... 옛 쪽에만 남는 글자: "과"x1` (또는 같은 뜻), 셋째 `FAIL ... 받침: 사과과`, 넷째 `DOMAIN-BULLET`, rc=1

- [ ] **Step 6: transcript 스크립트를 만든다**

`scripts/transcript-dots.mjs`:

```js
#!/usr/bin/env node
// 세션 transcript(assistant 텍스트)에서 가운뎃점(·)을 센다 (middle-dot-removal REQ-021).
// 사용: node scripts/transcript-dots.mjs <session.jsonl>
// 메인 파일과 같은 이름 폴더의 subagents/agent-*.jsonl을 함께 읽고, 출처(main/worker)를 앞에 붙인다.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const DOT = "\u00B7";
const NAME = /가운뎃점\(\u00B7\)/g;
const file = process.argv[2];
if (!file) { console.error("usage: transcript-dots.mjs <session.jsonl>"); process.exit(2); }

function* texts(path) {
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    if (!raw.trim()) continue;
    let j; try { j = JSON.parse(raw); } catch { continue; }
    if (j.type !== "assistant") continue;
    const content = j.message && j.message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) if (c.type === "text" && typeof c.text === "string") yield c.text;
  }
}
const sources = [["main", file]];
const sub = join(dirname(file), basename(file, ".jsonl"), "subagents");
if (existsSync(sub)) for (const f of readdirSync(sub)) if (/^agent-.*\.jsonl$/.test(f)) sources.push(["worker", join(sub, f)]);

let bad = 0, total = 0, listy = 0;
for (const [src, path] of sources) {
  for (const t of texts(path)) {
    for (const line of t.split("\n")) {
      total++;
      if (/, |^\s*- /.test(line)) listy++;                       // 쉼표나 불릿 나열이 있는 줄(도착 조건의 분모)
      const cleaned = line.replace(NAME, "");
      if (cleaned.includes(DOT)) { bad++; console.log(`${src}\t${line.slice(0, 160)}`); }
    }
  }
}
console.log(`--- assistant 줄 ${total}, 나열 줄 ${listy}, 가운뎃점 줄 ${bad}, 출처 ${sources.length}개 파일`);
process.exit(bad ? 1 : 0);
```

- [ ] **Step 7: transcript 스크립트를 이 세션 파일로 돌려 형식을 확인한다**

Run: `node scripts/transcript-dots.mjs "C:/Users/sangtakeg/.claude/projects/C--Users-sangtakeg-orca-workspaces-dev-workflow-opah/fc636680-9859-46ff-aa34-66aab1d533c0.jsonl" | tail -3`
Expected: 마지막 줄이 `--- assistant 줄 N, 나열 줄 M, 가운뎃점 줄 K, 출처 P개 파일` 모양이고 P가 2 이상(워커 파일이 잡힘). K는 이 세션이 점을 주제로 다루므로 0이 아니어도 된다

- [ ] **Step 8: 커밋**

```bash
git add tests/hooks/test-restatements.sh tests/hooks/test-completion-nudge.sh scripts/diff-check.mjs scripts/transcript-dots.mjs scripts/sweep scripts/check-restatements scripts/bump-version
git commit -m "test(middle-dot-removal): 가운뎃점 잔존 헬퍼와 도착 검사 여섯, 대조 스크립트와 transcript 스크립트"
```

---

### Task 2: 정본 decision-flow.md (규범 줄, 검사 여섯째, 고정표 값, 나머지 전부)

**모델:** researcher(sonnet) — 층 판정 파일

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (점이 든 줄 90, 점 177개)

**Interfaces:**
- Consumes: Task 1의 `diff-check.mjs`, `DOT_GATE=off` 검사
- Produces: 언어 규범 펜스의 새 줄(워커 프롬프트 열한 곳이 실행 시점에 복제), 검사 6번 블록, G1, G8, G9, G12~G21, G24 일부, G25 일부의 확정 문면. 절 이름 「결정과 질문 구조 규범」, 「공통 형식과 언어」

- [ ] **Step 1: 언어 규범 펜스에 새 줄을 넣는다** — 펜스 마지막 줄(슬래시 압축 금지 줄) 뒤에 위 「새 규범 문면」의 첫 블록을 그대로 넣는다. 그 뒤 펜스 안의 다른 줄들(266행의 표준 용어 셋을 점으로 이은 자리 등)을 규칙대로 고친다 — G17이 268행

- [ ] **Step 2: 「내보내기 전 검사」에 6번 블록을 넣는다** — 5번 곁가지 블록의 `- **적용 자리:** 선택지를 내는 모든 박스` 뒤에 위 「새 규범 문면」의 둘째 블록을 넣는다. 검사를 세는 머리말이 "다섯"이면 "여섯"으로 고친다(`grep -n '검사 다섯' skills/workflow-orchestrator/decision-flow.md`로 자리 확인)

- [ ] **Step 3: 고정표 자리를 값 그대로 고친다** — G1(50행), G8(253행), G9(249행), G12(489행), G13(360행), G14~G16(355~357행), G17(268행), G18(429행), G19(257행), G20(277행), G21(164행), G25의 54행, G24의 9, 80, 160행

- [ ] **Step 4: 나머지 줄을 규칙대로 고친다** — `grep -n $'\xc2\xb7' skills/workflow-orchestrator/decision-flow.md`로 남은 줄을 전부 연다. 층이 있는 줄(14행 재서술 목록 항목 설명처럼 쉼표와 점이 섞인 줄)은 하위 불릿으로 내린다. 재서술 지점 목록(12~23행) 항목 설명의 점도 같은 규칙이다. 표 칸은 쉼표만

- [ ] **Step 5: 자기 검사** — Run: `grep -c $'\xc2\xb7' skills/workflow-orchestrator/decision-flow.md` Expected: 이름 문구 "가운뎃점(·)"이 든 줄 수와 같다(규범 줄 1, 검사 6번 블록 2 — 셋 안팎). Run: `dot=$'\xc2\xb7'; sed "s/가운뎃점(${dot})//g" skills/workflow-orchestrator/decision-flow.md | grep -c $'\xc2\xb7'` Expected: `0`

- [ ] **Step 6: 대조와 검사** — Run: `node scripts/diff-check.mjs HEAD -- skills/workflow-orchestrator/decision-flow.md | tail -5` Expected: `FAIL 0`, `DOMAIN-BULLET 0`. Run: `DOT_GATE=off bash tests/hooks/run-all.sh | grep -v '^   ' | tail -20` Expected: 잔존 헬퍼 건수가 Task 1 때보다 90줄 안팎 줄었고, `결정과 질문 구조 규범`, `공통 형식과 언어`, `다시 씀: 왜 문제인지와`, `확정 N/M, 진행 중:`(decision-flow) 도착이 통과, `scripts/check-restatements`가 `12/12`

- [ ] **Step 7: 커밋**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "docs(decision-flow): 가운뎃점 금지 규범 줄과 검사 여섯째 항목, 고정표 값, 정본 전체 스윕"
```

---

### Task 3: workflow-orchestrator 폴더 나머지 (bootstrap, SKILL, references 넷)

**모델:** researcher(sonnet) — 층 판정 파일

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md` (12줄 49개 — 8, 32, 36행 포함)
- Modify: `skills/workflow-orchestrator/SKILL.md` (44줄 — 172, 265, 267, 404, 431, 432, 435, 436행 포함)
- Modify: `skills/workflow-orchestrator/references/grounding.md` (3줄, 26행), `references/actions.md` (5줄), `references/completion-protocol.md` (3줄), `references/code-name-patterns.md` (4줄 — 표 이스케이프 주석 줄은 `\|` 표기를 건드리지 않는다)

**Interfaces:**
- Consumes: Task 2의 절 이름 둘과 규범 문면
- Produces: G2, G3, G11, G22, G25(bootstrap 둘, SKILL 둘, grounding), G26, G27, G33(bootstrap:32, SKILL:267과 404), G34(bootstrap:36, SKILL:432)

- [ ] **Step 1: bootstrap.md** — 8행은 G26. 32행은 G33(도착 조각 `식별자는 즉석 풀이`, `풀이 없는 것`, `코드 자리에서 1건 이상`을 끊지 않는다). 36행은 G27 구조로 풀되 안의 값은 G3(헤더), G25(라운드나 조사 둘), G34(⑥과 "검사 여섯")를 쓴다. 나머지 9줄은 규칙대로

- [ ] **Step 2: SKILL.md** — 172행 G11, 265행 G22, 267행과 404행 G33, 431행과 435행 G25, 432행 G34, 436행 G2, 431행의 절 이름 G24. 나머지 줄은 규칙대로(표 칸 쉼표, 층은 하위 불릿)

- [ ] **Step 3: references 넷** — grounding.md 26행 G25, 나머지는 규칙대로

- [ ] **Step 4: 자기 검사** — Run: `for f in skills/workflow-orchestrator/bootstrap.md skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/references/*.md; do printf '%s ' "$f"; dot=$'\xc2\xb7'; sed "s/가운뎃점(${dot})//g" "$f" | grep -c $'\xc2\xb7'; done` Expected: 모두 `0`. Run: `wc -l -c skills/workflow-orchestrator/bootstrap.md` Expected: 줄 수와 바이트를 보고서에 적는다(Task 9가 9절에 옮김)

- [ ] **Step 5: 대조와 검사** — Run: `node scripts/diff-check.mjs HEAD -- skills/workflow-orchestrator | tail -3` Expected: `FAIL 0`. Run: `DOT_GATE=off bash tests/hooks/run-all.sh | grep -v '^   ' | tail -25` Expected: 잔존 헬퍼 밖의 실패 0 — 특히 `식별자는 즉석 풀이`, `풀이 없는 것`, `코드 자리에서 1건 이상`(bootstrap 2, SKILL 3), `가운뎃점(` 도착(bootstrap 2 이상, SKILL 2 이상), `확정 N/M,`(bootstrap), `확정 N/M, 진행 중:`(SKILL)

- [ ] **Step 6: 커밋**

```bash
git add skills/workflow-orchestrator
git commit -m "docs(orchestrator): bootstrap 폴백 불릿화와 조각, SKILL 폴백과 헤더, references 넷 스윕"
```

---

### Task 4: 스킬 여섯 (brainstorming, templates, plan-stage, context-handling, merge-to-domain, document-consolidation)

**모델:** researcher(sonnet)

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (26줄 — 67, 288행, 페르소나 공통 줄의 언어 요약), `skills/brainstorming/references/templates.md` (14줄 — 3, 56행), `skills/plan-stage/SKILL.md` (8줄), `skills/context-handling/SKILL.md` (15줄 — 84, 86, 88, 90, 116, 241행), `skills/merge-to-domain/SKILL.md` (15줄), `skills/document-consolidation/SKILL.md` (10줄)

**Interfaces:**
- Consumes: Task 2 규범 문면, 고정표
- Produces: G4~G7, G10, G23, G25(brainstorming:67), G31(context-handling:241), G33(templates:3, brainstorming 공통 줄)

- [ ] **Step 1: context-handling/SKILL.md** — 84, 86, 88행은 G4~G6. 90행 G25. 116행 G7. 241행 G31. 나머지는 규칙대로. HANDOFF 템플릿 안 다른 줄(되물음 횟수와 밟은 갈래 줄 등)은 쉼표와 "와" — 도착 조각 `다시 씀: `과 `밟은 갈래` 보존

- [ ] **Step 2: brainstorming/SKILL.md와 templates.md** — 67행 G25, 288행 G23, 페르소나 발언 공통 줄의 언어 요약은 G33. templates 3행 G33, 56행 G10. 나머지는 규칙대로(프롬프트 펜스 안의 점도 대상이다)

- [ ] **Step 3: plan-stage, merge-to-domain SKILL, document-consolidation** — 규칙대로. 표 칸은 쉼표만

- [ ] **Step 4: 자기 검사와 대조** — Run: `for f in skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md skills/plan-stage/SKILL.md skills/context-handling/SKILL.md skills/merge-to-domain/SKILL.md skills/document-consolidation/SKILL.md; do printf '%s ' "$f"; dot=$'\xc2\xb7'; sed "s/가운뎃점(${dot})//g" "$f" | grep -c $'\xc2\xb7'; done` Expected: 모두 `0`. Run: `node scripts/diff-check.mjs HEAD -- skills | tail -3` Expected: `FAIL 0`. Run: `DOT_GATE=off bash tests/hooks/run-all.sh | grep -v '^   ' | tail -25` Expected: 잔존 헬퍼 밖 실패 0 — `확정 [N]/[M], 진행 중:`(context-handling) 도착 통과, `--- 코드 이름 목록 ---` 8과 3 유지, `scripts/check-restatements` 12/12

- [ ] **Step 5: 커밋**

```bash
git add skills/brainstorming skills/plan-stage skills/context-handling skills/merge-to-domain/SKILL.md skills/document-consolidation
git commit -m "docs(skills): HANDOFF 템플릿 줄과 안내줄 고정표 값, 스킬 여섯 스윕"
```

---

### Task 5: 작은 스킬 넷, merge-to-domain 템플릿, commands 둘, hooks 셋 (grunt)

**모델:** grunt(haiku) — 점 1~6개짜리 파일, 층 없음

**Files:**
- Modify: `skills/development-principles/SKILL.md` (6줄), `skills/design-summary/SKILL.md` (2줄), `skills/rules-injection/SKILL.md` (1줄), `skills/persona-resolution/SKILL.md` (1줄), `skills/merge-to-domain/references/templates.md` (5줄), `commands/setup.md` (1줄), `commands/finish.md` (1줄), `hooks/session-start` (3행 주석), `hooks/intake-nudge` (27행), `hooks/completion-nudge` (40행)

**Interfaces:**
- Consumes: 고정표 G25(intake-nudge:27, completion-nudge:40)
- Produces: 없음

- [ ] **Step 1: 각 파일의 점이 든 줄을 연다** — Run: `git grep -n $'\xc2\xb7' -- skills/development-principles skills/design-summary skills/rules-injection skills/persona-resolution skills/merge-to-domain/references commands hooks`

- [ ] **Step 2: 규칙대로 고친다** — intake-nudge 27행과 completion-nudge 40행은 G25 값. 나머지는 쉼표와 "와/과"(층이 있으면 하위 불릿, 표 칸은 쉼표). 훅 스크립트는 heredoc 본문의 문구만 고치고 bash 구문은 건드리지 않는다

- [ ] **Step 3: 검증** — Run: `bash -n hooks/session-start && bash -n hooks/intake-nudge && bash -n hooks/completion-nudge && echo syntax-ok` Expected: `syntax-ok`. Run: `bash tests/hooks/test-intake-nudge.sh | tail -1; bash tests/hooks/test-completion-nudge.sh | tail -1` Expected: 둘 다 통과. Run: `git grep -c $'\xc2\xb7' -- skills/development-principles skills/design-summary skills/rules-injection skills/persona-resolution skills/merge-to-domain/references commands hooks` Expected: 출력 없음(0건). Run: `git diff --stat HEAD -- skills/development-principles skills/design-summary skills/rules-injection skills/persona-resolution skills/merge-to-domain/references commands hooks` Expected: 파일마다 변경 줄 수가 Step 1의 점 든 줄 수와 같다(층 나누기 없음)

- [ ] **Step 4: 커밋**

```bash
git add skills/development-principles skills/design-summary skills/rules-injection skills/persona-resolution skills/merge-to-domain/references commands hooks
git commit -m "docs(skills,hooks): 작은 스킬과 commands와 훅 주입 문구의 가운뎃점 스윕"
```

---

### Task 6: 도메인 문서 일곱 (평문은 한 문장 유지)

**모델:** researcher(sonnet)

**Files:**
- Modify: `docs/design/dev-workflow/ux-consistency.md` (43줄 — 157, 167, 179, 217, 248, 325, 329행 포함), `document-management.md` (19줄), `plugin-architecture.md` (18줄), `workflow-lifecycle.md` (11줄), `session-management.md` (7줄), `thinking-enhancement.md` (5줄), `project-customization.md` (3줄)

**Interfaces:**
- Consumes: G24(ux-consistency 여섯 줄), G30(217행)
- Produces: 없음

- [ ] **Step 1: 규칙대로 고치되 평문 단락은 불릿으로 내리지 않는다** — 층이 있는 평문(예: ux-consistency 65행 — 세 종류를 쉼표로 잇고 안쪽을 점으로 이은 줄)은 `계산과 논리, 프로젝트 내 코드와 문서, 외부 공식 문서`처럼 안쪽 층을 "와/과"로, 바깥 층을 쉼표로 둔다. 이미 불릿인 줄은 그대로 불릿. 표 칸은 쉼표. 157, 167, 179, 248, 325, 329행의 절 이름은 G24. 217행은 G30

- [ ] **Step 2: 자기 검사와 대조** — Run: `git grep -c $'\xc2\xb7' -- 'docs/design/dev-workflow/*.md'` Expected: 출력 없음. Run: `node scripts/diff-check.mjs HEAD -- 'docs/design/dev-workflow/*.md' | tail -3` Expected: `FAIL 0`, `DOMAIN-BULLET 0`. Run: `git diff --stat HEAD -- 'docs/design/dev-workflow/*.md'` Expected: 파일마다 변경 줄 수가 점 든 줄 수와 같다(불릿 내림이 없으므로)

- [ ] **Step 3: 커밋**

```bash
git add 'docs/design/dev-workflow/*.md'
git commit -m "docs(domain): 도메인 문서 일곱의 가운뎃점 스윕, 평문은 한 문장 유지"
```

---

### Task 7: complete feature 문서 넷과 옛 인용 참조, 이 기능의 문서

**모델:** researcher(sonnet)

**Files:**
- Modify: `docs/design/dev-workflow/code-name-lookup/code-name-lookup.md` (71줄 — 120, 121, 124, 125, 128, 129행 포함), `reask-reassembly/reask-reassembly.md` (59줄 — 78, 136행), `question-numbering/question-numbering.md` (24줄), `decision-label-linebreak/decision-label-linebreak.md` (21줄)
- Modify: `docs/design/dev-workflow/middle-dot-removal/HANDOFF.md` (이름 문구 밖 점이 있으면), `seed.yaml` (이름 문구 밖 점이 있으면)

**Interfaces:**
- Consumes: G24(reask-reassembly:78), G28, G29
- Produces: 없음

- [ ] **Step 1: 옛 화면 인용을 참조로 바꾼다** — code-name-lookup.md 121, 125, 129행의 "직전 화면: `...`"은 화면 조각을 지우고 `직전 화면: evidence 696행(옛 헤더 모양 그대로)`처럼 evidence 행 번호와 무엇을 볼지 한 조각만 남긴다(평문, 불릿 아님). 120행의 참조 줄(사례 행 셋을 점으로 이은 것)은 `사례 696행, 706행과 716행`. 124행과 128행의 되돌린 화면은 살아 있는 참조라 G28대로 새 모양. reask-reassembly 136행은 G29. 78행은 G24

- [ ] **Step 2: 나머지 줄은 규칙대로, 평문은 불릿으로 내리지 않는다** — Task 6과 같은 규칙(feature 문서도 digest 입력)

- [ ] **Step 3: 이 기능의 HANDOFF.md와 seed.yaml** — Run: `for f in docs/design/dev-workflow/middle-dot-removal/HANDOFF.md docs/design/dev-workflow/middle-dot-removal/seed.yaml docs/design/dev-workflow/middle-dot-removal/middle-dot-removal.md docs/design/dev-workflow/middle-dot-removal/plan.md; do printf '%s ' "$f"; dot=$'\xc2\xb7'; sed "s/가운뎃점(${dot})//g" "$f" | grep -c $'\xc2\xb7'; done` Expected: 모두 `0`. 아니면 그 줄을 규칙대로 고친다(phase 파일은 면제라 건드리지 않는다)

- [ ] **Step 4: 자기 검사와 대조** — Run: `git grep -c $'\xc2\xb7' -- docs/design ':(exclude)**/phase[0-9]_*.md' ':(exclude)**/_archive/**' ':(exclude)**/evidence/**' | grep -v 'middle-dot-removal'` Expected: 출력 없음. Run: `node scripts/diff-check.mjs HEAD -- docs/design | tail -3` Expected: `FAIL 0`, `DOMAIN-BULLET 0`. Run: `git diff -U0 HEAD -- docs/design/dev-workflow/code-name-lookup/code-name-lookup.md | grep '^-' | grep -c '📋 확정 3/7'` Expected: `2`(121, 125행 인용 두 줄이 지워짐 — 129행 것은 다른 헤더면 1) — 인용 원문이 치환되지 않고 지워진 것을 확인

- [ ] **Step 5: 커밋**

```bash
git add docs/design
git commit -m "docs(design): complete feature 문서 넷 스윕, 옛 화면 인용은 evidence 행 번호 참조로"
```

---

### Task 8: README, CLAUDE.md, tasks/lessons.md

**모델:** researcher(sonnet)

**Files:**
- Modify: `README.md` (18줄 — 93, 113, 145, 363, 545행 포함), `CLAUDE.md` (4줄), `tasks/lessons.md` (39줄)

**Interfaces:**
- Consumes: G31(README:363), G32(README:113)
- Produces: README 545행 언어 규범 문단에 가운뎃점 문장 하나

- [ ] **Step 1: README** — 113행 G32, 363행 G31, 145행 표 칸은 쉼표, 93행 괄호 안 "직접 실행 테스트"와 "검증 포함"을 점으로 이은 것은 "직접 실행 테스트와 검증 포함". 545행 문단 끝에 한 문장을 더한다: `나열은 가운뎃점(·) 대신 쉼표와 "와/과"로 잇고, 따로 보여야 하면 줄을 나눕니다.` 나머지는 규칙대로(본문은 층이 있으면 불릿 가능)

- [ ] **Step 2: CLAUDE.md** — 4줄 규칙대로(표 칸은 쉼표)

- [ ] **Step 3: tasks/lessons.md** — 39줄 규칙대로. 교훈 문장의 나열이라 층이 있으면 하위 불릿. 옛 화면 인용은 없다

- [ ] **Step 4: 자기 검사와 대조** — Run: `for f in README.md CLAUDE.md tasks/lessons.md; do printf '%s ' "$f"; dot=$'\xc2\xb7'; sed "s/가운뎃점(${dot})//g" "$f" | grep -c $'\xc2\xb7'; done` Expected: 모두 `0`. Run: `node scripts/diff-check.mjs HEAD -- README.md CLAUDE.md tasks/lessons.md | tail -3` Expected: `FAIL 0`. Run: `DOT_GATE=off bash tests/hooks/run-all.sh | grep -v '^   ' | tail -25` Expected: 잔존 헬퍼가 0건 또는 이 기능 문서의 이름 문구뿐, 그 밖의 실패 0, `0\.` 도착(README) 유지

- [ ] **Step 5: 커밋**

```bash
git add README.md CLAUDE.md tasks/lessons.md
git commit -m "docs(readme,lessons): 화면 견본 새 모양, 언어 규범 문단에 가운뎃점 문장, lessons 스윕"
```

---

### Task 9: 기록, 훅 주석, 버전, 초록 확인

**모델:** researcher(sonnet)

**Files:**
- Modify: `hooks/session-start:4` (주석 "~2.5KB" → 실측)
- Modify: `docs/design/dev-workflow/middle-dot-removal/middle-dot-removal.md` (9절 검증 표와 고정표 색인)
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (스크립트로만)

**Interfaces:**
- Consumes: Task 3의 bootstrap 실측, Task 1~8 커밋 전부

- [ ] **Step 1: 실측** — Run: `wc -l -c skills/workflow-orchestrator/bootstrap.md; git ls-files --eol skills/workflow-orchestrator/bootstrap.md` Expected: 줄 수 N, 바이트 M, `i/lf`

- [ ] **Step 2: 훅 주석** — `hooks/session-start` 4행의 `~2.5KB`를 `약 M바이트`(Step 1 값, 반올림해 KB)로 고친다. Run: `bash -n hooks/session-start && echo ok`

- [ ] **Step 3: 9절 검증 표와 고정표 색인** — 설계 문서 9절 `> 구현 완료 후 작성` 자리에 표를 쓴다: 항목 `bootstrap.md` 결과 `38행 6,562바이트(LF, 36행 폴백 1,865바이트 점 15개) → N행 M바이트(LF)`. 그 아래 「치환 고정표 색인」 절에 이 계획의 고정표를 `파일:행 → 새 값` 모양으로 옮기되 행 번호는 시작 커밋 `f6ab1a9` 기준임을 적는다. 이름 문구 밖에 점을 쓰지 않는다

- [ ] **Step 4: 버전** — Run: `scripts/bump-version 1.27.2 && scripts/bump-version --check` Expected: `OK: 1.27.2 (plugin.json == marketplace.json)`

- [ ] **Step 5: 초록 확인** — Run: `bash tests/hooks/run-all.sh | grep -v '^   ' | tail -30; echo rc=$?` Expected: 잔존 헬퍼 `0건`, 도착 여섯 통과, `scripts/check-restatements` 12/12, `PASS=3 FAIL=0`, rc=0. Run: `node scripts/diff-check.mjs f6ab1a9 | tail -3` Expected: `FAIL 0`, `DOMAIN-BULLET 0`. Run: `scripts/sweep $'\xc2\xb7' | grep -v '^docs/' | grep -v '가운뎃점(' | grep -c ':'` Expected: `0`(sweep의 docs 히트는 phase 파일과 _archive와 evidence뿐 — 보고서에 그 수를 적는다)

- [ ] **Step 6: 커밋**

```bash
git add hooks/session-start docs/design/dev-workflow/middle-dot-removal/middle-dot-removal.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore(release): 1.27.2 — bootstrap 실측 기록, 훅 주석 갱신"
```

---

## 실사용 확인 (REQ-021 — 계획 밖, 사용자가 수행)

1. `/plugin` Update → 재시작 → 세션 훅에서 version 1.27.2 확인
2. 대상 GW-Server 기능이 `Backfill`과 `Assignment`를 다루는지 확인한 뒤 브레인스토밍 한 바퀴. 되물음을 일부러 한 번 낸다
3. 세션이 끝나면 `node scripts/transcript-dots.mjs <그 세션의 jsonl>` 실행. 가운뎃점 줄 0, 나열 줄 1 이상이면 통과. 위반 줄은 출처(옛 HANDOFF 복구, 저장소 원문 인용, 새로 쓴 화면)를 갈라 설계 문서 9절 표에 적는다 — 앞 둘은 분모에서 뺀다
4. 9절 표에 앞선 릴리스 넷의 사건 행(1.26.0 닫힌 질문 번호, 1.26.1 이름표 개행, 1.27.0 0번 렌더와 풀이 병기와 접미 붙음, 1.27.1 고지 한 줄과 원문+풀이와 번역어 0회)과 1.27.2 행(헤더 쉼표, 접미 구분자, 점 0)을 채우고, 앞선 문서 셋(reask-reassembly, decision-label-linebreak, code-name-lookup)의 "실사용 미완료" 행을 이 표를 가리키는 한 줄로 닫는다
