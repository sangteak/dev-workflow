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
