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
