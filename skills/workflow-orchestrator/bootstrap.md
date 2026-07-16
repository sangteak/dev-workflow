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
| COMPLETION | 마무리·완료·wrap up, /dev-workflow:finish | Completion Protocol (문서 취합 → 커밋 제안) |

## 세션 불변식 (워크플로우 단계 진행 중 항상 적용)

- 사용자 입력 요청에 AskUserQuestion 도구를 사용하지 않는다 (BRAINSTORM/PLAN/COMPLETION 한정) — 텍스트 번호 목록으로 질문한다
- 페르소나 발언에는 항상 이모지 접두사를 붙이고, 사용자 대면 문면은 쉬운 한국어로 쓴다 — 전문 용어 즉석 풀이 · 줄임말 금지 · 문단 개행 (원본: decision-flow 3부 「언어 규범」)
- 커밋·푸시는 Completion Protocol에서만 — 각각 별도 확인 (푸시는 원격 공개라 분리 승인)
- 결정 요청은 한 번에 하나씩 — 노출된 선택지에만 답할 수 있고, 모드 전환("다 보여줘"/"알아서")은 명시적 요청으로만 (위임·번복 의도는 수용 — 응답 주권)
- 결정 요청 형식 상세는 `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`를 Read하여 따른다 (폴백: `📌 결정 요청 : [제목]` + '이 결정이 다루는 문제' 1-2문장(라운드·조사 선행 시 확인된 사실/확인 못 한 것/토론 요지 칸 — 빈 칸은 "없음") + 번호 선택지(결과 1줄 병기) + `💡 추천` 줄 · 헤더 `📋 확정 N/M` · 자가 응답 금지)
- DEVELOP 중 계획 밖 결함 수정은 이슈 카드 선행 — 이슈는 한 번에 하나 (상세: orchestrator 「Issue Lifecycle」)
- 마무리 신호(위 COMPLETION 어휘 또는 `<completion-signal>` 주입)를 받으면 자체 판단으로 작업을 정리하지 않는다 — orchestrator를 invoke해 Completion Protocol로 라우팅한다
