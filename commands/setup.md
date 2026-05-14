---
description: "권장 플러그인 의존성 설치 및 검증"
---

# dev-workflow 의존성 설정

## 의존성 목록

| 이름 | 마켓플레이스 소스 | 설치명 | 등록 명령 | 설치 명령 | 필수/권장 | 역할 |
|---|---|---|---|---|---|---|
| Superpowers | (공식 — 등록 불필요) | superpowers | — | `claude plugin install superpowers@claude-plugins-official` | 필수 | 개발/리뷰 자동화 |
| Ouroboros | Q00/ouroboros | ouroboros | `claude plugin marketplace add Q00/ouroboros` | `claude plugin install ouroboros@ouroboros` | 권장 | 페르소나 강화 브레인스토밍 |

## 플러그인 디렉토리 구조 참조

```
~/.claude/plugins/
├── installed_plugins.json      ← 설치된 플러그인 레지스트리
├── known_marketplaces.json     ← 등록된 마켓플레이스 목록
├── cache/[marketplace]/[plugin]/[version]/  ← 플러그인 실제 파일
└── marketplaces/[marketplace]/ ← 마켓플레이스 리포 클론
```

## 실행 프로토콜

아래 순서를 정확히 따른다. 순서를 건너뛰지 않는다.

### Step 1: 상태 진단

Bash 도구로 아래 명령을 실행하여 현재 설치 상태를 확인한다:

```bash
claude plugin list 2>&1
```

출력에서 각 의존성의 설치 여부를 판별한다:
- 출력에 `superpowers` 포함 → 설치됨
- 출력에 `ouroboros` 포함 → 설치됨

### Step 2: 결과 표시 + 확인

**모든 의존성이 설치된 경우:**

```
── 🔧 dev-workflow 의존성 설정 ──────────────────────
  ✅ Superpowers (설치됨)
  ✅ Ouroboros (설치됨)

  모든 의존성이 설치되어 있습니다!
──────────────────────────────────────────────────────
```

여기서 종료한다.

**미설치 항목이 있는 경우:**

각 의존성의 상태를 ✅(설치됨) 또는 ☐(미설치)로 표시한다:

```
── 🔧 dev-workflow 의존성 설정 ──────────────────────

현재 상태:
  [✅ 또는 ☐] Superpowers ([설치됨 또는 미설치]) — 개발/리뷰 자동화
  [✅ 또는 ☐] Ouroboros ([설치됨 또는 미설치]) — 페르소나 강화 브레인스토밍

설치할 항목이 있습니다.
  1. 전체 설치
  2. 취소

──────────────────────────────────────────────────────
```

사용자가 "2" 또는 "취소"를 선택하면 아무것도 하지 않고 종료한다.

### Step 3: 사전 점검 (Pre-flight Check)

사용자가 "1"을 선택하면, 설치 실행 전에 **미설치 플러그인에 대해서만** 잔여물을 점검하고 정리한다.
이전 설치/삭제 과정에서 남은 캐시나 디렉토리가 있으면 CLI 명령이 충돌하기 때문이다.

각 미설치 플러그인에 대해 아래를 순서대로 확인한다:

**3-A: 마켓플레이스 등록 상태 확인**

```bash
cat ~/.claude/plugins/known_marketplaces.json 2>&1
```

- 해당 플러그인의 마켓플레이스가 이미 `known_marketplaces.json`에 존재하면 → Step 4에서 `marketplace add` 명령을 **스킵**한다
- 존재하지 않으면 → Step 4에서 `marketplace add`를 실행한다

**3-B: 잔여 캐시 디렉토리 정리**

미설치 판정(Step 1)인데 캐시 디렉토리가 남아있으면 충돌 원인이 된다.

```bash
ls ~/.claude/plugins/cache/[marketplace]/[plugin]/ 2>&1
```

- 디렉토리가 존재하면 → 삭제한다:
  ```bash
  rm -rf ~/.claude/plugins/cache/[marketplace]/[plugin]/
  ```
- 디렉토리가 없으면 → 정상, 스킵

**3-C: installed_plugins.json 잔여 항목 정리**

미설치 판정인데 `installed_plugins.json`에 항목이 남아있으면 충돌 원인이 된다.

```bash
cat ~/.claude/plugins/installed_plugins.json 2>&1
```

- JSON에서 해당 플러그인 키(예: `ouroboros@ouroboros`)가 존재하면 → 해당 항목을 제거한 JSON을 다시 저장한다
- 존재하지 않으면 → 정상, 스킵

**사전 점검 결과 표시:**

정리 작업이 있었을 경우에만 표시한다:

```
🧹 사전 점검 완료
  - [플러그인명] 잔여 캐시 정리됨
  - [플러그인명] 마켓플레이스 이미 등록됨 (등록 스킵)
```

### Step 4: 설치 실행

미설치된 의존성만 위 테이블의 명령어 순서대로 실행한다:

1. 마켓플레이스 미등록 시 등록 명령 실행 (Step 3-A에서 이미 등록 확인됨 → 스킵)
2. 설치 명령을 실행 (Bash 도구)

각 명령 실행 전 진행 상황을 표시한다:
- `⏳ [플러그인명] 마켓플레이스 등록 중...` (등록 명령 실행 시)
- `⏳ [플러그인명] 설치 중...`

**⚠️ 에러 처리 규칙 (필수):**

CLI 명령 실행이 실패하면 아래 규칙을 엄격히 따른다:

1. **즉시 중단한다** — 실패한 명령에 대해 재시도하지 않는다
2. **워크어라운드를 시도하지 않는다** — 수동 클론, 디렉토리 rename, git clone 등 어떤 대안적 방법도 시도하지 않는다. 사전 점검(Step 3)에서 처리하지 못한 문제는 사용자에게 맡긴다
3. **Step 5로 즉시 넘어간다** — 성공한 플러그인은 검증하고, 실패한 플러그인은 수동 안내를 제공한다

이 규칙은 절대적이다. Step 3의 사전 점검이 알려진 문제를 미리 해결하므로, Step 4에서 실패하면 예상 밖의 문제이다. 이 경우 즉흥적 복구 시도는 상황을 악화시킬 수 있다.

### Step 5: 검증

Bash 도구로 `claude plugin list 2>&1`를 재실행하여 설치 성공 여부를 확인한다.

**모든 설치 성공:**

```
── ✅ 설치 완료 ─────────────────────────────────────
  ✅ Superpowers
  ✅ Ouroboros

  새 세션에서 모든 기능이 활성화됩니다.
  /clear 또는 새 세션을 시작해 주세요.
──────────────────────────────────────────────────────
```

Ouroboros가 이번에 새로 설치된 경우, 완료 메시지 아래에 추가 안내를 표시한다:

```
  💡 Ouroboros 초기 설정이 필요합니다.
     새 세션에서 /ouroboros:setup 을 실행하여 MCP 서버 등록 등
     초기 설정을 완료하세요.
```

Ouroboros가 이미 설치되어 있었거나 설치 대상이 아닌 경우에는 이 안내를 표시하지 않는다.

**일부 실패:**

```
── ⚠️ 설치 결과 ────────────────────────────────────
  ✅ [성공한 플러그인]
  ❌ [실패한 플러그인] — 설치 실패

  수동으로 설치하려면:
    [해당 플러그인의 등록 명령 (있으면)]
    [해당 플러그인의 설치 명령]
──────────────────────────────────────────────────────
```

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

그리고 다음 3개 샘플 파일을 작성한다. 각 파일은 권장 템플릿 형식을 따른다 (`docs/templates/rule-template.md` 참조):

**`.claude/rules/examples/coding_style.md`**:
````markdown
---
type: semantic
applies-to: [develop, review]
auto-fix: confirm
---

# Coding Style

## Rule
함수는 20줄 이하로 유지한다. 함수당 한 가지 책임만 가진다. 조건 분기에서는 early return을 선호한다.

## Examples
✅ Good:
- 함수가 짧고 한 가지 일만 함
- 깊은 중첩 대신 early return 사용

❌ Bad:
- 50줄 넘는 함수
- if-else 4단 중첩

## Rationale
긴 함수는 인지 부하가 크고 단위 테스트가 어렵다. early return은 중첩 들여쓰기를 줄여 가독성을 높인다.

## Anti-patterns
- 단일 함수에서 DB 쿼리 + 비즈니스 로직 + 응답 포맷팅 혼합
- 의미 없는 약어로 된 변수명 (e.g., `tmp`, `x1`, `data2`)
````

**`.claude/rules/examples/commit_conventional.md`**:
````markdown
---
type: quantitative
applies-to: [completion]
auto-fix: confirm
---

# Conventional Commits

## Rule
모든 커밋 메시지는 `<type>: <subject>` 형식을 따른다. type은 feat/fix/docs/chore/refactor/test/style/perf 중 하나로 한다.

## Examples
✅ Good:
- feat: add user authentication
- fix: handle null pointer in parser
- docs: update README with installation steps
- chore: bump dependency versions

❌ Bad:
- "added auth"
- "wip"
- "stuff"
- "Update files."

## Rationale
일관된 커밋 형식은 변경 이력 검색과 자동 릴리스 노트 생성을 가능하게 한다.

## Anti-patterns
- 대문자로 시작하는 메시지 (`Feat:` 대신 `feat:`)
- 마침표로 끝나는 subject
- 50자를 초과하는 subject
````

**`.claude/rules/examples/review_checklist.md`**:
````markdown
---
type: structural
applies-to: [review]
auto-fix: false
---

# Review Checklist

## Rule
모든 PR은 다음 항목을 충족한다: (1) 테스트가 추가/수정되어 있다, (2) 모든 테스트가 통과한다, (3) CLAUDE.md/README 등 관련 문서가 업데이트되어 있다.

## Examples
✅ Good:
- 새 기능 추가 PR → 새 테스트 케이스 포함
- 버그 수정 PR → 회귀 테스트 포함
- API 변경 → README/문서 업데이트 포함

❌ Bad:
- "트리비얼한 변경이라 테스트 없음"
- "테스트가 깨졌지만 무관한 변경이라 무시"
- 공개 API 시그니처 변경 후 문서 미반영

## Rationale
검증되지 않은 변경은 회귀를 만든다. 문서화되지 않은 변경은 다음 개발자에게 비용을 떠넘긴다.

## Anti-patterns
- 테스트 스킵 (xfail/skip) 추가하면서 이유 미명시
- 자동 수정으로 인한 변경 + 미검증 (자동 수정은 별도 검증 필요)
````

출력: `✅ .claude/rules/examples/ 에 샘플 3종 생성됨. 사용하려면 examples/ 밖으로 복사하세요.`
