# skill-slimming (G4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 증명된 축자 중복 삭제 + 대형 스킬 2개의 참조 자료 verbatim 분할로 invoke당 로드 비용 절감 (행동 등가성 유지, v1.13.0)

**Architecture:** SKILL.md 본문에는 흐름 제어·게이트·안전 앵커만 남기고, 템플릿·프롬프트 전문·긴 예시는 `references/templates.md`로 verbatim 이동. 모든 변경은 베이스라인 인벤토리(Task 1) 대비 3튜플 기계 체크로 검증. 인벤토리는 G4 전용 일회용.

**Tech Stack:** Markdown 스킬 문서 편집, bash(grep/개수/해시 체크), git

## Global Constraints

- diff 허용 연산: **삭제·verbatim 이동·참조 삽입만**. 신규 규범 문장 금지 (승인 목록 공란) — 이동 중 문장 수정 발견 시 중단하고 보고
- 분리 파일 경로: 스킬 base dir 상대 `references/templates.md` — 리포 상대 경로 금지
- 각 이동 블록의 **헤딩은 SKILL.md 원위치에 앵커로 잔존** (Architect 권장)
- 템플릿+게이트 이중 성격 블록: 게이트 규정(사용자 확인 필수 등)은 본문 잔존, 템플릿 문면만 이동
- 사용자 노출 템플릿은 F1 화이트리스트(Task 6에 명시) 외 바이트 보존
- decision-flow.md·development-principles/SKILL.md **절대 수정 금지**
- 커밋은 태스크당 1개, status 정정(Task 7)은 반드시 독립 커밋
- Read 지시 문면 (참조 삽입 표준형): `전문은 본 스킬의 references/templates.md 「[블록명]」을 Read하여 사용하라. (Read 실패 시 최소 요건: [1줄])`

---

### Task 1: 베이스라인 인벤토리 추출

**Files:**
- Create: `docs/design/dev-workflow/skill-slimming/baseline-inventory.md`

**Interfaces:**
- Produces: 이후 모든 태스크의 기계 체크 기준값 (앵커 인용문·개수·해시). Task 6이 전수 재검에 사용

- [ ] **Step 1: 파일 크기·해시 스냅샷 기록**

Run: `cd /d/02_Workspace/98_Github/dev-workflow && for f in skills/brainstorming/SKILL.md skills/merge-to-domain/SKILL.md skills/workflow-orchestrator/SKILL.md skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md; do echo "$f $(wc -c <$f)"; done`
결과를 baseline-inventory.md `## 크기 스냅샷` 섹션에 기록

- [ ] **Step 2: 디스패치 지점 O/X 표 기록 (A3)**

Run: `grep -n "에이전트 역할 정의를 읽고" skills/brainstorming/SKILL.md skills/plan-stage/SKILL.md skills/workflow-orchestrator/SKILL.md`
brainstorming 4곳(Ontologist/Socratic/Seed-Architect/Simplifier) + 미답변 조사·피드백루프 비판·Hacker·국면4 Seed-Architect 지점을 행으로, ①역할 정의 로드 ②페르소나 도메인 ③출력 제약(결정 요청 금지)의 O/X를 열로 기록. ③이 O인 지점은 피드백루프 비판 슬롯뿐임을 확인 명시

- [ ] **Step 3: 게이트 인벤토리 기록 (F2)**

Run: `grep -n "^1\. \|^  1\. \|1\. Yes" skills/brainstorming/SKILL.md skills/merge-to-domain/SKILL.md skills/workflow-orchestrator/SKILL.md skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md | head -60`
번호 선택 게이트별 {게이트명, 선택지 수, 0번 유무}를 표로 기록

- [ ] **Step 4: 크로스레퍼런스 인벤토리 기록 (F3)**

Run: `grep -n "참조\|§[0-9]\|references" skills/*/SKILL.md skills/workflow-orchestrator/decision-flow.md | grep -v "^Binary" | head -80`
파일 간 참조 목록 + **decision-flow §8 ↔ brainstorming 템플릿명 3쌍(시드 확인·Simplifier 스코프 정리·국면 0 카테고리 선택)** 명시 등재

- [ ] **Step 5: 보존 대상 앵커 인용문 확정 (A1~E3)**

phase2_discovery.md의 A1~E3 각 항목에 대해 현재 파일에서 정확 인용문을 추출해 3튜플 {파일, 인용문/정규식, 판정 방식} 표 완성. B계열은 decision-flow 무변경 확정으로 "파일 해시 동일" 1항목으로 대체: `git hash-object skills/workflow-orchestrator/decision-flow.md skills/development-principles/SKILL.md` 결과 기록

- [ ] **Step 6: 커밋**

```bash
git add docs/design/dev-workflow/skill-slimming/baseline-inventory.md
git commit -m "docs(g4): capture baseline invariant inventory for skill-slimming"
```

---

### Task 2: brainstorming 분할 + /compact 축소

**Files:**
- Create: `skills/brainstorming/references/templates.md`
- Modify: `skills/brainstorming/SKILL.md`

**Interfaces:**
- Consumes: Task 1 baseline-inventory.md (A1~A11 앵커, 디스패치 O/X 표)
- Produces: 분할 패턴 표준형 (Task 3이 동일 패턴 적용)

- [ ] **Step 1: references/templates.md 생성 — verbatim 이동 대상 블록 복사**

이동 대상 (헤딩 포함 원문 그대로, 순서 유지):
1. 「Step A-0 Ontologist 프롬프트」 — `아래 에이전트 역할 정의를...` 코드펜스 + 출력 형식 펜스
2. 「Step A Socratic 프롬프트」 — 프롬프트 펜스 + 통합 정제 출력 형식 펜스
3. 「미답변 조사 프롬프트」 — 조사 프롬프트 펜스 + 조사 결과 제시 펜스
4. 「Step B Seed-Architect 프롬프트」 — 프롬프트 펜스 + Standalone 시드 YAML 펜스 + 시드 추출 결과 펜스 + 명확도 체크 펜스
5. 「Simplifier 프롬프트」 — 프롬프트 펜스 + 출력 형식 펜스
6. 「국면 2 시작 출력」 펜스 / 「국면 3 TD 발언 형식」 펜스
7. 「국면 4 표준 설계 문서 포맷」 — frontmatter~섹션 10 전체 펜스
8. 「issues/ 이슈 디렉토리 구조」 펜스 + 「국면 4 디렉토리 구조」 펜스

각 블록 위에 `## 「블록명」` 헤딩 부여. 파일 서두에 1줄: `> brainstorming SKILL.md의 참조 자료 (verbatim). 본문 디스패치 지점의 Read 지시로 로드된다.`

- [ ] **Step 2: SKILL.md 원위치를 헤딩 앵커 + Read 지시로 치환**

각 이동 지점을 다음 형태로 치환 (게이트·규정 문장은 그대로 두고 코드펜스만 제거):
```
**[기존 헤딩/규정 문장 그대로]**
프롬프트/출력 형식 전문은 본 스킬의 references/templates.md 「[블록명]」을 Read하여 사용하라.
(Read 실패 시 최소 요건: [블록별 1줄 — 아래 표])
```
Read 실패 폴백 1줄 (블록별): A-0→"본질/근본원인/전제/숨은가정 4관점 질문 각 1개" · Step A→"도메인 관점 소크라테스 질문 2~3개, 해결책 제안 금지" · 조사→"미답변 질문을 docs/design→코드 순으로 조사, 확신도·근거 명시" · Step B→"Goal/Constraints/Non-goals/Success Criteria/Assumptions/Open Questions 구조화 + 사용자 확인" · Simplifier→"핵심/선택 분류 + YAGNI 축소 제안 3택" · 국면4 포맷→"10섹션 표준(frontmatter status: ready-for-plan)"
**보존 필수 (이동 금지):** Step B "시드 추출 후 반드시 사용자 확인" 게이트 문장, A1~A11 앵커 전부 (특히 피드백루프 비판 슬롯의 출력 제약 ③, Standalone 대응 문장 A10, TD 침묵 3회 + 괄호 단서 2회 A11)

- [ ] **Step 3: /compact 3중 블록을 확정 문면으로 치환 (REQ-003)**

3개 국면 말미의 `💡 **컨텍스트 관리:** ...` 블록(각 3~4줄)을 각각 아래 1줄로 치환 (phase 파일명만 상이):
```
💡 [phaseN_파일명] 저장됨 — /compact 가능 (재논의 대기열은 먼저 처리 — decision-flow.md §6) · 새 세션: /clear → /dev-workflow:resume
```

- [ ] **Step 4: 기계 체크 (A1~A11)**

Run: baseline-inventory.md의 A계열 grep 전수 실행. 추가 확인:
`grep -c "저장됨 — /compact 가능" skills/brainstorming/SKILL.md` → 3
`grep -c "references/templates.md" skills/brainstorming/SKILL.md` → 이동 지점 수와 일치
`wc -c skills/brainstorming/SKILL.md skills/brainstorming/references/templates.md` → 본문이 베이스라인 대비 40% 이상 감소, 합계는 베이스라인 ±5% 이내 (verbatim 검증)

- [ ] **Step 5: 커밋**

```bash
git add skills/brainstorming/
git commit -m "refactor(g4): split brainstorming templates to references/, unify compact notice"
```

---

### Task 3: merge-to-domain 분할

**Files:**
- Create: `skills/merge-to-domain/references/templates.md`
- Modify: `skills/merge-to-domain/SKILL.md`

**Interfaces:**
- Consumes: Task 2의 분할 패턴 표준형 + Task 1 게이트 인벤토리

- [ ] **Step 1: references/templates.md 생성 — verbatim 이동**

이동 대상: 「domain_digest YAML 형식」 펜스 · 「feature_digest YAML 형식」 펜스 · 「domain 학습 게이트 출력」 펜스 · 「feature 학습 게이트 출력」 펜스 · 「dry-run plan 예시」 펜스 · 「인터랙티브 fallback 메뉴」 펜스 · 「자동 모드 키워드 표 + confirm 출력」 · 「호환성 첫 머지 체크리스트 표」 · 「resolution 4지 출력」 펜스 · 「재논의(대기열) 노출·요약 출력」 펜스
**보존 필수 (이동 금지):** 진입 흐름 0~7 전체, 5단계 알고리즘 규정, 학습 게이트 노출 정책, Architect 라운드 규정([Round N/M] 템플릿 포함 — 판정 형식이라 본문 유지), 실행 모드 알고리즘, 2-pass 프로토콜, REQ-013/017 규정, (5) 검증 체크리스트·통과/실패 절차, Concurrency, Abort/Skip 정책, decision-flow SSOT 선언

- [ ] **Step 2: 원위치 치환 (Task 2 Step 2와 동일 표준형)**

Read 실패 폴백 1줄 (블록별): digest 형식→"policies/decisions/requirement_ids/section_index를 ID·statement·source_section 필드로 구조화" · dry-run→"자동 수정 회계 + 사용자 결정 목록 + 삭제 고지 + 커밋 미리보기 + Yes/No" · 호환성→"섹션10 시작행 자동, ID는 사용자 결정, 의존성 맵은 필요시만" · resolution→"Tech Lead 재투입/직접 수정/skip(보존)/abort 4지"

- [ ] **Step 3: 기계 체크**

baseline-inventory.md의 게이트 인벤토리(merge-to-domain 분)와 대조 — 게이트명·선택지 수·0번 유무 동일 재현. `wc -c` 본문 40%+ 감소, 합계 ±5% 이내

- [ ] **Step 4: 커밋**

```bash
git add skills/merge-to-domain/
git commit -m "refactor(g4): split merge-to-domain templates to references/"
```

---

### Task 4: orchestrator Evaluator/AC 인라인 간소화

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md` (REVIEW 섹션)

- [ ] **Step 1: Evaluator 프롬프트 펜스 간소화**

15줄 펜스를 다음으로 치환 (D1 필수 요소 전부 포함, 삭제만 수행):
```
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
--- 에이전트 역할 정의 --- [Ouroboros agents/evaluator.md 전문]
--- 수락 기준 --- [설계 문서의 success_criteria 목록]
--- 구현 결과물 --- [변경 파일 목록 및 주요 변경 내용]
각 수락 기준에 PASS/FAIL/PARTIAL을 판정하고, FAIL/PARTIAL에는 근거와 수정 제안을 포함하라.
```

- [ ] **Step 2: AC 박스 간소화 (D2 최소 필드)**

10줄 박스를 다음으로 치환:
```
── 🎯 AC 검증 결과 [Evaluator] ─── ✅ PASS: N · ⚠️ PARTIAL: N · ❌ FAIL: N
[상세 목록]
──────────────────────────────────
```

- [ ] **Step 3: 기계 체크 (D1~D5)**

Run: `grep -c "Standalone Mode에서는 Evaluator를 생략\|수락 기준이 없으면 Evaluator를 스킵" skills/workflow-orchestrator/SKILL.md` → 스킵 가드 2개 잔존. post-review-validate 순서 문구·FAIL 재검증·전부 PASS 진행·동적 탐색 폴백 grep 잔존 확인

- [ ] **Step 4: 커밋**

```bash
git add skills/workflow-orchestrator/SKILL.md
git commit -m "refactor(g4): condense Evaluator prompt and AC box inline"
```

---

### Task 5: 상태 정규화 1줄화 + 박스 스타일 통일

**Files:**
- Modify: `skills/design-doc-index/SKILL.md`, `skills/design-summary/SKILL.md`

- [ ] **Step 1: '상태 정규화 전처리' 섹션을 1줄로 치환 (양 파일 문자 동일)**

치환문 (E1+E3 충족):
```
**상태 정규화 (silent-fix):** 필터링 전에 frontmatter `status: completed`를 `complete`로 자동 수정한다 (허용 변형은 completed뿐, domain.md는 대상 제외). 정규화가 항상 필터링보다 먼저다.
```

- [ ] **Step 2: design-summary 박스 스타일 통일 (F1 화이트리스트)**

화이트리스트: design-summary 출력 템플릿의 `━━` 구분선 → `──` 전환 (해당 파일 내 전부). 그 외 파일의 박스는 무변경

- [ ] **Step 3: 기계 체크 + 커밋**

`grep -c "상태 정규화 (silent-fix)" skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md` → 각 1, diff로 문자 동일 확인. `grep -c "━" skills/design-summary/SKILL.md` → 0
```bash
git add skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md
git commit -m "refactor(g4): one-line status normalization, unify box style"
```

---

### Task 6: 전수 기계 체크 + 판단 리뷰 + 음성 불변식 감사

**Files:**
- Modify: `docs/design/dev-workflow/skill-slimming/baseline-inventory.md` (결과 기록)

**Interfaces:**
- Consumes: Task 1 인벤토리 전체, Task 2~5의 diff

- [ ] **Step 1: 3튜플 전수 재검**

baseline-inventory.md의 모든 항목(A·B해시·C해시·D·E·F) 재실행 → PASS/FAIL 기록. decision-flow.md와 development-principles/SKILL.md의 `git hash-object`가 베이스라인과 동일함을 확인 (무변경 검증)

- [ ] **Step 2: 음성 불변식 감사 (REQ-009)**

`git diff [Task1 커밋]..HEAD -- skills/` 전체를 검토: 모든 hunk가 {삭제, verbatim 이동(references/에 동일 문자열 존재), 참조 삽입(표준형 Read 지시), Task 4·5의 명시 치환} 중 하나인지 분류. 이외 발견 시 FAIL — 해당 태스크 재작업

- [ ] **Step 3: 판단 리뷰 (신선한 눈 1회)**

새 서브에이전트에게: Task 2~5 결과 파일 + phase2 판단 리뷰 목록(간소화된 Evaluator 프롬프트의 실행 완결성, 승인 목록 일치) 검토 위임. 컨텍스트 없는 시선으로 "이 스킬 문서만 보고 절차를 수행할 수 있는가" 판정

- [ ] **Step 4: 결과 기록 + 커밋**

```bash
git add docs/design/dev-workflow/skill-slimming/baseline-inventory.md
git commit -m "test(g4): full invariant check + fresh-eyes review results"
```

---

### Task 7: 스테일 status 정정 (독립 커밋)

**Files:**
- Modify: `docs/design/dev-workflow/decision-flow-hardening/decision-flow-hardening.md:4`

- [ ] **Step 1: status 정정**

`status: ready-for-plan` → `status: complete`, `last-updated: 2026-07-08`, 변경 이력에 1행 추가: `| 2026-07-08 | v1.10.0 출하 완료 상태 반영 (스테일 status 정정 — G4 부수) | frontmatter | 완료 |`

- [ ] **Step 2: 커밋 (도메인 머지는 실행하지 않음을 메시지에 명시)**

```bash
git add docs/design/dev-workflow/decision-flow-hardening/
git commit -m "docs: correct stale status of decision-flow-hardening to complete

status만 정정. 도메인 머지는 별도 세션에서 /dev-workflow:merge-to-domain 명시 호출로."
```

---

### Task 8: 릴리스 마감

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `docs/design/dev-workflow/skill-slimming/skill-slimming.md` (섹션 9·10)
- Delete: `docs/design/dev-workflow/skill-slimming/baseline-inventory.md` (일회용 폐기 — Task 6 결과 요약은 설계 문서 섹션 9로 이식)

- [ ] **Step 1: 버전 1.13.0 동기 범프** (`sed -i 's/"version": "1.12.0"/"version": "1.13.0"/' .claude-plugin/*.json`)
- [ ] **Step 2: 설계 문서 섹션 9(구현 결과·절감 실측·일탈)·섹션 10 기록, 인벤토리 파일 삭제**
- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "chore(release): bump to 1.13.0 for skill-slimming (G4)"
```

---

## Self-Review 결과

1. 스펙 커버리지: REQ-001→T2, 002→T3, 003→T2S3, 004→T5, 005→T4, 006→T5S2, 007→T7, 008→T1+T6, 009→T6S2 — 공백 없음
2. 플레이스홀더: 치환문·폴백 1줄·체크 명령 전부 실문면 — 통과
3. 일관성: references/templates.md 명명·표준형 Read 지시 문면이 T2/T3에서 동일 — 통과
