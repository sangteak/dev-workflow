# gate-effectiveness — 베이스라인 게이트 인벤토리

> 일회용 문서 — T8(도그푸딩 검증 완료 후 정리)에서 폐기 예정. T3~T6 개정 전후 대조 기준 + T7 전수 재검 원판.
> 생성: Task 1 (베이스라인 스냅샷). 이 문서 자체는 `skills/` 아래 어떤 파일도 수정하지 않고 생성되었다.

---

## Step 1: 처분 변경 12건 — 현행 문면 스냅샷

설계 문서 §4 "게이트 심사 결과 확정본" 기준. 각 항목은 개정 전 원문을 **그대로 인용**한다(치환 대상 verbatim 원판).

### 자동화 5건

#### (표 #2) document-consolidation — Mode1 Step6 중간 산출물 삭제 확인

**파일:줄:** `skills/document-consolidation/SKILL.md:83-96`

```
6. **중간 산출물 삭제**

   phase/plan/HANDOFF 등 중간 산출물만 삭제한다. **`[기능명].md`는 `status: complete` 상태로 보존한다** — 이 파일이 merge-to-domain의 머지 후보이며, feature 디렉토리 전체 삭제는 도메인 머지 검증 통과 후 merge-to-domain(REQ-019)이 전담한다.

   ```
   📋 중간 산출물을 삭제합니다.

   삭제 대상: phase1~3.md, plan.md, HANDOFF.md, seed.yaml
   보존: docs/design/[카테고리]/[기능명]/[기능명].md (complete — 도메인 머지 대기)

   진행할까요?
   1. Yes
   2. No
   ```
```

(줄 98-100의 사용자 승인 후속 처리 및 override 안내는 게이트 블록 밖 — 별도 보존)

---

#### (표 #12) brainstorming — 국면4 PLAN 연속 진행 제안

**파일:줄:** `skills/brainstorming/SKILL.md:432-435`

```
- 파일 생성 완료 후 PLAN 단계로 연속 진행을 제안한다:
  "설계 문서가 `docs/design/[카테고리]/[기능명]/[기능명].md`에 저장되었습니다.
   PLAN 단계로 바로 진행할까요?"
- PLAN 진행 시 Persona Resolution은 PLAN 페르소나만 새로 확정한다
```

---

#### (표 #18) context-handling — HANDOFF 복구 확인

**파일:줄:** `skills/context-handling/SKILL.md:230-236`

```
### HANDOFF 있는 경우

````
⚠️ 이전 세션이 [국면명] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?
````
```

(후속 절차 1~4행(줄 238-242)은 게이트 자체가 아닌 확인 후 동작 — 조건부 자동화 대상 아님, 변경 없음)

---

#### (표 #20) persona-resolution — 페르소나 저장 제안

**파일:줄:** `skills/persona-resolution/SKILL.md:78-90`

```
```
💾 이번 세션에서 사용한 페르소나를 저장해두면 다음 세션 시작 시
   페르소나 확인 단계가 간소화됩니다.

  사용한 페르소나:
    BRAINSTORM: [목록]
    PLAN:       [목록]

  `.claude/personas.md` 로 저장할까요?

  1. Yes — 고르면: .claude/personas.md가 생성되어 다음 세션부터 확인 없이 자동 적용됩니다
  2. No — 고르면: 다음 세션에도 페르소나 확인을 거칩니다
```
```

(트리거 조건 줄 74-76, 후속 처리 줄 92-98은 게이트 블록 부속 — 조건 자체는 유지, 형태만 PLAN에서 설계 예정)

---

#### (표 #32) merge-to-domain — 자동모드 키워드 confirm

**파일:줄:** `skills/merge-to-domain/SKILL.md:335-348`

```
### 자동 모드 키워드 보조 인식 (REQ-024)

ARGUMENTS에 다음 키워드가 발견되면 1차 confirm 발생:

전문은 본 스킬의 references/templates.md 「자동 모드 키워드 표 + confirm 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: 한/영 자동모드 키워드 매칭 표 + Yes(자동모드)/No(현재모드유지) 2택 확인 출력)

확인 출력: (위 Read 지시와 동일 블록)

**자동 모드 의미 경계 (REQ-024):**
- 자동 수정 항목의 사후 확인을 생략한다
- 사용자 결정 필요 항목은 여전히 질문한다 (SSOT 손상 위험 차단)
- **dry-run 승인 게이트("이대로 진행할까요?")와 도메인 문서당 최초 1회 학습 게이트는 `--auto`, `--no-review`, 키워드 자동 모드 등 어떤 플래그 조합에서도 생략할 수 없다** — 자동 모드가 생략하는 것은 자동 수정 항목의 항목별 사후 확인뿐이다
- 세션 종료 시 자동 리셋, 파일 저장 없음
```

(개정 대상은 "1차 confirm" 자체 — dry-run/학습 게이트 불가침 문구(줄 347)는 이 게이트 처분과 별개 유지 대상. 실제 confirm 템플릿 전문은 `skills/merge-to-domain/references/templates.md`에 있음 — 아래 §참고자료에 별도 기록)

---

### 조건부 자동화 1건

#### (표 #17) context-handling — 잔존 HANDOFF 삭제

**파일:줄:** `skills/context-handling/SKILL.md:164-182`

```
### 잔존 HANDOFF 정리

탐색 중 `status: complete`인데 HANDOFF.md가 남아있는 항목이 발견되면,
통합 목록 출력 후 아래 메시지를 추가한다:

```
🧹 완료된 작업에 HANDOFF.md가 남아있습니다:
  - [카테고리]/[기능명]/HANDOFF.md
  - [카테고리]/[기능명]/issues/[문제명]/HANDOFF.md

삭제할까요?

1. Yes — 고르면: 완료된 작업의 HANDOFF 파일들을 삭제합니다 (작업 기록은 phase 파일과 git에 남습니다)
2. No — 고르면: 그대로 두고 다음 세션에도 목록에 표시됩니다
```

- 사용자가 Yes → 해당 HANDOFF.md 파일을 삭제한다
- 사용자가 No → 삭제하지 않고 진행한다
- 이 제안은 통합 목록 제시 후에만 출력한다 (탐색 과정 중 출력 금지)
```

(REQ-007: git 프로젝트는 자동 삭제+고지 1줄, git 없는 프로젝트는 확인 유지 — VCS 모드 분기 신설 대상)

---

### 분리 1건

#### (표 #5) workflow-orchestrator — Completion Step3 커밋+푸시

**파일:줄:** `skills/workflow-orchestrator/SKILL.md:237-238`

```
**Step 3: 커밋+푸시 제안**
- "마무리가 완료되었습니다. 커밋+푸시를 진행할까요?" 사용자 확인 후 실행
```

**동기화 대상 (같은 태스크 — REQ-003 기술가이드라인 4):**

`skills/workflow-orchestrator/bootstrap.md:30`
```
- 커밋+푸시는 Completion Protocol에서만, 커밋 전 사용자 확인
```

`skills/workflow-orchestrator/bootstrap.md:24` (COMPLETION 요약 행)
```
| COMPLETION | 마무리·완료·wrap up | Completion Protocol (문서 취합 → 커밋 제안) |
```

부속 참조(개정 불필요, 문맥용):
- `skills/workflow-orchestrator/SKILL.md:95`: `4. 커밋+푸시는 마무리 시퀀스(Completion Protocol)에서 처리한다`
- `skills/workflow-orchestrator/SKILL.md:198`: `- DEVELOP 완료 후 커밋+푸시는 Completion Protocol을 통해서만 실행한다`
- `skills/workflow-orchestrator/SKILL.md:204`: `DEVELOP 완료 후 마무리 시퀀스를 관리한다. 커밋+푸시는 반드시 이 시퀀스 내에서만 실행한다.`

---

### 생략+사후 고지 2건

#### (표 #23) merge-to-domain — domain 학습 게이트

**파일:줄:** `skills/merge-to-domain/SKILL.md:82-90`

```
**학습 단계 사용자 게이트 (REQ-005):**

domain digest 산출 직후 사용자에게 검토 요청:

전문은 본 스킬의 references/templates.md 「domain 학습 게이트 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: 추출된 정책/결정/요구사항ID/섹션인덱스 요약 제시 + Yes/수정필요 2택)

"수정 필요" 선택 시 → 사용자에게 어느 부분이 잘못되었는지 받고 재추출.
```

**함께 개정 대상 (REQ-004 명시 지점 "SKILL.md:283·347"):**

`skills/merge-to-domain/SKILL.md:56`
```
**학습 게이트 노출 정책:** domain 학습 사용자 게이트는 대상 도메인 문서당 최초 1회만 노출한다. 누적 base 반영을 위한 재학습(두 번째 feature부터)은 내부 재추출로 수행하고 게이트를 생략한다 — 변경분은 직전 dry-run 승인에서 이미 검토됐다.
```

`skills/merge-to-domain/SKILL.md:283` (병렬 모드 2-pass 프로토콜 — "생략할 수 없다" 원문)
```
- **학습 게이트 (메인, 직렬)**: 결정 해소 전, 메인 컨텍스트가 Pass 1이 반환한 domain digest를 **대상 도메인 문서당 1회** 게이트("이렇게 해석이 맞나요?")로 노출한다. feature digest는 카테고리당 1회 묶음으로 노출한다. "수정 필요" 시 메인이 직접 재추출한다 — 이 게이트는 REQ-024 의미 경계에 따라 어떤 플래그 조합에서도 생략할 수 없다
```

`skills/merge-to-domain/SKILL.md:347` (자동 모드 의미 경계 — "생략할 수 없다" 원문, 표 #32와 공유 지점)
```
- **dry-run 승인 게이트("이대로 진행할까요?")와 도메인 문서당 최초 1회 학습 게이트는 `--auto`, `--no-review`, 키워드 자동 모드 등 어떤 플래그 조합에서도 생략할 수 없다** — 자동 모드가 생략하는 것은 자동 수정 항목의 항목별 사후 확인뿐이다
```

참고: 실제 출력 템플릿 전문은 `skills/merge-to-domain/references/templates.md:22-36` (「domain 학습 게이트 출력」)

---

#### (표 #24) merge-to-domain — feature 학습 게이트

**파일:줄:** `skills/merge-to-domain/SKILL.md:105-113`

```
**학습 단계 사용자 게이트 (REQ-005):**

feature digest 산출 직후 사용자에게 검토 요청 (domain과 동일 패턴).
복수 feature가 있을 경우, **카테고리당 1회로 묶어 표시** (인지 부담 절감).

전문은 본 스킬의 references/templates.md 「feature 학습 게이트 출력」을 Read하여 사용하라.
(Read 실패 시 최소 요건: feature별 정책/결정/요구사항ID 요약을 나열 + Yes/수정필요 2택)

"수정 필요" 선택 시 → 어느 feature의 어느 부분이 잘못되었는지 받고 해당 feature만 재추출.
```

**함께 개정 대상:** 위 domain 학습 게이트와 SKILL.md:283·347을 공유 (동일 "학습 게이트" 불가침 문구가 domain·feature 양쪽을 함께 지칭).

참고: 실제 출력 템플릿 전문은 `skills/merge-to-domain/references/templates.md:52-` (「feature 학습 게이트 출력」)

---

### 정비 2건 (Architect 라운드 규정)

#### (표 #33-a) merge-to-domain — Architect 라운드 등급표 + 승급 규칙

**파일:줄:** `skills/merge-to-domain/SKILL.md:137-159`

```
### Architect 라운드 등급 결정 (REQ-007)

분류 완료 직후, Architect 진입 **전에** 라운드 등급을 결정한다 (외부 분류 규칙).

| 머지 계획 특성 | Architect 라운드 |
|---|---|
| 자동 수정 only + 사용자 결정 0 + append만 | 1 |
| 사용자 결정 1~2건 + 의미 충돌 0 | 2 |
| 의미 충돌 ≥ 1 OR 의존성 재정의 OR 기존 결정 무효화 | 3 |

라운드 등급 결정 후 🏛️ Architect 페르소나를 정확히 등급 라운드만큼 실행한다.
각 라운드 종료 시 다음 출력 템플릿 강제 (M = 결정된 라운드 등급):

```
[Round N/M] 검토 결론: PASS | FAIL
- 자동 수정 항목 [건수] 검증 완료
- 사용자 결정 항목 [건수]
- 발견된 우려: [없음 / 항목 나열]
```

- 2라운드 이후는 직전 라운드의 "발견된 우려" 해소 여부를 재검토한다
- "발견된 우려"가 비어있지 않으면 등급을 1단계 자동 승급한다 (이미 등급 3이면 유지, PASS 선언 강제 차단). 단 `--review-merge=N`이 지정된 경우 자동 승급보다 N이 우선한다
- 최종 라운드가 FAIL이면 In-session Resolution(REQ-010) 4지 선택지로 라우팅한다
```

**설계 §4 근거:** "등급표 빈칸+승급 과발동" — 표에 "사용자 결정 3건+ · 의미 충돌 0" 행이 빈칸(2건 이하만 정의됨), 승급 판별문이 무조건 자동 승급이라 뻔한 우려에도 라운드가 늘어남(REQ-005 ②의 차단성 판별문 미적용 상태).

---

#### (표 #33-b) plan-stage — Step4 페르소나 루프 규칙

**파일:줄:** `skills/plan-stage/SKILL.md:247-251`

```
**루프 규칙:**
- PLAN 단계의 주요 결정 전 피드백루프를 절대 생략하지 않는다
- 페르소나 간 충돌 시 충돌 내용과 해결 근거를 명시한다
- 합의 후 사용자 확인을 받고 다음으로 진행한다
- 각 페르소나의 발언이 중복되지 않도록 한다
```

**설계 §4 근거:** REQ-005 ③ "plan-stage Step 4는 페르소나 전원 일치 시 합의 기록 후 라운드 종료" — 현행은 "절대 생략하지 않는다"만 있고 전원 일치 시 조기 종료 경로가 없음. 표 #16(페르소나 합의 확인)은 표에서 "유지" 라벨을 유지하되 이 조기 종료 규칙만 정비 대상(§ 하단 "집계 불일치 관측" 참조).

---

### 직접 갱신 1건

#### (표 #34) brainstorming — 국면4 Seed-Architect 재투입

**파일:줄:** `skills/brainstorming/SKILL.md:427-431`

```
- 📎 **Enhanced Mode — Seed YAML 생성:** 설계 문서 확정 후, Seed-Architect 서브에이전트로 최종 시드 YAML을 생성한다.
  - 입력: 확정된 설계 문서 전문 + phase1~3 핵심 결정 사항
  - 출력: `docs/design/[카테고리]/[기능명]/seed.yaml`
  - 이 시드는 Ouroboros `ooo run` 또는 PLAN 단계의 참조 자료로 활용할 수 있다
  - Standalone Mode에서는 Step B에서 생성한 시드를 설계 문서에 인라인으로 포함하고, 별도 파일은 생성하지 않는다
```

**설계 §4 근거:** REQ-006 "국면 4의 Seed-Architect 재투입 제거 — Step B 확정 시드에 국면 2~4 변경분만 반영해 seed.yaml 직접 작성". 이 항목은 사용자 확인 게이트가 아니라 서브에이전트 재투입 로직 자체가 대상(참고 행 — 34행 표기에서도 "게이트 아님, 관측 ③" 취급).

---

## Step 1: 유지 게이트 — 구조적 사실 (T7 전수 재검 원판)

> ⚠️ **집계 불일치 관측:** 설계 문서 §4 표를 행 단위로 직접 세면 "유지" 라벨 행이 **23건**이다(아래 표 전량). 그러나 같은 문서의 집계 각주는 "유지 22"로 명시한다. 원인 추정: 각주가 "정비 2"를 표 #33(merge-to-domain Architect 등급표) 1행 + 표 #16의 괄호 부기("단 REQ-005 ③ 조기 종료 적용")를 별도 변경 단위로 셈하면서, 표 #16 자체는 "유지" 라벨을 유지한 채로도 정비 대상에 이중 포함시킨 것으로 보인다 — 표에는 정비를 위한 별도 행(#33 외 1건)이 없다. 이 문서는 표에 실제로 적힌 라벨을 그대로 신뢰하여 **23건 전부**를 기록한다(#16 포함, 괄호 부기는 발동조건 열에 그대로 보존). T7 스윕 시 이 각주 불일치를 설계 문서 §4 자체의 결함으로 별도 보고할 것 — 본 태스크(베이스라인 캡처)의 책임 범위 밖이므로 §4 원문은 수정하지 않는다.

| # | 파일:줄 | 화면 이름 | 선택지 수 | 발동 조건 요지 |
|---|---|---|---|---|
| 1 | `skills/document-consolidation/SKILL.md:68-81` | 문서 통합 결과 사용자 리뷰 | 자유 텍스트(수정 요청 또는 진행) | Mode1 Step5 — 매 통합마다 상이한 내용 검토 |
| 3 | `skills/document-consolidation/SKILL.md:157-166` | 이슈 통합 결과 사용자 리뷰 | 자유 텍스트(수정 요청 또는 진행) | Mode2 — 승인이 곧 issues/ 디렉토리 비가역 삭제 동의 |
| 4 | `skills/workflow-orchestrator/SKILL.md:223-228` | README 업데이트 필요 여부 확인 | Yes/No (자연어 승인) | Completion Step2 — 변경 내용별 영향 판단 매번 상이 |
| 6 | `skills/workflow-orchestrator/SKILL.md:164-176` | 단계 감지 실패 질문 | 5지 (1~4 단계 + 0 해당없음) | Ambiguous — 워크플로우 의도는 있으나 단계 불명확 시에만 |
| 7 | `skills/brainstorming/SKILL.md:39-57` | 카테고리 확정 | 2지(Yes/No) 또는 목록+0 새 카테고리 | 국면0 — 카테고리 판단 매번 상이 |
| 8 | `skills/brainstorming/SKILL.md:267-290` | Step B 시드 확인 | 자유 텍스트(확인 또는 수정 요청) | 국면1 — 시드 추출 후 필수 확인, 수정 분기 실재 |
| 9 | `skills/brainstorming/SKILL.md:235-247` | 미답변 질문 조사 여부 | 3지(전부조사/선택조사/스킵) | 국면1~ — 미답변 질문 존재 시에만 |
| 10 | `skills/brainstorming/SKILL.md:311-326` (국면1 예시, 국면2/3/4 각각 유사 전환 확인 존재) | 국면 전환 확인 ×4 | 자유 텍스트/자연어 승인 | 국면0→1, 1→2, 2→3, 3→4 — 불변 phase 파일 생성 직전(비가역) |
| 11 | `skills/brainstorming/SKILL.md:328-347` | Simplifier 스코프 정리 | 자유 텍스트(사용자 결정) | 요구사항 8개 이상/사용자 언급/체크리스트 ⚠️❌ 3개 이상 시 자동 제안 |
| 13 | `skills/plan-stage/SKILL.md:14-45` | 브레인스토밍 문서 분석 확인 | 자유 텍스트(계속 진행 승인) | Step1 — 신규 세션 진입 시 요약 검토 |
| 14 | `skills/plan-stage/SKILL.md:47-64` | OPEN_QUESTIONS 해소 | 순차 질의응답(항목별) | Step1 부속 — 미결 사항 1건 이상 존재 시 |
| 15 | `skills/plan-stage/SKILL.md:203-220` | 재협의 선택지 | 4지 | Step3 — 🚫 RENEGOTIATE 항목 존재 시 |
| 16 | `skills/plan-stage/SKILL.md:224-251` | 페르소나 합의 확인 (Step4) | 자유 텍스트(합의 확인) | Step4 — CAUTION 항목 존재 시, 매 결정 내용 상이 (단 정비 대상 33-b의 조기 종료 규칙 적용 예정) |
| 19 | `skills/persona-resolution/SKILL.md:36-56` | 기본 페르소나 제시 및 수정 기회 | 자유 텍스트(그대로 진행 또는 수정 지정) | Step2 — `.claude/personas.md` 없을 때만, 프로젝트당 ~1회 |
| 21 | `skills/rules-injection/SKILL.md:106-120` | 자동수정 confirm | 2지(자동 수정/보고만) | `auto-fix: confirm`(기본값) 규칙 위반 발견 시 |
| 22 | `skills/rules-injection/SKILL.md:151-174` | 규칙 충돌 우선순위 | 3지 | REVIEW 중 규칙 간 상충 감지 시 |
| 25 | `skills/merge-to-domain/SKILL.md:38-41` | 대상 도메인 배정 확인 | 상황별(1개/2개 이상/0개 각각 분기) | 도메인 문서 2개 이상 존재 시 feature별 배정 제안 |
| 26 | `skills/merge-to-domain/SKILL.md:41` | 신규 domain 승격 확인 | 자유 텍스트(승인) | 도메인 문서 0개(신규 카테고리) 시 |
| 27 | `skills/merge-to-domain/SKILL.md:218-249` | 실행 모드 선택 | 3지(순차/병렬/자동위임) | 후보 식별 직후, `ask_user_3way` 분기 조건 충족 시 |
| 28 | `skills/merge-to-domain/SKILL.md:387-390` | 의미충돌 사용자 결정 | 상황별(각 충돌 유형에 따른 결정) | (3) 머지 계획에서 의미 충돌 발견 시 — 어떤 플래그로도 자동화 불가(REQ-012) |
| 29 | `skills/merge-to-domain/SKILL.md:167-174` | dry-run 승인 | 2지(Yes/No, 결정 해소 후) | (4) 적용 직전 — 비가역 최종 승인, 모든 모드에서 생략 불가 |
| 30 | `skills/merge-to-domain/SKILL.md:396-402` | feature 디렉토리 삭제 확인 (no-git) | 2지(Yes/No) | REQ-019 — no-git-mode 한정, 완전 비가역(git 히스토리 없음) |
| 31 | `skills/merge-to-domain/SKILL.md:363-369` | In-session Resolution | 4지(Tech Lead 재투입/직접 수정/skip/abort) | 머지 단계 어디서든 실패 발생 시 |

**비고 (게이트 아님 — 집계 제외):** Completion Step1 문서 취합(`skills/workflow-orchestrator/SKILL.md:216-221`)은 사용자 확인 없이 즉시 실행 — document-consolidation의 "자동 실행하지 않는다" 규칙보다 우선 적용되는 예외로 이미 확인 생략 상태.

**집계 검산 (표 라벨 실측 기준):** 유지 23(위 경고 참조) + 자동화 5 + 조건부 자동화 1 + 분리 1 + 생략+고지 2 + 정비 1(표 #33) + 직접 갱신 1 = **34행** (게이트 33 + 참고 1[비고]). 행 개수는 34로 설계 문서와 일치하나, "유지" 세부 집계는 설계 문서 각주(22)와 표 실측치(23) 사이에 1건 불일치가 있다 — 위 경고 참조.

---

## Step 2: 구 독트린 grep 전수 스윕

명령: `grep -rn "생략할 수 없다\|학습 게이트\|커밋+푸시" skills/` + 보강 `grep -rn "절대 생략" skills/`

### `생략할 수 없다`

| 파일:줄 | 표시 | 사유 |
|---|---|---|
| `skills/merge-to-domain/SKILL.md:283` | 개정 대상 | 병렬 2-pass 프로토콜 내 "학습 게이트 ... 생략할 수 없다" — REQ-004로 생략+사후고지 전환, 이 줄의 불가침 서술 삭제/수정 필요 |
| `skills/merge-to-domain/SKILL.md:347` | 개정 대상(부분) | "dry-run 승인 게이트... **와** 학습 게이트는 ... 생략할 수 없다" 복합 문장 — dry-run 부분은 유지(표 #29), 학습 게이트 부분만 REQ-004로 개정. 분리 편집 필요 |

### `학습 게이트`

| 파일:줄 | 표시 | 사유 |
|---|---|---|
| `skills/merge-to-domain/SKILL.md:56` | 개정 대상 | "학습 게이트 노출 정책" 절 제목 및 본문 — REQ-004로 게이트 자체가 사후 고지로 전환되므로 절 성격이 바뀜 |
| `skills/merge-to-domain/SKILL.md:86` | 개정 대상 | domain 학습 게이트 출력 Read 지시 — REQ-004 개정 시 출력 형식이 "검토 요청"에서 "digest 추출 N건 사후 고지"로 변경 |
| `skills/merge-to-domain/SKILL.md:110` | 개정 대상 | feature 학습 게이트 출력 Read 지시 — 상동 |
| `skills/merge-to-domain/SKILL.md:283` | 개정 대상 | (위 "생략할 수 없다"와 동일 줄 — 중복 집계 아님, 두 스윕 용어가 같은 줄에서 교차) |
| `skills/merge-to-domain/SKILL.md:347` | 개정 대상(부분) | (위와 동일 줄 — 학습 게이트 불가침 표현이 이 REQ-004 범위) |
| `skills/merge-to-domain/references/templates.md:22` | 개정 대상 | 「domain 학습 게이트 출력」 섹션 헤더 — REQ-004 개정 시 헤더명 및 본문 템플릿을 사후 고지 형식으로 교체 |
| `skills/merge-to-domain/references/templates.md:52` | 개정 대상 | 「feature 학습 게이트 출력」 섹션 헤더 — 상동 |

### `커밋+푸시`

| 파일:줄 | 표시 | 사유 |
|---|---|---|
| `skills/workflow-orchestrator/bootstrap.md:30` | 개정 대상 | "커밋+푸시는 Completion Protocol에서만, 커밋 전 사용자 확인" — REQ-003 분리로 "커밋"과 "푸시" 각자 확인 문구로 교체, bootstrap.md 동기화 대상(기술가이드라인 4) |
| `skills/workflow-orchestrator/SKILL.md:95` | 유지 정당 | DEVELOP 섹션의 부속 설명("커밋+푸시는 마무리 시퀀스에서 처리") — Completion Step3 처리 위임을 가리키는 문맥 서술이며 게이트 문면 자체가 아님. Step3 분리 후에도 "마무리 시퀀스에서 처리"라는 사실은 유효 — 단 T7 스윕 시 표현 일관성 재확인 권장(자동 확정 개정 아님) |
| `skills/workflow-orchestrator/SKILL.md:198` | 유지 정당 | Superpowers Delegation 섹션 부속 규칙("DEVELOP 완료 후 커밋+푸시는 Completion Protocol을 통해서만 실행") — 실행 위치 제약 서술, Step3 분리와 직접 충돌하지 않음(위임 사실은 불변) |
| `skills/workflow-orchestrator/SKILL.md:204` | 유지 정당 | Completion Protocol 섹션 도입부("커밋+푸시는 반드시 이 시퀀스 내에서만 실행") — 상동, 시퀀스 경계 서술이며 Step3 세부 분리와 별개 |
| `skills/workflow-orchestrator/SKILL.md:237` (헤더) | 개정 대상 | "Step 3: 커밋+푸시 제안" — REQ-003 분리 대상 헤더 자체 |
| `skills/workflow-orchestrator/SKILL.md:238` | 개정 대상 | "마무리가 완료되었습니다. 커밋+푸시를 진행할까요?" — 분리 대상 게이트 문면 원문 |

### `절대 생략` (보강 항목)

| 파일:줄 | 표시 | 사유 |
|---|---|---|
| `skills/plan-stage/SKILL.md:248` | 개정 대상 | "PLAN 단계의 주요 결정 전 피드백루프를 절대 생략하지 않는다" — REQ-005 ③ 조기 종료 규칙 추가로 "절대 생략하지 않는다"의 절대성이 "전원 일치 시 합의 기록 후 종료" 예외를 허용하도록 정비 필요 |

**스윕 히트 총계:** 용어별 grep 원시 매치 16건 (`생략할 수 없다` 2 · `학습 게이트` 7 · `커밋+푸시` 6 · `절대 생략` 1) = 위 표 16행. `merge-to-domain/SKILL.md:283`·`:347`이 "생략할 수 없다"와 "학습 게이트" 두 용어에 동시 매치되어 각 용어 섹션에 중복 기재되므로, 고유 file:line 기준으로는 **14곳** (개정 대상 11곳 · 유지 정당 3곳). 전 히트 표시 완료 — 미표시 잔여 없음.

**`wc -c skills/workflow-orchestrator/bootstrap.md`:** `2499`

---

## 참고자료 (개정 시 함께 확인할 인접 파일)

- `skills/merge-to-domain/references/templates.md:22-36` — 「domain 학습 게이트 출력」 템플릿 전문 (REQ-004 개정 대상)
- `skills/merge-to-domain/references/templates.md:52-` — 「feature 학습 게이트 출력」 템플릿 전문 (REQ-004 개정 대상)
- `skills/workflow-orchestrator/decision-flow.md:8` — "게이트 배칭" 명칭 (REQ-009 대상, Step 2 스윕 용어 4종에는 미포함 — 별도 개정 트래킹)
- `skills/workflow-orchestrator/bootstrap.md` 전체 2499 bytes — REQ-003 동기화 시 바이트 수 변동 예상, T7에서 재측정 대조

---

## 검증 결과 (Task 7)

> 검증 대상: 커밋 `77b190c`(T3)·`b9abdaa`(T4)·`b851496`(T5)·`a912d19`(T6) 적용 후 worktree 상태. 기준: `plan.md`(권위 문면), 대조 원판: 본 문서 위 §Step 1·§Step 2. 편집 없이 읽기 전용 검증.

### Step 1: 게이트 대조 전수 재검

#### Part A — 유지 게이트 23건

| # | 판정 | 현재 위치 | 근거 (1줄) |
|---|---|---|---|
| 1 | PASS | document-consolidation:68-81 (동일) | `📋 문서 통합 결과:` + 수정/진행 자유 텍스트 — Mode1 Step5 |
| 3 | PASS | document-consolidation:143-156 (157-166에서 상향 이동 — Step6 개정으로 파일 단축) | `📋 이슈 통합 결과:` — 자유 텍스트, Mode2 승인=비가역 삭제 동의 |
| 4 | PASS | workflow-orchestrator:223-228 (동일) | "README.md 업데이트가 필요해 보입니다. 진행할까요?" — Yes/No |
| 6 | PASS | workflow-orchestrator:164-176 (동일) | 단계 감지 실패 + 1~4단계 + `0. 해당 없음` = 5지 |
| 7 | PASS | brainstorming:39-57 (동일) | `📌 결정 요청 : 카테고리 확정` 2지 또는 목록+`0. ✨ 새 카테고리` |
| 8 | PASS | brainstorming:267-290 (동일) | 시드 추출 후 필수 확인(:272) + 수정 분기(:288) |
| 9 | PASS | brainstorming:235-247 (동일) | 미답변 질문 3지(전부조사/선택조사/스킵) |
| 10 | PASS | brainstorming:311-326 + 국면2/3 전환 :365-372·:397-404 | 자연어 승인 ×4, 불변 phase 파일 생성 직전 |
| 11 | PASS | brainstorming:328-345 (동일) | 트리거 3조건(:332-335) + 사용자 결정 자유 텍스트(:343) |
| 13 | PASS | plan-stage:14-45 (동일) | "계속할까요?"(:41) + 확인 없이 미진행(:45) |
| 14 | PASS | plan-stage:47-64 (동일) | 순차 질의응답(:59), OPEN_QUESTIONS 존재 시 |
| 15 | PASS | plan-stage:203-220 (동일) | 재협의 4지 + 응답 없이 미진행(:220) |
| 16 | PASS | plan-stage:224-251 (동일) | CAUTION 필수 루프(:228) — 화면·선택지·발동 무변경(루프 규칙 :248만 33-b 정비 반영) |
| 19 | PASS | persona-resolution:36-56 (동일) | 자유 텍스트(:47), personas.md 없을 때만 |
| 21 | PASS | rules-injection:106-120 (동일) | `⚠️ 규칙 위반 발견` 2지(자동수정/보고만) |
| 22 | PASS | rules-injection:151-174 (동일) | "어떻게 처리할까요?" 3지(:168-174) |
| 25 | PASS | merge-to-domain:38-41 (동일) | 1개/2개 이상/0개 3분기 유지 |
| 26 | PASS | merge-to-domain:41 (동일) | 도메인 0개 시 신규 생성 확인 |
| 27 | PASS | merge-to-domain:219-250 (+1) | 3지(순차/병렬/자동위임)(:241-248) |
| 28 | PASS | merge-to-domain:388-391 (+1) | 의미 충돌 = 항상 사용자 결정(:390) |
| 29 | PASS | merge-to-domain:168-175 (+1) | dry-run 회계 + Yes/No 승인(:175), :348 불가침 보호 지속 |
| 30 | PASS | merge-to-domain:397-403 (+1) | no-git 한정 2지(:403) |
| 31 | PASS | merge-to-domain:364-370 (+1) | 실패 시 4지(:367-370) |

**Part A: 23 PASS / 0 FAIL** (라인 이동은 #3 및 merge-to-domain 5건 ±수줄 — 모두 같은 파일 내 선행 편집에 의한 자연 이동, 구조 무변경)

#### Part B — 처분 변경 12건

| # | 항목 | 판정 | 근거 요지 |
|---|---|---|---|
| 표#2 | document-consolidation Mode1 Step6 | PASS | git-mode 사후고지+안전망 참조 / no-git-mode 확인 유지 — plan T6 S1 verbatim |
| 표#12 | brainstorming PLAN 연속진행 | PASS | :429 자동 진행+1줄 고지 — plan T5 S2 verbatim |
| 표#18 | context-handling HANDOFF 복구 확인 | PASS (부기†) | :236·:246 자동 시작+고지, "계속할까요?" 0건 |
| 표#20 | persona-resolution 저장 제안 | **정당 일탈** | plan verbatim + 안전망 참조 append(승인된 일탈 ②), 질문형 게이트 재도입 없음 |
| 표#32 | merge-to-domain 자동모드 confirm | PASS | confirm 게이트 소멸, 비차단 고지(templates.md:97) |
| 표#17 | context-handling 잔존 HANDOFF 삭제 | PASS | git-mode 자동+고지 / no-git-mode 확인 유지 — plan T6 S2 조건부 분기 |
| 표#5 | workflow-orchestrator 커밋/푸시 분리 + bootstrap | PASS | Step 3/3.5 분리(SKILL.md:237-242) + bootstrap.md:30 verbatim |
| 표#23 | merge-to-domain domain 학습 게이트 | PASS | :82-89 사후 고지 전환 + templates.md:25 고지 문면 |
| 표#24 | merge-to-domain feature 학습 게이트 | PASS | :105-113 domain과 대칭, 카테고리당 1회 |
| 표#33-a | merge-to-domain Architect 등급표 | PASS | :145 신규 행 + :159 차단성 우려 승급 규정 — plan T4 S3 verbatim |
| 표#33-b | plan-stage Step4 루프 규칙 | PASS | :248 조기 종료 예외 포함 — plan T5 S3 verbatim, "절대 생략" 0건 |
| 표#34 | brainstorming Seed-Architect 재투입 | PASS | :427 직접 작성, 재투입 없음 — plan T5 S1 verbatim |

† 표#18 부기: :236·:246 말미에 plan verbatim 밖 `(안전망: development-principles "자동 결정 안전망" 참조)` 추가 — 승인된 일탈 ②(persona-resolution 안전망 참조 append)와 동일 성격의 순수 참조 추가이며 신 규범과 모순 없음(질문형 아님). FAIL 아님으로 분류.

decision-flow.md 지정 2줄(plan T3 S3): :8 "게이트 실효성 정비와의 관계" 치환, :225 말미 업종 특화 어휘 문장 추가 — 둘 다 verbatim 확인(정당 일탈 ① 영역). "게이트 배칭" 구 명칭 skills/ 전체 0건.

**Part B: 11 PASS / 0 FAIL / 정당 일탈 2건**(표#20, 표#18 부기) — 둘 다 T6 리뷰 승인 범위(plan 공백 해소), 신 규범과 모순 없음.

### Step 2: 구 독트린 스윕 전수

**명령 1:** `grep -rn "생략할 수 없다\|학습 게이트\|커밋+푸시\|절대 생략" skills/` — 8건

```
skills\workflow-orchestrator\SKILL.md:95   (커밋+푸시, 유지 정당 — 마무리 시퀀스 위임 서술)
skills\workflow-orchestrator\SKILL.md:198  (커밋+푸시, 유지 정당 — 실행 위치 제약)
skills\workflow-orchestrator\SKILL.md:204  (커밋+푸시, 유지 정당 — 시퀀스 경계)
skills\merge-to-domain\SKILL.md:86         (학습 게이트, templates.md 헤딩명 지칭 Read 지시 — plan T4 S5가 보존 지시, 본문은 사후고지로 개정 완료)
skills\merge-to-domain\SKILL.md:110        (학습 게이트, 상동 — feature)
skills\merge-to-domain\SKILL.md:348        (생략할 수 없다, dry-run 부분만 잔존 — 학습 게이트 부분 삭제 완료, 표#29 보호 문구)
skills\merge-to-domain\references\templates.md:22  (학습 게이트, 헤딩명만 보존 — 펜스 내용은 고지 문면으로 교체 완료)
skills\merge-to-domain\references\templates.md:42  (학습 게이트, 상동 — feature)
```

베이스라인 "개정 대상" 11곳 중 8곳(:56, :283, bootstrap:30, SKILL.md:237/:238, plan-stage:248)은 완전 소멸, 3곳(SKILL.md:86/:110, templates.md:22/:42의 헤딩·Read 지시)은 plan T4 S5 지시대로 헤딩명만 잔존(본문 개정 완료). 유지 정당 3곳(SKILL.md:95/198/204) 그대로 생존. **신규 히트 0건.**

**명령 2:** `grep -rn "계속할까요" skills/` — 2건

```
skills\workflow-orchestrator\decision-flow.md:14  (결정 카운터 정의 예시 — plan이 decision-flow 지정 2줄 외 무접촉으로 제한)
skills\plan-stage\SKILL.md:41                      (유지 게이트 #13 화면 문면 자체 — 개정 대상 아님)
```

context-handling/SKILL.md 내 0건 — plan T6 S5 완료 조건(`grep -c … context-handling/SKILL.md` → 0) 충족. skills/ 전체 잔존 2건은 둘 다 정당(회귀 아님).

**명령 3:** `wc -c skills/workflow-orchestrator/bootstrap.md` → **2539** (베이스라인 2499 + 40B, plan 제약 "T1 기록 +100B 이내" 충족, 브리프 기준 ≤2599 충족)

**명령 4:** `git -C D:/02_Workspace/98_Github/dev-workflow status --porcelain -- skills/` → **빈 결과** (main 무오염 확인)

**Step 2 종합: 0 regressions confirmed.** 개정 대상 11곳 전부 해소 또는 plan 승인 형태(헤딩명 보존)로 개정 완료, 유지 정당 3곳 생존, 신규 모순 히트 0건.

### main 무오염

- worktree `git status --porcelain -- skills/` → 빈 결과 (전부 커밋됨)
- main 체크아웃 `git -C D:/02_Workspace/98_Github/dev-workflow status --porcelain -- skills/` → 빈 결과
- **판정: PASS — main 리포지토리 무오염 확인**

### 종합 판정

| 항목 | 결과 |
|---|---|
| Part A (유지 23건) | 23 PASS / 0 FAIL |
| Part B (처분 변경 12건) | 11 PASS / 0 FAIL / 정당 일탈 2건 |
| 스윕 (구 독트린) | 0 regressions |
| `계속할까요` (context-handling 한정) | 0건 PASS |
| bootstrap.md 바이트 수 | 2539 ≤ 2599 PASS |
| main 무오염 | PASS |

**전 항목 PASS — 회귀 없음.** (위 표는 T3~T6 시점 `a912d19` 기준 — 이후 수정 커밋 `e27e475` 재검 결과는 아래 「수정 커밋 재검」 참조, 전 항목 PASS 유지)

---

### 드라이런 로그

**설정:** 개정된 workflow-orchestrator SKILL.md + bootstrap.md **만** 읽는 신선 서브에이전트에게 가상 마무리 시나리오(문서 취합 완료 상태 가정)를 진행시킴.

**결과: 핵심 통과** — 커밋/푸시 2단 분리 발동 확인.

- 턴 5 **[WAIT #1]**: "마무리가 완료되었습니다. 커밋을 진행할까요?" — 커밋 확인에서 정지 (푸시 언급 없음)
- (커밋 실행)
- 턴 6 **[WAIT #2]**: "커밋 완료: [요지 1줄]. 원격에 푸시할까요?" — 푸시 별도 확인에서 재정지
- "커밋만 하고 마치는 선택을 허용한다"(SKILL.md L242) 명시 확인 — 푸시 No 경로 실재
- "커밋+푸시" 잔존 2곳(L95·L198)은 범위 지정 문장("Completion Protocol에서만")이라 2단 분리와 무모순
- bootstrap.md 불변식("커밋·푸시는 Completion Protocol에서만 — 각각 별도 확인")과 정합

**모호 2건 발견:**
- 드라이런-① Step 3/3.5 확인 문구에 번호 선택지(1. Yes / 2. No) 병기 여부 미명시 → **`e27e475`에서 수정** (Yes/No 형식 포인터 1줄 추가)
- 드라이런-② Step 2.5 no-op 시(README 업데이트 불필요 등) 출력 여부 미확정 → **기록-only, §9 후보**

### 판단 리뷰 (신선한 눈)

**설정:** 컨텍스트 없는 서브에이전트에게 개정 8파일 제공, 4개 판정 질문 + 약모델 리스크 검사.

| 질문 | 판정 | 발견 |
|---|---|---|
| Q1 고지/게이트 구분 (새 고지가 질문형 아닌지) | 정상 | 신설 고지 전부 선언문. 커밋/푸시는 의도대로 질문형 (게이트로 유지된 항목) |
| Q2 안전망 참조 해소 | 클린 | 참조 8지점 전부 development-principles "자동 결정 안전망" 실재 절로 해소 |
| Q3 라운드 판별문 예/아니오 실행 가능성 | 실행 가능 | Minor **F2**: 3단 트리 3번 "설계할 수 없으면"의 판정 기준 부재 |
| Q4 두 트랙(생략 vs 유지) 상호 모순 | 1건 | **Important F1**: "학습 게이트" 명칭 4곳 잔존 — 내용은 고지인데 이름이 게이트 (앵커-헤딩) + Minor **F3**: `--review-merge=N` 우선 vs PASS 차단 관계 미명시 |
| Q5 약모델 리스크 | 3건 | Minor **F4**: ①VCS 모드 미확보 시점 분기 기준 공백 ②자동모드 고지 3중 참조 홉 ③PLAN 고지 괄호 인라인 출력 위험 |

### 수정 커밋 재검 (`e27e475`)

F1·F3·F4-①·드라이런-① 4건 수정 반영 — 재검 3항목 전부 PASS:

1. **`git show e27e475 --stat`**: 5파일 +8/-5 (context-handling +1, document-consolidation +1, merge-to-domain SKILL 3줄 치환, templates 2줄 치환, workflow-orchestrator +1). diff 전문 검토 결과 **게이트 선택지 수 변화 0** — 삽입은 전부 부가 명시(VCS "Is directory a git repo" 즉시 판정 ×2, "N은 라운드 수에만 우선한다 — 차단성 우려 잔존 시 PASS 선언 차단은 N과 무관" 1줄, Step 3·3.5 Yes/No 형식 포인터 1줄) + 앵커-헤딩 개명 4곳. 질문 신설·선택지 증감 없음
2. **`grep -rn "학습 게이트" skills/` → 0건.** 앵커-헤딩 쌍 dangling 없음: 「domain/feature digest 사후 고지 출력」 — SKILL.md:86(domain)·:110(feature) Read 지시 ↔ templates.md:22·:42 헤딩, 2×2 정확 대응
3. **스윕 재확인 (T1 분류 무손상):** 4용어 스윕 재실행 → 잔존 4건 = 유지 정당 3곳(workflow-orchestrator SKILL.md:95/:198/:204 — T1 분류 그대로 생존) + dry-run 불가침 1곳(merge-to-domain SKILL.md:348, 표#29 보호 문구 — 학습 게이트 부분은 T4에서 분리 제거된 상태 유지). 위 §Step 2 검증 시점에 "plan 승인 헤딩명 보존"으로 분류했던 학습 게이트 히트 4곳은 `e27e475` 개명으로 **전부 소멸** — 신규범 모순 잔존 최종 0건. `계속할까요` 2건(decision-flow:14 정의 예시·plan-stage:41 유지 게이트 #13 문면) 불변, bootstrap.md 2539B 불변, main 무오염 재확인(porcelain 0줄)

### 기록-only 잔여 (§9 후보)

수정 없이 기록만 남기는 관측 4건 — T8 §9 기록 시 이관:

- **F2**: 게이트 신설 체크리스트 3단 트리 3번 "안전망을 설계할 수 없으면 게이트를 둔다"의 '설계 불가' 판정 기준 부재
- **F4-②**: merge-to-domain 자동모드 고지의 3중 참조 홉 (SKILL → templates → Input Format Rules)
- **F4-③**: brainstorming PLAN 자동 진행 고지의 괄호 주석이 약모델에서 인라인 출력될 위험
- **드라이런-②**: Completion Step 2.5(README 불필요 시) 무언 처리 여부 미확정
