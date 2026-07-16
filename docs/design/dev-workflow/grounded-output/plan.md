# grounded-output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결정 요청을 자기완결형(4요소)으로, 페르소나 발언을 생산 규격+원문 나열+본체 검증 주석 구조로 바꾸는 출력 규범 개정 (REQ-001~007, 009~011 — REQ-008 피드백 루프는 후속 MINOR로 분리 확정).

**Architecture:** decision-flow.md(결정 규범 원본)에 집행 문장을 편입하고 상세는 신규 references/grounding.md로 분리. 소비 스킬(brainstorming·plan-stage·orchestrator·context-handling)의 의미 미러를 스윕 인벤토리(T0) 기반으로 교체. 파급은 기존 참조망이 흡수.

**Tech Stack:** Markdown 스킬 문서 편집 + grep 검증 + scripts/sweep. 코드 없음.

## Global Constraints

- 작업은 전용 워크트리 브랜치에서 수행한다. **매 태스크 승인 직후 main 무오염 확인** (`git -C <main체크아웃> log --oneline -3` 대조) — 3릴리스 연속 재발 이력 (tasks/lessons.md 2026-07-14)
- 스윕 예외 없음: T0 인벤토리에 등재된 구 문구는 의미가 무관해 보여도 전부 교체/삭제한다. 예외로 남기려면 사용자 확인을 거친다 (tasks/lessons.md 2026-07-13)
- skills/brainstorming/references/agent-roles.md 와 skills/plan-stage/references/agent-roles.md 는 **절대 수정 금지** (verbatim 계약 — 파일 1행)
- 사용자 대면 문면에 절 기호(§) 신규 사용 금지. 기존 문서 내부 상호참조의 절 번호 표기("decision-flow §7" 등)는 **스킬 문서 내부(모델 대상)에서는 허용**, 사용자에게 출력되는 문면(💡 안내줄·결정 박스·고지)에서만 금지
- 버전 범프(1.21.0)는 이 plan 범위 밖 — Completion/릴리스 시점에 scripts/bump-version으로 수행
- 커밋 메시지는 Conventional Commits. 각 태스크 말미 커밋, main 머지·푸시는 Completion Protocol에서만

---

### Task 0: 스윕 인벤토리 작성 (선행 — 다른 태스크의 입력)

**Files:**
- Create: `docs/design/dev-workflow/grounded-output/sweep-inventory.md`

**Interfaces:**
- Produces: 구 문구 위치 목록 (파일:행 + 원문 인용 + 처리 태스크 번호) — T1~T5의 교체 대상 지도이자 T6 검증의 체크리스트

- [ ] **Step 1: 알려진 시작점을 grep으로 확장 수집**

Run (각각 실행, 결과를 인벤토리 초안에 축적):
```bash
grep -rn "재구성" skills/ --include="*.md"
grep -rn "고쳐 쓰" skills/ --include="*.md"
grep -rn "원문 그대로\|원문을 그대로\|원문 나열" skills/ --include="*.md"
grep -rn "배경 1-2문장\|배경 1~2문장\|배경:\*\*" skills/ commands/ README.md
grep -rn "§" skills/brainstorming/SKILL.md skills/context-handling/SKILL.md commands/ README.md
grep -rn "결론 1줄 + 근거 최대 3개\|결론 1줄+근거" skills/
```
Expected: 최소 아래 확정 항목이 잡힌다 —
- 재구성 책임 원본: `skills/workflow-orchestrator/decision-flow.md` 149~153행
- 재구성 미러 4곳: `skills/brainstorming/references/templates.md` 205~209행·236~242행, `skills/brainstorming/SKILL.md` 97행(출력 제약 괄호), `skills/plan-stage/SKILL.md` 96행
- 사용자 대면 절 기호 3곳: `skills/brainstorming/SKILL.md` 328·361·395행 (💡 /compact 안내줄)
- 블라인드 인라인 정형 2곳: `skills/workflow-orchestrator/decision-flow.md` 160행, `skills/brainstorming/SKILL.md` 122행
- 구 스켈레톤(배경 1~2문장) 서술: `skills/workflow-orchestrator/decision-flow.md` 229행, `skills/workflow-orchestrator/SKILL.md` 폴백 스켈레톤(Input Format Rules), `skills/workflow-orchestrator/bootstrap.md` 폴백 줄, README의 결정 요청 서술(존재 시)

- [ ] **Step 2: grep이 못 잡는 의미 미러를 눈으로 골라낸다**

skills/ 11개 SKILL.md와 references/*.md(agent-roles.md 제외)를 훑어, "본체/메인 컨텍스트가 발언을 정리·요약·압축한다"는 취지의 문장과 "결정 박스=배경+선택지" 취지의 문장을 전부 등재한다. 각 항목 형식(1줄):

```markdown
- [ ] skills/경로.md:행 — "원문 인용 한 줄" → 처리: T{N} (교체|삭제|유지사유)
```

- [ ] **Step 3: 인벤토리 파일 저장 + 사용자에게 목록 제시**

파일 머리에 1줄: `> T1~T5 교체 지도 · T6 검증 체크리스트. "유지" 판정 항목은 사유 필수 (스윕 예외 없음 원칙).`
유지 판정이 1건이라도 있으면 태스크 리포트에 명시해 사용자 확인을 받는다.

- [ ] **Step 4: Commit**

```bash
git add docs/design/dev-workflow/grounded-output/sweep-inventory.md
git commit -m "docs(grounded-output): T0 스윕 인벤토리 — 구 문구 위치 지도"
```

---

### Task 1: decision-flow.md 3부 개정 — 언어 규범 2조항 + 4요소 스켈레톤·등급 규칙

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (3부 「공통 형식·언어」 — 215~237행 일대)

**Interfaces:**
- Produces: 새 언어 규범 펜스(전 스킬이 실행 시점 복제) · 새 결정 스켈레톤(등급 2종) — T4·T5의 폴백 동기화가 이 문면을 기준으로 삼는다

- [ ] **Step 1: 언어 규범 펜스에 2조항 추가**

기존 펜스(``` 안, "- 논점이 바뀔 때마다..." 줄 뒤)에 추가:

```
- 절 기호(§) 같은 법조문식 표기를 쓰지 않는다 — 문서 이름과 절 이름을 말로 풀어 쓴다 (예: "결정 규범 문서의 블라인드 라운드 절")
- 목록·가이드라인을 슬래시(/)로 한 줄에 잇지 않는다 — 산출물만이 아니라 중계·요약 문면에도 적용된다 (길이 부담은 생산 규격이 해결한다 — 전달 압축 금지)
```

- [ ] **Step 2: 출력 스켈레톤을 4요소 판으로 교체**

교체 대상 경계: "**출력 스켈레톤 (고정 — 이 모양 그대로):**" 제목 아래 첫 ``` 펜스 전체 (기존: 📌 결정 요청/배경/선택지/추천). 질문형 펜스와 그 아래 설명은 유지. 새 펜스:

````
```
📌 결정 요청 : [결정명]

**이 결정이 다루는 문제:** [1-2문장 — 왜 지금 정하는지 + 앞선 결정과의 연결]

**확인된 사실:**
- [✔ 출처] [사실 1줄]   (없으면 이 칸에 "없음"이라고 쓴다)

**확인 못 한 것:**
- [⚠️ 확인 불가] [결정에 영향을 주는 불확실 1줄]   (없으면 "없음")

**토론 요지:** [수렴/충돌 1~3줄]

1. [선택지] — 고르면: [결과 1줄]
2. [선택지] — 고르면: [결과 1줄]
0. [탈출 레이블] (자유 입력 탈출구 필요 시에만)

💡 추천: [번호]
[추천 사유 1줄]
```
````

- [ ] **Step 3: 스켈레톤 바로 아래에 등급 규칙 문단 추가**

```markdown
**적용 등급 (기계 판정 — 주관 술어 금지):** 판정 질문은 하나다 — "이 결정 직전에 페르소나 라운드 또는 조사가 있었는가?"
- 있었다 → 4칸(문제·확인된 사실·확인 못 한 것·토론 요지) 상시. 내용 없는 칸은 생략하지 않고 "없음"이라고 쓴다 (칸의 부재와 확인의 부재를 구분하기 위해). 각 칸의 항목은 1줄 상한
- 없었다(표준 결정) → "이 결정이 다루는 문제" 칸만 필수, 나머지는 해당 이력(조사·앞선 토론)이 있는 칸만 추가
- 로컬 템플릿 결정·단순 승인 게이트 → 기존 형식 그대로 (본 문서 「로컬 템플릿 우선」·orchestrator Input Format Rules 관할 — 변경 없음)
경계 예시: ① 페르소나 라운드 종료 직후의 결정 → 4칸 ② 조사 없이 저장소 구조 대조만으로 묻는 결정 → 문제 칸+확인된 사실 칸 ③ 국면 0 카테고리 확정 → 로컬 템플릿 유지
```

- [ ] **Step 4: 검증**

```bash
grep -n "절 기호" skills/workflow-orchestrator/decision-flow.md   # 1건 이상
grep -n "이 결정이 다루는 문제" skills/workflow-orchestrator/decision-flow.md   # 스켈레톤 1건
grep -c "배경:\*\*" skills/workflow-orchestrator/decision-flow.md   # 질문형 펜스·실물 예시 잔존분만 — T0 인벤토리와 대조해 결정 스켈레톤 쪽은 0
```
실물 예시(260~269행 "앞질러 답하기") — 표준 결정(토론 무) 등급의 예시로 갱신: `**배경:**` 줄을 `**이 결정이 다루는 문제:**`로 교체.

- [ ] **Step 5: Commit**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(grounded-output): T1 언어 규범 2조항 + 4요소 스켈레톤·등급 규칙"
```

---

### Task 2: 검증 규범 신설 + 생산 규격 펜스 + references/grounding.md

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (3부 말미, 실물 예시 앞에 신설 절)
- Create: `skills/workflow-orchestrator/references/grounding.md`

**Interfaces:**
- Produces: 「검증 규범 (근거 있는 출력)」 절 — 태그 어휘·3출처·근거 첨부 의무·본체 관문·↳ 주석 (집행 문장, 원본 상주) / 「발언 생산 규격」 펜스 (원본 상주 — 래퍼 조립이 이 파일 하나만 Read) / grounding.md — 상세(고지 문구 실물·워커 규격·소급 반증 형식·관측 연결)
- Consumes: T1의 전치 태그 표기

- [ ] **Step 1: decision-flow.md 3부에 신설 절 추가** (「결정·질문 구조 규범」 뒤, 실물 예시 앞)

```markdown
### 검증 규범 (근거 있는 출력)

**출처 3종:** 계산·논리(그 자리에서 셈이 되는 것) / 프로젝트 내 코드·문서 / 외부 공식 문서(웹). 이 3종 외는 출처가 아니다.

**전치 태그 — 항목 첫머리 고정:** `[✔ 출처]` 확인됨 · `[⚠️ 확인 불가]` 확인 수단 없음 · `[✘ 반증 — 출처]` 확인 결과 틀림 · `[추측]` 발언자 자백. 무표시 단정 서술을 화면에 올리지 않는다. 확인 불가 항목은 결정에 영향을 주는 것만 표시하고, 영향 없는 추측은 출력하지 않는다 (선별 침묵).

**근거 첨부 의무:** [✔]에는 대조 가능한 증거를 병기한다 — 프로젝트 내 출처는 파일 경로+행 번호 또는 한 줄 인용, 외부 출처는 출처 주소+해당 대목 원문 인용. 증거 없는 [✔]는 [⚠️ 확인 불가]로 강등하고 강등 사실을 1줄 고지한다.

**본체 관문:** 화면에 올라가는 주장의 검증 책임은 본체(화면을 조립하는 메인 컨텍스트)에 있다 — 서브에이전트의 태그는 1차 필터일 뿐 신뢰 지점이 아니다.
- 재확인 대상: 미확인([추측]/무표시)인데 추천(💡) 사유 또는 선택지의 성패 근거로 쓰인 주장 — 본체가 3출처로 직접 확인한다. 외부 문서 확인만 조사 워커에 위임할 수 있다 (워커도 근거 첨부 의무 — 인용 없는 보고는 미확인 취급)
- [✔] 주장은 첨부 증거와 주장의 대조만 한다
- 규약: 화면에 도달한 [✔] = 본체 관문 통과. 세션에서 [✔]가 처음 화면에 나올 때 1회 고지한다 (문구 실물: references/grounding.md)
- 관문 수행 주체는 본체 고정 — 하위 모델 워커로 내리지 않는다. 네트워크 차단 환경에서는 외부 출처 축 전체가 [⚠️ 확인 불가]로 강등된다

**본체 검증 주석 (↳):** 본체는 발언 원문을 고쳐 쓰지 않고, 필요할 때만 해당 항목 아래 들여쓴 `↳` 한 줄을 단다 (불릿 기호와 겹쳐 쓰지 않는다). 다는 경우는 3가지뿐 — 반증([✘]) · 확인 불가 승격([⚠️]) · 재확인으로 새 사실을 보탠 경우.

**발언 생산 규격 (원본 펜스):** 아래 펜스를 모든 페르소나 서브에이전트 프롬프트에 "--- 생산 규격 ---" 구획으로 전문 복제한다 (언어 규범 펜스와 동일한 실행 시점 복제 — 문서 사본을 만들지 않는다).

```
📐 발언 생산 규격:
- 결론 1줄 + 근거 불릿 3개 이내 + 전제 반박 1개. 근거가 3개 미만이면 부족 사유 1줄로 대체한다 (3은 상한이지 채움 목표가 아니다)
- 근거마다 첫머리에 전치 태그 — 확인했으면 [✔ 출처]와 증거(파일 경로·행 또는 인용), 확인 못 했으면 [추측]
- 사용자를 향한 결정 요청 문구를 포함하지 않는다
```

경계 사례·고지 문구 실물·워커 반환 규격·소급 반증 형식은 `references/grounding.md`를 Read하여 따른다 (Read 실패 폴백: 위 집행 문장만으로 동작 — 고지 문구는 취지 유지 즉석 작문 허용).
```

- [ ] **Step 2: references/grounding.md 생성**

```markdown
# 검증 규범 상세 (grounding)

> decision-flow.md 「검증 규범 (근거 있는 출력)」의 상세. 집행 문장의 원본은 decision-flow.md이며 본 파일은 실물 문구·규격만 담는다.

## 고지 문구 실물

- [✔] 세션 최초 출현 시 (1회): `ℹ️ 표시 안내: [✔]는 본체가 증거를 대조해 통과시킨 주장, [⚠️]는 확인 수단이 없어 판단이 필요한 주장이라는 뜻입니다.`
- 재실행 진행 표시: `⏳ 발언 1건 형식 위반 — 다시 받는 중 (약 1분)`
- 재위반 제외 고지: `⚠️ [페르소나명] 발언 제외 — 형식 재위반. 다음 라운드에 다시 참여합니다.`
- [✔] 강등 고지: `⚠️ [페르소나명]의 주장 1건을 확인 불가로 강등 — 증거 미첨부.`

## 외부 문서 조사 워커 반환 규격

주장별로 3필드를 반환한다 — ① 판정(확인/반증/못 찾음) ② 출처 주소 ③ 해당 대목 원문 인용. 인용이 없는 보고는 본체가 [⚠️ 확인 불가]로 강등한다. 본체의 신뢰 지점은 워커의 판정이 아니라 인용문과 주장의 대조다.

## 소급 반증 형식

이미 지나간 발언을 뒤집는 사실이 나중에 확인되면, 새 메시지에서 대상 발언을 이름으로 가리킨다:
`↳ [✘ 반증 — 출처] 앞선 [페르소나명]의 "[주장 요지]" 주장은 [확인된 사실]로 성립하지 않습니다.`

## 등급 경계 사례 (결정 스켈레톤)

- 페르소나 라운드 종료 직후의 결정 → 4칸 상시 (빈 칸은 "없음")
- 라운드 없이 저장소 구조 대조로만 묻는 결정 → 문제 칸 + 확인된 사실 칸
- 국면 0 카테고리 확정·시드 확인 등 로컬 템플릿 결정 → 기존 템플릿 그대로

## 관측 연결

- "없음" 칸 3개 연속인 결정이 잦으면 등급 술어 과잉 신호 — tasks/lessons.md에 1줄 기록
- 관측 후 조정 후보 (1차 릴리스 미포함): 결정 근거로 쓰인 [✔] 주장의 표본 재확인 — 잘못 붙은 [✔] 통과 사례가 관측되면 추가한다
```

- [ ] **Step 3: 검증**

```bash
grep -n "발언 생산 규격" skills/workflow-orchestrator/decision-flow.md   # 펜스 1건
grep -n "관문 통과" skills/workflow-orchestrator/decision-flow.md        # 규약 1건
test -f skills/workflow-orchestrator/references/grounding.md && grep -c "고지 문구 실물" skills/workflow-orchestrator/references/grounding.md   # 1
```

- [ ] **Step 4: Commit**

```bash
git add skills/workflow-orchestrator/decision-flow.md skills/workflow-orchestrator/references/grounding.md
git commit -m "feat(grounded-output): T2 검증 규범·생산 규격 펜스 + grounding.md 상세"
```

---

### Task 3: decision-flow.md 7절·6절 개정 — 원문 전달 원칙·재실행 + 블라인드 출처 의무 + 상태 보존

**Files:**
- Modify: `skills/workflow-orchestrator/decision-flow.md` (「7. 페르소나 피드백 출력 형식」 149~166행 일대, 「6. 상태 보존」 123~130행 일대)

**Interfaces:**
- Consumes: T2의 생산 규격 펜스·grounding.md 고지 문구
- Produces: 원문 전달 원칙 (T4·T5 미러 교체의 신 규범 기준 문면)

- [ ] **Step 1: 「서브에이전트 출력 재구성 책임」 절(149~153행) 교체**

교체 대상 경계: 소제목 "### 서브에이전트 출력 재구성 책임"부터 "**유일한 예외 — 블라인드 라운드의 원문 나열:** ..." 문단 끝까지. 새 문면:

```markdown
### 원문 전달 원칙 (전 라운드 공통)

서브에이전트 발언은 본체가 고쳐 쓰지 않고 원문 그대로 나열한다 — 압축·재요약·문장 재구성 금지. 길이 통제는 발언 생산 규격(3부 「검증 규범」의 펜스)이 담당하며, 전달 단계의 압축으로 해결하지 않는다. 블라인드/대화형 라운드 구분 없이 적용된다 (구 "재구성 책임 + 블라인드 예외" 구도는 본 원칙으로 대체).

본체의 책임은 두 가지다: ① 에이전트 태그 부착과 검증 주석(↳ — 3부 「검증 규범」) ② 결정 요청 재구성 — 발언 원문에 포함된 결정 요청 문구는 그대로 노출하지 않고, 결정 요청은 본체가 결정 박스로 별도 조립한다 (발언 문면 자체는 무수정).

**규격 위반 처리:** 발언이 생산 규격을 어기면 (판정은 셀 수 있는 조건만 — 전치 태그 유무·불릿 개수·결론 줄 유무) 고쳐 쓰지 않고 재실행한다 — 1회 한정, 진행 표시·재위반 제외 고지 문구는 references/grounding.md 실물을 쓴다.
```

- [ ] **Step 2: 블라인드 프롬프트 구성(160행)에 출처 의무 추가 + 정형 포인터 단일화**

160행 프롬프트 구성 항목 중 `[정형 형식: 결론 1줄 + 근거 최대 3개]` 를 다음으로 교체:

```
[생산 규격 펜스 전문 — "--- 생산 규격 ---" 구획 (3부 「검증 규범」 원본 복제 — 정형 형식·출처 의무 포함)]
```

- [ ] **Step 3: 「6. 상태 보존」 목록에 압축 생존 항목 추가**

"- **HANDOFF 저장(save) 시**..." 불릿의 "블라인드 첫 루프 완료 여부(국면 단위)도 함께 기록한다." 뒤에 문장 추가:

```
결정 박스 등급 판정 근거(직전 라운드·조사 유무)·발언 재실행 이력(라운드별 상한 소진)·[✔] 최초 고지 완료 여부도 함께 기록한다 — 유실 시 보수적으로 재판정한다 (등급은 4칸 쪽, 고지는 재고지 쪽).
```

- [ ] **Step 4: 검증**

```bash
grep -n "원문 전달 원칙" skills/workflow-orchestrator/decision-flow.md      # 1건
grep -n "재구성 책임" skills/workflow-orchestrator/decision-flow.md         # 0건 (절 제목 소멸)
grep -n "결론 1줄 + 근거 최대 3개" skills/workflow-orchestrator/decision-flow.md  # 0건 (포인터로 대체)
grep -n "재실행 이력" skills/workflow-orchestrator/decision-flow.md         # 1건
```

- [ ] **Step 5: Commit**

```bash
git add skills/workflow-orchestrator/decision-flow.md
git commit -m "feat(grounded-output): T3 원문 전달 원칙·재실행 규칙 + 블라인드 출처 의무 + 압축 생존 등재"
```

---

### Task 4: brainstorming 동기화 — Contrarian 래퍼 교체·미러 스윕·절 기호 교정

**Files:**
- Modify: `skills/brainstorming/references/templates.md` (Contrarian 프롬프트 197~209행, Hacker 재구성 블록 236~242행, 블라인드 프롬프트 419행 일대)
- Modify: `skills/brainstorming/SKILL.md` (97행 출력 제약, 122행 블라인드 정형, 328·361·395행 💡 안내줄, 「출력 형식 (라운드 유형별)」 절)
- 금지: `skills/brainstorming/references/agent-roles.md` 무수정

**Interfaces:**
- Consumes: T2 생산 규격 펜스, T3 원문 전달 원칙

- [ ] **Step 1: templates.md 「Step C Contrarian 프롬프트」의 지시 3항 교체**

교체 대상 경계: "이 도메인 관점에서 Contrarian으로서:" 부터 "출력 제약: ..." 직전까지 (기존 1.가정 지적/2.반사실 질문/3.대안 3항). 새 문면:

```
이 도메인 관점에서 Contrarian으로서:
1. 논의에 깔린 가정 중 검증되지 않은 것을 지적하라 — 각 지적에 확인 근거([✔ 출처]+증거)를 붙이거나, 확인하지 못했으면 [추측]으로 표시하라. 근거 없는 시나리오 나열은 하지 마라
2. 현재 방향의 대안 또는 출구를 1개 이상 제시하라

--- 생산 규격 ---
[decision-flow.md 3부 「검증 규범」의 생산 규격 펜스 전문 — 공통 조립 규칙과 동일한 실행 시점 복제]
```

- [ ] **Step 2: templates.md의 "출력 재구성 (메인 컨텍스트)" 블록 2곳 교체** (Contrarian 205~209행 / Hacker 236~242행)

두 곳 모두 아래 형식으로 (Hacker 쪽은 ⚡ 헤더 유지):

```
전달 (메인 컨텍스트): 발언 원문을 고쳐 쓰지 않고 그대로 나열하고, 검증 주석(↳)만 단다 — decision-flow.md 「원문 전달 원칙」. 결정 요청이 필요하면 본체가 결정 박스로 별도 조립한다.
```

- [ ] **Step 3: SKILL.md 97행 출력 제약 괄호 교체**

`(결정 요청은 메인 컨텍스트가 decision-flow 형식으로 재구성한다)` → `(결정 요청은 본체가 결정 박스로 별도 조립한다 — 발언 문면은 무수정 나열)`

- [ ] **Step 4: SKILL.md 「출력 형식 (라운드 유형별)」 갱신**

- "**블라인드 라운드:** 정형 형식 — 결론 1줄 + 근거 최대 3개." → "**모든 라운드:** 생산 규격(decision-flow.md 「검증 규범」 펜스) 적용 — 본체는 원문 나열 + 검증 주석."
- "**대화형 라운드 (2라운드+):** 자유 문장. ..." 의 첫 문장을 "정형은 생산 규격을 따르되 새 기여 요소 규칙은 유지:" 로 교체 (실질성 규칙 문장들은 무수정 보존)

- [ ] **Step 5: SKILL.md 💡 안내줄 3곳(328·361·395행) 절 기호 제거**

`(재논의 대기열은 먼저 처리 — decision-flow.md §6)` → `(재논의 대기열은 먼저 처리 — 결정 규범 문서의 상태 보존 절)` (3곳 동일)

- [ ] **Step 6: 검증**

```bash
grep -n "반사실" skills/brainstorming/references/templates.md   # 0건
grep -rn "재구성" skills/brainstorming/ --include="*.md" | grep -v agent-roles   # 0건 (T0 인벤토리 대조)
grep -n "§" skills/brainstorming/SKILL.md   # 사용자 대면 줄 0건 (내부 상호참조 잔존분은 T0 인벤토리의 "유지" 판정과 대조)
git diff --stat skills/brainstorming/references/agent-roles.md   # 변경 0
```

- [ ] **Step 7: Commit**

```bash
git add skills/brainstorming/
git commit -m "feat(grounded-output): T4 brainstorming 동기화 — Contrarian 래퍼·원문 전달·절 기호 교정"
```

---

### Task 5: plan-stage·orchestrator·bootstrap·context-handling 동기화

**Files:**
- Modify: `skills/plan-stage/SKILL.md` (96행 취합 문장, 판정 프롬프트 구성 92행 일대)
- Modify: `skills/workflow-orchestrator/SKILL.md` (Input Format Rules 폴백 스켈레톤 + 언어 최소 요건 줄)
- Modify: `skills/workflow-orchestrator/bootstrap.md` (결정 요청 폴백 줄)
- Modify: `skills/context-handling/SKILL.md` (「결정 흐름 상태」 섹션 서식)

- [ ] **Step 1: plan-stage 96행 취합 문장 교체**

`판정 취합은 본 절의 판정 출력 형식(로컬 템플릿)을 따른다 — §7 취합의 원문 나열은 의견 수집 라운드에 적용된다.` → `판정 취합은 본 절의 판정 출력 형식(로컬 템플릿)을 따르되, 개별 판정문은 원문 그대로 싣는다 (결정 규범 문서의 원문 전달 원칙). 판정 프롬프트에는 생산 규격 펜스를 "--- 생산 규격 ---" 구획으로 복제한다.`

- [ ] **Step 2: orchestrator SKILL.md 폴백 스켈레톤을 T1 신판으로 교체**

「결정 요청 폴백 형식」의 스켈레톤 펜스를 T1 Step 2의 4요소 펜스로 교체하고, 등급 규칙 요약 1줄 추가: `- 등급: 직전에 라운드·조사가 있었으면 4칸 상시(빈 칸 "없음"), 아니면 문제 칸+이력 칸, 로컬 템플릿·게이트는 기존 형식`

- [ ] **Step 3: bootstrap.md 폴백 줄 동기화**

기존: `(폴백: '📌 결정 요청 : [제목]' + 번호 선택지(결과 1줄 병기) + '💡 추천' 줄 · 헤더 '📋 확정 N/M' · 자가 응답 금지)`
교체: `(폴백: '📌 결정 요청 : [제목]' + '이 결정이 다루는 문제' 1-2문장(라운드·조사 선행 시 확인된 사실/확인 못 한 것/토론 요지 칸 — 빈 칸은 "없음") + 번호 선택지(결과 1줄 병기) + '💡 추천' 줄 · 헤더 '📋 확정 N/M' · 자가 응답 금지)`

- [ ] **Step 4: context-handling 「결정 흐름 상태」 서식에 압축 생존 3항목 추가**

`- 블라인드 첫 루프: [완료/미완료] · 국면: [국면명]` 줄 아래 추가:

```markdown
- 등급 이력: [결정명별 직전 라운드·조사 유무 — 진행 중 결정만]
- 재실행 이력: [라운드별 상한 소진 여부 — 활성 라운드만]
- [✔] 최초 고지: [완료/미완료]
<!-- 유실 시 보수적으로 재판정 (등급은 4칸 쪽, 고지는 재고지 쪽) — 결정 규범 문서의 상태 보존 절 -->
```

- [ ] **Step 5: 검증**

```bash
grep -n "생산 규격" skills/plan-stage/SKILL.md            # 1건 이상
grep -n "이 결정이 다루는 문제" skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/bootstrap.md   # 각 1건
grep -n "최초 고지" skills/context-handling/SKILL.md       # 1건
grep -rn "배경 1-2문장\|배경 1~2문장" skills/ | grep -v "질문형\|배경/힌트"   # 결정 스켈레톤 계열 0건 (T0 인벤토리 대조)
```

- [ ] **Step 6: Commit**

```bash
git add skills/plan-stage/SKILL.md skills/workflow-orchestrator/SKILL.md skills/workflow-orchestrator/bootstrap.md skills/context-handling/SKILL.md
git commit -m "feat(grounded-output): T5 plan-stage·orchestrator·bootstrap·context-handling 동기화"
```

---

### Task 6: 전수 스윕 검증 (T0 인벤토리 체크리스트 소진)

**Files:**
- Modify: `docs/design/dev-workflow/grounded-output/sweep-inventory.md` (체크박스 소진 기록)

- [ ] **Step 1: 인벤토리 전 항목 재-grep**

T0의 grep 6종을 재실행해 인벤토리의 모든 항목이 "교체 완료" 또는 "유지(사유+사용자 확인)"인지 대조한다. 잔존 발견 시 해당 태스크 커밋에 준해 수정한다.
Expected: 교체 대상 잔존 0. `재구성` 계열은 agent-roles.md(수정 금지 파일)와 문맥 무관 용례만 남는다 — 남는 각 건은 인벤토리에 유지 사유를 기록.

- [ ] **Step 2: scripts/sweep 실행 + 훅 테스트 회귀**

```bash
scripts/sweep 2>/dev/null || bash scripts/sweep
bash tests/hooks/test-completion-nudge.sh
```
Expected: sweep 위반 0 · 훅 테스트 전 케이스 PASS (이번 개정은 훅 어휘 미변경 — 회귀 확인용)

- [ ] **Step 3: main 무오염 최종 확인**

```bash
git -C <main체크아웃 경로> log --oneline -5   # 이 기능 커밋이 없어야 함
git log --oneline main..HEAD                  # 워크트리 브랜치에 T0~T6 커밋 존재
```

- [ ] **Step 4: Commit**

```bash
git add docs/design/dev-workflow/grounded-output/sweep-inventory.md
git commit -m "chore(grounded-output): T6 스윕 인벤토리 소진 검증"
```

---

### Task 7: README 검토·갱신

**Files:**
- Modify: `README.md` (결정 요청·페르소나 발언을 서술하는 사용자 문서 구간 — T0 인벤토리가 위치 특정)

- [ ] **Step 1: README에서 구 형식 서술 확인**

T0 인벤토리의 README 항목을 연다. 결정 요청 예시·페르소나 설명이 구 스켈레톤(배경 1~2문장)이나 절 기호를 쓰면 신 형식으로 갱신한다.

- [ ] **Step 2: 신 형식 소개 문단 (내부 용어 무맥락 노출 금지 — 교훈 2026-07-13)**

독자 상황 → 기본 동작 → 의미 순으로. 삽입 문안 (결정 요청 서술 구간에):

```markdown
결정을 요청받으면 그 화면 안에서 판단에 필요한 정보를 함께 받습니다 — 어떤 문제인지, 토론에서 확인된 사실([✔])과 확인하지 못한 것([⚠️]), 토론이 어디로 수렴했는지. 페르소나의 근거에는 출처 표시가 붙고, 확인 안 된 추측은 [추측]으로 표시되거나 화면에 오르지 않습니다.
```

- [ ] **Step 3: 검증 + Commit**

```bash
grep -n "§" README.md   # 0건
git add README.md
git commit -m "docs(grounded-output): T7 README 결정 요청·검증 표시 서술 현행화"
```

---

## Self-Review 결과

- 스펙 커버리지: REQ-001(T1)·002(T2 펜스+T4 래퍼)·003(T3+T4)·004(T2)·005(T2)·006(T2+grounding)·007(T2)·009(T1+T4·T5 절 기호)·010(T3+T5)·011(T0+T2 분리 배치+T6) — REQ-008은 분리 확정으로 미포함 (설계 문서 명시). 커버리지 완전
- 플레이스홀더: 없음 — 모든 교체 문면 실물 수록. T0 Step 2와 T7 Step 1은 탐색 태스크 특성상 대상을 인벤토리가 특정 (경계 문장 명시로 대체)
- 타입 일관성: 태그 어휘([✔]/[⚠️]/[✘]/[추측])·펜스 구획명("--- 생산 규격 ---")·고지 문구가 T2 원본 기준으로 T3·T4·T5에서 동일 참조 — 확인 완료
