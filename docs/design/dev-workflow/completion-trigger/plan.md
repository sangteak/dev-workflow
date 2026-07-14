# completion-trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completion Protocol 스킵 문제를 4축(조건부 주입 훅·경고등·finish command·bootstrap 강화)으로 해결한다.

**Architecture:** 모든 개입은 주입형(차단 0). 잔존 감지는 공용 스크립트로 추출해 3소비자(session-start·completion-nudge·statusline)가 공유하되 statusline은 자체 완결형 사본. Completion Protocol 시퀀스는 references로 분리해 command가 직접 Read(직행의 구조적 보장), 트리거 감지 절은 orchestrator에 잔류.

**Tech Stack:** bash 훅 (기존 session-start 패턴), Markdown 스킬 문서, hooks.json (UserPromptSubmit 이벤트 — 공식 문서로 등록 가능 확인됨, matcher 미지원·타임아웃 30초)

## Global Constraints

- deny형(차단) 개입 금지 — 훅은 exit 0 + 컨텍스트 주입만, exit 2 사용 금지
- plan.md 체크박스를 bash로 파싱 금지 (LLM 파일 읽기 판단만 허용)
- bootstrap 강화는 명령형 교체만 — 수사 격화("Iron Law"류) 금지, 주입 총량 증가 최소화
- bash/LLM 등급별 주장 어휘 분리 — bash 채널은 "미완료 N건"(존재 사실), LLM 채널만 "🔔 마무리 대기"(준비 판정)
- statusline 제안문에 플러그인 캐시 버전 경로 참조 금지 (자체 완결형)
- 커밋 메시지: Conventional Commits 한국어 요지 (저장소 관례: `feat(completion): ...`)
- 마무리 어휘 SSOT: orchestrator SKILL.md의 `completion-vocab:` 정형 라인 — 훅은 미러, diff 테스트가 보증
- 이 저장소는 문서 기반 플러그인 — 테스트는 bash 스크립트(수동 실행), CI 없음 → 각 태스크 리뷰에서 테스트 실행 결과 확인 필수
- MINOR 릴리스 (사용자 docs/design 구조 불변) — 버전 범프는 Completion에서 별도 처리
- main 무오염 확인: 모든 작업은 워크트리 브랜치 `worktree-completion-trigger`에서. 각 태스크 시작 시 `git branch --show-current`와 `pwd` 확인

---

### Task 1: 회귀 테스트 하네스 + 공용 잔존 감지 스크립트 추출

session-start의 인라인 find 로직(최대 회귀 위험 지점)을 테스트로 먼저 고정한 뒤 공용 스크립트로 추출한다.

**Files:**
- Create: `tests/hooks/fixtures/.gitkeep` (픽스처는 테스트가 런타임 생성)
- Create: `tests/hooks/test-detect-remnants.sh`
- Create: `hooks/lib/detect-remnants`
- Modify: `hooks/session-start:54-56` (인라인 find → 공용 스크립트 호출)

**Interfaces:**
- Produces: `hooks/lib/detect-remnants <PROJECT_ROOT> <파일명1> [파일명2...]` — stdout에 매칭 경로 목록(줄바꿈 구분, `_archive/` 제외, 최대 5건), 매칭 없으면 빈 출력. exit 항상 0
- 소비자별 파일 집합 (하드코딩 통합 금지 — Architect 조건): session-start는 `HANDOFF.md plan.md phase1_exploration.md`, completion-nudge(Task 2)는 `HANDOFF.md plan.md`

- [ ] **Step 1: 잔존 감지 테스트 작성 (현행 동작 고정)**

`tests/hooks/test-detect-remnants.sh`:

```bash
#!/usr/bin/env bash
# detect-remnants 회귀 테스트 — 픽스처를 런타임 생성해 검증
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DETECT="${REPO_ROOT}/hooks/lib/detect-remnants"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { # $1=케이스명 $2=기대값 $3=실제값
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi
}

# 픽스처 A: 미완료 잔존 (plan.md + HANDOFF.md + phase1)
mkdir -p "$TMP/projA/docs/design/cat/feat" "$TMP/projA/docs/design/cat/_archive/old"
echo p > "$TMP/projA/docs/design/cat/feat/plan.md"
echo h > "$TMP/projA/docs/design/cat/feat/HANDOFF.md"
echo 1 > "$TMP/projA/docs/design/cat/feat/phase1_exploration.md"
echo x > "$TMP/projA/docs/design/cat/_archive/old/HANDOFF.md"
# 픽스처 B: 깨끗
mkdir -p "$TMP/projB/docs/design/cat/feat"

echo "[detect-remnants]"
# 1. session-start 집합(3종): 3건 검출
out=$("$DETECT" "$TMP/projA" HANDOFF.md plan.md phase1_exploration.md | wc -l | tr -d ' ')
check "3종 집합 검출 수" "3" "$out"
# 2. nudge 집합(2종): phase1 제외 2건
out=$("$DETECT" "$TMP/projA" HANDOFF.md plan.md | wc -l | tr -d ' ')
check "2종 집합 검출 수(phase1 제외)" "2" "$out"
# 3. _archive 제외
out=$("$DETECT" "$TMP/projA" HANDOFF.md plan.md | grep -c "_archive" || true)
check "_archive 제외" "0" "$out"
# 4. 깨끗한 프로젝트: 빈 출력
out=$("$DETECT" "$TMP/projB" HANDOFF.md plan.md)
check "깨끗 시 빈 출력" "" "$out"
# 5. docs 디렉토리 부재: 빈 출력 + exit 0
out=$("$DETECT" "$TMP/nonexistent" HANDOFF.md plan.md); rc=$?
check "docs 부재 시 빈 출력" "" "$out"
check "docs 부재 시 exit 0" "0" "$rc"

echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `bash tests/hooks/test-detect-remnants.sh`
Expected: FAIL (hooks/lib/detect-remnants 부재로 전 케이스 ❌ 또는 스크립트 에러)

- [ ] **Step 3: 공용 스크립트 구현**

`hooks/lib/detect-remnants`:

```bash
#!/usr/bin/env bash
# 공용 잔존 감지 — 소비자: session-start(3종 집합), completion-nudge(2종 집합)
# 사용: detect-remnants <PROJECT_ROOT> <파일명1> [파일명2...]
# 출력: 매칭 경로 목록 (_archive 제외, 최대 5건). 항상 exit 0.
set -u
PROJECT_ROOT="${1:-}"; shift || true
[ -z "$PROJECT_ROOT" ] || [ "$#" -eq 0 ] && exit 0
docs_dir=$(find "$PROJECT_ROOT" -maxdepth 2 -iname "docs" -type d 2>/dev/null | head -1 || true)
[ -z "$docs_dir" ] && exit 0
name_expr=( -name "$1" ); shift
for f in "$@"; do name_expr+=( -o -name "$f" ); done
find "$docs_dir" -maxdepth 6 -name "_archive" -prune -o \( "${name_expr[@]}" \) -print 2>/dev/null | head -5 || true
exit 0
```

Run: `chmod +x hooks/lib/detect-remnants` (git-bash에서는 `git update-index --chmod=+x hooks/lib/detect-remnants`도 커밋 전 실행)

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `bash tests/hooks/test-detect-remnants.sh`
Expected: `PASS=6 FAIL=0`, exit 0

- [ ] **Step 5: session-start 배선 교체**

`hooks/session-start` 54~56행의 아래 부분을:

```bash
    docs_dir=$(find "$PROJECT_ROOT" -maxdepth 2 -iname "docs" -type d 2>/dev/null | head -1 || true)
    if [ -n "$docs_dir" ]; then
        handoff_files=$(find "$docs_dir" -maxdepth 6 -name "_archive" -prune -o \( -name "HANDOFF.md" -o -name "plan.md" -o -name "phase1_exploration.md" \) -print 2>/dev/null | head -5 || true)
```

다음으로 교체 (이후의 `if [ -n "$handoff_files" ]` 블록과 들여쓰기 구조는 그대로 유지하되, 교체로 남는 잉여 `fi` 1개를 제거해 `if [ "$hook_source" != "compact" ]` 블록의 짝을 맞춘다):

```bash
    handoff_files=$("${SCRIPT_DIR}/lib/detect-remnants" "$PROJECT_ROOT" HANDOFF.md plan.md phase1_exploration.md)
```

- [ ] **Step 6: session-start 동작 검증 (수동 시뮬레이션)**

Run: `echo '{"source":"startup"}' | CLAUDE_PROJECT_DIR="$PWD" CLAUDE_PLUGIN_ROOT="$PWD" bash hooks/session-start | head -3`
Expected: `hookSpecificOutput` JSON 방출 + 이 워크트리의 plan.md가 "진행 중 작업 감지"에 포함됨 (현재 completion-trigger의 plan.md가 감지되는 것이 정상)

Run: `echo '{"source":"compact"}' | CLAUDE_PROJECT_DIR="$PWD" CLAUDE_PLUGIN_ROOT="$PWD" bash hooks/session-start | grep -c "진행 중 작업" || echo 0`
Expected: `0` (compact 시 억제 유지)

- [ ] **Step 7: Commit**

```bash
git add tests/hooks/ hooks/lib/detect-remnants hooks/session-start
git commit -m "feat(completion): 잔존 감지 공용 스크립트 추출 + 회귀 테스트 (REQ-002)"
```

---

### Task 2: completion-nudge 훅 + hooks.json 등록 + 시나리오 테스트

**Files:**
- Create: `hooks/completion-nudge`
- Create: `tests/hooks/test-completion-nudge.sh`
- Modify: `hooks/hooks.json` (UserPromptSubmit 이벤트 추가)

**Interfaces:**
- Consumes: `hooks/lib/detect-remnants` (Task 1) — 파일 집합 `HANDOFF.md plan.md`
- Produces: stdout에 plain text 주입 (공식 문서: UserPromptSubmit는 exit 0 + stdout이 컨텍스트로 주입, 모델에게만 보임). 발동 조건 미충족 시 빈 출력 + exit 0
- 어휘 미러: `FINISH_WORDS='마무리|완료|정리해|끝내자|wrap up|finish|finalize|done'` — SSOT는 Task 3의 SKILL.md `completion-vocab:` 라인 (diff 테스트 케이스 0번이 보증)

- [ ] **Step 1: 시나리오 테스트 작성 (7종 — 어휘 diff 0번 포함)**

`tests/hooks/test-completion-nudge.sh`:

```bash
#!/usr/bin/env bash
# completion-nudge 시나리오 테스트 (0번: 어휘 SSOT diff)
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
HOOK="${REPO_ROOT}/hooks/completion-nudge"
SKILL="${REPO_ROOT}/skills/workflow-orchestrator/SKILL.md"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi }
fire() { # $1=프로젝트루트 $2=프롬프트 → 발동 시 "FIRE", 침묵 시 "SILENT"
  out=$(printf '{"prompt": "%s", "cwd": "%s"}' "$2" "$1" | CLAUDE_PROJECT_DIR="$1" bash "$HOOK")
  [ -n "$out" ] && echo "FIRE" || echo "SILENT"
}

# 픽스처
mkdir -p "$TMP/projA/docs/design/cat/feat" "$TMP/projB/docs/design/cat/feat" "$TMP/projC/docs/design/cat/_archive/old"
echo p > "$TMP/projA/docs/design/cat/feat/plan.md"
echo h > "$TMP/projC/docs/design/cat/_archive/old/HANDOFF.md"

echo "[completion-nudge]"
# 0. 어휘 SSOT diff: SKILL.md의 completion-vocab 라인과 훅의 FINISH_WORDS 일치
ssot=$(grep -o 'completion-vocab: .*' "$SKILL" | sed 's/completion-vocab: //' | tr -d '`')
mirror=$(grep -o "FINISH_WORDS='[^']*'" "$HOOK" | sed "s/FINISH_WORDS='//; s/'$//")
check "0.어휘 SSOT diff" "$ssot" "$mirror"
# 1. 잔존 O + 마무리 발화 → 발동
check "1.잔존+마무리" "FIRE" "$(fire "$TMP/projA" "이제 마무리하자")"
# 2. 잔존 O + 무관 발화 → 침묵
check "2.잔존+무관" "SILENT" "$(fire "$TMP/projA" "이 버그 고쳐줘")"
# 3. 잔존 X + 마무리 발화 → 침묵
check "3.무잔존+마무리" "SILENT" "$(fire "$TMP/projB" "마무리하자")"
# 4. 잔존 O + 영어 발화 → 발동
check "4.영어 wrap up" "FIRE" "$(fire "$TMP/projA" "lets wrap up this feature")"
# 5. 잔존 O + 어휘 밖 발화 → 침묵 (예상된 미탐 — 축2·4가 보완)
check "5.어휘 밖 미탐" "SILENT" "$(fire "$TMP/projA" "오늘은 여기까지 하고 넘어가자")"
# 6. _archive만 잔존 → 침묵
check "6.archive 제외" "SILENT" "$(fire "$TMP/projC" "마무리하자")"

echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `bash tests/hooks/test-completion-nudge.sh`
Expected: FAIL (hooks/completion-nudge 부재)

- [ ] **Step 3: 훅 구현**

`hooks/completion-nudge`:

```bash
#!/usr/bin/env bash
# UserPromptSubmit hook — 조건부 정밀 주입 (completion-trigger REQ-001)
# 발동: 미완료 잔존(plan.md/HANDOFF.md, _archive 제외) ∧ 마무리 어휘.
# 미충족 시 빈 출력. 항상 exit 0 (차단 금지 — deny형 개입 배제 독트린).
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"

hook_input=$(cat 2>/dev/null || true)
# prompt 추출: jq 우선, 부재 시 sed 폴백 (이스케이프 포함 프롬프트는 폴백에서 부분 매칭될 수 있으나
# 오탐 비용이 주입 몇 줄이므로 수용 — 판정은 LLM에 위임됨)
if command -v jq >/dev/null 2>&1; then
    prompt=$(printf '%s' "$hook_input" | jq -r '.prompt // empty' 2>/dev/null || true)
else
    prompt=$(printf '%s' "$hook_input" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p' | head -1)
fi
[ -z "$prompt" ] && exit 0

# 어휘 미러 — SSOT: skills/workflow-orchestrator/SKILL.md 「마무리 트리거 감지」의 completion-vocab 라인.
# 변경 시 양쪽 동시 수정 (tests/hooks/test-completion-nudge.sh 케이스 0번이 diff 검증)
FINISH_WORDS='마무리|완료|정리해|끝내자|wrap up|finish|finalize|done'
printf '%s' "$prompt" | grep -qiE "$FINISH_WORDS" || exit 0

remnants=$("${SCRIPT_DIR}/lib/detect-remnants" "$PROJECT_ROOT" HANDOFF.md plan.md)
[ -z "$remnants" ] && exit 0

features=$(printf '%s\n' "$remnants" | sed 's|.*/docs/design/||; s|/[^/]*$||' | sort -u | paste -sd ', ' -)
cat <<EOF
<completion-signal>
사용자 입력에 마무리 어휘가 감지되었고, 미완료 feature가 남아 있다: ${features}
판정하라: 이 발화가 세션 전체 작업의 마무리 의도라면 — 자체 판단으로 정리하지 말고
dev-workflow:workflow-orchestrator의 Completion Protocol로 라우팅하라.
특정 코드·파일에 대한 정리/수정 요청이면 이 신호는 해당 없음 — 무시하고 요청을 그대로 처리하라.
</completion-signal>
EOF
exit 0
```

Run: `chmod +x hooks/completion-nudge` (+ `git update-index --chmod=+x hooks/completion-nudge`)

- [ ] **Step 4: hooks.json 등록**

`hooks/hooks.json`의 `"SessionStart": [...]` 배열 뒤에 형제 키로 추가 (전체 결과):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "'${CLAUDE_PLUGIN_ROOT}/hooks/session-start'",
            "async": false
          },
          {
            "type": "command",
            "command": "'${CLAUDE_PLUGIN_ROOT}/hooks/inject-rules'",
            "async": false
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "'${CLAUDE_PLUGIN_ROOT}/hooks/completion-nudge'",
            "async": false
          }
        ]
      }
    ]
  }
}
```

주의: UserPromptSubmit는 matcher 미지원(공식 문서) — matcher 키를 넣지 않는다. 조건 분기는 스크립트 내부가 전담한다.

- [ ] **Step 5: 테스트 실행 — 통과 확인 (케이스 0번은 Task 3 전이므로 임시 실패 허용 여부 확인)**

Run: `bash tests/hooks/test-completion-nudge.sh`
Expected: 케이스 1~6 PASS. 케이스 0번은 SKILL.md에 `completion-vocab:` 라인이 아직 없어 FAIL — **Task 3 완료 후 재실행에서 PASS=7이 최종 판정** (이 시점 기록: `PASS=6 FAIL=1(케이스0)`)

- [ ] **Step 6: JSON 유효성 검증**

Run: `python -c "import json;json.load(open('hooks/hooks.json'))" && echo VALID`
Expected: `VALID`

- [ ] **Step 7: Commit**

```bash
git add hooks/completion-nudge hooks/hooks.json tests/hooks/test-completion-nudge.sh
git commit -m "feat(completion): completion-nudge UserPromptSubmit 훅 + 시나리오 테스트 (REQ-001·006·010)"
```

**스모크 노트 (REQ-010):** 훅 등록의 라이브 확인은 플러그인 재시작이 필요하므로(commands 캐싱 교훈) REVIEW 후 사용자 안내 항목이다: "재시작 → 아무 프로젝트에서 '마무리' 포함 발화 → `/context`나 응답에서 completion-signal 주입 확인". 실패 시 출구: hooks.json에서 UserPromptSubmit 블록 제거하고 축 3·4만으로 운영.

---

### Task 3: orchestrator 수술 — 시퀀스 추출 + 어휘 정형화 + 🔔 규범 + 진입 경로 기록

**Files:**
- Create: `skills/workflow-orchestrator/references/completion-protocol.md`
- Modify: `skills/workflow-orchestrator/SKILL.md:280-336` (Completion Protocol 절)

**Interfaces:**
- Produces: `references/completion-protocol.md` — Step 0~4 시퀀스 SSOT (Task 4의 finish command가 Read)
- Produces: SKILL.md의 `completion-vocab:` 정형 라인 (Task 2 테스트 케이스 0번이 소비)
- 절단선 (Architect 조건): 「마무리 트리거 감지」(라우팅 책임)는 SKILL.md 잔류, 「마무리 시퀀스」 Step 0~4(절차 책임)만 추출

- [ ] **Step 1: references/completion-protocol.md 생성**

현행 SKILL.md의 「마무리 시퀀스」 Step 0 ~ Step 4 본문(292~335행)을 **바이트 동일하게 이동**하되, 파일 서두에 아래 헤더를 붙이고 두 곳을 수정한다:

```markdown
# Completion Protocol — 마무리 시퀀스 (SSOT)

> 진입 경로: ① workflow-orchestrator 「마무리 트리거 감지」(자연어) ② `/dev-workflow:finish` command 호출 (호출 자체가 사용자의 완료 선언 — 트리거 감지 생략) ③ completion-nudge 훅 주입 후 라우팅.
> 이 파일이 시퀀스의 SSOT다. 요약본을 다른 곳에 만들지 않는다.

## 진입 경로 기록 (Step 0 직전)

시퀀스 시작 시 진입 경로를 식별해 내부적으로 기록한다: `자연어 감지` | `finish command` | `훅 주입 후 라우팅`.
Step 1의 document-consolidation이 §10 변경 이력 행을 쓸 때 `(진입: [경로])`를 병기한다 — 관측 데이터(REQ-009).

[이하 현행 Step 0 ~ Step 4 본문 그대로 이동]
```

이동 시 수정 2곳:
1. Step 1의 `⚠️ 이 invoke는 document-consolidation의 '자동 실행하지 않는다' 규칙보다 우선한다` 문장은 그대로 유지 (Task 4에서 document-consolidation 쪽 예외 절을 갱신)
2. Step 1 항목에 §10 병기 지시 추가: `- §10 변경 이력 행에 진입 경로를 병기한다: (진입: [경로])`

- [ ] **Step 2: SKILL.md Completion Protocol 절 재작성**

현행 280~336행(`## Completion Protocol` 절 전체)을 아래로 교체:

```markdown
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
```

- [ ] **Step 3: 이동 검증 (바이트 동일성 + 잔존 0)**

Run: `grep -n "Step 0: 이슈 카드 잔존 검사" skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/references/completion-protocol.md`
Expected: references 파일에서만 검출 (SKILL.md 0건)

Run: `grep -c "completion-vocab:" skills/workflow-orchestrator/SKILL.md`
Expected: `1`

- [ ] **Step 4: Task 2 테스트 재실행 (어휘 diff 0번 최종 판정)**

Run: `bash tests/hooks/test-completion-nudge.sh`
Expected: `PASS=7 FAIL=0`

- [ ] **Step 5: Commit**

```bash
git add skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/references/completion-protocol.md
git commit -m "feat(completion): 시퀀스 references 분리 + 어휘 SSOT 정형화 + 🔔 경고등 규범 + 진입 경로 기록 (REQ-003·004·006·009)"
```

---

### Task 4: finish command + document-consolidation 예외 절 갱신 + 크로스레퍼런스 스윕

**Files:**
- Create: `commands/finish.md`
- Modify: `skills/document-consolidation/SKILL.md:22` (예외 절 — 호출 주체 확대)
- Modify: `skills/workflow-orchestrator/SKILL.md:92-93` (DEVELOP 완료 보고 문구에 finish 안내 병기)

**Interfaces:**
- Consumes: `references/completion-protocol.md` (Task 3)

- [ ] **Step 1: commands/finish.md 생성**

```markdown
---
description: "현재 feature의 마무리 시퀀스(Completion Protocol) 직행 실행"
---

이 커맨드 호출 자체가 사용자의 완료 선언이다. 마무리 트리거 감지를 생략하고 즉시 시퀀스를 시작하라.

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/workflow-orchestrator/references/completion-protocol.md` using the Read tool and follow its instructions exactly.

주의: 이 커맨드는 Superpowers의 finishing-a-development-branch 스킬과 별개다 — 여기서는 dev-workflow의 문서 취합·커밋·푸시 시퀀스만 수행한다.
대상 feature가 불명확하면(미완료 feature 2개 이상) 목록을 제시하고 사용자가 지정한 것만 진행한다.
```

- [ ] **Step 2: document-consolidation 예외 절 갱신**

`skills/document-consolidation/SKILL.md` 22행:

```markdown
**예외:** `workflow-orchestrator` Completion Protocol에서 invoke된 경우, 이 규칙을 적용하지 않는다. **즉시 실행한다.**
```

를 다음으로 교체:

```markdown
**예외:** Completion Protocol(진입 경로 무관 — orchestrator 자연어 감지, `/dev-workflow:finish` command, 훅 주입 후 라우팅)에서 invoke된 경우, 이 규칙을 적용하지 않는다. **즉시 실행한다.**
```

- [ ] **Step 3: DEVELOP 완료 보고 문구에 finish 안내 병기**

`skills/workflow-orchestrator/SKILL.md` 92행:

```markdown
  3. 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리할까요?"
```

를 다음으로 교체:

```markdown
  3. 대신 다음 메시지로 완료를 보고한다: "✅ 모든 태스크가 완료되었습니다. 마무리할까요? (/dev-workflow:finish 또는 \"마무리해줘\")"
```

- [ ] **Step 4: 크로스레퍼런스 스윕 (Completion Protocol 참조처 전수 확인)**

Run: `grep -rn "Completion Protocol" skills/ commands/ README.md CLAUDE.md hooks/ | grep -v "references/completion-protocol.md" | grep -v "docs/design"`

각 검출 행을 열어 확인 — 판정 기준: "시퀀스 본문을 재서술하거나, 진입 경로를 orchestrator 단독으로 전제하는 문장"은 갱신, 단순 이름 언급은 유지. 최소 확인 대상(실측 기준): `SKILL.md` 93·199행(커밋 위임 서술 — 유지 예상), `bootstrap.md` 24·30행(Task 5에서 처리), `README.md` 512·528행(Task 6에서 처리), `document-consolidation` 22행(본 태스크 Step 2), `context-handling`·`merge-to-domain` 내 언급(단순 언급 — 유지 예상). 예상과 다른 신규 검출이 있으면 같은 기준으로 처리하고 커밋 메시지에 명기한다.

- [ ] **Step 5: Commit**

```bash
git add commands/finish.md skills/document-consolidation/SKILL.md skills/workflow-orchestrator/SKILL.md
git commit -m "feat(completion): /dev-workflow:finish command + 예외 절 진입 경로 확대 + 참조 스윕 (REQ-004)"
```

---

### Task 5: bootstrap COMPLETION 명령형 강화

**Files:**
- Modify: `skills/workflow-orchestrator/bootstrap.md:24` (단계 표 행), `:33` (세션 불변식 뒤 1줄 추가)

- [ ] **Step 1: 단계 표 행 교체**

`bootstrap.md` 24행:

```markdown
| COMPLETION | 마무리·완료·wrap up | Completion Protocol (문서 취합 → 커밋 제안) |
```

를 다음으로 교체:

```markdown
| COMPLETION | 마무리·완료·wrap up, /dev-workflow:finish | Completion Protocol (문서 취합 → 커밋 제안) |
```

- [ ] **Step 2: 세션 불변식에 명령형+금지문 1줄 추가**

`bootstrap.md` 33행(`- DEVELOP 중 계획 밖 결함 수정은...`) 뒤에 추가:

```markdown
- 마무리 신호(위 COMPLETION 어휘 또는 `<completion-signal>` 주입)를 받으면 자체 판단으로 작업을 정리하지 않는다 — orchestrator를 invoke해 Completion Protocol로 라우팅한다
```

수사 격화 금지: 위 1줄 외의 강조·반복·경고 문구를 추가하지 않는다.

- [ ] **Step 3: 주입 크기 확인**

Run: `wc -c skills/workflow-orchestrator/bootstrap.md`
Expected: 3000 바이트 이하 유지 (현행 ~2.5KB + 1줄 — 총량 증가 최소화 제약 준수 확인)

- [ ] **Step 4: Commit**

```bash
git add skills/workflow-orchestrator/bootstrap.md
git commit -m "feat(completion): bootstrap COMPLETION 매핑 명령형 강화 (REQ-005)"
```

---

### Task 6: statusline 스크립트 + setup 통합 제안 절차

**Files:**
- Create: `hooks/statusline/dev-workflow-status` (저장소 정본 — 자체 완결형)
- Create: `tests/hooks/test-statusline.sh`
- Modify: `commands/setup.md` (말미에 statusline 섹션 추가)

**Interfaces:**
- 자체 완결형 (Architect 조건): 이 스크립트는 detect-remnants를 참조하지 않고 감지 로직을 인라인 사본으로 갖는다 — 사용자 settings에 플러그인 캐시 버전 경로가 박히는 것을 방지. bash 등급 주장 어휘: "미완료 N건" (존재 사실만 — "마무리 대기" 금지)

- [ ] **Step 1: statusline 테스트 작성**

`tests/hooks/test-statusline.sh`:

```bash
#!/usr/bin/env bash
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SL="${REPO_ROOT}/hooks/statusline/dev-workflow-status"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi }

mkdir -p "$TMP/projA/docs/design/c/f1" "$TMP/projA/docs/design/c/f2" "$TMP/projB/docs/design/c/f"
echo p > "$TMP/projA/docs/design/c/f1/plan.md"; echo h > "$TMP/projA/docs/design/c/f2/HANDOFF.md"

echo "[statusline]"
out=$(printf '{"workspace": {"current_dir": "%s"}, "cwd": "%s"}' "$TMP/projA" "$TMP/projA" | bash "$SL")
check "미완료 2건 표시" "[dev-workflow] ⚠ 미완료 2건: c/f1 외" "$out"
out=$(printf '{"cwd": "%s"}' "$TMP/projB" | bash "$SL")
check "깨끗 시 표시" "[dev-workflow] ✓ 미완료 없음" "$out"
out=$(printf '{"cwd": "%s"}' "$TMP/nonexistent" | bash "$SL")
check "docs 부재 시" "[dev-workflow] ✓ 미완료 없음" "$out"
echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `bash tests/hooks/test-statusline.sh`
Expected: FAIL (스크립트 부재)

- [ ] **Step 3: statusline 정본 구현**

`hooks/statusline/dev-workflow-status`:

```bash
#!/usr/bin/env bash
# dev-workflow statusline — 미완료 feature 존재 사실만 표시 (bash 등급 어휘: "미완료 N건")
# 자체 완결형: 사용자 settings에 복사되므로 플러그인 경로를 참조하지 않는다.
# 감지 로직은 hooks/lib/detect-remnants의 인라인 사본 (의도적 중복 — 경로 결합 회피)
set -u
input=$(cat 2>/dev/null || true)
if command -v jq >/dev/null 2>&1; then
    cwd=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // empty' 2>/dev/null || true)
else
    cwd=$(printf '%s' "$input" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
fi
[ -z "$cwd" ] && { echo "[dev-workflow]"; exit 0; }
docs_dir=$(find "$cwd" -maxdepth 2 -iname "docs" -type d 2>/dev/null | head -1 || true)
remnants=""
if [ -n "$docs_dir" ]; then
    remnants=$(find "$docs_dir" -maxdepth 6 -name "_archive" -prune -o \( -name "HANDOFF.md" -o -name "plan.md" \) -print 2>/dev/null | head -5 || true)
fi
if [ -n "$remnants" ]; then
    count=$(printf '%s\n' "$remnants" | sed 's|/[^/]*$||' | sort -u | wc -l | tr -d ' ')
    first=$(printf '%s\n' "$remnants" | head -1 | sed 's|.*/docs/design/||; s|/[^/]*$||')
    if [ "$count" -gt 1 ]; then echo "[dev-workflow] ⚠ 미완료 ${count}건: ${first} 외";
    else echo "[dev-workflow] ⚠ 미완료 1건: ${first}"; fi
else
    echo "[dev-workflow] ✓ 미완료 없음"
fi
exit 0
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `bash tests/hooks/test-statusline.sh`
Expected: `PASS=3 FAIL=0`

- [ ] **Step 5: setup.md에 statusline 섹션 추가**

`commands/setup.md` 말미에 추가:

```markdown
## statusline 통합 제안 (opt-in — 기존 사용자 한정)

의존성 검증 완료 후 실행한다:

1. 아래 3위치에서 `statusLine` 설정 존재를 검사한다 (grep `"statusLine"`):
   - `~/.claude/settings.json` · 프로젝트 `.claude/settings.json` · 프로젝트 `.claude/settings.local.json`
2. **셋 다 없으면 → 이 섹션 전체를 조용히 스킵한다.** 신규 설치를 제안하지 않는다 (설계 결정: 설치 강요 금지)
3. 하나라도 있으면 1회 제안한다:
   "기존 statusline에 dev-workflow 미완료 상태 표시를 추가할 수 있습니다. 안내를 볼까요?
   1. Yes — 고르면: 붙여넣기용 스크립트와 설정 예시를 출력합니다 (설정 파일은 직접 수정하셔야 합니다)
   2. No — 고르면: 스킵합니다"
4. Yes 선택 시: `[플러그인 루트]/hooks/statusline/dev-workflow-status` 파일 내용을 코드 블록으로 출력하고 안내한다:
   - "이 내용을 예: `~/.claude/dev-workflow-status.sh`로 저장 후, 기존 statusLine 스크립트 출력에 이 스크립트의 출력을 이어 붙이세요"
   - 설정 파일을 도구로 직접 수정하지 않는다 — 제안문 출력+사용자 직접 반영이 기본 (설정 파일 수술 위험 회피)
```

- [ ] **Step 6: Commit**

```bash
git add hooks/statusline/dev-workflow-status tests/hooks/test-statusline.sh commands/setup.md
git commit -m "feat(completion): statusline 정본 스크립트 + setup opt-in 제안 절차 (REQ-007)"
```

---

### Task 7: 사용자 문서 현행화 + 최종 검증

**Files:**
- Modify: `README.md:512, 528` 인근 (마무리 절차 서술 — finish command·경고등 반영)
- Modify: `CLAUDE.md` (Core Components hooks 서술, Commands 표에 finish 행 추가)
- Create: `tests/hooks/run-all.sh`

- [ ] **Step 1: CLAUDE.md 갱신**

Commands 표(`| merge-to-domain | ...` 행 뒤)에 추가:

```markdown
| finish | workflow-orchestrator (references/completion-protocol.md 직접 Read) | — | 마무리 시퀀스(Completion Protocol) 직행 실행 — 호출 자체가 완료 선언 |
```

`hooks/` 항목 서술을 다음으로 교체:

```markdown
- **`hooks/`** — 세션 시작 시 `workflow-orchestrator` 스킬을 자동 주입하는 bash 스크립트 + 마무리 어휘 감지 시 라우팅 지시를 주입하는 completion-nudge 훅 (공용 잔존 감지: `hooks/lib/detect-remnants`)
```

- [ ] **Step 2: README 갱신**

512행("모든 태스크 완료 후 커밋하지 않고 Completion Protocol로 전달")·528행("마무리 트리거 감지 시 자동 실행") 인근 절을 열어, 사용자 언어로 다음 내용을 반영한다 (내부 용어 무맥락 노출 금지 — 상황→기본 동작→발화 예시 순):
- 마무리 방법 3가지: 자연어("마무리해줘")·`/dev-workflow:finish`·개발 완료 직후 안내에 응답
- 개발이 끝났는데 결함 처리로 흐름이 샜다면: 응답 말미의 `🔔 마무리 대기` 표시가 남아 있는 동안 언제든 위 방법으로 마무리 가능
- statusline 사용자는 `/dev-workflow:setup`에서 미완료 표시 통합을 선택 가능

- [ ] **Step 3: 통합 테스트 러너 작성**

`tests/hooks/run-all.sh`:

```bash
#!/usr/bin/env bash
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
rc=0
for t in "$DIR"/test-*.sh; do
  echo "▶ $(basename "$t")"; bash "$t" || rc=1
done
exit $rc
```

- [ ] **Step 4: 전체 테스트 실행**

Run: `bash tests/hooks/run-all.sh`
Expected: 3개 스위트 전부 `FAIL=0`, exit 0

- [ ] **Step 5: 최종 스윕 검증**

Run: `grep -rn "마무리 시퀀스" skills/ commands/ README.md CLAUDE.md | grep -v "references/completion-protocol.md" | grep -v docs/design`
판정: 시퀀스 본문(Step 0~4 절차)을 재서술하는 잔존 0 확인 — 이름 언급·폴백 요약(SKILL.md의 1줄 폴백)은 허용

Run: `git log --oneline main..HEAD | wc -l` + `git status --short`
Expected: 태스크 커밋 7±1건, 작업 트리 클린, 현재 브랜치 `worktree-completion-trigger` (main 무오염 확인)

- [ ] **Step 6: Commit**

```bash
git add README.md CLAUDE.md tests/hooks/run-all.sh
git commit -m "docs(completion): README·CLAUDE.md 현행화 + 통합 테스트 러너 (REQ-008)"
```

---

## Self-Review 기록

- 스펙 커버리지: REQ-001·006·010→T2, REQ-002→T1, REQ-003·004(추출)·009→T3, REQ-004(command)→T4, REQ-005→T5, REQ-007→T6, REQ-008→T1·T2·T6·T7. Architect 조건 4건: 감지 절 잔류→T3, statusline 자체 완결형→T6, 등급별 어휘 분리→T3(🔔)·T6(미완료 N건), document-consolidation 스윕→T4. 갭 없음
- 플레이스홀더: 코드 블록 전 태스크 실물 포함. T4 Step 4·T7 Step 2는 grep 결과 의존 작업이라 판정 기준을 명문화하는 방식으로 대체
- 타입 일치: detect-remnants 시그니처(T1 정의↔T2 소비), completion-vocab 문자열(T2 미러↔T3 SSOT), 🔔 문구(T3↔T7 README) 대조 완료
