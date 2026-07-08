# 베이스라인 게이트 인벤토리 (conversation-ux)

> 일회용 문서 — T6(개정 완료 후)에서 폐기 예정.
> conversation-ux 개정 착수 전, 영향 대상 게이트의 현재 상태를 스냅샷으로 고정한다.
> T2~T4의 전후 대조 기준(같은 화면·같은 선택지 수·같은 0번 유무) 및 T5 전수 재검의 원장으로 사용한다.

## Step 1 실행 커맨드

```bash
grep -n "^1\. \|^  1\. \|1\. Yes" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md skills/plan-stage/SKILL.md skills/context-handling/SKILL.md skills/persona-resolution/SKILL.md
```

## 게이트 스냅샷 표

| # | 파일:줄 | 화면 이름 | 선택지 수 | 0번 유무 | 현재 헤더/첫 선택지 인용 |
|---|---|---|---|---|---|
| 1 | `skills/workflow-orchestrator/decision-flow.md:58-64` | 결정 박스 (D, 오픈형) — SSOT 템플릿 | 2 (+0번) | 있음 (`0. 기타`) | `┌── 📌 결정 요청: [결정명] ──────────────` / `│  1. [선택지]` |
| 2 | `skills/workflow-orchestrator/decision-flow.md:108-116` | 재논의 대기열 노출 박스 | 3 | 없음 | `┌── 🔄 재논의 대기열 K건 ────────────────` / `│  1. 모두 재논의` |
| 3 | `skills/workflow-orchestrator/SKILL.md:298-308` | 결정 요청 폴백 형식 (decision-flow.md Read 실패 시) | 2 | 없음 | `┌── 📌 결정 요청: [결정명] ──────────────` / `│  1. [선택지]` |
| 4 | `skills/workflow-orchestrator/SKILL.md:164-176` | Ambiguous 단계 질문 | 4 (+0번) | 있음 (`0. 해당 없음 — 하려는 작업을 자유롭게 설명해주세요`) | `현재 단계를 감지하지 못했습니다. 어느 단계인가요?` / `1. 브레인스토밍` |
| 5 | `skills/brainstorming/SKILL.md:39-44` | 국면 0 카테고리 — 추천이 명확한 경우 | 0 (선택지 없음, Yes/No성 확인 질문) | 없음 | `📂 카테고리 추천: [카테고리명]` / (선택지 없음 — "이 카테고리로 진행할까요?" 자연어 확인) |
| 6 | `skills/brainstorming/SKILL.md:46-54` | 국면 0 카테고리 — 추천이 모호한 경우 | 3 | 없음 | `📂 기존 카테고리 목록:` / `1. [카테고리A] — [소속 기능 수]개 기능` |
| 7 | `skills/brainstorming/SKILL.md:232-241` | 미답변 조사 Pass 2 (미답변 확인 + 조사) | 3 | 없음 | `미답변 질문이 있습니다: [미답변 번호 목록]` / `1. 전부 조사` |
| 8 | `skills/brainstorming/references/templates.md:137-151` | 시드 확인 (Step B 시드 추출 결과) | 2 | 없음 | `이것이 핵심 요구사항입니다. 맞습니까?` / `1. Yes` |
| 9 | `skills/brainstorming/references/templates.md:181-197` | Simplifier 스코프 정리 3택 | 3 | 없음 | `✂️ 스코프 정리 제안 [Simplifier]:` / `1. 제안 수용 (선택적 항목 v2로 미룸)` |
| 10 | `skills/plan-stage/SKILL.md:51-61` | 미결 사항(OPEN_QUESTIONS) 확인 | 가변 (항목 수 N개 나열, 고정 선택지 없음 — 번호는 미결 항목 자체를 나열) | 없음 | `── 미결 사항 확인 ─────────────────────────────────────` / `1. ❓ [미결 사항 1] — [정렬 근거 한 줄] ← 루트` |
| 11 | `skills/plan-stage/SKILL.md:203-218` | 재협의 4지 (🚫 RENEGOTIATE 항목 처리) | 4 | 없음 | `── 재협의 필요 항목 ───────────────────────────────────` / `1. 브레인스토밍 문서를 수정하고 다시 검토` |
| 12 | `skills/context-handling/SKILL.md:158-172` | 잔존 HANDOFF 삭제 제안 | 2 | 없음 | `🧹 완료된 작업에 HANDOFF.md가 남아있습니다:` / `1. Yes — 모두 삭제` |
| 13 | `skills/persona-resolution/SKILL.md:74-90` | 세션 종료 페르소나 저장 제안 | 2 | 없음 | `💾 이번 세션에서 사용한 페르소나를 저장해두면 다음 세션 시작 시` / `1. Yes` |

**비고 — #5 (국면 0 명확 케이스):** 선택지 번호 목록이 없는 자연어 Yes/No 확인 질문("이 카테고리로 진행할까요?")이다. 개정 시 이 화면이 번호 선택지 형식으로 바뀌는지 여부가 T2~T4 대조 포인트다.

**비고 — #10 (미결 사항 확인):** 이 화면은 고정 선택지(1/2/3...)가 아니라 미결 항목 자체를 번호로 나열하는 목록형이다. "선택지 수"는 미결 항목 수에 따라 가변이며, 화면 포맷 자체(헤더 문구·번호 나열 방식·0번 부재)가 대조 대상이다.

### Step 1 재검 원본 grep 결과 (참고용 원문)

```
skills/workflow-orchestrator/decision-flow.md:43:1. [항목명] — [정렬 근거 한 줄] ← 루트
skills/workflow-orchestrator/SKILL.md:270:1. 선택지A
skills/workflow-orchestrator/SKILL.md:281:1. Yes
skills/brainstorming/SKILL.md:49:  1. [카테고리A] — [소속 기능 수]개 기능
skills/brainstorming/SKILL.md:238:1. 전부 조사
skills/brainstorming/references/templates.md:148:  1. Yes
skills/brainstorming/references/templates.md:194:1. 제안 수용 (선택적 항목 v2로 미룸)
skills/plan-stage/SKILL.md:56:1. ❓ [미결 사항 1] — [정렬 근거 한 줄] ← 루트
skills/plan-stage/SKILL.md:213:1. 브레인스토밍 문서를 수정하고 다시 검토
skills/context-handling/SKILL.md:170:1. Yes — 모두 삭제
skills/persona-resolution/SKILL.md:88:  1. Yes
```

(전체 원본 출력에는 위 목록 외에도 본문 서술(번호 매기기 목적이 아닌 절차 나열, 예: `SKILL.md:23: 1. **작업 상태 확인**`)이 다수 포함되어 있으나, 이는 게이트 화면이 아니라 절차 문서 서술이므로 위 게이트 스냅샷 표에서 제외했다.)

## Step 2: 괘선·폴백 현황

### Step 2 실행 커맨드

```bash
grep -cn "┌\|└" skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/bootstrap.md
```

(bootstrap 경로 확인: `hooks/` 하위에는 `hooks.json`·`inject-rules`·`session-start` 3개 파일만 존재하고 `.md` 파일이 없다. `hooks/session-start`가 `${PLUGIN_ROOT}/skills/workflow-orchestrator/bootstrap.md`를 cat하여 세션 시작 컨텍스트에 주입하는 구조이므로, 실질적 "bootstrap 파일"은 `skills/workflow-orchestrator/bootstrap.md`이다. `hooks/` 자체에는 괘선 문자가 없다.)

### 괘선(┌/└) 현황

| 파일 | 괘선 라인 수 (┌+└ 합계) |
|---|---|
| `skills/workflow-orchestrator/decision-flow.md` | 4 (결정 박스 ┌/└ 1쌍 + 재논의 대기열 박스 ┌/└ 1쌍) |
| `skills/workflow-orchestrator/SKILL.md` | 2 (폴백 결정 박스 ┌/└ 1쌍) |
| `skills/workflow-orchestrator/bootstrap.md` | 1 (본문 인용구 `┌── 📌 결정 요청 ──` — 실제 박스가 아니라 폴백 안내 문구 내 인용) |

### 폴백 3점 결정 요청 문면 인용

**① `skills/workflow-orchestrator/decision-flow.md` (결정 박스 D, 오픈형 SSOT 템플릿, line 55-64)**

```
### 결정 박스 (D) — 오픈형

┌── 📌 결정 요청: [결정명] ──────────────
│
│  1. [선택지]
│  2. [선택지] (추천)
│  0. 기타
└──────────────────────────────────────
```

**② `skills/workflow-orchestrator/SKILL.md` Input Format Rules 섹션 (결정 요청 폴백 형식, line 298-308)**

```
### 결정 요청 폴백 형식 (decision-flow.md Read 실패 시)

- 결정은 한 번에 하나만 묻는다. 사용자가 일괄로 답하거나 위임하면 그 의도를 수용한다 (응답이 형식을 이긴다)
- 결정 요청은 우측 개방형 결정 박스로 표시한다:

┌── 📌 결정 요청: [결정명] ──────────────
│  1. [선택지]
│  2. [선택지]
└──────────────────────────────────────

- 여러 결정이 대기 중이면 결정 요청 응답 상단에 한 줄 헤더를 표시한다: `📋 확정 N/M · 진행 중: [결정명] · 재논의 K건`
- 재논의 대기열(모델이 감지했으나 즉시 처리하지 않기로 한 결정 간 충돌 항목)이 없으면 '재논의' 필드를 생략한다
```

**③ `skills/workflow-orchestrator/bootstrap.md` (세션 시작 부트스트랩 주입 본문, line 31-32)**

```
- 결정 요청은 한 번에 하나씩 — 사용자가 일괄로 답하거나 위임하면 그 의도를 수용한다 (응답 주권)
- 결정 요청 형식 상세는 `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`를 Read하여 따른다 (폴백: 우측 개방 박스 `┌── 📌 결정 요청 ──` + 헤더 `📋 확정 N/M`)
```

### 파일 크기 (`wc -c`, bootstrap 예산 확인용)

```bash
wc -c skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/bootstrap.md
```

| 파일 | 바이트 수 |
|---|---|
| `skills/workflow-orchestrator/decision-flow.md` | 16227 |
| `skills/workflow-orchestrator/SKILL.md` | 18888 |
| `skills/workflow-orchestrator/bootstrap.md` | 2365 |
| 합계 | 37480 |

`bootstrap.md`는 hook에서 세션 시작마다 컨텍스트로 주입되는 파일이므로(현재 2365 bytes ≈ 2.5KB 예산 내), 개정 후에도 이 예산을 벗어나지 않는지 T5에서 재확인해야 한다.

## 대상 목록 커버리지 체크 (브리핑 원문 대비)

브리핑 Step 1 대상 목록: "decision-flow 결정 박스·재논의 대기열 박스 / orchestrator 폴백 박스·Ambiguous 질문 / brainstorming 국면0 카테고리(명확·모호 2형)·미답변 조사 Pass2·시드 확인·Simplifier 3택 / plan-stage 재협의 4지·미결 사항 확인 / context-handling 잔존 HANDOFF 삭제 / persona-resolution 저장 제안"

- [x] decision-flow 결정 박스 → #1
- [x] decision-flow 재논의 대기열 박스 → #2
- [x] orchestrator 폴백 박스 → #3
- [x] orchestrator Ambiguous 질문 → #4
- [x] brainstorming 국면0 카테고리 — 명확 케이스 → #5
- [x] brainstorming 국면0 카테고리 — 모호 케이스 → #6
- [x] brainstorming 미답변 조사 Pass2 → #7
- [x] brainstorming 시드 확인 → #8
- [x] brainstorming Simplifier 3택 → #9
- [x] plan-stage 재협의 4지 → #11
- [x] plan-stage 미결 사항 확인 → #10
- [x] context-handling 잔존 HANDOFF 삭제 → #12
- [x] persona-resolution 저장 제안 → #13

목록의 13개 화면 전부 표에 기록됨. 누락 없음.

---

## 검증 결과 (Task 5)

> Task 2~4 (커밋 `8141186`, `da19134`, `c22874b`) 적용 후 T1 베이스라인 전수 재검. 대상: 8개 편집 파일 전부.

### Step 1: 게이트 대조 전수 재검 (13행)

| # | 화면 | 베이스라인 선택지/0번 | 개정 후 선택지/0번 | 판정 |
|---|---|---|---|---|
| 1 | 결정 박스 (D) SSOT | 2(+0) / 있음 | 2(+0, 조건부 `0. 기타`) / 있음 — 스켈레톤 3부 이관, 괘선 제거 | PASS |
| 2 | 재논의 대기열 박스 | 3 / 없음 | 3 (모두 재논의/일부만/모두 기각) / 없음 | PASS |
| 3 | 결정 요청 폴백 형식 | 2 / 없음 | 2 / 없음(0은 조건부 예시) | PASS |
| 4 | Ambiguous 단계 질문 | 4(+0) / 있음 | 4(+0. 해당 없음) / 있음 — 문면 동일 | PASS |
| 5 | 국면0 명확형 | 0 (자연어 Yes/No) | 2 (`1. Yes`/`2. No`) | **의도된 변경** (task-3-brief Step 4①) |
| 6 | 국면0 모호형 | 3 / 없음 | 3 + `0. ✨ 새 카테고리 생성` / **있음(신설)** | **의도된 변경** (task-3-brief Step 4①) |
| 7 | 미답변 조사 Pass 2 | 3 / 없음 | 3 (전부 조사/선택 조사/스킵) / 없음 | PASS |
| 8 | 시드 확인 | 2 / 없음 | 2 (Yes/수정이 필요하다) / 없음 | PASS |
| 9 | Simplifier 3택 | 3 / 없음 | 3 (제안 수용/일부만 수용/유지) / 없음 | PASS |
| 10 | 미결 사항(OPEN_QUESTIONS) 확인 | 가변 목록형, 헤더+번호 나열, 0번 부재 | 가변 목록형, 헤더+번호 나열 유지, 0번 부재 | PASS (구조 요소 기준) |
| 11 | 재협의 4지 | 4 / 없음 | 4 / 없음 (결과 1줄만 추가) | PASS |
| 12 | 잔존 HANDOFF 삭제 제안 | 2 / 없음 | 2 (Yes/No) / 없음 | PASS |
| 13 | 페르소나 저장 제안 | 2 / 없음 | 2 (Yes/No) / 없음 | PASS |

**Tally: 11 PASS + 2 의도된 변경(행5·행6), FAIL 0.** 두 의도된 변경 모두 task-3-brief.md Step 4①의 verbatim 지시와 정확히 일치.

### Step 2: 확정 문면 grep 전수

**T2 재실행 (task-2-brief.md Step 11):**

| 명령 | 기대값 | 실측값 | 판정 |
|---|---|---|---|
| `grep -c "┌\|└" decision-flow.md/SKILL.md/bootstrap.md` | 각 0 | decision-flow.md=1(self-mention), SKILL.md=0, bootstrap.md=0 | 아래 정밀 재검 참조 |
| `grep -c "📌 결정 요청 :" decision-flow.md` | ≥3 | 3 | PASS |
| `grep -c "❓ 질문" decision-flow.md` | ≥2 | 3 | PASS |
| `grep -c "일괄로 답하시거나" decision-flow.md` | 0 | 0 | PASS |
| `grep -c "본문 또는 본문이 지시하는 references/" decision-flow.md` | 1 | 1 | PASS |

**괘선 정밀 재검(줄 앵커형 `grep -c "^[┌└│]"` 사용, Task 2 리뷰 권고 반영):** SKILL.md에서 9건 검출되었으나 Python 유니코드 정확 비교로 재검한 결과 **거짓 양성**으로 판명 — 이 grep 구현이 `[┌└│]` 문자 클래스를 바이트 단위(첫 바이트 `E2`)로 매칭해 `→`(U+2192)·`─`(U+2500) 등 무관 문자로 시작하는 줄까지 오탐. Python 정확 비교 결과 3개 파일 모두 줄 시작 괘선 문자 **0건**. 파일 전체 임의 위치 검색도 재실행: 3개 파일 통틀어 **1건**(decision-flow.md:218 "`**금지:** 정렬이 필요한 괘선(┌ │ └)과...`" — 금지 조항이 금지 대상을 설명하는 산문 인용, 실제 박스 사용 아님). **실질 괘선 박스 사용 0건.**

**T3 재실행 (task-3-brief.md Step 5):** `grep -c "최대 2개" brainstorming/SKILL.md` = 0 (PASS) · `grep -c "❓ 질문" SKILL.md/templates.md` = 2/2 (PASS, 기대 각 ≥1)

**T4 재실행 (task-4-brief.md Step 6):** `grep -c "고르면:" plan-stage/context-handling/persona-resolution` = 4/2/2 (PASS, 기대 각 ≥1) · `grep -c "일괄로 답하시거나" plan-stage/SKILL.md` = 0 (PASS)

**grep 전수 tally: 9/9 PASS** (괘선 항목은 self-mention 예외 처리 후 실질 PASS로 정정)

**폴백 3점 상호 무모순 대조:**

① decision-flow.md §「공통 형식·언어」(line 192-205): `📌 결정 요청 : [결정명]` + 배경 + `N. [선택지] — 고르면: [결과 1줄]` + 조건부 `0. [탈출 레이블]` + `💡 추천: [번호]` + 사유줄

② workflow-orchestrator/SKILL.md 폴백 형식(line 298-317): ①과 **문면 완전 동일**(verbatim 이관) + 별도 헤더 `📋 확정 N/M · 진행 중: [결정명] · 재논의 K건`

③ bootstrap.md(line 31-32): `(폴백: 📌 결정 요청 : [제목] + 번호 선택지(결과 1줄 병기) + 💡 추천 줄 · 헤더 📋 확정 N/M · 자가 응답 금지)` — 압축 요약형이나 ①②의 4대 구성 요소(제목·번호+결과줄·추천줄·헤더)를 정확히 요약, "자가 응답 금지"는 §1 메타 원칙과 정합.

**판정: 3점 상호 모순 없음.** 괘선 언급이 3점 어디에도 실물로 없음 (bootstrap.md는 이미 신형 교체 완료 — task-2-brief Step 10 이행 확인).

### Step 3: 범위 밖 무변경 확인

`git diff b0b6b81..HEAD --stat`:
```
 skills/brainstorming/SKILL.md                 |  28 +++---
 skills/brainstorming/references/templates.md  |  33 ++++---
 skills/context-handling/SKILL.md              |  11 ++-
 skills/persona-resolution/SKILL.md            |   4 +-
 skills/plan-stage/SKILL.md                    |  10 +-
 skills/workflow-orchestrator/SKILL.md         |  24 +++--
 skills/workflow-orchestrator/bootstrap.md     |   2 +-
 skills/workflow-orchestrator/decision-flow.md | 128 +++++++++++++++++++-------
 8 files changed, 160 insertions(+), 80 deletions(-)
```

`grep -iE "merge-to-domain|design-summary|rules-injection|document-consolidation|development-principles|design-doc-index"` → **매치 0건** (exit code 1). 6개 제외 대상 스킬 모두 변경 파일 목록에 없음.

**정확한 변경 파일 목록:** `git diff b0b6b81..HEAD --name-only` 결과 8개 파일 — `skills/brainstorming/SKILL.md`, `skills/brainstorming/references/templates.md`, `skills/context-handling/SKILL.md`, `skills/persona-resolution/SKILL.md`, `skills/plan-stage/SKILL.md`, `skills/workflow-orchestrator/SKILL.md`, `skills/workflow-orchestrator/bootstrap.md`, `skills/workflow-orchestrator/decision-flow.md` — 브리핑 지정 목록과 **정확히 일치**. `docs/design/dev-workflow/conversation-ux/` 하위는 baseline-gates.md 자체(b0b6b81에서 이미 생성)만 해당하며 diff 범위 내 신규 변경 없음.

**부트스트랩 예산 재확인:** `wc -c` → decision-flow.md 22497B, SKILL.md 19176B, bootstrap.md 2422B (베이스라인 2365B 대비 **+57B**, task-2-brief Step 10의 +200B 이내 조건 충족).

### 판단 리뷰 (신선한 눈)

> 컨텍스트 없는 opus 서브에이전트에게 개정된 decision-flow.md + brainstorming 2파일만 제공하여 판정 (파일:줄 근거는 task-5-report.md의 Fix Round 섹션과 대조 가능). 발견 사항 F1~F4는 수정 커밋 `2be8f94`로 해소 후 재검 완료.

**평결 (Q1~Q4):**

- **Q1 규칙집 실행 가능성:** 대체로 가능 — F3(§4 응답 범위 조건 압축, Important) · F4("다 보여줘"="한꺼번에" 등가 미명시, Minor) 발견
- **Q2 스켈레톤 모방 가능성:** 결정 박스 정의-예시 일치 — F5(0번 조건부의 실물 예시 부재, Minor — 기록만)
- **Q3 파일 간 정합 (두 트랙 상호 모순 여부):** 폴백 2점·plan-stage 푸터 정합(F8 Clean), 괘선 준수(F9 Clean) — F1(Ontologist 출력 펜스 4개 동시 나열 vs "하나씩" 지시 자기모순, Important) · F2(개방형 질문과 질문 스켈레톤의 관계 미규정, Important) · F6(시드 확인 로컬 템플릿에 배경/추천 부재 — §8 로컬 템플릿 우선이 허용하는 형태, Minor 기록만)
- **Q4 약모델 리스크:** F7(3단 참조 홉 — F1·F2 해소로 실질 완화) · F10(질문/결정 카운터 경계 판정 어려움, Minor 기록·관측 대상)

**Disposition:**

| Finding | 심각도 | 처리 |
|---|---|---|
| F1 (Ontologist 펜스 자기모순) | Important | **FIXED** (`2be8f94`) — 출력 펜스를 순차형(`❓ 질문 [N]/4`)으로 교체 |
| F2 (개방형 질문 관계 미규정) | Important | **FIXED** (`2be8f94`) — 질문 스켈레톤 직후 개방형 허용 1줄 추가 |
| F3 (§4 조건 압축) | Important | **FIXED** (`2be8f94`) — 3불릿 분리 (문장 문면 동일, 구조만) |
| F4 (등가 문구 미명시) | Minor | **FIXED** (`2be8f94`) — §3 발동 조건에 정확 문구 예시 추가 |
| F5 (0번 실물 예시 부재) | Minor | 기록-only — 관측 대상 |
| F6 (시드 확인 배경/추천 부재) | Minor | 기록-only — §8 로컬 템플릿 우선 조항이 명시적으로 허용 |
| F7 (3단 참조 홉) | — | F1·F2 해소로 실질 완화 |
| F8 (폴백·푸터 정합) | Clean | — |
| F9 (괘선 준수) | Clean | — |
| F10 (카운터 경계 판정) | Minor | 기록-only — 관측 대상 (§9 후보) |

**Fix Round 재검 (commit `2be8f94`, 2 files):**

1. `git show 2be8f94` 검토 — 변경 파일 정확히 2개(templates.md·decision-flow.md), templates.md의 에이전트 PROMPT 펜스(4관점 생성 지시부) 무접촉·출력 노출 펜스만 교체, F3 불릿 3개는 기존 문장과 verbatim 동일(구조 분리만), F4는 괄호 예시만 추가. ✅
2. 영향 grep 재실행 — `grep -c "배경/힌트" decision-flow.md`=1(≥1 ✅) · `grep -c "하나씩 모드:"`=1(=1 ✅) · templates.md:24에 `❓ 질문 [N]/4` 존재 ✅ · `📌 결정 요청 :`=3 불변 ✅ · `❓ 질문` decision-flow=3·templates=3(2→3, Ontologist 펜스 +1) 기준 충족 ✅ · 괘선 Python 재검: decision-flow.md 금지 조항 self-mention 1건(223행 이동)만, SKILL.md·bootstrap.md clean, templates.md 294·309행은 디렉토리 트리(금지 조항 명시 허용, 베이스라인부터 존재) ✅ · 폴백 3점: SKILL.md·bootstrap.md 무접촉 + 스켈레톤 펜스 자체 무변경(F2 줄은 펜스 밖 후행 서술) → 상호 무모순 유지 ✅
3. 게이트 대조 영향 없음 — 2be8f94 변경 지점(§3 모드 표·§4 불릿·질문 스켈레톤 후행 1줄·Ontologist 출력 펜스)은 13행 게이트 화면 비해당 (A-0 본질 질문은 베이스라인 표 비대상). **13행 판정 불변: 11 PASS + 2 의도된 변경, FAIL 0.** ✅
