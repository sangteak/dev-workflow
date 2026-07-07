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
   - **수정 착수 전 워킹 트리 확인**: 미커밋 변경이 있으면 auto-fix를 시작하지 않고 `confirm` 흐름으로 강등한다 (롤백이 사용자의 미커밋 변경까지 파괴하는 것을 방지)
2. 수정 완료 후 별도 커밋 생성: `style(auto-fix): [규칙 요약] 적용 (rule: [파일명])`
3. 테스트 재실행 (Implementer가 CLAUDE.md의 `## Test Command` 또는 package.json/Makefile에서 추론)
   - **테스트 명령 추론 실패 시**: 테스트 없이 커밋을 유지하지 말고 `confirm` 흐름으로 강등한다 — "테스트 명령을 찾지 못해 자동 검증이 불가합니다. 수정 결과를 검토해주세요" 보고와 함께 diff 요약 제시 (UE5 등 package.json/Makefile이 없는 프로젝트에서 무검증 자동 커밋 방지)
4. 결과 분기:
   - ✅ 테스트 통과 → 커밋 유지, REVIEW 완료
   - ❌ 테스트 실패 → 자동 롤백 + 사용자 보고. **롤백 전 안전 확인 필수**: `git log -1 --format=%s`가 `style(auto-fix):` 접두로 시작하는 경우에만 `git reset --hard HEAD~1`을 실행한다. 접두 불일치 시(다른 커밋이 끼어든 경우) 롤백을 중단하고 상황을 보고한다:
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
