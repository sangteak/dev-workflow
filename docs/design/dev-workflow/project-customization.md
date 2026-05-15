> 프로젝트별 규칙(`.claude/rules/*.md`)을 SessionStart 자동 주입·단계별 적시 첨부·REVIEW 검증의 3계층으로 dev-workflow에 흡수하여, CLAUDE.md 비대화 없이 프로젝트가 dev-workflow에 적응하도록 한다.

## 시스템 개요

dev-workflow는 범용 워크플로우 플러그인으로 설계되어 있지만, 사용자 프로젝트마다 고유한 코딩 스타일·커밋 형식·아키텍처 원칙 같은 팀 표준을 갖는다. 기존에는 이러한 규칙이 모두 CLAUDE.md에 누적되어 파일이 비대해졌고, 도메인이 분리되지 않아 모든 컨텍스트에 무차별 주입되었다. CLAUDE.md에 *"YOU MUST 외부 파일을 읽어라"* 강한 명령을 추가하는 우회는 명령 인지는 보장하지만, **행동 강제·단계별 적시 재강조·자동 검증/수정·메타데이터 라우팅**을 보장하지 못했다.

조사 결과 Claude Code 자체 메커니즘만으로는 자동 글로브 주입이 불가능하고(`@import`는 수동 명시, Skills description은 자동 활성화 보장 안 됨), `SessionStart` 훅의 `additionalContext`만이 자동 주입의 유일한 경로이며, 서브에이전트는 메인 컨텍스트를 비상속(fresh context)하므로 명시적 첨부가 필수임을 확인했다. 이를 토대로 dev-workflow가 자체 레이어로 책임지는 3계층 Defense in Depth 메커니즘을 구축했다. 핵심 원칙은 Superpowers/Ouroboros 자체를 수정하지 않고 컨텍스트 주입과 호출 시점 첨부로만 제어한다는 것, 그리고 `.claude/rules/`가 없는 기존 프로젝트는 변경 없이 동일 동작한다는 것이다.

## 규칙 파일 작성 규약

규칙 파일은 `.claude/rules/*.md` 평면 디렉토리에 배치하며, 도메인 prefix(`coding_`, `commit_`, `review_` 등)로 그룹화를 권장한다. 한 파일 내 여러 규칙은 헤더(`##`, `###`)로 세분화한다. 평면 구조를 채택한 이유는 단계 라우팅을 frontmatter에 일원화하기 위함이고, 카테고리 하위 디렉토리 방식은 한 도메인이 여러 단계에 걸칠 때 모호함이 발생하며 5개 미만 규칙에는 오버킬이라 기각했다.

`.claude/rules/examples/` 서브디렉토리는 글로브에서 자동 제외된다. 비재귀 글로브(`*.md`)를 사용하기 때문이며, `**` 재귀 패턴은 금지한다. 학습용 샘플을 격리하여 의도치 않은 활성화를 방지한다.

frontmatter는 세 필드를 정의하되 `type`만 필수다.

```yaml
---
type: semantic | quantitative | structural   # 필수
applies-to: [develop, review, completion, plan, all]   # 선택, 기본 [all]
auto-fix: true | false | confirm   # 선택, 기본 confirm
---
```

`type`만 필수로 두고 나머지에 안전한 기본값을 부여한 이유는 사용자 진입 부담을 낮추기 위함이다. PLAN 단계 Architect 검토에서 frontmatter 7개 개념이 과하다는 지적이 있었으나, 의미 손실 우려로 3필드를 유지하되 기본값과 인터랙티브 명령(`add-rule`)으로 학습 부담을 해소했다. `type`을 단일 `kind`로 압축하면 검증자 라우팅 정보가 죽고, `auto-fix`를 본문 헤더로 분리하면 정밀 마크다운 파싱이 필요하여 "마크다운 정신" 제약을 위반하므로 모두 기각했다.

본문은 자유 형식을 허용한다. 강제 템플릿 대신 권장 템플릿(Rule + Examples + Rationale + Anti-patterns)을 `docs/templates/rule-template.md`에 제공한다. LLM 검증자는 자연어 자유 처리가 가능하지만 Examples 유무가 판정 정밀도를 크게 가르므로 작성 가이드에서 강조한다.

## 3계층 Defense in Depth 메커니즘

### 1차: SessionStart 자동 주입

신규 훅 `hooks/inject-rules`(독립 bash 스크립트)가 `SessionStart` matcher 아래 `hooks/session-start`와 누적 등록된다. 두 훅의 `additionalContext`는 각각 주입되어 합쳐지며, 출력에 섹션 마커(`<!-- dev-workflow:orchestrator -->`, `<!-- dev-workflow:rules -->`)를 두어 신호 희석을 방지한다. `inject-rules`는 `.claude/rules/*.md`를 평면 글로브하여 모든 규칙을 `<project-rules>` 블록으로 묶고 한 줄 헤더(`🛡️ 프로젝트 규칙 N개 로드됨: ...`)와 함께 출력한다. 디렉토리가 없거나 비어있으면 빈 `additionalContext`로 조용히 skip한다(Unix 철학).

기존 `hooks/session-start`와 통합하지 않고 분리한 이유는 단일 책임 원칙과 옵션 기능의 독립성 때문이다. 규칙 주입은 옵션이므로 orchestrator 주입과 별개로 관리되어야 하고, 향후 다른 SessionStart 훅 추가 시에도 확장이 용이하다.

### 2차: 단계별 프롬프트 적시 첨부

신규 스킬 `skills/rules-injection/SKILL.md`가 단계별 첨부와 REVIEW 검증을 응집 책임으로 가져간다. `workflow-orchestrator`/`plan-stage` 같은 기존 스킬은 단계 진입 시점에 `rules-injection`을 invoke하기만 한다. 이 책임 분리는 PLAN 단계 Architect 검토의 권장에 따른 것으로, 그러지 않으면 `workflow-orchestrator`가 단계 감지·위임·Completion Protocol·Evaluator 게이트에 더해 3계층 규칙 주입까지 떠안게 되어 단일 책임이 무너졌을 것이다.

invoke 인터페이스는 `stage`(develop/review/completion/plan), `purpose`(pre-stage-attach/post-review-validate/conflict-check), `target_agent`(Implementer/code-reviewer/Evaluator/Architect, 선택)의 3축이다. 단계 진입 시 `applies-to`에 해당 단계가 명시된 규칙을 grep 기반으로 매칭하여 Superpowers/Ouroboros 서브에이전트 호출 프롬프트에 명시 첨부한다. frontmatter는 정밀 YAML 파싱 대신 grep 단순 추출만 사용하며, 잘못된 frontmatter는 해당 파일을 제외하고 한 줄 경고를 출력한다.

`applies-to: all` 규칙은 1차 SessionStart에서만 노출되고 2차 단계별 첨부에서는 제외된다. 동일 규칙이 SessionStart와 단계 프롬프트 양쪽에 중복 노출되면 토큰 낭비와 "신호 희석" 가능성이 있기 때문이다. 단계 특화 규칙(`applies-to: [develop]` 등)은 1차+2차 모두에 노출되어 적시 재강조 효과를 노린다. BRAINSTORM 단계는 요구사항 탐색이라 코드 패턴 규칙과 무관하므로 v1 범위에서 제외했다.

### 3차: REVIEW 검증과 자동 수정 라운드

REVIEW 단계 진입 시 `rules-injection`이 두 번 호출된다. 사전(`pre-stage-attach`)에는 `applies-to: review` 매칭 규칙을 Superpowers `code-reviewer` 프롬프트에 첨부하여 자연어 평가가 가능하게 하고, 사후(`post-review-validate`)에는 type별 검증자 라우팅을 수행한다. `type: semantic`은 이미 `code-reviewer`가 자연어 평가했으므로 별도 호출 없이 그 결과를 사용하고, `type: quantitative` 또는 `structural`은 Ouroboros Evaluator에 자연어 AC 형태로 전달하여 PASS/FAIL/PARTIAL 판정을 받는다. Evaluator AC 입력 포맷은 자연어로 통일하고 별도 DSL은 도입하지 않았는데, 사용자 학습 부담과 dev-workflow의 "마크다운만" 정신을 유지하기 위함이다.

기존 Enhanced Mode의 Evaluator QA 게이트는 그대로 유지되지만 책임 영역이 명시되었다. `rules-injection`의 `post-review-validate`가 먼저 실행되어 규칙 위반 여부를 처리하고, 그 다음 Evaluator QA 게이트가 설계 문서의 Success Criteria만 검증한다. 두 호출의 중복을 회피하기 위한 명시적 순서다.

위반 검출 시 해당 규칙의 `auto-fix` 값으로 분기한다. `false`는 보고만, `confirm`(기본값)은 사용자에게 번호 선택으로 결정 위임, `true`는 즉시 자동 수정 라운드를 실행한다. 자동 수정의 안전망은 git-mode에서 별도 커밋 격리 + 테스트 재실행 + 실패 시 `git reset --hard HEAD~1` 자동 롤백으로 구성되며, 롤백 시 변경 diff와 실패한 테스트명을 사용자에게 보고하여 수동 결정을 돕는다. no-git-mode에서는 변경 사항을 별도 리포트로 분리 기록하고 실패 시 텍스트로 보존한다.

자동 수정의 테스트 명령 인지는 Superpowers Implementer가 CLAUDE.md의 `## Test Command` 섹션이나 package.json/Makefile에서 추론한다. 별도 메타 파일(`.claude/dev-workflow.yaml`)을 도입하는 안도 검토했으나, dev-workflow의 "마크다운만" 정신을 유지하기 위해 CLAUDE.md 가이드 강화로 충분하다고 판단하여 v2로 미뤘다. frontmatter에 `auto-fix-test` 필드를 추가해 테스트를 옵션화하는 안은 안전망을 약화시키므로 비채택했다.

## 충돌 처리 정책

규칙 간 충돌(같은 항목에 대한 상충 지시)은 자동 해결 없이 감지 알림만 한다. REVIEW 단계의 `code-reviewer` 프롬프트에 충돌 감지 지시가 함께 첨부되며, 상충 발견 시 사용자에게 번호 선택으로 결정을 위임한다. 명시적 priority 필드는 v1에 도입하지 않았는데, 자동 해결은 의도된 override와 실수를 구별할 수 없어 잘못된 자동 해결이 사용자 결정보다 더 위험하기 때문이다. 충돌 빈도가 실제로 높아지면 v2에서 priority 필드를 검토한다.

## 사용자 인터페이스와 마이그레이션

신규 명령 `/dev-workflow:add-rule`은 인터랙티브 흐름(이름 → 적용 단계 → 종류 → 자동 수정 정책 → 파일 생성)으로 frontmatter를 자동 설정하고 권장 템플릿 골격을 작성한다. 각 옵션마다 짧은 설명을 함께 표시하여 사용자가 의미를 추론할 필요 없이 선택할 수 있다(예: "1. develop — 코드 작성 시 Implementer에 주입"). 이 명령은 PLAN 단계 Architect 검토가 지적한 "사용자 진입 개념 7개" 부담을 해소하는 핵심 장치다.

`/dev-workflow:setup` 명령은 의존성 설치 후 `.claude/rules/` 디렉토리 초기화 옵션을 추가로 제공한다. 빈 디렉토리만 생성/스킵/샘플 포함 초기화 중 선택할 수 있고, 샘플 포함 시 `examples/` 서브디렉토리에 3종 샘플(`coding_style`, `commit_conventional`, `review_checklist`)을 배치한다. examples 격리 패턴은 사용자 학습과 활성화 분리를 동시에 보장한다.

CLAUDE.md에서 `.claude/rules/`로의 마이그레이션은 자동 도구를 제공하지 않고 가이드 문서(`docs/guides/migrate-claude-md.md`)로만 안내한다. 분리할 항목 선정은 프로젝트 맥락에 의존하므로 사용자 결정이 안전하고, 점진적 분리가 가능하도록 부분 마이그레이션을 지원한다. CLAUDE.md는 그대로 동작하므로 분리는 비대화 해소 측면의 선택일 뿐 필수가 아니다.

## 관측성

규칙 활성 상태는 두 계층의 짧은 라벨로 사용자에게 노출한다. SessionStart 시점에 한 줄(`🛡️ 프로젝트 규칙 N개 로드됨: ...`), 단계 진입 시점에 한 줄(`📋 활성 규칙: ... (applies-to 매칭)`)이다. 노이즈를 최소화하면서 디버깅 단서를 보장하는 균형점이며, 상세 출력은 v2의 `/dev-workflow:rules-status` 커맨드로 검토한다.

## 후방 호환과 비목표

`.claude/rules/` 디렉토리가 없는 기존 dev-workflow 사용자 프로젝트는 변경 없이 동일하게 동작한다. SessionStart 훅은 빈 `additionalContext`를 반환하고, `rules-injection` invoke는 단계별 라벨 출력 없이 no-op으로 종료한다. 이 후방 호환성은 MAJOR 버전 업 없이 MINOR(1.7.7 → 1.8.0) 릴리스를 가능하게 한 핵심 조건이다.

v1 범위에서 명시적으로 제외한 항목은 다음과 같다. 신규 워크플로우 단계 추가는 REVIEW 강화로 흡수 가능하여 UX 비용 대비 가치가 없다고 판단했다. pre-commit git hook 레벨 강제는 Superpowers 내부 수정이 필요해 범위 외다. PreToolUse/UserPromptSubmit 훅 기반 실시간 차단은 v2에서 검토한다. 시맨틱 규칙의 100% 강제 보장은 LLM 판단에 의존하므로 best-effort만 약속한다. 헤더 단위 라우팅(현재는 파일 단위), `priority` 필드, 별도 메타 파일, 자동 CLAUDE.md 마이그레이션은 모두 v2 검토 대상이다.

## 컴포넌트 책임 요약

| 컴포넌트 | 책임 |
|---|---|
| `hooks/inject-rules` (신규) | 1차 — `.claude/rules/*.md` 글로브하여 `additionalContext`로 일괄 주입 |
| `hooks/session-start` (수정) | `<!-- dev-workflow:orchestrator -->` 섹션 마커로 신호 분리 |
| `hooks/hooks.json` (수정) | 두 SessionStart 훅을 동일 matcher에 누적 등록 |
| `skills/rules-injection/SKILL.md` (신규) | 2/3차 응집 책임 — 단계별 첨부 + type별 검증자 라우팅 + 자동 수정 라운드 |
| `skills/workflow-orchestrator/SKILL.md` (수정) | DEVELOP/REVIEW/COMPLETION 위임 지점에서 `rules-injection` invoke |
| `skills/plan-stage/SKILL.md` (수정) | PLAN 진입 시점과 Architect 호출 시점에 `rules-injection` invoke |
| `skills/development-principles/SKILL.md` (수정) | 규칙 작성 가이드와 마이그레이션 가이드 참조 추가 |
| `commands/add-rule.md` (신규) | 인터랙티브 규칙 생성, frontmatter 자동 설정 |
| `commands/setup.md` (수정) | `.claude/rules/` 디렉토리 초기화 옵션 + 3종 샘플 |
| `docs/templates/rule-template.md` (신규) | 권장 템플릿 (필드 설명 + 본문 구조 + 작성 팁) |
| `docs/guides/migrate-claude-md.md` (신규) | CLAUDE.md → `.claude/rules/` 점진적 분리 가이드 |
