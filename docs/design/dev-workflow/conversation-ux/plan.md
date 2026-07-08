# conversation-ux Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dev-workflow 직접 진행 구간의 대화를 "하나씩 · 보이는 것만 · 쉬운 말 · 깨지지 않는 형식"으로 통일 (실사용 이슈 6건 + 백로그 1건, v1.14.0)

**Architecture:** decision-flow.md를 3부(결정 규칙/질문 규칙/공통 형식·언어)로 재편하고, 본 plan에 확정된 문면을 verbatim 반영. 폴백 2점은 본문과 같은 태스크에서 동기화. 로컬 화면 개정은 게이트 대조 인벤토리(T1)로 회귀 방지. 검증은 G4 패턴 재사용.

**Tech Stack:** Markdown 스킬 문서 편집, bash(grep/개수 체크), git

## Global Constraints

- 본 plan의 확정 문면은 **verbatim 반영** — 구현 중 재작성·문구 개선 금지. 수정 필요 발견 시 중단하고 보고
- 게이트 의미 보존: 개정 화면의 **선택지 수·0번 유무·분기 의미 변경 금지** — 문구·형식만 (T1 인벤토리로 전후 대조)
- 적용 범위 밖 무변경: REVIEW AC 박스(workflow-orchestrator SKILL.md:154-156), merge-to-domain·design-summary·rules-injection·document-consolidation 출력, 디렉토리 트리(├└│), 산출물 내부 마크다운 표
- `──` 대시 구분선은 금지 대상 아님 (금지는 정렬 요구 괘선 ┌│└ + 대화 UI 마크다운 표)
- development-principles/SKILL.md 무변경
- 커밋은 태스크당 1개
- 스켈레톤 표준형 (결정 — 질문은 첫 줄만 `❓ 질문 [N]/[M] : [제목]`으로 상이):

  ```
  📌 결정 요청 : [결정명]

  **배경:** [왜 이 결정이 필요한지 1~3문장 — 전문 용어는 등장 시 짧게 풀이]

  1. [선택지] — 고르면: [결과 1줄]
  2. [선택지] — 고르면: [결과 1줄]

  💡 추천: [번호]
  [사유 1~2문장]
  ```

  (0번 탈출구는 필요 시에만 목록 마지막. 추천이 없으면 💡 줄 생략)

---

### Task 1: 베이스라인 게이트 인벤토리

**Files:**
- Create: `docs/design/dev-workflow/conversation-ux/baseline-gates.md` (일회용 — T6에서 폐기)

**Interfaces:**
- Produces: T2~T4의 전후 대조 기준 (게이트명·선택지 수·0번 유무), T5 전수 재검의 원장

- [ ] **Step 1: 개정 대상 게이트 스냅샷**

Run: `grep -n "^1\. \|^  1\. \|1\. Yes" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md skills/plan-stage/SKILL.md skills/context-handling/SKILL.md skills/persona-resolution/SKILL.md`
개정 대상 화면별 {파일:줄, 화면 이름, 선택지 수, 0번 유무}를 표로 기록. 대상 목록: decision-flow 결정 박스·재논의 대기열 박스 / orchestrator 폴백 박스·Ambiguous 질문 / brainstorming 국면0 카테고리(명확·모호 2형)·미답변 조사 Pass2·시드 확인·Simplifier 3택 / plan-stage 재협의 4지·미결 사항 확인 / context-handling 잔존 HANDOFF 삭제 / persona-resolution 저장 제안

- [ ] **Step 2: 괘선·폴백 현황 기록**

Run: `grep -cn "┌\|└" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md hooks/bootstrap.md` (bootstrap 경로는 hooks/ 하위 실제 파일명 확인 후 기록)
현재 괘선 위치와 폴백 3점(decision-flow.md·SKILL.md Input Format Rules·bootstrap)의 결정 요청 문면을 인용으로 기록. `wc -c` 3개 파일 크기 기록 (bootstrap 예산 확인용)

- [ ] **Step 3: 커밋**

```bash
git add docs/design/dev-workflow/conversation-ux/baseline-gates.md
git commit -m "docs(conv-ux): capture baseline gate inventory"
```

---

### Task 2: decision-flow.md 3부 재편 + 폴백 2점 동기화

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (중심), `skills/workflow-orchestrator/SKILL.md` (Input Format Rules·Ambiguous), `hooks/` 부트스트랩 파일 (폴백 1줄)

**Interfaces:**
- Consumes: T1 인벤토리
- Produces: 3부 구조와 확정 문면 — T3·T4의 로컬 화면이 이 스켈레톤을 인스턴스화

- [ ] **Step 1: 문서 서두에 적용 범위·G5 관계·3부 위계 추가**

§1 앞 또는 §1 내에 verbatim 삽입:

```
**적용 범위:** 본 규칙은 dev-workflow가 직접 진행하는 구간(BRAINSTORM/PLAN/COMPLETION, 세션 시작, 컨텍스트 관리)의 사용자 대면 출력에 적용된다. Superpowers 위임 단계(DEVELOP/REVIEW)와 merge-to-domain·design-summary의 기존 출력 형식은 별개다.
**G5(게이트 배칭)와의 관계:** 게이트 배칭은 확인의 묶음 단위(이 확인이 필요한가)를 다루고, 본 규칙은 묶음 내부의 제시 방식(남은 확인을 어떻게 보여주나)을 다룬다 — 확인 횟수를 줄이는 변경과 충돌하지 않는다.
**문서 구성:** 1부(결정 규칙)·2부(질문 규칙)는 3부(공통 형식·언어)의 스켈레톤과 언어 규범을 결정·질문에 각각 적용한 것이다 — 형식·언어의 원본은 3부가 유일하다.
```

- [ ] **Step 2: 결정 박스(§2 D)·재논의 대기열 박스(§5)를 스켈레톤으로 교체**

기존 `┌──…└──` 박스 정의 2곳 삭제, Global Constraints의 스켈레톤 표준형으로 교체. §2의 "우측 테두리를 닫지 않는다" 조항 삭제 (괘선 폐지로 무의미). 인라인 `(추천)` 규정을 `💡 추천: [번호]` + 사유 줄 규정으로 교체. 재논의 대기열 노출은 동일 스켈레톤 + 선택지에 결과 1줄:

```
📌 결정 요청 : 재논의 대기열 처리 ([K]건)

**배경:** 확정된 결정과 충돌해 보류해 둔 항목입니다. 기각해도 사라지지 않고 phase 파일에 기록이 남습니다.

- [항목명] — 충돌 상대: [결정명] · 사유: [1줄]

1. 모두 재논의 — 고르면: 항목별로 페르소나 토론을 다시 엽니다
2. 일부만 (번호 지정) — 고르면: 지정한 것만 재논의, 나머지는 기각 기록
3. 모두 기각 — 고르면: 전부 기각으로 기록하고 진행
```

- [ ] **Step 3: §4 응답 처리 재작성 (핵심 의미 변경)**

기존 일괄 응답 수용·순서 무시 수용·"브리핑 일괄 응답 → 한꺼번에 전환" 조항을 삭제하고 verbatim 삽입:

```
**응답 가능 범위 — 선택지까지 노출된 항목에만 답할 수 있다.** 제목만 나열된 브리핑·목차는 응답 대상이 아니다. 하나씩 모드에서 쉼표·줄바꿈으로 구분된 다중 값 응답이 오면 첫 값만 현재 항목에 반영하고 나머지는 버린 뒤 한 줄로 안내한다: `첫 답만 반영했습니다. 나머지는 다음 항목에서 다시 여쭙겠습니다. (한 번에 보시려면 "다 보여줘")` 선답·일괄 응답을 모드 전환으로 자동 해석하지 않는다 — 모드 전환은 명시적 요청("다 보여줘"/"한꺼번에"/"알아서")으로만 일어난다. 한꺼번에 모드에서는 모든 항목의 선택지가 노출되어 있으므로 일괄 응답을 항목별로 매핑해 수용한다 (기존 규칙 유지).
```

(§4의 무관 주제 복귀 고지·재확정 요청 처리 등 나머지 조항은 무변경)

- [ ] **Step 4: 자가 응답 금지 + 생략 화이트리스트 신설 (1부)**

verbatim 삽입:

```
**자가 응답 금지 — 번호 선택지를 출력한 메시지는 그 선택을 기다리며 끝나야 한다.** 모델이 대신 선택하고 진행하지 않는다. 선택지를 출력한 뒤 같은 메시지에서 다른 게이트로 잇지 않는다.
**선택지 생략 화이트리스트:** 사용자 메시지에 아래 표현(또는 그 명백한 변형)이 있을 때만, 해당 지점의 선택지 출력을 생략하고 그 지시대로 진행할 수 있다: "그냥 기본값으로" / "알아서 해줘" / "당연히 [X]로" / "네가 정해줘" / "아무거나". 목록에 없는 표현은 생략 근거가 아니다 — 의도가 명확해 보여도 선택지를 출력한다. 생략 후 사용자가 이의를 제기하면 재논의 대기열을 거치지 않고 즉시 해당 선택지를 소급 제시한다.
```

- [ ] **Step 5: 사전 브리핑(F) 시점·문면 개정**

기존 F의 "일괄로 답하시거나 '알아서'라고 하셔도 됩니다" 유형 안내를 제거하고 verbatim 교체:

```
**사전 브리핑(F)은 첫 결정 박스와 같은 메시지에서, 박스 직전에 출력한다.** 페르소나 토론·서브에이전트 라운드가 선행되는 경우 브리핑도 라운드 종료 후로 미룬다. 라운드 진행 중에는 응답을 기다린다는 문면을 출력하지 않는다 — 입력을 여는 문면은 실제로 응답을 기다리는 시점에만 쓴다.

브리핑 문면:
📋 결정 항목 [M]개 — 의존성 루트부터 정렬:
1. [결정명] — [정렬 근거 1줄] ← 루트
2. [결정명] — [정렬 근거 1줄]

첫 번째 항목부터 하나씩 여쭙습니다. (정렬 이의는 알려주세요 · 한 번에 보시려면 "다 보여줘" · 위임은 "알아서")
```

- [ ] **Step 6: 2부 질문 규칙 신설**

verbatim 삽입 (신규 절):

```
## 질문 규칙 (탐색적 질문 트랙)

질문은 답이 산출물에 결정으로 기록되지 않는 탐색적 입력 요청이다 (결정과의 층위 차이: 질문의 답은 대화로 가볍게 무를 수 있고, 결정은 §5 재논의 절차를 거친다).

- **기본 하나씩:** 질문은 한 번에 하나만 노출한다. 이 규칙은 종전의 "한 번에 최대 2개 질문" 규칙을 대체한다
- **진행 표시:** `❓ 질문 [N]/[M] : [제목]` — M(전체 수)은 질문 수집(페르소나 전원 소집·병합)이 끝난 뒤 확정한다. 질문 카운터와 결정 카운터(📋 확정 N/M)는 별개로 센다 — 합산하지 않는다
- **형식:** 3부 스켈레톤의 질문형을 따른다. 첫 질문에만 진행 안내 1줄을 붙인다: `(답하기 어려우면 "모름"/"넘어가" — 조사로 넘깁니다 · 전체 보기: "다 보여줘" · 위임: "알아서")`
- **라우팅:** "모름"/"넘어가" 응답은 해당 질문을 조사 대기열에 적재하고 다음 질문으로 진행한다. 질문 순회가 끝나면 적재분을 일괄 조사한다 (미답변 조사 절차)
- **잠정성:** 질문의 답은 잠정이며 국면 전환 시점에 확정된다. 답의 전제가 이후 토론으로 무효화되면 해당 답을 재확인한다
- **응답 범위·모드 전환:** §4와 동일 — 노출된 질문에만 답할 수 있고, 다중 값 응답은 첫 값만 반영하며, 모드 전환은 명시적 요청으로만
- **세션 이관:** HANDOFF 저장 시 질문 진행 상태를 별도 줄로 기록한다: `❓ 질문 진행: [N]/[M] · 국면: [국면명]` + 미답변 질문 목록 (결정 마커와 혼용하지 않는다)
```

- [ ] **Step 7: 3부 공통 형식·언어 신설**

verbatim 삽입 (신규 절 — 스켈레톤 표준형은 Global Constraints의 것을 그대로 수록):

```
## 공통 형식·언어 (결정·질문 공통 — 형식·언어의 원본)

**출력 스켈레톤 (고정 — 이 모양 그대로):**
[Global Constraints의 결정 스켈레톤 + 질문 첫 줄 변형 수록]

**금지:** 정렬이 필요한 괘선(┌ │ └)과 대화 UI의 마크다운 표. 허용: `──` 대시 구분선, 디렉토리 트리, 산출물(설계 문서·phase 파일) 내부의 표.

**초심자 언어 기본값:** 사용자에게 묻거나 결과를 공유하는 모든 문면의 기본 — ① 짧은 배경(왜 묻는지/무엇이 문제인지) ② 선택지마다 "고르면: [결과 1줄]" ③ 전문 용어는 등장 시 짧게 풀이 ④ 💡 추천과 사유는 별도 줄 ⑤ 비유는 도움이 될 때 (의무 아님). 사용자가 더 풀어달라고 하면 배경→비유→선택지별 의미→추천 순으로 다시 설명한다.

**ID 라벨 병기:** 문서 내부 ID(REQ-001 등)를 대화에서 단독으로 지칭하지 않는다 — 항상 짧은 라벨을 병기한다. 예: `REQ-001(공통 스켈레톤)`.

**공유 출력 형식:** 요약·결과 공유는 이모지를 붙인 구분 헤더 아래 `-` 항목으로 나열하고 구분 사이는 빈 줄로 띄운다. 항목을 `/`로 한 줄에 이어 붙이지 않는다. 페르소나 발언은 `[이모지] [이름]:` 줄 다음 개행 후 내용을 쓴다. 그룹 경계가 흐리면 `──` 구분선을 쓴다.

**실물 예시 (규범이 적용된 결정 요청):**
📌 결정 요청 : 앞질러 답하기 처리

**배경:** 질문을 하나씩 내면, 사용자가 "1,1,1"처럼 아직 나오지 않은 질문에 미리 답하는 경우가 생깁니다.

1. 받아준다 — 고르면: 순서대로 배정하고 배정 결과표로 확인
2. 되돌린다 — 고르면: 첫 답만 받고 나머지는 순서대로 다시 질문

💡 추천: 2
안 본 질문에 답하면 질문 내용을 알았을 때와 다른 선택을 했을 수 있습니다.
```

- [ ] **Step 8: §8 로컬 템플릿 우선 문면 갱신 (백로그 B1)**

"스킬 본문에 구체 출력 템플릿이 있는" → "스킬 본문 또는 본문이 지시하는 references/ 템플릿에 구체 출력 템플릿이 있는" 으로 교체 (그 외 §8 문면 무변경 — "문서 그대로 출력, 임의 재조립 금지" 원칙 유지)

- [ ] **Step 9: orchestrator SKILL.md 동기화 (같은 태스크 — 분리 금지)**

- Input Format Rules의 "결정 요청 폴백 형식" 괘선 박스 → Global Constraints 스켈레톤으로 교체 (한 줄 헤더 `📋 확정 N/M` 문면은 유지)
- Ambiguous 단계 질문(:169-176)에 선택지별 결과 1줄 부여:

```
현재 단계를 감지하지 못했습니다. 어느 단계인가요?

1. 브레인스토밍 — 고르면: 페르소나 인터뷰로 요구사항 탐색 시작
2. 계획 — 고르면: 설계 문서 기반 실현 가능성 평가로 진행
3. 개발 — 고르면: 태스크 목록 실행으로 진행
4. 리뷰 — 고르면: 코드 리뷰 절차로 진행
0. 해당 없음 — 하려는 작업을 자유롭게 설명해주세요
```

- [ ] **Step 10: 부트스트랩 폴백 1줄 동기화 (같은 태스크)**

hooks 부트스트랩의 `(폴백: 우측 개방 박스 ┌── 📌 결정 요청 ── + 헤더 📋 확정 N/M)` 유형 문면을 다음으로 교체: `(폴백: 📌 결정 요청 : [제목] + 번호 선택지(결과 1줄 병기) + 💡 추천 줄 · 헤더 📋 확정 N/M · 자가 응답 금지)` — 교체 후 `wc -c`로 부트스트랩 크기가 T1 기록 대비 +200B 이내 확인

- [ ] **Step 11: 기계 체크 + 커밋**

- `grep -c "┌\|└" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md [부트스트랩]` → 각 0 (디렉토리 트리 없는 파일들)
- `grep -c "📌 결정 요청 :" skills/workflow-orchestrator/decision-flow.md` → ≥3 (표준형+대기열+실물 예시)
- `grep -c "❓ 질문" skills/workflow-orchestrator/decision-flow.md` → ≥2
- `grep -c "일괄로 답하시거나" skills/workflow-orchestrator/decision-flow.md` → 0 (F 개정 확인)
- `grep -c "본문 또는 본문이 지시하는 references/" skills/workflow-orchestrator/decision-flow.md` → 1
- T1 인벤토리의 decision-flow·orchestrator 게이트 대조: 선택지 수·0번 유무 동일

```bash
git add skills/workflow-orchestrator/ hooks/
git commit -m "feat(conv-ux): rewrite decision-flow as 3-part interaction SSOT, sync fallbacks"
```

---

### Task 3: brainstorming 접합 + 로컬 화면 개정

**Files:**
- Modify: `skills/brainstorming/SKILL.md`, `skills/brainstorming/references/templates.md`

**Interfaces:**
- Consumes: T2의 스켈레톤·질문 규칙 (인스턴스화), T1 인벤토리

- [ ] **Step 1: "최대 2개" 규칙 교체 (SKILL.md 2곳)**

`한 번에 최대 2개 질문만 한다 (탐색적 질문 한정 — 답이 설계 결정으로 기록되는 질문은 decision-flow의 '한 번에 하나' 규칙을 따른다)` → `질문은 decision-flow.md의 질문 규칙을 따른다 — 하나씩, ❓ 질문 N/M 진행 표시 (답이 설계 결정으로 기록되는 질문은 결정 규칙을 따른다)` (2곳 동일 문면)

- [ ] **Step 2: Step A 통합 정제 — 노출부만 순차화 (templates.md 「Step A Socratic 프롬프트」 블록의 출력 형식 펜스 교체)**

수집·병합·그룹핑·힌트 규칙(1~4)은 무변경. 출력 형식 펜스를 verbatim 교체:

```
❓ 질문 [N]/[M] : [주제]
← [페르소나 이모지] [Socratic] (겹친 경우 + 병기)

**배경/힌트:** [답변 시 고려할 관점 1줄 — 초심자 언어]

(첫 질문에만: 답하기 어려우면 "모름"/"넘어가" — 조사로 넘깁니다 · 전체 보기: "다 보여줘" · 위임: "알아서")
```

병합 완료 후 M 확정 → 1번부터 순차 노출. "모름"/"넘어가" → 미답변 조사 대기열 적재 후 다음 질문. 순회 종료 후 기존 미답변 조사 절차(2-pass) 무변경 진입

- [ ] **Step 3: A-0 본질 질문 4개도 동일 순차 규칙 적용 (templates.md 「Step A-0 Ontologist 프롬프트」 출력 형식의 노출 규정에 1줄 추가)**

출력 형식 펜스 하단에 추가: `노출은 decision-flow.md 질문 규칙을 따른다 — 하나씩 (❓ 질문 N/4), "모름"/"넘어가"는 조사로.`

- [ ] **Step 4: 로컬 화면 4개 개정 (게이트 의미 보존 — 문구·형식만)**

① 국면 0 카테고리 (SKILL.md, 명확형):

```
📌 결정 요청 : 카테고리 확정

**배경:** 이 기능의 설계 문서가 저장될 분류 폴더입니다. 기존 카테고리 [카테고리명]이 [근거]와 일치합니다.

1. Yes — 고르면: docs/design/[카테고리명]/ 아래에 기능 폴더가 생깁니다
2. No — 고르면: 다른 카테고리를 지정하거나 새로 만듭니다
```

(모호형은 기존 목록형 유지하되 각 항목에 `— 소속 기능 [n]개` 유지 + 말미 `0. ✨ 새 카테고리 생성 — 고르면: 이름 질의로 진행` 형식 정리)

② 미답변 조사 Pass 2 (SKILL.md):

```
미답변 질문이 있습니다: [번호 목록]

1. 전부 조사 — 고르면: 모든 미답변 질문을 코드/문서에서 조사해 잠정 답을 제시합니다
2. 선택 조사 (번호 지정) — 고르면: 지정한 것만 조사합니다
3. 스킵 — 고르면: 조사 없이 다음 단계로 넘어갑니다
```

③ 시드 확인 (templates.md 「Step B Seed-Architect 프롬프트」 내 시드 추출 결과 펜스 말미):

```
📌 결정 요청 : 시드 확인

1. Yes — 고르면: 이 요약이 이후 모든 설계의 기준이 됩니다
2. 수정이 필요하다 — 고르면: 고칠 부분을 알려주시면 반영 후 다시 확인받습니다
```

④ Simplifier 3택 (templates.md 「Simplifier 프롬프트」 출력 펜스 말미):

```
1. 제안 수용 — 고르면: 선택적 항목을 다음 버전으로 미루고 범위를 줄입니다
2. 일부만 수용 (항목 지정) — 고르면: 지정한 것만 미룹니다
3. 유지 — 고르면: 전체 범위 그대로 진행합니다

💡 추천: 1
[Simplifier의 축소 근거 1줄]
```

- [ ] **Step 5: 기계 체크 + 커밋**

- `grep -c "최대 2개" skills/brainstorming/SKILL.md` → 0
- `grep -c "❓ 질문" skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md` → 각 ≥1
- T1 인벤토리 대조: 국면0·Pass2·시드 확인·Simplifier의 선택지 수·0번 유무 동일
- A-계열 보존 앵커 (G4 인벤토리 기준): TD 침묵 2+1, 괄호 단서는 Step 1 교체로 문면 변경되므로 새 문면 2곳 grep

```bash
git add skills/brainstorming/
git commit -m "feat(conv-ux): sequential question track in brainstorming, revise local screens"
```

---

### Task 4: plan-stage·context-handling·persona-resolution 개정

**Files:**
- Modify: `skills/plan-stage/SKILL.md`, `skills/context-handling/SKILL.md`, `skills/persona-resolution/SKILL.md`

- [ ] **Step 1: plan-stage 재협의 4지 — 결과 1줄 부여**

```
1. 브레인스토밍 문서를 수정하고 다시 검토 — 고르면: 설계로 돌아가 해당 요구사항을 고칩니다
2. 해당 요구사항을 스코프에서 제외하고 진행 — 고르면: 이번 구현에서 빠지고 문서에 제외 기록이 남습니다
3. CAUTION으로 하향 조정하여 리스크를 감수하고 진행 — 고르면: 경고 상태로 구현 대상에 남습니다
4. 대안 접근 방향을 제안받고 논의 — 고르면: 페르소나가 대안을 만들어 다시 여쭙니다
```

- [ ] **Step 2: plan-stage 미결 사항 확인 — F 개정 연동 (브리핑 문면을 T2 Step 5의 신형으로 정합, "일괄로 답하시거나…" 문구 제거)**

- [ ] **Step 3: context-handling 축약 규칙 확장 (이슈 1 대응)**

축약 규칙 절에 verbatim 추가:

```
- 사용자 의도가 **새 작업 시작**으로 명확하면(새 기능·주제를 지목하는 발화) 목록 제시를 생략하고 정보 1줄로 대체한다: `📋 진행 중 작업 [n]건은 유지됩니다 — 새 작업으로 진행합니다.` 번호 목록을 출력했다면 반드시 사용자 선택을 기다린다 — 목록을 출력하며 모델이 스스로 선택해 진행하는 것을 금지한다 (decision-flow.md 자가 응답 금지)
```

- [ ] **Step 4: context-handling — HANDOFF 템플릿에 질문 진행 줄 + 잔존 HANDOFF 삭제 확인 개정**

HANDOFF 템플릿 "결정 흐름 상태" 섹션에 조건부 줄 추가: `- ❓ 질문 진행: [N]/[M] · 국면: [국면명]` + `### 미답변 질문` 목록 (질문 순회가 활성일 때만). 잔존 HANDOFF 삭제 확인:

```
1. Yes — 고르면: 완료된 작업의 HANDOFF 파일들을 삭제합니다 (작업 기록은 phase 파일과 git에 남습니다)
2. No — 고르면: 그대로 두고 다음 세션에도 목록에 표시됩니다
```

- [ ] **Step 5: persona-resolution 저장 제안 개정**

```
1. Yes — 고르면: .claude/personas.md가 생성되어 다음 세션부터 확인 없이 자동 적용됩니다
2. No — 고르면: 다음 세션에도 페르소나 확인을 거칩니다
```

(페르소나 확인 화면 :44-49는 열린 입력형 — 스켈레톤 비대상, 무변경)

- [ ] **Step 6: 기계 체크 + 커밋**

- `grep -c "고르면:" skills/plan-stage/SKILL.md skills/context-handling/SKILL.md skills/persona-resolution/SKILL.md` → 각 ≥1
- `grep -c "일괄로 답하시거나" skills/plan-stage/SKILL.md` → 0
- T1 인벤토리 대조: 재협의 4지·삭제 확인·저장 제안의 선택지 수·0번 유무 동일

```bash
git add skills/plan-stage/SKILL.md skills/context-handling/SKILL.md skills/persona-resolution/SKILL.md
git commit -m "feat(conv-ux): revise plan-stage/context-handling/persona-resolution screens"
```

---

### Task 5: 전수 검증 + 판단 리뷰

**Files:**
- Modify: `docs/design/dev-workflow/conversation-ux/baseline-gates.md` (결과 기록)

- [ ] **Step 1: 게이트 대조 전수 재검** — T1 인벤토리 전 행에 대해 개정 후 {화면 이름, 선택지 수, 0번 유무} 동일 재현 확인, PASS/FAIL 기록
- [ ] **Step 2: 확정 문면 grep 전수** — T2~T4의 기계 체크 전 항목 재실행 + 폴백 3점(decision-flow·SKILL.md·부트스트랩) 문면 상호 무모순 육안 대조 기록
- [ ] **Step 3: 범위 밖 무변경 확인** — `git diff [T1 커밋]..HEAD --stat`에 merge-to-domain·design-summary·rules-injection·document-consolidation·development-principles 부재 확인
- [ ] **Step 4: 판단 리뷰 (신선한 눈 1회)** — 컨텍스트 없는 서브에이전트에게 개정된 decision-flow.md + brainstorming 2파일만 주고 판정: "이 문서만 보고 결정·질문 흐름을 규칙대로 실행할 수 있는가, 두 트랙(결정/질문)의 규칙이 상호 모순 없는가, 스켈레톤 예시는 모방 가능한가"
- [ ] **Step 5: 결과 기록 + 커밋**

```bash
git add docs/design/dev-workflow/conversation-ux/baseline-gates.md
git commit -m "test(conv-ux): full gate parity check + fresh-eyes review"
```

---

### Task 6: 릴리스 마감

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `docs/design/dev-workflow/conversation-ux/conversation-ux.md` (§9·§10)
- Delete: `docs/design/dev-workflow/conversation-ux/baseline-gates.md` (일회용 폐기 — 검증 요약은 §9로 이식)

- [ ] **Step 1: 버전 1.14.0 동기 범프** (`sed -i 's/"version": "1.13.0"/"version": "1.14.0"/' .claude-plugin/*.json` 후 grep으로 두 파일 확인)
- [ ] **Step 2: 설계 문서 §9 (구현 결과·일탈·화이트리스트 관측 루프 명시)·§10 기록, status: complete 마킹은 하지 않음 (Completion Protocol의 document-consolidation 몫), 인벤토리 파일 삭제**
- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "chore(release): bump to 1.14.0 for conversation-ux"
```

---

## Self-Review 결과

1. 스펙 커버리지: REQ-001·006(스켈레톤·언어)→T2 S7, REQ-002→T2 S3, REQ-003→T2 S4+T4 S3, REQ-004→T2 S5, REQ-005→T2 S6+T3 S1~3, REQ-007·008→T2 S7, REQ-009→T3 S4+T4 S1~5, REQ-010→T2 S6+T4 S4, REQ-011→T2 S9~10, REQ-012→T2 S1·S8+Global, REQ-013→T1+T5 — 공백 없음
2. 플레이스홀더: 치환문 전부 실문면 (로컬 화면 모호형 카테고리만 "기존 유지+정리"로 서술 — 게이트 의미 보존 원칙이 커버) — 통과
3. 일관성: 스켈레톤 문면이 Global Constraints·T2 S7·로컬 화면들에서 동일 골격 — 통과
