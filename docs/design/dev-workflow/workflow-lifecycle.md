> 워크플로우의 실행 환경 적응(VCS 분기)부터 종료 시퀀스(문서 취합 → 커밋)까지, DEVELOP 단계의 전체 라이프사이클을 관리한다.

## 시스템 개요

dev-workflow는 Superpowers 위에서 동작하는 플러그인이다. DEVELOP 단계에 진입하면 Superpowers의 `subagent-driven-development`에 실행을 위임하는데, 이 과정에서 두 가지 구조적 문제가 존재했다.

첫째, 실행 환경의 다양성이다. Superpowers는 git worktree를 REQUIRED로 명시하지만, 언리얼 프로젝트처럼 Perforce를 사용하는 환경에서는 `.git` 자체가 존재하지 않는다. 기존에는 Claude Code가 worktree 실패를 암묵적으로 무시하고 메인 디렉토리에서 직접 작업했으나, 공식적인 대응 전략이 없었다.

둘째, 종료 시점의 제어 부재다. DEVELOP/REVIEW 완료 후 Superpowers가 곧바로 커밋을 제안하면서 문서 취합(document-consolidation)이 스킵되는 문제가 반복되었다. 사용자가 매번 "마무리하고 커밋하자"라고 수동 개입해야 하는 마찰이 있었다.

이 두 문제를 해결하기 위해 workflow-orchestrator의 역할을 확장했다. 기존의 세션 시작 프로토콜(시작 → 단계 감지)에 더해, VCS 감지에 의한 실행 모델 분기와 종료 프로토콜을 추가하여 워크플로우의 전체 라이프사이클을 관리하도록 했다. 핵심 원칙은 Superpowers 자체를 수정하지 않고, 컨텍스트 주입과 래퍼로만 제어한다는 것이다.

## VCS 감지와 실행 모델 분기

### 환경 감지

세션 시작 시 프로젝트 루트의 `.git` 디렉토리 존재 여부로 VCS를 감지한다. 존재하면 `git-mode`, 없으면 `no-git-mode`를 설정하며, 감지는 세션당 1회만 수행한다. 모호한 경우에는 사용자에게 worktree 사용 여부를 질문한다.

감지 방식으로 `.git` 디렉토리 유무를 선택한 이유는 단순하고 확실하며 추가 설정이 불필요하기 때문이다. p4 CLI 감지나 별도 설정 파일 방식은 복잡도 대비 가치가 부족하여 기각했다.

### git-mode

기존 Superpowers 방식을 그대로 사용한다. `using-git-worktrees`로 worktree를 설정한 뒤 `subagent-driven-development`를 실행하며, git commit과 SHA 비교 기반의 Code Quality Review가 동작한다.

### no-git-mode

worktree 설정 단계를 스킵하되, Superpowers의 2단계 리뷰 loop(Spec Review + Code Quality Review)는 그대로 유지한다. 이를 위해 다음 규칙을 적용한다:

- worktree 설정 단계를 스킵하고, 프로젝트 디렉토리에서 직접 작업한다
- git commit 대신 Implementer 리포트를 체크포인트로 사용한다
- Code Quality Reviewer에게 SHA 비교 대신 Implementer 리포트의 "Files changed" 목록을 전달하여, 리뷰어가 해당 파일을 직접 읽어 리뷰한다
- Spec Review는 원래 코드 직접 읽기 방식이므로 변경 없다
- TodoWrite로 Task 진행을 추적한다 (기존과 동일)
- DEVELOP 진입 시 감지된 모드를 한 줄로 안내한다

worktree 불가 시 `executing-plans`로 폴백하는 대안도 검토했으나, 리뷰 메커니즘이 없고 공식적으로 비권장이므로 기각했다. 체크포인트를 p4 shelve로 구현하는 방안도 VCS 의존성과 환경 설정 부담 때문에 기각하고, VCS에 완전 독립적인 파일 기반 마커를 선택했다.

### worktree의 실제 가치

worktree의 핵심 가치는 작업 공간 격리이다. Superpowers의 Task 실행은 이미 순차 모델(병렬 디스패치 금지)이므로 병렬성은 부가 가치에 불과하다. Perforce 환경에서는 바이너리 의존성, 에디터 연동 필요성 등으로 worktree의 가치가 제한적이며, 최종 검증은 사용자가 에디터에서 수행한다고 가정한다.

## 마무리 시퀀스와 종료 프로토콜

### 문제와 해결

Superpowers는 태스크 완료 후 곧바로 커밋을 제안하는 경향이 있다. 이로 인해 document-consolidation이 스킵되어 문서가 산발적으로 남는 문제가 발생했다. 이를 해결하기 위해 두 가지 조치를 취했다.

첫째, DEVELOP 진입 시 Superpowers에 "모든 태스크 완료 후 커밋을 제안하지 않는다. 완료 보고만 한다. 마무리 시퀀스는 오케스트레이터가 관리한다."라는 컨텍스트를 주입한다. 이는 no-git-mode 컨텍스트 주입에서 검증된 동일한 패턴이며, git-mode와 no-git-mode 공통으로 적용된다. 다만 텍스트 기반 지시이므로 100% 제어를 보장할 수 없는 한계는 수용한다.

둘째, 사용자가 자연어로 마무리를 선언하면 정해진 순서의 시퀀스가 자동 진행된다.

### 마무리 시퀀스 흐름

사용자의 마무리 선언을 감지하면 다음 순서로 실행한다:

1. **문서 취합** — document-consolidation 스킬의 `consolidate-main`을 호출한다. 실패 시 중단하고 사용자에게 알린다.
2. **README 영향 판단** — 변경 내용이 README에 영향을 주는지 Claude가 판단한 뒤 사용자에게 확인한다. 영향이 없으면 스킵하고, README.md가 프로젝트 루트에 존재하지 않으면 역시 스킵한다.
3. **커밋+푸시 제안** — 사용자 확인 후 실행한다.

각 단계는 성공/실패를 명시적으로 판단하며, 실패 시 해당 지점에서 중단하여 커밋을 차단한다.

### 자연어 감지

마무리 트리거는 자연어 감지 방식을 채택했다. 사용자의 자연스러운 흐름을 유지하기 위함이며, 명시적 명령어는 추후 추가 가능하되 초기에는 자연어로 충분하다고 판단했다. 감지 키워드는 오케스트레이터 스킬 내에 목록으로 관리한다.

- 한국어: "마무리", "마무리해줘", "완료", "정리해줘", "끝내자"
- 영어: "wrap up", "finish", "finalize", "done"

## 관련 파일

| 파일 | 용도 |
|------|------|
| `skills/workflow-orchestrator/SKILL.md` | 세션 시작 프로토콜, VCS 감지, DEVELOP 분기, 종료 프로토콜 — 라이프사이클 전체를 관리하는 중앙 오케스트레이터 |
| `skills/document-consolidation/SKILL.md` | 마무리 시퀀스의 Step 1에서 호출되는 문서 취합 스킬 |

## 핵심 결정 사항

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| VCS 감지 방법 | `.git` 디렉토리 유무 | 단순하고 확실하며 추가 설정 불필요 |
| worktree 불가 시 실행 모델 | subagent-driven-development 유지 (worktree만 스킵) | 2단계 리뷰 loop의 품질을 유지하기 위함 |
| no-git-mode 체크포인트 | 파일 기반 마커 (TodoWrite + Implementer 리포트) | VCS에 완전 독립적이고 구현이 단순 |
| Code Quality Review 대체 방식 | 파일 목록 + 코드 직접 읽기 | Implementer 리포트에 이미 "Files changed"가 존재 |
| Superpowers 수정 여부 | 수정하지 않음 (래퍼/컨텍스트 주입만) | 외부 플러그인이므로 업데이트 호환성 유지 |
| 마무리 시퀀스 제어 위치 | workflow-orchestrator | 세션 시작 프로토콜과 대칭적 구조, 중앙 관리 |
| 커밋 제안 억제 방식 | 컨텍스트 주입 | no-git-mode에서 검증된 패턴 재활용 |
| 마무리 트리거 | 자연어 감지 | 사용자의 자연스러운 흐름 유지 |
| README 업데이트 판단 | Claude 자동 판단 + 사용자 확인 | 불필요한 업데이트 방지 |
