---
phase: 1
feature: gate-effectiveness
category: dev-workflow
status: complete
created: 2026-07-09
---

# Phase 1: Exploration

## 1. 발단 — G5 원안과 재정의

- 원안 (로드맵): "게이트 배칭 — 불필요한 확인 절차 축소" (document-consolidation 확인 5회→2게이트, Completion 커밋+푸시 단계 정비)
- 재정의 경위: A-0 본질 질문 + 조사로 원안의 전제가 낡았음이 확인됨 — 문서 취합의 확인은 이미 2곳뿐(원안의 "5회"는 낡은 수치), 사용자는 번호 응답 UI로 게이트 불편 없음("단, 적응의 결과일 수 있음"), "묶어 보여주기(배칭)"는 명시적 불원
- **재정의된 G5 = 게이트 실효성 정비**: 확인 절차 전수를 "이 확인이 제 역할을 하는가" 기준으로 원장화·심사하여, 등급 오류를 교정하고 형식적 게이트를 처분한다

## 2. A-0 본질 질문 결과

| 관점 | 결론 | 출처 |
|---|---|---|
| Essence | G5의 본질은 횟수가 아니라 **권한 범위 재분류** ("이 확인이 애초에 필요한가") | 조사 (확신도 높음) |
| Root Cause | 리스크 등급 뭉뚱그림 — 단 예상과 반대로 **푸시(고위험)가 커밋(중위험)과 한 게이트로 결합**된 등급 오류 발견. merge-to-domain은 "커밋 자동·푸시 명시 요청 시만" 분리 선례 보유 | 조사 (확신도 높음) |
| Prerequisites | 사용자 의견: "묶을 필요 없다 — 단순 확인은 선택 한 번, 복잡한 걸 묶으면 옛 문제로 회귀" + 토론으로 방향 결정 요청 | 사용자 답변 |
| Hidden Assumptions | "게이트 피로" 전제는 사용자 경험과 다름 — 번호 응답 UI로 큰 불편 없음 | 사용자 답변 |

## 3. Step A 인터뷰 확정 답변 (4건)

1. **실패 모드 범위 = 둘 다** — ① 등급 오류 교정 + ② 형식적 게이트 처분 ("게이트가 제 역할을 하는가" 기준의 실효성 정비)
2. **재검사 범위 = 전수** — 게이트 33건 전부를 역할·무게·검증 가능성 기준으로 심사해 등급표 확정
3. **가치 심사 포함** — 정상 작동하는 확인도 "보호 가치 < 왕복 비용"이면 제거·자동화 후보 (단서: "불편 없음"은 적응의 결과일 수 있음)
4. **안전망 동반 (범위 안)** — 제거·자동화마다 대체 안전망(사후 고지 1줄·자동 결정 기록·소급 수정 경로 중 최소 1개) 동반 설계

## 4. Step C 확장 토론 — [라운드 1/3] [비판: 🛠️ Claude Code Expert — Contrarian]

### 합의 (시드에 반영)

- **원장화 선행 재정의**: "33건 원장"은 조사 대화 산출물일 뿐 파일로 부재 — 첫 산출물을 "원장 초안 작성"으로 재정의 (본 문서 6절이 그 1차 정착본)
- **폐기 예정 모드 배제**: document-consolidation Mode 3(DEPRECATED)의 확인 지점들은 심사 대상에서 명시 배제
- **REQ-012(conversation-ux, G5 경계 선언) 역참조**: G5 산출 문서에 계승 1줄 명시 — 두 문서의 상호 인지
- **가중치 점수제 폐기 → 3단 예/아니오 결정 트리 채택** (OQ-02 해소): ① 되돌릴 수 없는 결과가 생기나 → 무조건 유지 ② 답이 사실상 항상 같은가 → 자동화 후보 ③ 생략해도 사후에 알 방법이 있나 → 없으면 안전망 선행 (설계 못 하면 자동화 보류)
- **안전망 공통 포맷 1회 정의**: 스킬마다 개별 서술 금지 — 공통 섹션 1곳 정의 + 각 스킬 1줄 참조 (문서 비대화 역설 방지, merge-to-domain "자동 수정 회계" 패턴 승격)
- **스코프 가드 4건** (OQ-04·05·06 부분 해소): 버전 등급의 일반 원칙 신설 금지(이번 결과 보고만) · 문면은 기존 스켈레톤(conversation-ux REQ-001) 100% 내에서만 · 토론은 판단이 갈리는 소수에만(전수 토론 금지 — 그 자체가 새 형식적 의식) · 새 문면 요소 신설 금지

### 사용자 확정 결정 (2건)

- [x] 게이트 신설 체크리스트 포함 — 확정: 신설 전 3문항 필터를 산출물에 추가 (재발 방지 상시 필터)
- [x] 드라이런 검증 포함 — 확정: 완료 조건에 "개정 문면 기준 가상 시나리오 1회 통과" 추가

## 5. 명시적 제외 항목

- 배칭 UI (사용자 명시 불원 + conversation-ux "하나씩" 규범 충돌)
- 게이트 수 자체를 줄이는 목표 (늘 수도 있음 — 기준은 오직 "역할을 하는가")
- 원안의 "5회→2게이트" (낡은 전제로 폐기)
- 커밋+푸시 통합 유지 (그 통합이 곧 발견된 등급 오류 — 방향은 분리)
- SemVer 일반 원칙 신설 (CLAUDE.md 개정으로 스코프 확대 금지)
- document-consolidation Mode 3 (폐기 예정 — 심사 배제)
- conversation-ux 문면 스켈레톤 재정의

## 6. 게이트 전수 원장 (1차 정착본 — 조사 산출, 심사 전 초기 등급)

> 분류: (a) 정보성 확인 12 · (b) 비가역 승인 8 · (c) 방향 결정 13 — 계 33건. Mode 3(DEPRECATED) 제외.
> 본 표는 심사 전 초안이다. 등급·처분 확정은 국면 2~3에서 3단 결정 트리로 수행한다.

| 스킬 | 게이트명 | 시점 | 분류 | 가역성 | 발동 빈도 |
|---|---|---|---|---|---|
| document-consolidation | 사용자 리뷰 (Mode1 Step5) | 문서 통합 직후 | (a) | 가역 | 매 feature 1회 |
| document-consolidation | 중간 산출물 삭제 (Mode1 Step6) | 리뷰 후 | (b) | 준가역 | 매 feature 1회 |
| document-consolidation | 이슈 통합 리뷰 (Mode2) | 이슈 완료 시 | (a)+(b) | 비가역 | 조건부 |
| workflow-orchestrator | Completion Step2 (README) | 영향 시만 | (b) | 가역 | 조건부 |
| workflow-orchestrator | Completion Step3 (커밋+푸시) | 마지막 | (b) | 비가역(푸시) | 매 feature 1회 — **등급 오류 발견 지점** |
| workflow-orchestrator | 단계 감지 실패 질문 | 감지 실패 시 | (c) | — | 조건부 |
| brainstorming | 국면0 카테고리 확정 | 시작 시 | (c) | 가역 | 매 feature 1회 |
| brainstorming | Step B 시드 확인 | 인터뷰 후 | (a) | 가역 | 매 feature 1회 |
| brainstorming | 미답변 질문 조사 여부 | 통합 정제 후 | (c) | 가역 | 조건부 |
| brainstorming | 국면 전환 확인 (1→2→3→4) | 각 국면 종료 | (c) | 비가역(phase 불변) | 매 feature 최대 4회 |
| brainstorming | Simplifier 스코프 정리 | 국면1→2 | (c) | 가역 | 조건부 |
| brainstorming | PLAN 연속 진행 제안 | 국면4 완료 | (a) | 가역 | 매 feature 1회 |
| plan-stage | 문서 분석 확인 (Step1) | 신규 세션 진입 | (a) | 가역 | 조건부 |
| plan-stage | OPEN_QUESTIONS 해소 | Step1→2 | (c) | 가역 | 조건부 |
| plan-stage | 재협의 선택지 (Step3) | RENEGOTIATE/CAUTION | (c) | 가역 | 조건부 |
| plan-stage | 페르소나 합의 확인 (Step4) | 설계 방향 수립 | (a)/(c) | 가역 | CAUTION 항목당 |
| context-handling | 잔존 HANDOFF 삭제 | 세션 시작 | (b) | 비가역 | 조건부 |
| context-handling | HANDOFF 복구 확인 | resume 시 | (a) | 가역 | 조건부 |
| persona-resolution | 기본 페르소나 제시 | personas.md 부재 | (c) | 가역 | 프로젝트당 ~1회 |
| persona-resolution | 페르소나 저장 제안 | 완료 시 | (a) | 가역 | 조건부 |
| rules-injection | 자동수정 confirm | REVIEW 위반 시 | (c) | 조건부 가역 | 조건부 |
| rules-injection | 규칙 충돌 우선순위 | REVIEW 중 | (c) | 가역 | 조건부 |
| merge-to-domain | domain 학습 게이트 | digest 직후 | (a)·생략불가 | 가역 | 도메인당 1회 — **형식적 게이트 관측 ①** |
| merge-to-domain | feature 학습 게이트 | digest 직후 | (a)·생략불가 | 가역 | 카테고리당 1회 — **형식적 게이트 관측 ①'** |
| merge-to-domain | 대상 도메인 배정 확인 | domain 복수 시 | (c) | 가역 | 조건부 |
| merge-to-domain | 신규 domain 승격 확인 | domain 0개 | (c) | 가역 | 조건부 |
| merge-to-domain | 실행 모드 선택 | 후보 식별 직후 | (c) | — | 조건부 |
| merge-to-domain | 의미충돌 사용자 결정 | 머지 계획 수립 | (c)·자동화 불가 | 가역 | 조건부 |
| merge-to-domain | dry-run 승인 | 적용 직전 | (b)·생략불가 | 비가역 | 도메인 머지마다 |
| merge-to-domain | feature 디렉토리 삭제 (no-git) | 검증 통과 후 | (b) | 완전 비가역 | no-git 한정 |
| merge-to-domain | In-session Resolution | 실패 시 | (c) | 가역 | 조건부 |
| merge-to-domain | 자동모드 키워드 confirm | 키워드 감지 시 | (a) | 가역 | 조건부 |
| workflow-orchestrator | Completion Step1 (문서 취합) | 마무리 선언 직후 | 게이트 없음 (확인 명시 생략) | — | 참고 행 |

**형식적 게이트 관측 3건** (도그푸딩 기록, 처분은 국면 2에서): ① digest 학습 게이트(사용자 검증 불가 → 신뢰 통과) ② Architect 자동 에스컬레이션(사소한 우려에도 토론 라운드 강제 — plan-stage/merge-to-domain의 라운드 규정) ③ 국면 4의 2차 Seed-Architect 디스패치(형식적 반복)

## 7. 확정된 페르소나

- 🛠️ Claude Code Expert / 🎯 Workflow Designer / 🔍 Ecosystem Analyst (국면 3 활성화) — `.claude/personas.md` 자동 적용

## 8. 시드 (사용자 확인 완료본 — 라운드 1 합의·확정 2건 반영)

- goal: 게이트 전수를 원장화하고 "제 역할을 하는가" 기준(3단 결정 트리)으로 심사 — 등급 오류 교정 + 형식적 게이트 처분. 배칭 불채택
- constraints: 배칭 금지(하드) · conversation-ux 규범(하나씩·스켈레톤·REQ-012 경계) 100% 정합 · 비가역 승인은 모드 불문 생략 불가 · 전수 심사(Mode 3 제외) · 제거·자동화마다 안전망 동반(공통 포맷 1회 정의) · 문서 개정으로만 구현
- non_goals: 5절 참조
- success_criteria: 원장 확정본(등급·처분·근거) 문서화 · 커밋/푸시 게이트 등급 분리 규정 · 형식 게이트 3건 처분+근거 기록 · 제거 건별 안전망 반영 · 게이트 신설 체크리스트 존재 · 배칭 미도입 확인 · 드라이런 1회 통과 · 버전 동기 범프 · 변경 이력 기록
- assumptions: 원장 초안(6절)이 심사 재료 · 커밋/푸시 분리 방향은 조사 도출 · merge-to-domain 두 선례가 참조 템플릿 · 진행은 번호 응답+선택지별 결과 1줄
- open_questions (국면 2 이월): ① 형식적 게이트 3건 각각의 처분 (OQ-01) ② 영향 SKILL.md 파일 매핑 (OQ-03) ③ 원장 33건에 3단 트리를 적용한 등급·처분 확정 (심사 실행)

## 9. 명확도 체크리스트 (전환 시점)

- ✅ Goal Clarity: 원안 폐기·재정의 완료, 판단 기준(3단 트리)까지 확정
- ✅ Constraint Clarity: 하드 제약 8건 + 스코프 가드 4건 명문화
- ⚠️ Success Criteria: 골격 확정 — 형식 게이트 3건 처분(OQ-01)과 심사 실행 결과에 따라 세부 확정
- → 다음 국면 집중 영역: open_questions 3건
