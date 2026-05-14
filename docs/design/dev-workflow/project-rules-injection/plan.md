# project-rules-injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dev-workflow 플러그인에 `.claude/rules/*.md`를 SessionStart 훅·단계별 프롬프트 주입·REVIEW 검증자 라우팅의 3계층으로 자동 주입·전파·검증하는 메커니즘을 추가하고, 사용자 진입 부담을 낮추는 `add-rule` 명령과 권장 템플릿을 함께 제공한다.

**Architecture:** Defense in Depth 3계층 — (1) 신규 `hooks/inject-rules`가 SessionStart에서 `.claude/rules/*.md`를 일괄 주입, (2) 신규 `skills/rules-injection`이 단계별 프롬프트 첨부·REVIEW 검증자 라우팅·자동 수정 라운드를 응집 책임화, (3) 기존 `workflow-orchestrator`/`plan-stage`는 단계 진입 시 `rules-injection`을 호출하는 통합 지점만 담당. 사용자 학습 부담을 낮추기 위해 frontmatter는 `type`만 필수이고 `applies-to`(기본 `[all]`)·`auto-fix`(기본 `confirm`)는 선택. 신규 `commands/add-rule.md`가 인터랙티브로 frontmatter를 자동 생성한다.

**Tech Stack:** Markdown 스킬 + Bash SessionStart 훅(`hooks/inject-rules`) + 기존 Claude Code `hooks.json` 메커니즘. 외부 의존 없음. 정밀 YAML/마크다운 파싱 금지(grep 기반 단순 추출).

---

## File Structure

### 신규 파일 (5개)
- `hooks/inject-rules` — 1차 SessionStart 훅 (Bash 스크립트, `.claude/rules/*.md` 글로브 → `additionalContext` 주입)
- `skills/rules-injection/SKILL.md` — 2/3차 메커니즘 응집 (단계별 프롬프트 첨부 규약, type별 검증자 라우팅, 자동 수정 라운드)
- `commands/add-rule.md` — 인터랙티브 규칙 생성 명령 (frontmatter 자동 설정 + 본문 골격)
- `docs/templates/rule-template.md` — 권장 템플릿 (frontmatter 3필드 + 본문 구조)
- `docs/guides/migrate-claude-md.md` — CLAUDE.md → `.claude/rules/` 마이그레이션 가이드

### 수정 파일 (7개)
- `hooks/hooks.json` — `SessionStart` matcher에 `inject-rules` 훅 추가 등록
- `hooks/session-start` — 출력에 `<!-- dev-workflow:orchestrator -->` 섹션 마커 추가
- `skills/workflow-orchestrator/SKILL.md` — DEVELOP/REVIEW/COMPLETION 위임 지점에 `rules-injection` 호출 지시 추가
- `skills/plan-stage/SKILL.md` — Architect 호출 시 `rules-injection` 호출 지시 추가
- `skills/development-principles/SKILL.md` — 규칙 작성 가이드 참조 추가
- `commands/setup.md` — `.claude/rules/` 디렉토리 초기화 옵션 추가
- `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` — MINOR 버전 동기화 (1.7.7 → 1.8.0)

### 책임 분담
- 1차 주입(SessionStart 전역) → `hooks/inject-rules`
- 2차 주입(단계별 적시) + 3차 검증/수정(REVIEW) → `skills/rules-injection`
- 기존 스킬은 "rules-injection 호출"만 담당 (단일 책임 원칙)

### 검증 방식
dev-workflow는 코드 없는 Markdown 플러그인이므로 단위 테스트는 적용 불가. **각 태스크는 "샘플 규칙 디렉토리 + 수동 시나리오 체크"로 검증**한다. 시나리오는 Task 13 통합 검증에서 일괄 실행.

---

## Phase A: 기반 인프라 (1차 SessionStart 훅)

### Task 1: `hooks/inject-rules` 스크립트 신설

**Files:**
- Create: `hooks/inject-rules`

- [ ] **Step 1: 검증 시나리오 정의**

다음 6가지 케이스가 모두 통과해야 한다:
1. `.claude/rules/` 디렉토리가 없으면 빈 `additionalContext` 반환 (조용히 skip)
2. `.claude/rules/` 비어있으면 빈 `additionalContext` 반환
3. `.claude/rules/coding_style.md` 1개 존재 시 그 내용이 `<project-rules>` 블록으로 출력
4. `.claude/rules/coding_style.md` + `.claude/rules/commit_style.md` 2개 존재 시 둘 다 포함
5. `.claude/rules/examples/sample.md`는 출력에서 제외됨 (재귀 안 함)
6. 출력 한 줄 헤더: `🛡️ 프로젝트 규칙 N개 로드됨: <파일명 콤마 나열>`

- [ ] **Step 2: 스크립트 작성**

`hooks/inject-rules` (실행 권한 필요, chmod +x):

```bash
#!/usr/bin/env bash
# SessionStart hook for dev-workflow plugin — inject .claude/rules/*.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
RULES_DIR="${PROJECT_ROOT}/.claude/rules"

# 디렉토리 없음 또는 비어있음 → 조용히 skip
if [ ! -d "${RULES_DIR}" ]; then
    cat <<EOF
{
  "additional_context": "",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": ""
  }
}
EOF
    exit 0
fi

escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

rules_content=""
loaded_names=()
count=0

# 평면 글로브 (examples/ 서브디렉토리 자동 제외 — ** 재귀 금지)
for file in "${RULES_DIR}"/*.md; do
    [ -e "$file" ] || continue
    fname="$(basename "$file" .md)"
    loaded_names+=("$fname")
    count=$((count + 1))
    content="$(cat "$file" 2>&1 || echo "Error reading $file")"
    rules_content="${rules_content}

<!-- rule: ${fname} -->
${content}
"
done

if [ "$count" -eq 0 ]; then
    cat <<EOF
{
  "additional_context": "",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": ""
  }
}
EOF
    exit 0
fi

# 관측 헤더 한 줄
names_joined="$(IFS=,; echo "${loaded_names[*]}")"
header="🛡️ 프로젝트 규칙 ${count}개 로드됨: ${names_joined}"

full_output="<!-- dev-workflow:rules -->
<project-rules>
${header}

${rules_content}
</project-rules>"

escaped="$(escape_for_json "$full_output")"

cat <<EOF
{
  "additional_context": "${escaped}",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "${escaped}"
  }
}
EOF

exit 0
```

- [ ] **Step 3: 실행 권한 부여**

```bash
chmod +x hooks/inject-rules
```

- [ ] **Step 4: 단독 실행 검증 (6 케이스)**

```bash
# Case 1: 디렉토리 없음
mkdir -p /tmp/test-proj1 && cd /tmp/test-proj1
CLAUDE_PROJECT_DIR=/tmp/test-proj1 bash <PLUGIN_PATH>/hooks/inject-rules
# 기대: "additional_context":"" 출력

# Case 3: 1개 파일
mkdir -p /tmp/test-proj2/.claude/rules && cd /tmp/test-proj2
echo '---
type: semantic
---
# 코딩 스타일
함수 20줄 이하.' > .claude/rules/coding_style.md
CLAUDE_PROJECT_DIR=/tmp/test-proj2 bash <PLUGIN_PATH>/hooks/inject-rules
# 기대: <project-rules> 블록에 코딩 스타일 내용 + 헤더 "🛡️ 프로젝트 규칙 1개 로드됨: coding_style"

# Case 5: examples/ 제외
mkdir -p /tmp/test-proj3/.claude/rules/examples
echo "test" > /tmp/test-proj3/.claude/rules/examples/sample.md
CLAUDE_PROJECT_DIR=/tmp/test-proj3 bash <PLUGIN_PATH>/hooks/inject-rules
# 기대: count=0, 빈 additional_context
```

각 케이스 출력을 육안 확인하여 검증 시나리오 모든 조건 충족 여부 체크.

- [ ] **Step 5: Commit**

```bash
git add hooks/inject-rules
git commit -m "feat(hooks): add inject-rules SessionStart hook for .claude/rules/*.md auto-injection"
```

---

### Task 2: `hooks/hooks.json`에 `inject-rules` 등록

**Files:**
- Modify: `hooks/hooks.json`

- [ ] **Step 1: 현재 파일 내용 확인**

현재(읽기 전):
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
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: `inject-rules` 항목 추가**

`hooks/hooks.json`을 다음으로 수정:

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
    ]
  }
}
```

핵심: 같은 matcher 아래에 두 훅을 누적 등록. 두 훅의 `additionalContext`가 각각 주입되어 합쳐진다.

- [ ] **Step 3: JSON 유효성 검사**

```bash
python -c "import json; json.load(open('hooks/hooks.json'))" && echo "JSON OK"
# 기대: "JSON OK"
```

- [ ] **Step 4: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat(hooks): register inject-rules hook under SessionStart matcher"
```

---

### Task 3: `hooks/session-start`에 섹션 마커 추가

**Files:**
- Modify: `hooks/session-start:22`

- [ ] **Step 1: 현재 22번 줄 확인**

현재:
```bash
session_context="<EXTREMELY_IMPORTANT>\nYou have a structured development workflow.\n\n**Below is the full content of your 'dev-workflow:workflow-orchestrator' skill:**\n\n${orchestrator_escaped}\n</EXTREMELY_IMPORTANT>"
```

- [ ] **Step 2: 섹션 마커 prepend**

`hooks/session-start`의 22번 줄을 다음으로 수정 (앞에 `<!-- dev-workflow:orchestrator -->\n\n` 추가):

```bash
session_context="<!-- dev-workflow:orchestrator -->\n\n<EXTREMELY_IMPORTANT>\nYou have a structured development workflow.\n\n**Below is the full content of your 'dev-workflow:workflow-orchestrator' skill:**\n\n${orchestrator_escaped}\n</EXTREMELY_IMPORTANT>"
```

이로써 두 SessionStart 훅 출력이 합쳐질 때 구분 가능: `<!-- dev-workflow:orchestrator -->`와 `<!-- dev-workflow:rules -->`.

- [ ] **Step 3: 실행 검증**

```bash
bash hooks/session-start | head -c 200
# 기대: 출력 시작에 "<!-- dev-workflow:orchestrator -->" 포함
```

- [ ] **Step 4: Commit**

```bash
git add hooks/session-start
git commit -m "feat(hooks): add orchestrator section marker to session-start output"
```

---

## Phase B: 핵심 스킬 (rules-injection)

### Task 4: `skills/rules-injection/SKILL.md` 신설 (응집 책임 스킬)

**Files:**
- Create: `skills/rules-injection/SKILL.md`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p skills/rules-injection
```

- [ ] **Step 2: SKILL.md 본문 작성**

`skills/rules-injection/SKILL.md`:

````markdown
---
name: rules-injection
description: ".claude/rules/*.md 프로젝트 규칙을 단계별로 전파하고 REVIEW에서 검증/자동 수정하는 메커니즘. workflow-orchestrator·plan-stage가 단계 진입 시 invoke한다."
---

# rules-injection

dev-workflow의 3계층 Defense in Depth 중 **2차(단계별 프롬프트 첨부)와 3차(REVIEW 검증자 라우팅 + 자동 수정 라운드)**를 응집하여 담당한다. 1차(SessionStart 자동 주입)는 `hooks/inject-rules`가 별도로 담당한다.

## 책임 범위
- 2차 — 단계별 프롬프트 첨부 (DEVELOP/REVIEW/COMPLETION/PLAN 진입 시 매칭 규칙을 Superpowers/Ouroboros 서브에이전트 호출 프롬프트에 명시 첨부)
- 3차 — REVIEW에서 `type`별 검증자 라우팅 (semantic→code-reviewer, quantitative/structural→Evaluator)
- 3차 — 자동 수정 라운드 (별도 커밋 + 테스트 재실행 + 실패 시 자동 롤백)
- 충돌 감지 + 사용자 결정 위임 (자동 해결 안 함)

## frontmatter 규약

규칙 파일 `.claude/rules/*.md`의 frontmatter:

```yaml
---
type: semantic | quantitative | structural   # 필수
applies-to: [develop, review, completion, plan, all]   # 선택, 기본 [all]
auto-fix: true | false | confirm   # 선택, 기본 confirm
---
```

- `type` 필수 — REVIEW 검증자 라우팅 결정
- `applies-to` 선택, 기본값 `[all]` — 단계 라우팅
- `auto-fix` 선택, 기본값 `confirm` — 자동 수정 정책 (안전 기본)

**파싱 규칙:** grep 기반 단순 추출만 사용. 정밀 YAML 파싱 금지. 잘못된 frontmatter는 단계별 주입에서 제외하고 사용자에게 한 줄 경고 출력 (`⚠️ rule [파일명] 무시: invalid frontmatter`).

## invoke 인터페이스

호출자는 다음 인자를 전달한다:

- `stage`: develop | review | completion | plan
- `purpose`: pre-stage-attach | post-review-validate | conflict-check
- `target_agent`: Implementer | code-reviewer | Evaluator | Architect (필요 시)

## 2차 — 단계별 프롬프트 첨부 절차

### DEVELOP 진입 시 (`stage: develop`, `purpose: pre-stage-attach`)

1. `.claude/rules/*.md` 글로브 (재귀 금지, examples/ 제외)
2. 각 파일의 frontmatter에서 `applies-to` 추출 (grep `^applies-to:`)
3. `applies-to`에 `develop`이 포함된 규칙만 선택 (단, `all` 규칙은 SessionStart에서만 노출 — 중복 방지)
4. 선택된 규칙 파일 본문 전체를 다음 블록으로 Superpowers Implementer 호출 프롬프트에 첨부:
   ```
   ── 📋 활성 규칙 (DEVELOP) ──
   [규칙명 콤마 나열]

   <project-rules-stage scope="develop">
   [규칙 파일 전체 본문 나열]
   </project-rules-stage>
   ```
5. 단계 진입 시 사용자에게 한 줄 출력: `📋 활성 규칙: [규칙명 콤마 나열] (applies-to 매칭)`

### REVIEW 진입 시 (`stage: review`, `purpose: pre-stage-attach`)

DEVELOP와 동일 절차, 단 `applies-to: review` 매칭. 첨부 대상은 Superpowers `code-reviewer` 호출 프롬프트.

### COMPLETION 진입 시 (`stage: completion`, `purpose: pre-stage-attach`)

DEVELOP와 동일 절차, 단 `applies-to: completion` 매칭. 커밋 직전 컨텍스트에 첨부.

### PLAN 진입 시 (`stage: plan`, `purpose: pre-stage-attach`)

DEVELOP와 동일 절차, 단 `applies-to: plan` 매칭. 첨부 대상은 Ouroboros Architect 호출 프롬프트.

### BRAINSTORM은 적용 안 함

BRAINSTORM 단계 페르소나(Ontologist, Socratic, Contrarian, Simplifier, Hacker, Researcher)에는 규칙을 전파하지 않는다.

## 3차 — REVIEW 검증자 라우팅 (`purpose: post-review-validate`)

REVIEW 단계의 Superpowers `requesting-code-review` 완료 후 실행한다.

1. `.claude/rules/*.md` 글로브
2. 각 파일의 `type` 추출
3. type별 라우팅:
   - `type: semantic` → Superpowers `code-reviewer`가 이미 자연어 평가 수행 (별도 호출 안 함)
   - `type: quantitative` 또는 `type: structural` → Ouroboros Evaluator를 추가 호출, 규칙 본문을 자연어 AC로 전달:
     ```
     아래 규칙 위반 여부를 PASS/FAIL/PARTIAL로 판정하라.

     --- 규칙 ---
     [규칙 본문]

     --- 구현 결과물 ---
     [변경된 파일 목록 및 주요 변경 내용]
     ```
4. 위반 결과 통합:
   - PASS → 통과 보고
   - FAIL / PARTIAL → 자동 수정 라운드 진입 (해당 규칙의 `auto-fix` 메타데이터에 따라 분기)

## 3차 — 자동 수정 라운드

위반 발견 시 해당 규칙의 `auto-fix` 값에 따라 분기:

### `auto-fix: false` — 보고만

사용자에게 위반 내용 출력 후 종료. 수동 처리 위임.

### `auto-fix: confirm` (기본값) — 사용자 확인

다음 출력 후 번호 선택 (AskUserQuestion 도구 사용 금지, 텍스트 번호 선택):

```
⚠️ 규칙 위반 발견: [규칙명]
위반 내용: [요약]
auto-fix 정책: confirm

1. 자동 수정
2. 보고만 (수동 처리)
```

- 1 → `auto-fix: true` 흐름 실행
- 2 → 보고만 종료

### `auto-fix: true` — 즉시 자동 수정

**git-mode:**
1. Superpowers Implementer를 호출하여 수정 지시 (위반 내용 + 규칙 본문 전달)
2. 수정 완료 후 별도 커밋 생성: `style(auto-fix): [규칙 요약] 적용 (rule: [파일명])`
3. 테스트 재실행 (Implementer가 CLAUDE.md의 `## Test Command` 또는 package.json/Makefile에서 추론)
4. 결과 분기:
   - ✅ 테스트 통과 → 커밋 유지, REVIEW 완료
   - ❌ 테스트 실패 → `git reset --hard HEAD~1` 자동 롤백 + 사용자 보고:
     ```
     ⚠️ 자동 수정 후 테스트 실패 — 변경 사항 롤백됨

     변경 diff:
     [변경된 파일별 diff 요약]

     실패한 테스트:
     - [테스트명1]
     - [테스트명2]

     수동 처리를 권장합니다.
     ```

**no-git-mode:**
- 변경 사항을 별도 리포트(`docs/design/.../auto-fix-attempts/[timestamp].md`)로 분리 기록
- 테스트 실패 시 변경 텍스트로 보존 (rollback 대신 사용자에게 수동 검토 요청)
- 동일한 사용자 보고 형식

## 충돌 감지 (REVIEW 단계 code-reviewer 동시 책임)

Superpowers `code-reviewer` 호출 프롬프트에 "규칙 간 충돌 감지 시 사용자에게 명시 보고" 지시를 함께 첨부한다. 호출 프롬프트 예시:

```
[기존 review 컨텍스트]

추가 지시: 첨부된 규칙들 사이에 동일 항목에 대한 상충(예: '함수 20줄 이하' vs '레거시 50줄 허용')이 발견되면, 다음 형식으로 별도 보고하라:

⚠️ 규칙 충돌 감지:
  - [규칙A] ([섹션]): "[요지]"
  - [규칙B] ([섹션]): "[요지]"
  대상 코드: [파일:라인]

자동 해결하지 말고 사용자 결정을 요청한다.
```

사용자 결정 형식 (충돌 발견 시):
```
어떻게 처리할까요?
  1. [규칙A] 우선 적용
  2. [규칙B] 우선 적용
  3. 이 위치는 예외 처리 (수정 안 함)
```

## 호출 패턴 (호출자 측 가이드)

`workflow-orchestrator` 또는 `plan-stage`가 단계 진입 시 다음 형식으로 invoke:

```
invoke `dev-workflow:rules-injection` with:
  stage: [develop | review | completion | plan]
  purpose: pre-stage-attach
  target_agent: [Implementer | code-reviewer | Evaluator | Architect]
```

REVIEW 후 검증:
```
invoke `dev-workflow:rules-injection` with:
  stage: review
  purpose: post-review-validate
```

## 폴백

- `.claude/rules/` 디렉토리 부재 → 모든 invoke가 no-op (단계별 라벨 출력 없음)
- frontmatter 파싱 실패 파일 → 해당 파일만 제외 + 사용자 경고 한 줄
- v1 비목표: PreToolUse/UserPromptSubmit 훅, priority 필드, 별도 메타 파일, 자동 CLAUDE.md 마이그레이션, 헤더 단위 라우팅, frontmatter `auto-fix-test` 필드
````

- [ ] **Step 3: 검증 — 스킬 표시 확인**

```bash
# 플러그인이 인식하는지 확인 (Claude Code 재시작 후)
# Skill 목록에 "dev-workflow:rules-injection"이 표시되어야 함
```

수동 검증: `/help` 또는 Skill 목록에서 새 스킬이 보이는지 확인.

- [ ] **Step 4: Commit**

```bash
git add skills/rules-injection/SKILL.md
git commit -m "feat(skills): add rules-injection skill for stage-targeted rule propagation and REVIEW validation"
```

---

## Phase C: 기존 스킬 통합

### Task 5: `skills/workflow-orchestrator/SKILL.md` 수정 (rules-injection 호출 지점)

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (DEVELOP/REVIEW/COMPLETION 위임 섹션)

- [ ] **Step 1: DEVELOP 섹션에 rules-injection 호출 명시**

현재 DEVELOP 섹션(80~106줄 부근)의 `superpowers:subagent-driven-development` 실행 안내 부분에 다음 줄을 **컨텍스트 전달 규칙 목록의 첫 항목으로 추가**:

```markdown
0. **단계 진입 즉시**: invoke `dev-workflow:rules-injection` with:
   - stage: develop
   - purpose: pre-stage-attach
   - target_agent: Implementer

   이 호출 결과(활성 규칙 본문 + 단계 라벨)를 `superpowers:subagent-driven-development`의 Implementer/spec-reviewer/code-quality-reviewer 호출 프롬프트에 함께 첨부한다. `.claude/rules/`가 없으면 자동으로 no-op이 된다.
```

기존 6가지 git 대체 규칙(no-git-mode)이나 git-mode 안내문 앞에 0번 항목으로 배치하여 가장 먼저 실행되도록 한다.

- [ ] **Step 2: REVIEW 섹션에 rules-injection 2회 호출 명시**

REVIEW 섹션(`Superpowers \`requesting-code-review\` 전담`)에 다음 두 호출 지점 추가:

```markdown
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
```

기존 Evaluator QA 게이트 섹션은 그대로 유지하되, 그 직전에 위 호출 안내를 배치한다. Evaluator AC 검증과 rules-injection 검증은 직렬로 실행한다 (rules-injection 먼저).

- [ ] **Step 3: COMPLETION 섹션에 rules-injection 호출 명시**

Completion Protocol → "Step 3: 커밋+푸시 제안" 직전에 다음 한 줄 추가:

```markdown
**Step 2.5: rules-injection 호출 (커밋 직전):**
invoke `dev-workflow:rules-injection` with:
- stage: completion
- purpose: pre-stage-attach

`applies-to: completion` 규칙(예: 커밋 메시지 형식)이 현재 컨텍스트에 첨부되어 Step 3의 커밋 메시지 작성에 반영된다.
```

- [ ] **Step 4: 위임 표 업데이트**

`Superpowers Delegation` 섹션의 표에 `rules-injection` 호출을 명시. 기존:

```markdown
| DEVELOP (git-mode) | Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 | — |
```

다음으로 수정:

```markdown
| DEVELOP (git-mode) | dev-workflow `rules-injection` → Superpowers `using-git-worktrees` + `subagent-driven-development` | ❌ 없음 | — |
| DEVELOP (no-git-mode) | dev-workflow `rules-injection` → Superpowers `subagent-driven-development` (worktree 스킵) | ❌ 없음 | — |
| REVIEW | dev-workflow `rules-injection` (사전+사후) → Superpowers `requesting-code-review` + Evaluator QA | ❌ 없음 | Evaluator |
| COMPLETION | dev-workflow `rules-injection` → Completion Protocol | ❌ 없음 | — |
```

- [ ] **Step 5: 검증 시나리오**

`.claude/rules/` 디렉토리가 있는 임시 프로젝트에서 dev-workflow의 DEVELOP 단계 진입을 시뮬레이션 (수동: 사용자가 "구현 시작"이라고 입력):
- 단계 진입 직후 `📋 활성 규칙: ...` 한 줄 출력 확인
- Superpowers 위임 시 규칙 본문이 함께 전달되는지 (메시지 흐름 확인)

- [ ] **Step 6: Commit**

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "feat(workflow-orchestrator): wire rules-injection at DEVELOP/REVIEW/COMPLETION stage transitions"
```

---

### Task 6: `skills/plan-stage/SKILL.md` 수정 (Architect 호출 시 rules-injection)

**Files:**
- Modify: `skills/plan-stage/SKILL.md` (Step 2 Feasibility Assessment 직전)

- [ ] **Step 1: PLAN 진입 직후 rules-injection 호출 명시**

`Step 1: 브레인스토밍 문서 분석` 직후, `Step 2: Feasibility Assessment` 진입 전에 다음 안내를 추가:

```markdown
## Step 1.5: rules-injection 호출 (PLAN 진입)

invoke `dev-workflow:rules-injection` with:
- stage: plan
- purpose: pre-stage-attach
- target_agent: Architect

결과(활성 규칙 본문 + 단계 라벨)를 Architect/Researcher 서브에이전트 호출 프롬프트에 첨부한다. `applies-to: plan` 규칙(예: 아키텍처 원칙)이 설계 의사결정에 반영된다. `.claude/rules/`가 없으면 자동으로 no-op이다.
```

- [ ] **Step 2: Architect 호출 프롬프트 템플릿 수정**

`Step 2 — Architect 구조 분석` 섹션의 서브에이전트 프롬프트 템플릿에 다음 슬롯을 명시:

```markdown
--- 에이전트 역할 정의 ---
[Ouroboros agents/architect.md 전문]

--- 프로젝트 규칙 ---
[rules-injection 결과: applies-to: plan|all 매칭 규칙 본문]

--- 설계 문서 ---
[확정된 설계 문서 전문]

--- 현재 코드베이스 구조 ---
[프로젝트 디렉토리 구조 요약]
```

- [ ] **Step 3: 검증 시나리오**

PLAN 진입 시 한 줄 출력 `📋 활성 규칙: ... (applies-to: plan 매칭)` 확인. Architect 호출 프롬프트에 규칙 본문이 포함되는지 점검 (메시지 흐름 확인).

- [ ] **Step 4: Commit**

```bash
git add skills/plan-stage/SKILL.md
git commit -m "feat(plan-stage): wire rules-injection at PLAN stage entry and Architect dispatch"
```

---

### Task 7: `skills/development-principles/SKILL.md` 수정 (규칙 작성 가이드 참조)

**Files:**
- Modify: `skills/development-principles/SKILL.md` (끝부분 또는 새 섹션)

- [ ] **Step 1: 새 섹션 추가**

`development-principles` SKILL의 끝에 다음 섹션 추가:

```markdown
---

## 프로젝트 규칙 (`.claude/rules/*.md`)

dev-workflow는 프로젝트별 코딩/커밋/리뷰 규칙을 `.claude/rules/*.md`로 분리하여 도메인 분리 + 단계별 자동 주입을 지원한다.

- **규칙 작성:** `docs/templates/rule-template.md` 참조
- **CLAUDE.md 분리 가이드:** `docs/guides/migrate-claude-md.md` 참조
- **새 규칙 생성:** `/dev-workflow:add-rule` 명령으로 인터랙티브 생성

자세한 메커니즘은 `skills/rules-injection/SKILL.md` 참조. 규칙 파일이 없는 프로젝트는 변경 없이 동일하게 동작한다 (후방 호환).
```

- [ ] **Step 2: Commit**

```bash
git add skills/development-principles/SKILL.md
git commit -m "docs(development-principles): reference rules-injection mechanism and rule authoring guide"
```

---

## Phase D: 사용자 인터페이스

### Task 8: `commands/add-rule.md` 신설 (인터랙티브 규칙 생성)

**Files:**
- Create: `commands/add-rule.md`

- [ ] **Step 1: 명령 파일 작성**

`commands/add-rule.md`:

````markdown
---
description: ".claude/rules/ 하위에 새 규칙 파일을 인터랙티브하게 생성한다."
---

# add-rule 명령

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/rules-injection/SKILL.md` for context on the frontmatter schema, then follow the steps below.

## Step 1: 규칙 이름 입력

사용자에게 다음 질문을 한다 (자유 텍스트):

```
규칙 이름을 입력하세요 (소문자 + 언더스코어, 예: coding_style, commit_conventional, coding_concurrency)
> 예: "coding_concurrency"
```

입력값을 `RULE_NAME`으로 저장. 빈 입력이거나 공백 포함이면 재질문.

## Step 2: 적용 단계 선택

다음을 출력하고 사용자 선택을 받는다 (콤마로 여러 개 가능):

```
어느 단계에 적용하시겠습니까? (콤마로 여러 개 가능, 예: "1, 2")

1. develop — 코드 작성 시 Implementer에 주입
2. review — 코드 리뷰 시 code-reviewer/Evaluator에 주입
3. completion — 커밋 시 (커밋 메시지 형식 등)
4. plan — 설계 시 Architect 페르소나에 주입
5. all — 모든 단계, SessionStart 전역
```

사용자 응답을 파싱하여 `APPLIES_TO` 배열로 변환. 예: "1, 2" → `[develop, review]`. "5" → `[all]`. 빈 입력 시 기본값 `[all]`.

## Step 3: 규칙 종류 선택

```
규칙 종류를 선택하세요.

1. semantic — 자연어 평가 (코드 스타일, 함수 작성 원칙). code-reviewer가 판단
2. quantitative — 정량 검증 (커밋 메시지 형식 등). Evaluator가 PASS/FAIL
3. structural — 구조 규칙 (디렉토리 배치, 의존성 방향). Evaluator가 PASS/FAIL
```

번호 → 값: 1→semantic, 2→quantitative, 3→structural. `TYPE` 저장. 필수 입력 (빈 입력 시 재질문).

## Step 4: 자동 수정 정책 선택

```
자동 수정 정책을 선택하세요.

1. true — 위반 시 자동 수정 + 별도 커밋 + 테스트 재실행
2. confirm — 위반 시 사용자 확인 질문 (기본값, 안전)
3. false — 위반 보고만, 사용자가 수동 처리
```

번호 → 값: 1→true, 2→confirm, 3→false. `AUTO_FIX` 저장. 빈 입력 시 기본값 `confirm`.

## Step 5: 파일 생성

경로 결정: `.claude/rules/${RULE_NAME}.md` (프로젝트 루트 기준)

기존 파일 존재 여부 확인:
- 존재하면 다음을 묻는다:
  ```
  ⚠️ .claude/rules/${RULE_NAME}.md 가 이미 존재합니다.
  1. 덮어쓰기
  2. 취소
  ```
- "1" 선택 시 덮어쓰기, "2" 선택 시 종료

`.claude/rules/` 디렉토리가 없으면 자동 생성 (`mkdir -p`).

다음 본문을 파일에 작성한다:

````markdown
---
type: ${TYPE}
applies-to: [${APPLIES_TO_JOINED}]
auto-fix: ${AUTO_FIX}
---

# ${RULE_NAME_HUMAN}

## Rule
[규칙 한 문장으로 작성. 무엇을 강제할지 명확히.]

## Examples
✅ Good:
```
[Good 예시 코드/형식]
```

❌ Bad:
```
[Bad 예시 코드/형식]
```

## Rationale (선택)
[이 규칙이 필요한 이유]

## Anti-patterns (선택)
- [피해야 할 패턴 1]
- [피해야 할 패턴 2]
````

여기서:
- `${TYPE}`, `${APPLIES_TO_JOINED}`(콤마+공백 구분), `${AUTO_FIX}`는 Step 2~4 입력값
- `${RULE_NAME_HUMAN}`은 `RULE_NAME`의 언더스코어를 공백으로, 첫 글자 대문자: `coding_concurrency` → `Coding Concurrency`

## Step 6: 완료 안내

다음을 출력한다:

```
✅ 생성됨: .claude/rules/${RULE_NAME}.md

frontmatter:
  type: ${TYPE}
  applies-to: [${APPLIES_TO_JOINED}]
  auto-fix: ${AUTO_FIX}

이 규칙은 다음 시점에 활성화됩니다:
[각 applies-to 단계 한 줄씩 설명]

규칙 본문(Rule / Examples / Rationale / Anti-patterns)을 편집하여 완성하세요.
권장 템플릿 참조: docs/templates/rule-template.md
```

각 단계 설명 예시:
- `develop`: 코드 작성 시 Superpowers Implementer가 인지
- `review`: 코드 리뷰 시 code-reviewer/Evaluator가 인지
- `completion`: 커밋 시점에 인지
- `plan`: 설계 단계 Architect 페르소나가 인지
- `all`: 모든 SessionStart에 자동 주입

## 폴백 처리

- 어떤 단계에서든 사용자가 명시적으로 "취소"라고 응답하면 즉시 종료, 파일 생성 안 함
- 파일 쓰기 실패 시 에러 메시지 + 종료
````

- [ ] **Step 2: 검증 시나리오**

수동 검증:
```bash
# 빈 .claude/rules/ 디렉토리 준비
mkdir -p /tmp/add-rule-test/.claude/rules && cd /tmp/add-rule-test
# Claude Code에서 /dev-workflow:add-rule 실행
# 1. 이름: coding_test
# 2. 단계: 1, 2 (develop, review)
# 3. 종류: 1 (semantic)
# 4. 자동 수정: 2 (confirm)
# → .claude/rules/coding_test.md 생성 확인
cat .claude/rules/coding_test.md
# 기대: frontmatter type/applies-to/auto-fix + 본문 골격
```

- [ ] **Step 3: Commit**

```bash
git add commands/add-rule.md
git commit -m "feat(commands): add interactive add-rule command for rule file creation"
```

---

### Task 9: `commands/setup.md` 수정 (.claude/rules/ 디렉토리 초기화 옵션)

**Files:**
- Modify: `commands/setup.md` (Step 5 이후 새 섹션 추가)

- [ ] **Step 1: 새 Step 6 추가**

`commands/setup.md`의 Step 5 검증 출력 이후, 다음 Step 6을 추가:

```markdown
### Step 6: 프로젝트 규칙 디렉토리 초기화

설치 완료 또는 모두 이미 설치된 경우, `.claude/rules/` 디렉토리 초기화 여부를 묻는다:

```
── 📁 프로젝트 규칙 초기화 ────────────────────────────

dev-workflow는 `.claude/rules/*.md` 도메인 규칙 파일을 자동 주입할 수 있습니다.
지금 디렉토리를 초기화할까요?

  1. 빈 디렉토리만 생성 (.claude/rules/)
  2. 스킵
  3. 샘플 포함 초기화 (.claude/rules/examples/ 에 3종 샘플)

──────────────────────────────────────────────────────
```

**옵션 1 (빈 디렉토리):**
```bash
mkdir -p .claude/rules
```
출력: `✅ .claude/rules/ 생성됨. /dev-workflow:add-rule 로 새 규칙을 만들 수 있습니다.`

**옵션 2 (스킵):**
출력 없이 종료.

**옵션 3 (샘플 포함):**
```bash
mkdir -p .claude/rules/examples
```
그리고 다음 3개 샘플 파일을 작성 (각 파일은 권장 템플릿 형식):

- `.claude/rules/examples/coding_style.md` (type: semantic, applies-to: [develop, review], auto-fix: confirm)
- `.claude/rules/examples/commit_conventional.md` (type: quantitative, applies-to: [completion], auto-fix: confirm)
- `.claude/rules/examples/review_checklist.md` (type: structural, applies-to: [review], auto-fix: false)

샘플 내용은 `docs/templates/rule-template.md` 의 구조를 따르며, 각 도메인에 맞는 일반적 예시를 포함한다 (예: coding_style은 "함수 20줄 이하" "early return 선호"; commit_conventional은 "Conventional Commit 형식 준수"; review_checklist는 "테스트 커버리지 70% 이상").

출력: `✅ .claude/rules/examples/ 에 샘플 3종 생성됨. 사용하려면 examples/ 밖으로 복사하세요.`
```

- [ ] **Step 2: 검증 시나리오**

수동 검증: `/dev-workflow:setup` 실행 → Step 6 옵션 3 선택 → `.claude/rules/examples/` 에 3개 파일 생성 확인.

- [ ] **Step 3: Commit**

```bash
git add commands/setup.md
git commit -m "feat(setup): add .claude/rules/ initialization step with sample option"
```

---

### Task 10: `docs/templates/rule-template.md` 신설 (권장 템플릿)

**Files:**
- Create: `docs/templates/rule-template.md`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p docs/templates
```

- [ ] **Step 2: 템플릿 파일 작성**

`docs/templates/rule-template.md`:

````markdown
---
type: semantic | quantitative | structural   # 필수 — 검증자 라우팅 결정
applies-to: [develop, review, completion, plan, all]   # 선택, 기본 [all] — 단계 라우팅
auto-fix: true | false | confirm   # 선택, 기본 confirm — 자동 수정 정책
---

# [규칙 이름]

## Rule (필수)
[규칙을 한 문장으로 명확히 작성. 무엇을 강제할지.]

## Examples (강력 권장)
✅ Good:
```
[Good 예시 코드/형식]
```

❌ Bad:
```
[Bad 예시 코드/형식]
```

## Rationale (선택)
[이 규칙이 필요한 이유. 통증/원칙/근거.]

## Anti-patterns (선택)
- [피해야 할 패턴 1]
- [피해야 할 패턴 2]

---

## frontmatter 필드 설명

### type (필수)
- `semantic` — 자연어 평가 (코드 스타일, 함수 작성 원칙). REVIEW 시 Superpowers code-reviewer가 판단
- `quantitative` — 정량 검증 (커밋 메시지 형식, 명명 규칙). Ouroboros Evaluator가 PASS/FAIL
- `structural` — 구조 규칙 (디렉토리 배치, 의존성 방향). Ouroboros Evaluator가 PASS/FAIL

### applies-to (선택, 기본 [all])
- `develop` — 코드 작성 시 Implementer에 주입
- `review` — 코드 리뷰 시 code-reviewer/Evaluator에 주입
- `completion` — 커밋 시 (커밋 메시지 형식 등)
- `plan` — 설계 시 Architect 페르소나에 주입
- `all` — 모든 단계 SessionStart 전역에 주입 (단계별 2차 주입에서는 중복 방지로 제외됨)

### auto-fix (선택, 기본 confirm)
- `true` — 위반 시 자동 수정 + 별도 커밋 + 테스트 재실행 + 실패 시 자동 롤백
- `confirm` — 위반 시 사용자에게 확인 질문 후 결정 (기본값, 안전)
- `false` — 위반 보고만, 사용자가 수동 처리

## 작성 팁

- **Rule 한 문장**: 추상적이지 않게. "함수는 20줄 이하" > "함수를 작게 유지"
- **Examples 필수에 가까움**: code-reviewer/Evaluator의 판정 정밀도가 Examples 유무로 크게 갈림
- **헤더로 세분화 가능**: 한 파일 내 `## Functions`, `## Naming`, `## Comments` 같이 헤더로 여러 규칙 묶기 가능
- **파일명 prefix 권장**: `coding_*`, `commit_*`, `review_*` 등으로 도메인 그룹화
- **examples/ 서브디렉토리**: 학습용 샘플은 `.claude/rules/examples/` 에 둔다. 글로브에서 자동 제외되어 활성화되지 않음.
````

- [ ] **Step 3: Commit**

```bash
git add docs/templates/rule-template.md
git commit -m "docs(templates): add rule-template.md for .claude/rules/ authoring"
```

---

### Task 11: `docs/guides/migrate-claude-md.md` 신설 (마이그레이션 가이드)

**Files:**
- Create: `docs/guides/migrate-claude-md.md`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p docs/guides
```

- [ ] **Step 2: 가이드 작성**

`docs/guides/migrate-claude-md.md`:

````markdown
# CLAUDE.md → `.claude/rules/` 마이그레이션 가이드

dev-workflow 1.8.0 이상에서 `.claude/rules/*.md` 메커니즘을 활용해 CLAUDE.md 비대화를 해소하는 가이드.

## 분리 대상 식별

CLAUDE.md에서 다음 항목들은 `.claude/rules/`로 분리하기에 적합:

| CLAUDE.md 항목 | 분리 권장? | 권장 파일명 | type | applies-to |
|---|---|---|---|---|
| 코딩 스타일 (함수 크기, 네이밍 등) | ✅ | `coding_style.md` | semantic | [develop, review] |
| 커밋 메시지 형식 (Conventional Commits 등) | ✅ | `commit_conventional.md` | quantitative | [completion] |
| 코드 리뷰 체크리스트 | ✅ | `review_checklist.md` | structural | [review] |
| 테스트 작성 원칙 | ✅ | `coding_test.md` | semantic | [develop, review] |
| 아키텍처 원칙 / 의존성 방향 | ✅ | `architecture.md` | structural | [plan, develop, review] |
| 프로젝트 개요 / 기술 스택 | ❌ (CLAUDE.md 유지) | — | — | — |
| Test Command (테스트 실행 명령) | ❌ (CLAUDE.md `## Test Command` 섹션 권장) | — | — | — |
| 워크플로우 규칙 (커밋 전 확인 등) | △ (선택) | `workflow.md` | semantic | [all] |

## 마이그레이션 절차

### Step 1: 분리할 항목 선정

CLAUDE.md를 열고 위 표 기준으로 분리할 섹션을 표시한다.

### Step 2: `.claude/rules/` 초기화

```bash
# 또는 /dev-workflow:setup 의 Step 6 옵션 3 사용
mkdir -p .claude/rules
```

### Step 3: 새 규칙 파일 생성

각 항목마다 `/dev-workflow:add-rule` 명령을 사용하여 인터랙티브하게 생성:

```
/dev-workflow:add-rule

규칙 이름: coding_style
적용 단계: 1, 2  (develop, review)
종류: 1  (semantic)
자동 수정: 2  (confirm)

✅ 생성됨: .claude/rules/coding_style.md
```

생성된 파일의 본문(Rule / Examples / Rationale / Anti-patterns)을 CLAUDE.md의 기존 내용에서 옮겨와 채운다.

### Step 4: CLAUDE.md에서 분리된 내용 제거

이전 단계에서 옮긴 섹션을 CLAUDE.md에서 삭제. 다만 짧은 참조 한 줄은 남기는 것을 권장:

```markdown
## 코딩 규칙

`.claude/rules/coding_style.md` 참조 (dev-workflow가 자동 주입).
```

### Step 5: Test Command 섹션 추가 (권장)

자동 수정 라운드의 테스트 재실행을 위해 CLAUDE.md에 다음 섹션을 추가:

```markdown
## Test Command

[프로젝트의 테스트 실행 명령]
예: `npm test` / `pytest` / `go test ./...`
```

### Step 6: 검증

새 세션을 시작하여 다음을 확인:
- SessionStart에 `🛡️ 프로젝트 규칙 N개 로드됨: ...` 한 줄 출력
- DEVELOP 진입 시 `📋 활성 규칙: ...` 라벨 출력
- 코드 작성 결과가 규칙을 인지하는지 (예: 함수 크기 제한 준수)

## 주의 사항

- **자동 마이그레이션 도구는 제공하지 않음**. 분리할 항목 선정은 프로젝트 맥락 의존이므로 사용자가 결정한다.
- **분리 후에도 CLAUDE.md는 그대로 동작**. dev-workflow는 CLAUDE.md를 대체하지 않는다.
- **점진적 분리 가능**. 한 번에 모두 옮길 필요 없음. 가장 자주 참조되는 규칙부터 분리 권장.
- **examples/ 활용**: 학습용으로 만든 규칙은 `.claude/rules/examples/` 에 두면 글로브에서 자동 제외된다 (실제 적용 안 됨).
````

- [ ] **Step 3: Commit**

```bash
git add docs/guides/migrate-claude-md.md
git commit -m "docs(guides): add CLAUDE.md to .claude/rules/ migration guide"
```

---

## Phase E: 릴리스

### Task 12: 버전 동기화 (1.7.7 → 1.8.0)

**Files:**
- Modify: `.claude-plugin/marketplace.json:11`
- Modify: `.claude-plugin/plugin.json:4`

- [ ] **Step 1: `marketplace.json` 버전 업**

`.claude-plugin/marketplace.json:11`을:
```json
      "version": "1.7.7",
```
다음으로 변경:
```json
      "version": "1.8.0",
```

- [ ] **Step 2: `plugin.json` 버전 업**

`.claude-plugin/plugin.json:4`을:
```json
  "version": "1.7.7",
```
다음으로 변경:
```json
  "version": "1.8.0",
```

- [ ] **Step 3: SemVer 근거 확인**

이 변경이 MINOR인 이유:
- 신규 기능 추가 (`.claude/rules/` 메커니즘, `add-rule` 명령)
- 기존 사용자 프로젝트 `docs/design/` 구조 변경 없음
- `.claude/rules/` 없는 프로젝트는 변경 없이 동일 동작 (후방 호환)
- 기존 스킬·명령·훅 인터페이스 변경 없음

`docs/design/dev-workflow/project-rules-injection/project-rules-injection.md`의 섹션 10 (변경 이력)에 다음 항목 추가:

```markdown
| 2026-05-14 | 구현 완료 — `.claude/rules/` 3계층 메커니즘 + add-rule 명령 + 마이그레이션 가이드 | 전체 | implemented |
```

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/marketplace.json .claude-plugin/plugin.json docs/design/dev-workflow/project-rules-injection/project-rules-injection.md
git commit -m "chore(release): bump version to 1.8.0 for project-rules-injection feature"
```

---

### Task 13: 통합 검증 시나리오

**Files:**
- 없음 (수동 검증)

- [ ] **Step 1: 빈 프로젝트 회귀 테스트 (후방 호환)**

`.claude/rules/` 없는 임시 프로젝트에서 dev-workflow 동작 확인:

```bash
mkdir -p /tmp/regress-test && cd /tmp/regress-test
echo "# Test project" > CLAUDE.md
# Claude Code 신규 세션 열기
```

확인 사항:
- SessionStart에 `🛡️ 프로젝트 규칙` 한 줄이 **출력되지 않아야 함** (조용히 skip)
- 기존 workflow-orchestrator 동작이 변경 없이 작동
- `/dev-workflow:resume`이 정상 동작

- [ ] **Step 2: 1차 SessionStart 주입 검증**

`.claude/rules/coding_style.md` 1개 두고 신규 세션 시작:

```bash
mkdir -p /tmp/inject-test/.claude/rules && cd /tmp/inject-test
cat > .claude/rules/coding_style.md <<'EOF'
---
type: semantic
applies-to: [develop, review]
auto-fix: confirm
---

# 코딩 스타일

## Rule
함수는 20줄 이하로 유지한다.

## Examples
✅ Good:
def fetch(id):
    if id <= 0: raise ValueError
    return db.query(id)

❌ Bad:
def fetch(id):
    # 50줄짜리 함수
    ...
EOF
# Claude Code 신규 세션 열기
```

확인 사항:
- SessionStart에 `🛡️ 프로젝트 규칙 1개 로드됨: coding_style` 한 줄 출력
- Claude가 코딩 스타일을 인지함 (직접 질문: "이 프로젝트의 함수 크기 제한은?" → "20줄")

- [ ] **Step 3: 2차 단계별 주입 검증 (DEVELOP)**

위 프로젝트에서 가상의 DEVELOP 단계 진입 시뮬레이션 (수동):
- 워크플로우 오케스트레이터가 "구현 시작" 명령에 반응하여 DEVELOP 단계 진입
- 단계 진입 시 `📋 활성 규칙: coding_style (applies-to 매칭)` 한 줄 출력 확인
- Superpowers 위임 시 규칙 본문이 컨텍스트에 함께 전달되는지 메시지 흐름으로 확인

- [ ] **Step 4: 3차 REVIEW 검증 라우팅 (시나리오)**

`commit_conventional.md` (type: quantitative) 추가하고 REVIEW 단계 진입:

```bash
cat > /tmp/inject-test/.claude/rules/commit_conventional.md <<'EOF'
---
type: quantitative
applies-to: [completion, review]
auto-fix: confirm
---

# Conventional Commits

## Rule
모든 커밋 메시지는 `<type>: <subject>` 형식을 따른다. type은 feat/fix/docs/chore/refactor/test/style/perf 중 하나.

## Examples
✅ Good:
- feat: add user authentication
- fix: handle null pointer in parser

❌ Bad:
- "added auth"
- "wip"
EOF
```

확인 사항:
- REVIEW 진입 시 `📋 활성 규칙: coding_style, commit_conventional` 라벨 출력
- Superpowers code-reviewer가 coding_style (semantic) 평가
- 별도로 Ouroboros Evaluator가 commit_conventional (quantitative) AC 판정

- [ ] **Step 5: add-rule 명령 검증**

```bash
mkdir -p /tmp/add-rule-test && cd /tmp/add-rule-test
# Claude Code에서 /dev-workflow:add-rule 실행
# 입력: coding_test / 1,2 / 1 / 2
```

확인:
- `.claude/rules/coding_test.md` 생성
- frontmatter에 `type: semantic`, `applies-to: [develop, review]`, `auto-fix: confirm` 포함
- 본문에 권장 템플릿 구조(Rule / Examples / Rationale / Anti-patterns) 포함

- [ ] **Step 6: examples/ 글로브 제외 검증**

```bash
cd /tmp/inject-test
mkdir -p .claude/rules/examples
echo "test" > .claude/rules/examples/sample.md
CLAUDE_PROJECT_DIR=/tmp/inject-test bash <PLUGIN_PATH>/hooks/inject-rules | grep -o "examples"
# 기대: 출력 없음 (examples/는 제외됨)
```

- [ ] **Step 7: setup 통합 검증**

```bash
mkdir -p /tmp/setup-test && cd /tmp/setup-test
# Claude Code에서 /dev-workflow:setup 실행
# Step 6에서 옵션 3 (샘플 포함) 선택
ls .claude/rules/examples/
# 기대: coding_style.md, commit_conventional.md, review_checklist.md 3개 파일
```

- [ ] **Step 8: 자동 수정 라운드 시나리오 (선택, 시간 허용 시)**

git 초기화된 프로젝트에 `auto-fix: true` 규칙을 두고 위반 코드 생성 → REVIEW 진입 → 자동 수정 라운드 동작 확인:
- 별도 커밋 생성 (`style(auto-fix): ...`)
- 테스트 재실행 호출
- 통과 시 커밋 유지, 실패 시 `git reset --hard HEAD~1` 자동 롤백 + 사용자 보고

이 시나리오는 Superpowers Implementer 동작 의존성이 있어 환경 구축이 복잡하다. v1.8.0 첫 릴리스에서는 매뉴얼 시나리오 문서화로 충분.

- [ ] **Step 9: 검증 결과 기록**

`docs/design/dev-workflow/project-rules-injection/project-rules-injection.md` 의 섹션 9(구현 결과 및 일탈 사항)에 검증 결과 작성:

```markdown
## 9. 구현 결과 및 일탈 사항

### 검증 완료 항목 (2026-05-14)
- [x] 후방 호환: `.claude/rules/` 없는 프로젝트 무변경 동작
- [x] 1차 SessionStart 주입: 한 줄 헤더 + `<project-rules>` 블록 출력
- [x] 2차 단계별 주입: DEVELOP/REVIEW 진입 시 활성 규칙 라벨 출력
- [x] 3차 검증 라우팅: type별 검증자 분기 (semantic/quantitative/structural)
- [x] add-rule 명령: 인터랙티브 frontmatter 자동 설정 + 본문 골격 생성
- [x] examples/ 글로브 자동 제외
- [x] setup 옵션 3 (샘플 포함) 동작

### 일탈 사항
[구현 중 시드/설계 문서와 다른 결정이 발생했다면 여기에 기록]

### 알려진 한계
- 자동 수정 라운드의 end-to-end 검증은 Superpowers Implementer 환경 의존성으로 매뉴얼 시나리오로만 검증
- frontmatter 파싱은 grep 기반 단순 추출 — 복잡한 YAML(중첩, 멀티라인 값) 미지원
```

- [ ] **Step 10: Commit**

```bash
git add docs/design/dev-workflow/project-rules-injection/project-rules-injection.md
git commit -m "docs(design): record project-rules-injection verification results"
```

---

## Self-Review 체크리스트

이 plan을 사용하는 엔지니어가 마지막에 점검할 사항:

1. **스펙 커버리지**
   - REQ-001~006 (규칙 파일 작성 규약): Task 4, 8, 10, 11에서 다룸
   - REQ-010~014 (자동 주입 메커니즘): Task 1, 2, 4, 5, 6에서 다룸
   - REQ-020~024 (REVIEW 검증 + 자동 수정): Task 4, 5에서 다룸
   - REQ-030 (충돌 처리): Task 4 (rules-injection 안의 충돌 감지 섹션)
   - REQ-040~041 (관측성): Task 1, 4 (각 단계 라벨 출력)
   - REQ-050~052 (setup 자동화): Task 9, 11
   - REQ-060~061 (폴백/오류): Task 1, 4

2. **타입 일관성**
   - frontmatter 필드명(`type` / `applies-to` / `auto-fix`)이 모든 태스크에서 동일하게 사용됨
   - `applies-to` 값(`develop` / `review` / `completion` / `plan` / `all`) 5종이 일관됨
   - `type` 값(`semantic` / `quantitative` / `structural`) 3종이 일관됨
   - `auto-fix` 값(`true` / `false` / `confirm`) 3종이 일관됨

3. **명명 일관성**
   - 스킬명: `dev-workflow:rules-injection`
   - 명령명: `/dev-workflow:add-rule`, `/dev-workflow:setup`
   - 훅 파일: `hooks/inject-rules`, `hooks/session-start`
   - 신규 파일 경로: `.claude/rules/*.md`, `docs/templates/rule-template.md`, `docs/guides/migrate-claude-md.md`

4. **버전**: 1.7.7 → 1.8.0 (MINOR)

---

## Execution Handoff

Plan complete and saved to `docs/design/dev-workflow/project-rules-injection/plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task with two-stage review (spec compliance + code quality). Fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, with checkpoints for review.

**Which approach?**
