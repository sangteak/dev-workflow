> 멀티세션 컨텍스트 보존과 복구를 위한 HANDOFF 생명주기 전체를 관리한다 -- 저장 명령, 탐색/복구 UX, 이슈 격리 규칙을 포함한다.

## 시스템 개요

Claude Code 세션은 컨텍스트 한계에 도달하거나 사용자가 임의로 종료할 수 있다. 이때 진행 중인 작업의 맥락을 보존하고, 다음 세션에서 매끄럽게 복구하는 것이 세션 관리의 핵심 과제다.

이 도메인은 세 가지 축으로 구성된다. 첫째, HANDOFF 저장과 복구를 slash command로 명시적으로 트리거하는 **명령 체계**. 둘째, 세션 시작 시 진행 중인 작업을 HANDOFF 유무와 관계없이 하나의 통합 목록으로 제시하는 **탐색 UX**. 셋째, 이슈 서브워크플로우에서 부모 Feature의 HANDOFF가 오염되지 않도록 하는 **스코프 격리 규칙**. 이 세 축은 모두 `context-handling` 스킬을 SSOT(Single Source of Truth)로 삼아 동작하며, 정책이 분산되지 않도록 설계되어 있다.

## HANDOFF 저장과 복구 명령

컨텍스트가 가득 차면 사용자는 세 단계를 거쳐야 했다: "HANDOFF.md 작성해줘", `/clear`, "HANDOFF.md 읽고 작업 복귀해줘". 이 반복적 마찰을 제거하기 위해 기존 `context-handling` 스킬에 서브커맨드 두 개를 추가했다.

`/context-handling save`는 현재 작업 맥락을 HANDOFF.md로 저장한다. 저장 완료 후에는 `/clear` 이후의 복구 경로(자동/수동)를 안내하는 메시지를 출력한다. 작업 컨텍스트가 없는 상태에서 호출하면 안내 메시지를 출력하고 종료한다.

`/context-handling resume`은 HANDOFF.md를 탐색하여 복구 흐름에 진입한다. 다만 세션 시작 시 SessionStart hook을 통한 자동 복구가 이미 동작하고 있으므로, `/clear` 후 아무 메시지를 입력하면 orchestrator가 자동으로 context-handling을 호출하여 작업 목록을 제시한다. `resume`은 이를 명시적으로 트리거하는 수동 경로다.

서브커맨드 구조는 `document-consolidation` 스킬의 Mode 패턴을 참조하되, `Mode 1: consolidate-main` 대신 `Mode: save` 형태로 명명하여 subcommand 기반 스킬의 특성에 맞췄다. 별도 스킬을 2개 생성하는 대안은 기능이 2개뿐이라 과잉이고 context-handling과 로직이 중복되므로 기각했다. 명령 이름으로 `restore`나 `load` 대신 `resume`을 선택한 이유는 "작업 재개"라는 뉘앙스에 가장 부합하기 때문이다.

컨텍스트 부족 자동 감지 및 선제적 HANDOFF 제안은 구현하지 않았다. 플랫폼에 정확한 컨텍스트 사용량 API가 없어 사용자가 직접 모니터링하는 방식을 유지한다. `/clear` 자동화 역시 Claude Code CLI 내장 명령이라 프로그래밍적 호출이 불가능하다.

## 세션 시작 탐색과 통합 목록

기존에는 세션 시작 시 HANDOFF 탐색 과정에서 glob 실패 메시지("docs/design/ 경로에 없습니다"), sequential-thinking 내부 로그 등이 그대로 노출되어 가독성이 극도로 저하되었다. 또한 HANDOFF.md를 작성하지 않은 채 세션이 종료된 작업은 목록에 나타나지 않았고, orchestrator와 context-handling에 탐색 로직이 분산되어 출력 일관성을 유지하기 어려웠다.

이를 해결하기 위해 탐색 책임을 context-handling 한 곳으로 일원화했다. orchestrator의 Session Start Protocol Step 2는 단순 invoke만 수행하도록 축소하고, 탐색, 분류, 목록 제시, 폴백을 모두 context-handling이 처리한다.

탐색은 단일 패스로 수행한다. `docs/design/` 하위 전체를 한 번에 스캔하여 HANDOFF.md, phase 파일, 기능명.md, plan.md를 수집하고, `_archive/` 경로 포함 항목을 즉시 제거한 뒤 디렉토리별로 그룹핑한다. 순차 탐색(1차 실패 후 2차 재탐색)은 중간 실패 메시지 노출의 원인이었으므로 기각했다.

분류 단계에서는 `status: complete`이거나 `_archive/`가 존재하는 항목을 완료로 판정하여 제외한다. HANDOFF가 있는 항목은 `current-phase`와 `last-updated`를 추출하고, HANDOFF가 없는 항목은 파일 조합으로 단계를 추론한다:

- `phase1.md`만 존재하면 "Phase 1 완료"
- `phase1.md` + `phase2.md`이면 "Phase 2 완료"
- `phase1.md` + `phase2.md` + `phase3.md`이면 "Phase 3 완료"
- `[기능명].md`의 status가 `ready-for-plan`이면 "PLAN 대기"
- `plan.md`가 존재하고 status가 complete가 아니면 "DEVELOP 진행 중"

HANDOFF가 없는 항목에는 `HANDOFF 없음` 태그를 부착한다. issues/ 항목은 `parent-feature` 하위에 들여쓰기로 표시한다. 정렬은 `last-updated` 역순이다. HANDOFF가 1개뿐일 때 자동 복귀하는 대안은 사용자 의도를 확인할 수 없고 새 작업 선택지를 보장할 수 없어 기각했다. 항상 목록을 제시하여 일관성을 유지한다.

출력 억제도 핵심 설계 결정이다. 탐색부터 목록 제시 사이에 "탐색합니다", glob 실행 결과, "HANDOFF.md가 없습니다", sequential-thinking 내부 추론 등을 일절 출력하지 않는다. 유일한 출력은 통합 목록 템플릿뿐이다. 단, Markdown 스킬은 Claude의 행동을 지시할 뿐 강제할 수 없으므로 100% 보장은 불가능하며, 발생 빈도를 줄이는 것이 목표다. 탐색 지시를 단일 문단으로 압축한 이유도 여기에 있다 -- 여러 스텝으로 나누면 Claude가 스텝별 진행 보고를 하는 경향이 있기 때문이다.

복구 시 HANDOFF가 있는 항목을 선택하면 이전 세션의 국면을 이어서 진행하겠다는 안내와 확인을 거친다. HANDOFF가 없는 항목을 선택하면 마지막으로 완료된 단계를 안내하고 다음 단계부터 새로 시작한다 -- Phase N 완료 항목은 Phase N+1부터, PLAN 대기 항목은 PLAN 단계부터, DEVELOP 진행 중 항목은 plan.md의 태스크 체크리스트를 확인한 후 재개한다.

## 이슈 서브워크플로우 HANDOFF 격리

Feature 개발 중 이슈를 생성하여 `issues/` 서브워크플로우에 진입한 상태에서 HANDOFF를 저장하면, 이슈의 HANDOFF.md뿐만 아니라 부모 Feature의 HANDOFF.md까지 수정되는 문제가 있었다. 원인은 context-handling 스킬에 명시적 격리 규칙이 없어 Claude가 "더 많이 저장하는 게 안전하다"고 넓게 해석한 것이다.

해결 방식은 명시적 금지 규칙 추가다. issues/ 서브워크플로우에서 HANDOFF를 생성하거나 업데이트할 때 부모 Feature의 HANDOFF.md를 수정하거나 새로 생성하지 않는다. 중간 결정 사항 업데이트 시에도 "현재 작업 위치의 HANDOFF.md"만 대상으로 한정한다. Claude는 명시적 단정 규칙을 근거와 함께 제시하면 잘 따르므로, 시나리오별 가이드보다 금지 규칙이 효과적이다.

이슈 생성 시 부모 HANDOFF를 자동 저장하는 방안은 불필요하다. 이슈는 DEVELOP 단계에서만 발생하며, DEVELOP 상태는 plan.md, git, TodoWrite 등 기존 산출물로 충분히 복구 가능하다. 부모 HANDOFF에 이슈 참조를 기록하는 방안도 `is-issue`와 `parent-feature` 메타데이터로 이미 관계가 표현되므로 중복 기록일 뿐이다.

## 관련 파일

| 파일 | 용도 |
|------|------|
| `skills/context-handling/SKILL.md` | HANDOFF 정책의 SSOT. 저장/복구 서브커맨드, 탐색 절차, 출력 템플릿, 격리 규칙을 모두 포함 |
| `skills/workflow-orchestrator/SKILL.md` | Session Start Protocol Step 2에서 context-handling을 invoke |
| `.claude-plugin/plugin.json` | 플러그인 버전 및 스킬 description 관리 |
| `.claude-plugin/marketplace.json` | 마켓플레이스 배포 버전 관리 |

## 핵심 결정 사항

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 서브커맨드 vs 별도 스킬 | 서브커맨드 (`save`/`resume`) | 기능이 2개뿐이라 별도 스킬은 과잉, 로직 중복 방지 |
| 명령 이름 | `resume` (not `restore`/`load`) | "작업 재개" 뉘앙스에 가장 부합 |
| 컨텍스트 부족 자동 감지 | 미구현 | 플랫폼에 컨텍스트 사용량 API 없음 |
| 탐색 책임 | context-handling 일원화 | 출력 템플릿을 한 곳에서 관리하여 일관성 보장 |
| 탐색 방식 | 단일 패스 glob | 순차 탐색은 중간 실패 메시지 노출의 원인 |
| 상태 판단 | status + 파일 조합 추론 | 기존 status 2개(`ready-for-plan`, `complete`)로 충분 |
| HANDOFF 1개일 때 | 항상 목록 제시 | 자동 복귀는 사용자 의도 확인 불가, 새 작업 선택지 보장 |
| 이슈 HANDOFF 격리 | 명시적 금지 규칙 | Claude는 단정 규칙을 잘 따름, 시나리오별 가이드는 해석 여지가 넓어 역효과 |
| 이슈 생성 시 부모 HANDOFF 자동 저장 | 불필요 | DEVELOP 산출물(plan.md, git, TodoWrite)로 복구 가능 |
| 부모 HANDOFF에 이슈 참조 기록 | 불필요 | `is-issue` + `parent-feature` 메타데이터로 충분 |
