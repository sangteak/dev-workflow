# Completion Protocol — 마무리 시퀀스 (SSOT)

> 진입 경로: ① workflow-orchestrator 「마무리 트리거 감지」(자연어) ② `/dev-workflow:finish` command 호출 (호출 자체가 사용자의 완료 선언 — 트리거 감지 생략) ③ completion-nudge 훅 주입 후 라우팅.
> 이 파일이 시퀀스의 SSOT다. 요약본을 다른 곳에 만들지 않는다.

## 진입 경로 기록 (Step 0 직전)

시퀀스 시작 시 진입 경로를 식별해 내부적으로 기록한다: `자연어 감지` | `finish command` | `훅 주입 후 라우팅`.
Step 1의 document-consolidation이 §10 변경 이력 행을 쓸 때 `(진입: [경로])`를 병기한다 — 관측 데이터(REQ-009).

감지 시 아래 순서를 자동으로 실행한다. 각 단계는 이전 단계 성공 후에만 진행한다.

**Step 0: 이슈 카드 잔존 검사**
- `[기능명]/issues/` 하위에 미해소 카드(`NNN-*.md`)가 있으면 목록을 제시하고 확인한다:
  "미해소 이슈 [N]건이 있습니다: [카드명·심각도 목록]. 처리 후 마무리할까요?
  1. 처리 후 마무리 — 고르면: 카드부터 해소하고 시퀀스를 다시 시작합니다
  2. 보류하고 마무리 — 고르면: §10에 보류 사유를 기록하고 진행합니다"
- 없으면 출력 없이 통과한다

**Step 1: 문서 취합**
- invoke `dev-workflow:document-consolidation` (consolidate-main 모드)
- 역할: phase/plan 파일을 feature 문서로 통합 후 status를 `complete`로 마킹
- ⚠️ 이 단계에서는 domain.md 머지를 시도하지 않는다 (별도 머지 스킬이 전담)
- **⚠️ 이 invoke는 document-consolidation의 '자동 실행하지 않는다' 규칙보다 우선한다. 사용자 확인 없이 즉시 실행한다.**
- §10 변경 이력 행에 진입 경로를 병기한다: `(진입: [경로])`
- 실패 시 → 중단, 사용자에게 상황 보고

**Step 2: README 영향 판단**
- 변경 내용을 분석하여 README.md 업데이트 필요 여부를 판단한다
- 영향 있음 → "README.md 업데이트가 필요해 보입니다. 진행할까요?" 사용자 확인 후 업데이트
- 영향 없음 → 스킵
- README.md가 프로젝트에 존재하지 않으면 스킵
- 실패 시 → 중단, 사용자에게 상황 보고

**Step 2.5: rules-injection 호출 (커밋 직전):**
invoke `dev-workflow:rules-injection` with:
- stage: completion
- purpose: pre-stage-attach

`applies-to: completion` 규칙(예: 커밋 메시지 형식)이 현재 컨텍스트에 첨부되어 Step 3의 커밋 메시지 작성에 반영된다.

**Step 3: 커밋 제안**
- "마무리가 완료되었습니다. 커밋을 진행할까요?" 사용자 확인 후 커밋 실행

**Step 3.5: 푸시 제안 (커밋 성공 후)**
- "커밋 완료: [커밋 요지 1줄]. 원격에 푸시할까요?" 사용자 확인 후 푸시 실행
- 푸시는 원격 공개(되돌리기 어려움)이므로 커밋과 분리해 별도 승인을 받는다 — 커밋만 하고 마치는 선택을 허용한다
- Step 3·3.5의 확인 문구는 Input Format Rules의 Yes/No 형식(1. Yes / 2. No)으로 출력한다

**Step 4 (선택, 관리자만): 도메인 통합**
- 작업자는 여기서 작업을 마무리한다
- 관리자는 별도 시점에 `/dev-workflow:merge-to-domain [카테고리]`를 호출하여 도메인 통합 진행
- merge-to-domain 스킬은 docs/design 스캔으로 status=complete feature를 자동 식별
