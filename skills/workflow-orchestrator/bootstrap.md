<!-- dev-workflow:orchestrator -->
You have a structured development workflow (dev-workflow plugin).

## 발동 규칙 (필수)

워크플로우 의도 신호가 있는 요청을 처리하기 **전에** 반드시 `dev-workflow:workflow-orchestrator` 스킬을 invoke하라:

- 단계 키워드: 브레인스토밍·아이디어·기획 / 계획·설계 / 구현·개발 / 리뷰·검토 / 마무리·wrap up
- `docs/design/` 하위 설계 산출물을 만들거나 이어가는 작업
- 진행 중 작업 재개 발화 ("이어서 하자", "계속하자", "복구해줘")

신호가 전혀 없는 요청(일반 질문, 단순 수정, 조사)은 워크플로우를 발동하지 않고 일반 응답한다.
이후 대화에서 신호가 등장하면 **그 시점에** invoke한다. 판단이 애매하면 invoke하는 쪽을 택한다.
이미 이 세션에서 orchestrator가 활성이면(워크플로우 단계 진행 중, /compact 복원 포함) 재invoke하지 않고 진행 중 흐름을 계속한다.

## 단계 감지 요약 (상세는 orchestrator 스킬)

| 단계 | 신호 | 위임 |
|---|---|---|
| BRAINSTORM | 브레인스토밍·아이디어·방향 탐색 | brainstorming 스킬 (페르소나 사용) |
| PLAN | 계획·설계, `[기능명].md` 존재 + plan.md 없음 | plan-stage 스킬 (페르소나 사용) |
| DEVELOP | 구현·개발, plan.md 존재 | Superpowers subagent-driven-development |
| REVIEW | 리뷰·검토·QA | Superpowers requesting-code-review + Evaluator QA |
| COMPLETION | 마무리·완료·wrap up | Completion Protocol (문서 취합 → 커밋 제안) |

## 세션 불변식 (워크플로우 단계 진행 중 항상 적용)

- 사용자 입력 요청에 AskUserQuestion 도구를 사용하지 않는다 (BRAINSTORM/PLAN/COMPLETION 한정) — 텍스트 번호 목록으로 질문한다
- 페르소나 발언에는 항상 이모지 접두사를 붙인다
- 커밋+푸시는 Completion Protocol에서만, 커밋 전 사용자 확인
- 결정 요청은 한 번에 하나씩 — 사용자가 일괄로 답하거나 위임하면 그 의도를 수용한다 (응답 주권)
- 결정 요청 형식 상세는 `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`를 Read하여 따른다 (폴백: 우측 개방 박스 `┌── 📌 결정 요청 ──` + 헤더 `📋 확정 N/M`)
