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
