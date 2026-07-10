---
feature: verification-realignment
category: dev-workflow
status: complete
created: 2026-07-09
last-updated: 2026-07-10
dependencies:
  - gate-effectiveness (v1.15.0 — 라운드 축소·차단성 판별문의 출처)
  - skill-slimming (v1.13.0 — references/ 분할 구조·base dir 도달성 규범)
affects:
  - workflow-orchestrator (Ouroboros Detection 재편, Evaluator 내장, references/ 신설)
  - brainstorming (역할 6종 내장, 경로 해소 블록 제거)
  - plan-stage (역할 2종 내장, Researcher 발동 조건 확장, 조기 종료 예외, references/ 신설)
  - development-principles (스윕 절차 규범 1절 신설)
  - merge-to-domain (블록명 개명 — PATCH)
  - CLAUDE.md (낡은 문장 정정 — PATCH)
  - plugin.json/marketplace.json (v1.15.1 PATCH + v1.16.0 MINOR)
---

# verification-realignment 설계 문서

> 한 줄 요약: G6 원안 "검증 강화" 12개 항목을 신선도 검사로 재심사해 — 낡은 것은 접고, 뿌리 항목(Ouroboros 역할 정의 내장)으로 외부 의존 문제를 한 번에 걷어내며, 스테일 재발은 절차 규범으로 막는다.

## 1. 배경과 동기

로드맵 G6 원안은 2026-07-07 Fable5 적합성 리뷰 출신 5건 + 이후 3개 릴리스(v1.13.0~v1.15.0)에서 쌓인 백로그 7건의 묶음이었다. 직전 G5가 같은 리뷰 출신 원안의 전제 낡음으로 재정의된 전례에 따라, 착수 전 12건 전부를 오늘 기준으로 신선도 검사했다(사용자 확정 성립 조건). 결과:

- 12건은 최소 5종의 이질 묶음 — "검증 강화" 라벨이 맞는 건 절반뿐
- 1건은 이미 해결(v1.14.0), 2건은 최근 결정(v1.15.0 라운드 축소)과 방향 충돌, 1건은 원안 정의 유실
- "검증 장치는 더할수록 좋다"는 가정은 무근거 — 최근 3릴리스의 실제 결함 적발자는 전체 시야 최종 리뷰·신선한 눈·기계 체크였고, 프로젝트 독트린("검증 연극 회피")도 반대 방향
- 사용자 실사용 증언: "읽기 실패 폴백이 실제로 지켜지지 않는 경우가 많다" — 폴백 실효성의 첫 관측 데이터 (리포에 관측 기록 0건이던 미검증 가정의 반증)

이에 G6는 **성격별 5갈래 재편(verification-realignment)**으로 재정의되었다: ① 정정 PATCH ② 역할 내장 MINOR ③ 스윕 절차 규범화 ④ 신규 검증 장치 2건 폐기+알맹이 이식 ⑤ 관측 전환.

## 2. 목표와 비목표

### 목표
- GOAL-001: 원안 12개 항목 전원을 4경로(배송/흡수/폐기/관측) 중 하나로 귀속 — 누락 0건
- GOAL-002: Ouroboros 역할 정의를 플러그인에 내장해 외부 의존 3문제(find 탐색·경로 미확보·폴백 미준수)를 구조적으로 제거
- GOAL-003: 스테일 문서 재발(3릴리스 연속)을 절차 규범 + 검증 항목화로 차단 — 경고문 단독 방식 금지
- GOAL-004: 계획 결함의 실증 경로(전원 낙관 일치 → 실측 없이 통과)를 신규 장치 없이 기존 장치의 조건 튜닝으로 봉쇄

### 비목표
- B1(decision-flow §8 문면) 재작업 — v1.14.0에서 이미 해결 (decision-flow.md:160 실측)
- A2(Standalone 강등 해제) 독립 구현 — 역할 내장으로 대부분 함께 소멸
- A3(Feasibility 판정 패널)·A4(Deep Round) 신규 장치 — 폐기. 근거: 실재하는 계획 결함(G4 수치 프록시·G5 오프바이원)은 토론 부족이 아니라 **실측 부재**가 원인 — 합의체 층 추가로는 못 막는 유형. ("적발 기록 0건" 단독 논거는 관측 편향으로 기각하고 근거를 교체함)
- Standalone 분기 서술의 전면 철거 — 죽은 텍스트 ~14곳은 후속 작업으로 분리 (릴리스 대형화 방지). 목록은 phase3_validation.md에 보존
- B6(약한 모델 관측)의 릴리스 배송 — 파일 변경 없는 관측 활동
- 주기적 원본(Ouroboros) 대조 절차 — 죽은 절차 위험. "메이저 업데이트 인지 시 수동 1회 대조" 기록만 남김
- 12건 일괄 대형 릴리스

## 3. 확정된 요구사항

### PATCH (v1.15.1 — 직접 커밋, SDD 생략, 설계 확정 직후 즉시)
- REQ-001 (블록명 개명): merge-to-domain 「재논의(대기열) 노출·요약 출력」→「머지 세션 종료 요약 출력」 — 포인터(SKILL.md:423-424)+헤딩(references/templates.md:129) 동기 개명 — HIGH
- REQ-002 (폴백 보강): brainstorming 국면 4 표준 설계 문서 포맷 폴백(SKILL.md:437)에 10섹션명 열거 — MEDIUM
- REQ-003 (CLAUDE.md 정정): "모든 로직은 SKILL.md에 정의된다"(CLAUDE.md:11)를 references/ 분할 반영으로 갱신 — MEDIUM
- REQ-004 (미니 스윕 선적용): 배송 전 구 명칭·구 문면 잔존 0 확인 — 범위 skills/ + README + commands + CLAUDE.md (스윕 절차의 첫 도그푸딩) — HIGH

### MINOR (v1.16.0 — 워크플로우 1사이클)
- REQ-005 (역할 내장): Ouroboros 역할 9종을 각 스킬 references/agent-roles.md로 verbatim 내장(0.39.0 기준, 출처·버전 주석 1줄) — brainstorming 6종/plan-stage 2종/orchestrator 1종(겹침 0 실측). find 탐색 제거, 역할 로드는 내장 경로 고정 — HIGH
- REQ-006 (모드 재편): Ouroboros Detection을 "MCP 유무"만으로 단순화 — Path C(Standalone) 구조적 소멸. 모순 지점 18곳(phase3 실측 목록) 정리. validate_seed 등 MCP 분기는 존치+라벨 정리. Evaluator QA 상시화는 의도된 강화로 명시 — HIGH
- REQ-007 (Evaluator 보완): Evaluator 프롬프트에 완충 문구("형식이 예상과 다르더라도...") 추가 — 유일 누락 실측 — MEDIUM
- REQ-008 (폴백 정합화 흡수): 내장 후 잔존 Read 폴백 텍스트는 제거 또는 내장 경로와 정합 — REQ-005의 완료 기준(AC)으로 편입 — HIGH
- REQ-009 (스윕 절차 규범화): development-principles에 1절 신설 — "규범 의미를 바꾸는 변경은 plan에 grep 스윕 태스크를 포함한다(범위: skills/ 밖 README·commands·CLAUDE.md까지)" + 최종 브랜치 리뷰 디스패치 컨텍스트에 스테일 검사 검증 항목화. 인벤토리 산출물은 매번 일회용(영속화 금지 독트린과 양립) — HIGH
- REQ-010 (Researcher 조건 확장): plan-stage Step 3 발동 조건에 1건 추가 — 미실측 수치/구조적 상한 가정을 포함한 FEASIBLE 판정도 조사 대상 (G4 교훈의 문면 승격) — HIGH
- REQ-011 (조기 종료 예외): plan-stage Step 4 전원 일치 조기 종료에 예외 1문장 — 일치라도 근거가 미실측 수치/상한 가정이면 합의 블록에 실측·추정 근거 1줄 요구 — MEDIUM
- REQ-012 (1회 갭 감사): MINOR 검증 단계에 커버리지 갭 감사 태스크 1회 (동형 공백 잔존 확인 — gap sweep ⓑ 해석 흡수) — MEDIUM

### 관측 (릴리스 아님)
- REQ-013 (관측 기록): 약한 모델 Read 추종 등 관측 데이터는 발생 시 tasks/lessons.md 기록. 관측 대상 목록은 본 문서 §9.3 — LOW

## 4. 설계 개요

**5갈래 재편 구조:**

```
원안 12건 ─┬─ 배송 PATCH v1.15.1: REQ-001~004 (직접 커밋 + 미니 스윕)
           ├─ 배송 MINOR v1.16.0: REQ-005~012 (역할 내장 중심)
           ├─ 흡수: B4→REQ-008(AC) · A2→내장 부수 소멸 · A5→REQ-009/012
           ├─ 폐기: A3·A4 (근거 교체 — 알맹이는 REQ-010·011로 이식)
           └─ 관측: B6→REQ-013 · 기해결: B1 (재작업 없음)
```

**역할 내장 아키텍처:** 각 스킬의 references/agent-roles.md에 사용 역할만 배치 (base dir 상대 경로 — 검증된 도달성 메커니즘). 디스패치 지점의 "[Ouroboros agents/*.md 전문]" 자리표시는 "본 스킬 references/agent-roles.md 「역할명」 블록을 Read" 지시로 교체. Ouroboros Detection은 MCP 유무만 판정 (Path A=MCP 연동 / Path B=내장 역할만) — Standalone 소멸로 모든 사용자가 서브에이전트 사고 제약을 받는다.

**배송 순서:** 설계 확정 → PATCH 즉시(미니 스윕→커밋+v1.15.1 범프, 사용자 Update 안내는 하지 않음) → MINOR 정상 사이클(PLAN→DEVELOP→REVIEW→Completion, v1.16.0) → 사용자 Update+재시작 안내 1회 통합.

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| 역할 내장 (REQ-005) | base dir 상대 references/ 메커니즘 (G4 규범) | 모드 재편(REQ-006)·폴백 정합화(REQ-008)·A2 소멸 |
| 모드 재편 (REQ-006) | REQ-005 (역할 상시 도달) | Ouroboros Detection, Evaluator QA 상시화, Standalone 후속 철거 |
| 스윕 규범 (REQ-009) | 미니 스윕 도그푸딩(REQ-004) 결과 | development-principles, SDD 최종 리뷰 디스패치 |
| 조건 튜닝 (REQ-010·011) | plan-stage 기존 3층 구조 | Feasibility Assessment, Step 4 합의 |
| PATCH 3건 | — | merge-to-domain, brainstorming 폴백, CLAUDE.md |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| G6 정의 | 5갈래 재편으로 재정의 | 신선도 검사 실측 — 이질 5종·기해결 1·방향 충돌 2 | 원안(검증 강화) 일괄 | 낡은 전제 + 독트린 역행 |
| 배송 단위 | PATCH 선커밋 + MINOR, 배포 안내 1회 통합 | 정정·기능 분리(C-002)·수동 액션 절반·비긴급 실측 | 즉시 배포 2회 / 전부 한 MINOR | 수동 액션 낭비 / 이질 묶음 재생산 |
| B4 처리 | REQ-005의 AC로 흡수 | 내장이 폴백 발동 조건 자체를 소멸 — 선정합화는 이중 작업 | PATCH에 포함 | 곧 대체될 문장을 두 번 수정 |
| A3·A4 | 폐기 + 알맹이 조건 튜닝 이식 | 계획 결함 원인은 실측 부재(G4·G5 실증) — 기존 3층은 낙관 방향 감사 0층 | 신규 패널/라운드 | 같은 방향 편향 층 추가·v1.15.0 역행 |
| 역할 배치 | 스킬별 references/agent-roles.md | 겹침 0 실측 + base dir 도달성 + Superpowers 동봉 관행 일치 | 공용 단일 파일 | 크로스 스킬 경로 해소 실패 가능성 (실증된 문제) |
| 역할 소스 | 내장본 단일 소스 | 문구 아닌 뼈대 의존 실측·출력 형식 자체 소유 — 탐색·경로·폴백 3문제 동시 제거 | 외부 우선+내장 폴백 / 주기 대조 | 이중 소스 관리·폴백 미준수 잔존 / 죽은 절차 |
| 모드 감지 | MCP 유무만 (Path C 소멸) | 역할 파일 상시 도달로 B/C 구분 근거 소멸 | 3-Path 유지 | 판정 문장 자체가 모순화 |
| Standalone 철거 범위 | 모순 18곳만, 전면 철거 후속 분리 | 릴리스 대형화 방지 — 죽은 분기 ~14곳은 무해 | 전면 철거 동시 | 스윕 대상 폭증 |
| 스윕 상시화 형태 | 절차 규범(plan 태스크 포함 의무) + 리뷰 검증 항목화 | 검증 항목화만 재발 차단 실증·인벤토리는 매번 일회용 | 훅 자동화 / 영구 체크리스트 | 릴리스 이벤트 부재 / 영속화 금지 독트린 위반 |
| gap sweep(A5) | 두 해석 분할 흡수 (B7 규범 + 1회 감사) | 원문 유실 — 두 갈래 모두 기존 결정의 연장 | 폐기 / 정의 복구 시도 | 의도 손실 가능성 / 복구 불가 |
| 관측 기록 | 발생 시 lessons.md | 기존 자기개선 루프 재사용 | 전용 파일/주기 점검 | 관리 대상 증가·안 돌리는 절차 |

## 7. 제약조건과 가정

- 검증 장치는 필요성 입증이 전제 — "더할수록 좋다" 판단 금지 (C-001)
- 재발 방지는 검증 항목화 방식만 — 경고문 단독은 실측 실패 (C-003)
- 확정 문면(스윕 규범 1절·Researcher 조건·조기 종료 예외·미니 스윕 체크리스트·개명 지점)은 plan.md에 완성형 수록 — 구현은 verbatim 치환만
- 가정: 신선도 검사(2026-07-09)가 착수 시점까지 유효 (지연 시 재검)
- 가정: 내장 시 드리프트로 인한 품질 저하 없음 (구조 조사 기반 — 장기 실측 없음)
- 가정: 리뷰 검증 항목화가 스테일 재발을 차단 (표본 작음 — §9.3 관측 대상)

## 8. 기술 가이드라인

1. 역할 내장은 verbatim 복사(0.39.0) + 출처·버전 주석 1줄 — 문장 수정 금지, 수정 필요 시 별도 커밋
2. 모순 18곳 정리는 phase3_validation.md의 실측 목록이 태스크 체크리스트
3. Standalone 후속 철거 대상 ~14곳 목록은 phase3에 보존 — 이번 릴리스에서 건드리지 않음
4. "Path A만" MCP 분기(validate_seed)는 존치 + 라벨 정리
5. Evaluator QA 상시화는 의도된 강화 — README 등 사용자 문서에 반영
6. PATCH는 미니 스윕 통과 후에만 커밋 — 스윕 결과(잔존 0 확인)를 커밋 메시지 본문에 1줄 기록
7. 릴리스: PATCH v1.15.1(정정) / MINOR v1.16.0(기능, docs/design 구조 무변경 — 하위 호환 실측 완료)

## 9. 구현 결과 및 일탈 사항

### 9.1 구현 결과

**PATCH 배송 기록 (v1.15.1, 커밋 df1a2fe — 설계 확정 직후 즉시):**
- REQ-001 블록명 개명(포인터+헤딩 동기) · REQ-002 폴백 10섹션명 열거 · REQ-003 CLAUDE.md 스킬 문서 구조 현행화
- REQ-004 미니 스윕 선적용 통과 — 구 블록명·구 폴백 문면·구 CLAUDE.md 문장 잔존 0 (범위: skills/ + README + commands + CLAUDE.md), 결과를 커밋 메시지에 기록 (스윕 절차 첫 도그푸딩 — SC-006 충족)

**MINOR 구현 (v1.16.0, 워크트리 9커밋 — SDD 6태스크 + fix 2 + 범프):**
- REQ-005: 역할 9종 verbatim 내장 — brainstorming 6종·plan-stage 2종·orchestrator 1종의 references/agent-roles.md (겹침 0, 출처·버전 주석, 9/9 블록 원본 byte-identical 검증)
- REQ-006: Ouroboros Detection을 MCP 유무만의 2-Path로 재편 (Path A=MCP 연동 / Path B=내장 역할, Path C 소멸 — 브리징 문장으로 죽은 분기 무해화), 모순 실측 18곳 전건 정리, Evaluator QA 상시화 "의도된 강화" 명시
- REQ-007: Evaluator 디스패치 프롬프트에 완충 문구 (verbatim 블록 밖 래핑 — 문장 수정 금지 규범과 양립하는 유일 위치)
- REQ-008: 역할 로드 폴백 3곳을 내장 Read+최소 요건 형식으로 정합화 (B4 해소 — 외부 탐색 폴백 잔존 0), A2는 Path C 소멸로 부수 해소
- REQ-009: development-principles 「규범 변경 스윕」 신설 + orchestrator DEVELOP 공통 규칙 5 검증 항목화 — 상호 포인터 양방향 성립
- REQ-010·011: Researcher 발동 조건 확장(미실측 수치/상한 가정 낙관 판정도 조사)·전원 일치 조기 종료 예외 — plan-stage 확정 문면 반영
- REQ-012: 1회 커버리지 갭 감사 — 디스패치 10지점 전수, 동형 공백 0
- 검증: 태스크 리뷰 6건 전건 Approved(main 무오염 매회 확인) · 최종 브랜치 리뷰(신선한 눈, 최상위 모델) Approved with fixes → 전건 해소 · 시나리오 재현 2건(Ontologist 투입·Evaluator 실행) 경로 무단절 · Evaluator AC 게이트 6/6 PASS — **이 검증 자체가 내장 Evaluator 역할의 첫 실전 구동**

### 9.2 일탈 사항

1. 최종 리뷰 M-1 (수정 완료, 4f1f7ef): decision-flow.md §7 에이전트 태그 절의 사장 어휘 3줄 — phase3 모순 실측 인벤토리가 decision-flow.md를 스캔 범위에 누락한 것이 원인. 헤딩·본문·태그 규칙에서 Enhanced/Standalone 어휘 제거, 구 헤딩 앵커 참조 0건 확인
2. Task 5 범위 밖 정당 수정: README 예시 라벨 "Enhanced Mode"→"MCP 모드" (캡션-예시 내적 정합 — 리뷰 승인)
3. Task 6 스윕 fix (7b5e03f): README 헤딩 "Ouroboros Enhanced Mode"→"Ouroboros 연동" (Task 5 리뷰어의 감사 입력 처리)
4. Task 3 Step 5 no-op: 위임 표에 "Enhanced Mode" 어휘가 원래 없어 정렬 불요 (블록 치환들이 선해소)
5. 기록-only: Task 6 리포트의 스윕 집계 서술 오차(16 vs 실측 18 — 분류·결론 무영향, 비배송물이라 무수정) / plan-stage가 📎 마커를 쓰면서 로컬 범례 정의 없음(기존 패턴, 후속 관찰)

**후속 철거 백로그 (별도 작업 — 이번 릴리스 의도적 제외):** Standalone 죽은 분기 서술 ~14곳 (plan-stage 2곳 최우선 — 로컬 브리징 부재, PLAN 직행 세션의 오독 잔여 위험) · commands/setup.md의 Ouroboros 가치 서술 현행화(M-2) · "Ouroboros Evaluator/Architect" 출처 라벨 용어 통일(M-4). 상세 지점 목록은 git 이력의 phase3_validation.md (b)절.

### 9.3 도그푸딩 관측 루프 (차기 개선 입력)

- 약한 모델의 내장 역할 Read 추종 여부 (기존 미검증 가정 — 사용자 증언이 첫 데이터)
- 미니 스윕 체크리스트의 실효 (PATCH 도그푸딩 결과)
- Researcher 확장 조건·조기 종료 예외의 발동 사례
- Evaluator QA 상시화가 비-Ouroboros 사용자에게 부담이 되지 않는지
- Ouroboros 메이저 업데이트 인지 시 수동 1회 원본 대조

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-07-09 | 초안 작성 (국면 0~4 완료) — 원안 재심사·5갈래 재편·역할 내장 중심 확정 | 신규 기능 | ready-for-plan |
| 2026-07-10 | PATCH v1.15.1 선배송 (정정 3건 + 미니 스윕 첫 도그푸딩) | merge-to-domain·brainstorming 폴백·CLAUDE.md | 완료 |
| 2026-07-10 | 구현 완료 — 역할 9종 내장·2-Path 재편·스윕 규범·조건 튜닝, v1.16.0 | 스킬 4종 + references/agent-roles.md 3파일 신설 + README | 완료 |
| 2026-07-10 | 개발 완료 — 문서 통합 (중간 산출물 삭제) | 전체 | 완료 |
