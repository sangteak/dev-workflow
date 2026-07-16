> T1~T5 교체 지도 · T6 검증 체크리스트. "유지" 판정 항목은 사유 필수 (스윕 예외 없음 원칙).

# 스윕 인벤토리 — grounded-output

grep 6종(Step 1) + 의미 미러 수동 검토(Step 2) 결과. 항목 형식: `파일:행 — "원문 인용" → 처리: T{N} (교체|삭제|유지사유)`.

---

## A. 재구성 책임 원본 (SSOT)

- [ ] skills/workflow-orchestrator/decision-flow.md:149-153 — "### 서브에이전트 출력 재구성 책임 / 서브에이전트 출력은 메인 컨텍스트가 수합 후 본 SSOT 형식으로 재구성해 제시한다... 유일한 예외 — 블라인드 라운드의 원문 나열" → 처리: T1/T2/T3 (교체 — 규범 원본)

## B. 재구성 미러 (원본을 참조/복제하는 서술)

- [ ] skills/brainstorming/references/templates.md:205-209 — "출력 재구성 (메인 컨텍스트): ... 결정 요청이 필요하면 메인 컨텍스트가 decision-flow.md 형식으로 재구성한다." (Step C Contrarian 프롬프트 뒤) → 처리: T4 (교체)
- [ ] skills/brainstorming/references/templates.md:236-242 — "출력 재구성 (메인 컨텍스트): ⚡ 교착 돌파 제안 [Hacker]: ... 결정 요청은 decision-flow 형식을 따른다." (Step C Hacker 프롬프트 뒤) → 처리: T4 (교체)
- [ ] skills/brainstorming/SKILL.md:97 — "4. 출력 제약: 사용자를 향한 결정 요청 문구를 포함하지 않는다 — 의견·비판·대안만 반환한다 (결정 요청은 메인 컨텍스트가 decision-flow 형식으로 재구성한다)" → 처리: T4 (교체)
- [ ] skills/plan-stage/SKILL.md:96 — "판정 취합은 본 절의 판정 출력 형식(로컬 템플릿)을 따른다 — §7 취합의 원문 나열은 의견 수집 라운드에 적용된다." → 처리: T5 (교체 — "판정 취합=본체 재요약" 취지 재검토 필요)

## C. 사용자 대면 절 기호(§) 노출 (💡 안내줄)

- [ ] skills/brainstorming/SKILL.md:328 — "💡 phase1_exploration.md 저장됨 — /compact 가능 (재논의 대기열은 먼저 처리 — decision-flow.md §6) · 새 세션: /clear → /dev-workflow:resume" → 처리: T4 (교체 — § 제거/평이화)
- [ ] skills/brainstorming/SKILL.md:361 — "💡 phase2_discovery.md 저장됨 — /compact 가능 (재논의 대기열은 먼저 처리 — decision-flow.md §6) · 새 세션: /clear → /dev-workflow:resume" → 처리: T4 (교체)
- [ ] skills/brainstorming/SKILL.md:395 — "💡 phase3_validation.md 저장됨 — /compact 가능 (재논의 대기열은 먼저 처리 — decision-flow.md §6) · 새 세션: /clear → /dev-workflow:resume" → 처리: T4 (교체)

## D. 블라인드 인라인 정형 ("결론 1줄 + 근거 최대 3개")

- [ ] skills/workflow-orchestrator/decision-flow.md:160 — "**프롬프트 구성:** ... + [정형 형식: 결론 1줄 + 근거 최대 3개] + ..." → 처리: T1/T2/T3 (교체 — 원본)
- [ ] skills/brainstorming/SKILL.md:122 — "**블라인드 라운드:** 정형 형식 — 결론 1줄 + 근거 최대 3개. 취합·센티널·순서 회전은 decision-flow §7 「블라인드 라운드 공통 절차」가 원본이다." → 처리: T4 (교체)
- [ ] skills/brainstorming/references/templates.md:419 — "이 도메인 관점의 독립 의견을 정형 형식으로 반환하라: 결론 1줄 + 근거 최대 3개 (불릿)." (Step C Contrarian 이후, 별도 매칭 — 블라인드 프롬프트 조립 지점) → 처리: T4 (교체, Step 2 grep으로도 잡히나 D 계열 확정 목록에 함께 등재)

## E. 구 스켈레톤(배경 1~2문장) 서술

- [ ] skills/workflow-orchestrator/decision-flow.md:224-237 — "**출력 스켈레톤 (고정 — 이 모양 그대로):** 📌 결정 요청 : [결정명] / **배경:** [1-2문장 — 왜 묻는지/무엇이 문제인지] / 1. [선택지] — 고르면: [결과 1줄] ..." (결정 박스 스켈레톤 정의) → 처리: T1/T2/T3 (교체 — 원본)
- [ ] skills/workflow-orchestrator/decision-flow.md:239-248 — "질문형 (첫 줄이 다르고...): ❓ 질문 [N]/[M] : [제목] / **배경:** [1-2문장] / 1. [선택지]..." (질문형 스켈레톤 정의) → 처리: T1/T2/T3 (교체 — 원본)
- [ ] skills/workflow-orchestrator/decision-flow.md:250 — "탐색적 질문은 대개 개방형이다 — 번호 선택지 없이 `**배경/힌트:**` 뒤에 질문 본문으로 끝나도 스켈레톤 충족으로 본다." (배경/힌트 변형 허용 조항) → 처리: T1/T2/T3 (교체 — 같은 블록)
- [ ] skills/workflow-orchestrator/decision-flow.md:106-118 — "노출 형식: 📌 결정 요청 : 재논의 대기열 처리 ([K]건) / **배경:** 확정된 결정과 충돌해 보류해 둔 항목입니다... / 1. 모두 재논의 ..." (재논의 대기열 실사용 예) → 처리: T1/T2/T3 (교체 — §5 실사용 인스턴스)
- [ ] skills/workflow-orchestrator/decision-flow.md:260-269 — "**실물 예시 (규범이 적용된 결정 요청):** 📌 결정 요청 : 앞질러 답하기 처리 / **배경:** 질문을 하나씩 내면... / 1. 받아준다 ... 💡 추천: 2 ..." (3부 실물 예시) → 처리: T1/T2/T3 (교체 — 예시도 신규 스켈레톤으로 갱신 필요)
- [ ] skills/workflow-orchestrator/SKILL.md:363-380 — "### 결정 요청 폴백 형식 (decision-flow.md Read 실패 시) ... 📌 결정 요청 : [결정명] / **배경:** [1-2문장 — 왜 묻는지/무엇이 문제인지] / 1. [선택지]..." (Input Format Rules 폴백 스켈레톤) → 처리: T5 (교체)
- [ ] skills/workflow-orchestrator/bootstrap.md:32 — "결정 요청 형식 상세는 `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`를 Read하여 따른다 (폴백: `📌 결정 요청 : [제목]` + 번호 선택지(결과 1줄 병기) + `💡 추천` 줄 · 헤더 `📋 확정 N/M` · 자가 응답 금지)" → 처리: T5 (교체 — 압축형 폴백, 세션 부트스트랩 훅 산출물이라 별도 확인 필요)
- [ ] README.md:476 — "워크플로우 진행 중 결정할 사항이 생기면 dev-workflow가 사용자에게 질문합니다. 기본은 **한 번에 하나씩** 묻는 방식이고..." (결정 요청 서술 — 서사형, 리터럴 스켈레톤 미노출) → 처리: T7 (내용 검토 — skeleton 자체가 아니라 동작 서술이므로 T1~T5 결과에 따라 갱신 필요 여부 판단)
- [ ] skills/brainstorming/SKILL.md:40-48 — "**추천이 명확한 경우:** 📌 결정 요청 : 카테고리 확정 / **배경:** 이 기능의 설계 문서가 저장될 분류 폴더입니다... / 1. Yes — 고르면: ... / 2. No — 고르면: ..." (국면 0 카테고리 결정 실사용 예) → 처리: T4 (교체)

## F. Step 2 의미 미러 (grep이 못 잡은 것)

- [ ] skills/brainstorming/SKILL.md:202-207 — "서브에이전트 결과를 **통합 정제**하여 사용자에게 제시한다: 1. 모든 서브에이전트의 질문을 수집한다 2. 의미가 겹치는 질문을 병합한다(출처 페르소나를 태그로 보존) 3. 주제별로 그룹핑하고 번호를 매긴다 4. 각 질문에 응답 힌트를 추가한다" (Step A 인터뷰 — 서브에이전트 산출 질문 취합) → 처리: T4 (교체 검토 — "본체가 서브에이전트 발언을 정리·압축한다" 취지와 동일 패턴. 단 이 취합은 결정 요청 재구성이 아니라 다중 페르소나 질문의 중복 제거·그룹핑이므로, T4 작업자가 grounded-output 신 규범 적용 범위에 포함되는지 판단 필요 — 근거 태그 보존은 이미 하고 있어 완전한 반례는 아님)
- [ ] skills/brainstorming/references/templates.md:32 — "**배경/힌트:** [이 관점에서 왜 묻는지 1줄]" (Step A-0 Ontologist 출력 형식) → 처리: T4 (교체 — decision-flow.md §3 스켈레톤의 국지적 사본, SSOT 변경 시 동반 갱신)
- [ ] skills/brainstorming/references/templates.md:69 — "**배경/힌트:** [답변 시 고려할 관점 1줄 — 초심자 언어]" (Step A Socratic 출력 형식) → 처리: T4 (교체 — 동일 사유)

---

## G. 유지 판정 (사유 필수 — 스윕 예외 없음 원칙에 따른 명시)

- [x] skills/brainstorming/references/agent-roles.md — 전체 파일 → 유지: **수정 금지 계약** (태스크 지시 — 브리프에 명시된 편집 금지 파일)
- [x] skills/plan-stage/references/agent-roles.md — 전체 파일 → 유지: **수정 금지 계약** (태스크 지시 — 브리프에 명시된 편집 금지 파일)
- [x] skills/context-handling/SKILL.md:253 — "3. HANDOFF에 "결정 흐름 상태" 섹션이 있으면: ... 대기열 내용을 기억으로 재구성하지 않는다 (decision-flow.md §6)" → 유지: 이미 grounded 원칙과 일치 — "기억으로 재구성하지 않는다"는 서브에이전트 출력 재구성 금지가 아니라 **HANDOFF 원장 값을 그대로 복원하라**는 지시(반대 방향의 안전장치). 단 "§6" 표기 자체는 사용자 대면이 아닌 스킬 간 내부 참조이므로 교체 대상 아님
- [x] skills/workflow-orchestrator/decision-flow.md:129 — "복구(resume) 시: ... 내용을 기억으로 재구성하지 않는다" → 유지: 위와 동일 사유 (§6 상태 보존 규칙 — 이미 grounded 방향)
- [x] skills/design-summary/SKILL.md:8 — "관련 설계 문서 그룹을 기획서 수준의 통합 요약으로 재구성하여 화면에 출력한다." → 유지: 범위 상이 — 여러 **설계 문서**(파일)의 서사적 통합 요약이 목적이며, 서브에이전트 발언/결정 요청의 재구성이 아니다. design-summary는 grounded-output이 겨냥하는 "서브에이전트 출력 재구성" 안티패턴과 무관한 별도 기능
- [x] skills/design-summary/SKILL.md:76 — "모든 문서를 직접 읽고 서사적 재구성을 수행한다" (1~3개 문서 직접 로드 경로) → 유지: 위와 동일 사유
- [x] skills/design-summary/SKILL.md:103 — "2단계: 메인 에이전트가 추출 결과를 조합하여 출력 구조 가이드에 따라 서사적 재구성을 수행한다" (4개 이상 문서 — 서브에이전트 추출 후 메인이 조합) → 유지: 범위 상이 — 여기서 서브에이전트는 "문서 내용 8항목 추출"을 반환하고, 메인은 이를 시스템 개요 서사로 조합한다. grounded-output이 문제 삼는 "사용자를 향한 결정 요청·의견 원문의 재구성"과는 다른 산출물 성격(설계 문서 요약 생성이 스킬의 본질적 목적) — 단, 만약 T1~T5 재정의가 "서브에이전트 산출물 일반"까지 범위를 넓히면 재검토 필요 (경계 조건이므로 사용자 확인 권장)
- [x] skills/merge-to-domain/SKILL.md:60 — "...feature.md를 도메인 형식(시스템 개요·정책·결정 사항·관련 파일·변경 이력)으로 재구성해 생성한다." (신규 카테고리 승격 흐름) → 유지: 범위 상이 — feature 설계 문서를 도메인 문서 포맷으로 구조 변환하는 것이며, 서브에이전트 발언이나 결정 요청 문구를 재구성하는 것이 아니다

---

## Self-Review 대조 (Step 1 Expected 확정 항목)

- [x] 재구성 책임 원본: decision-flow.md 149~153행 → A 섹션 등재
- [x] 재구성 미러 4곳: templates.md 205~209행·236~242행, brainstorming SKILL.md 97행, plan-stage SKILL.md 96행 → B 섹션 4건 모두 등재
- [x] 사용자 대면 절 기호 3곳: brainstorming SKILL.md 328·361·395행 → C 섹션 3건 모두 등재
- [x] 블라인드 인라인 정형 2곳: decision-flow.md 160행, brainstorming SKILL.md 122행 → D 섹션 등재 (+ templates.md:419 보충 발견)
- [x] 구 스켈레톤(배경 1~2문장) 서술: decision-flow.md 229행, workflow-orchestrator SKILL.md 폴백(372행 인근), bootstrap.md 폴백(32행), README 결정 요청 서술(476행) → E 섹션 모두 등재 (+ decision-flow.md 244·250·106-118·260-269, brainstorming SKILL.md 44행 보충 발견)

누락 없음 — 전부 인벤토리에 등재됨.
