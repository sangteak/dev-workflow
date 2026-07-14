---
feature: completion-trigger
category: dev-workflow
status: complete
created: 2026-07-14
last-updated: 2026-07-14
dependencies: []
affects:
  - workflow-orchestrator (Completion Protocol 절 분리·🔔 규범·트리거 어휘 SSOT)
  - bootstrap.md (COMPLETION 매핑 명령형 강화)
  - hooks/ (신규 completion-nudge 훅 + 잔존 감지 공용화)
  - commands/ (신규 finish)
  - setup (statusline 통합 제안 절차)
success_criteria:
  - "미완료 상태(파일 술어 기준)가 회색 지대의 일단락 출력마다 가시화된다"
  - "마무리 어휘 발화 시 훅이 발동해 판정 위임형 지시가 주입된다 (회귀 테스트 6+1종 통과)"
  - "/dev-workflow:finish가 Completion Protocol 전문을 직접 Read하여 직행한다"
  - "모든 개입은 주입형 — 차단 지점 0, 오탐 시 사용자 우회 경로 존재"
  - "성공 마무리마다 진입 경로 1줄이 프로토콜 Step으로 기록된다"
---

# completion-trigger 설계 문서

> 한 줄 요약: 개발 종료 후 결함 처리가 이어지는 동안 Completion Protocol이 조용히 스킵되는 문제를,
> "완료는 사용자가 선언하는 사건"이라는 원칙 아래 가시화·라우팅·선언 수단의 4축으로 해결한다.

## 1. 배경과 동기
- 마무리 질문("마무리할까요?")은 DEVELOP 종료 시 1회 발화되는 이벤트 — 이슈 처리 등으로 흐름을 벗어나면 재무장 계기가 없어 조용히 스킵됨
- 사용자가 "마무리하자"라고 발화해도 LLM이 Completion Protocol로 라우팅하지 않고 자체 정리하는 라우팅 실패가 실관측됨 (놓치는 주체는 사용자가 아니라 LLM)
- 스킵 비용: resume 시 미완료 오표시 · 도메인 머지 제외 · 사후 재확인 수고와 토큰 (컨텍스트 소실로 비싸지는 복구)

## 2. 목표와 비목표
### 목표
- GOAL-001: 미완료 상태의 지속 가시화 — 흐름 이탈에도 마무리 계기가 소실되지 않는다
- GOAL-002: 마무리 선언의 확실한 라우팅 — LLM 임의 마무리가 재현되지 않는다
- GOAL-003: 명시적 선언 수단 제공 — 자연어 해석을 우회하는 직행 진입점

### 비목표
- Completion Protocol 내부 단계 재설계 (문제는 내용이 아니라 진입 실패)
- 완료 시점의 시스템 판단·자동 실행 일체 (핵심 원칙 위반 — PR 머지 감지 포함)
- 무조건 차단형 게이트 (독트린 충돌)
- Superpowers plan.md 형식 규정화

## 3. 확정된 요구사항
- REQ-001 (훅): UserPromptSubmit 훅 `completion-nudge` — "미완료 잔존(plan.md/HANDOFF, _archive 제외) ∧ 마무리 어휘" 시에만 판정 위임형 지시를 주입 — 우선순위: HIGH
- REQ-002 (훅 견고성): jq+폴백 파싱 · 잔존 감지 로직을 session-start와 공용 스크립트로 추출 — 우선순위: HIGH
- REQ-003 (경고등 규범): 파일 술어(status≠complete ∧ plan.md 잔여 태스크 없음, LLM 판단) 참일 때 오케스트레이터 통제 일단락 출력 말미에 `🔔 마무리 대기: [feature] — /dev-workflow:finish 또는 마무리 발화` — 우선순위: HIGH
- REQ-004 (command): `/dev-workflow:finish` — Completion Protocol 절을 `references/completion-protocol.md`로 추출, command가 직접 Read. 호출=완료 선언, 트리거 감지 생략 — 우선순위: HIGH
- REQ-005 (bootstrap): COMPLETION 매핑을 명령형+금지문으로 교체 (수사 격화 금지, 총량 최소) — 우선순위: MEDIUM
- REQ-006 (어휘 SSOT): 원본=orchestrator 트리거 목록, 훅은 미러+크로스레퍼런스 주석, diff 검사를 회귀 테스트 0번으로 — 우선순위: HIGH
- REQ-007 (statusline): 3위치 감지(user/project/local settings), 기존 사용자에게만 setup 시 opt-in 제안, 병합 기본안=제안문 출력+직접 붙여넣기 — 우선순위: MEDIUM
- REQ-008 (검증): 회귀 테스트(6+1종, 픽스처 포함)를 저장소에 보존, REVIEW 검증 항목 편입 — 우선순위: HIGH
- REQ-009 (관측): 성공 마무리의 진입 경로 1줄 기록을 Completion Protocol Step으로 편입, 실패 기록은 "다음 세션 스킵 발견 시"로 한정 — 우선순위: MEDIUM
- REQ-010 (스모크): 훅 등록 실동작 확인을 구현 첫 태스크로, 실패 시 축 3·4만으로 운영하는 출구 — 우선순위: HIGH

## 4. 설계 개요
**핵심 원칙: "완료는 시스템이 판단하는 상태가 아니라 사용자가 선언하는 사건이다. 시스템의 역할은 ①열려 있음의 가시화 ②선언의 확실한 라우팅 ③선언 수단 제공 — 판단은 어디에도 없다."**

4축 방어 (각 축이 다른 실패 모드를 담당):
- 1축 훅(REQ-001·002): 선언했는데 새는 경우 — 발화 순간 컨텍스트 최후방에 주입
- 2축 경고등(REQ-003·007): 선언을 잊는 경우 — 열려 있음의 지속 가시화 (LLM 규범 줄 + bash statusline 2등급)
- 3축 command(REQ-004): 확실히 가고 싶은 경우 — 파일 구조로 직행 보장
- 4축 bootstrap(REQ-005): 어휘 밖 발화 — 상시 규칙의 안전망

관통 설계 규율: LLM 기억·규범 준수를 저장소나 실행 보장으로 쓰지 않는다 — 파일 술어·파일 구조로 옮길 수 있는 것은 전부 옮긴다.

## 5. 의존성 맵
| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| completion-nudge 훅 | 공용 잔존 감지 스크립트, 어휘 SSOT | (컨텍스트 주입만) |
| 공용 잔존 감지 | docs/design 경로 규칙 | session-start 훅, completion-nudge, statusline |
| 🔔 규범 줄 | 파일 술어(status·plan.md), orchestrator 출력 지점 | workflow-orchestrator SKILL.md |
| finish command | references/completion-protocol.md | workflow-orchestrator (절 분리 수술) |
| statusline 스크립트 | 공용 잔존 감지 | setup (제안 절차) |

## 6. 기술 결정 및 대안 검토
| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 라우팅 보강 | 조건부 정밀 주입 | 발화 순간 최후방 주입, 실패 원인 3종 우회 | 매 턴 상시 주입 | 훅 지연·banner blindness |
| 경고등 채널 | 규범 줄 + 기존 statusline 한정 | 회색 지대 정밀 조준 + 결정론 채널 병행 | 신규 statusline 설치 제안 | 사용자 명시 제외 ("강요 없음") |
| 회색 지대 경계 | 파일 술어 (LLM 판단) | 컴팩션·세션 교체에도 재파생 가능 | SDD 완료 보고 사건 기반 | 대화 기억을 저장소로 씀 — 원문제와 동일 결함 |
| command 구현 | references 분리형 | 직행을 파일 구조로 보장, v1.13.0 관례 | ARGUMENTS 하드코딩 | orchestrator에 분기 구조 없음, 400줄 재로딩 부작용 |
| CI/PR 앵커 | 반영하지 않음 | 완료 판단은 사용자 선언 (핵심 원칙) | 2단 Completion·소비 시점 검증·pr 참조 기록 | 스킵 지점 복제·좀비 상태·원칙 위반 |
| Stop 훅 경고등 | 확장 카드로 보류 | 관측 기반 점진 전략 | 즉시 도입 (생태계 분석 제안) | 성긴 술어의 소음 재등장·플랫폼 근거 부족 — 규범 누락 실측 시 재검토 |

## 7. 제약조건과 가정
- deny형 훅 금지 — 모든 개입은 주입형, 오탐 시 사용자 우회 경로 필수
- plan.md 형식은 외부 산출물 — bash 기계 파싱 의존 금지 (LLM 파일 읽기 판단만 허용)
- 마무리 어휘 사전은 유지보수 부채 — diff 테스트·판정 위임 문구·중복 방어로 관리
- 가정: 플러그인 hooks.json에 UserPromptSubmit 등록 가능 (REQ-010 스모크로 최우선 검증)
- 가정: 주입 후 LLM 라우팅 성공 — 오프라인 검증 불가, 도입 후 관측(REQ-009)으로 판정

## 8. 기술 가이드라인
- 주입문은 판정 위임형 — "세션 전체의 마무리 의도면 라우팅, 특정 코드 정리 요청이면 해당 없음" + 무시 탈출구
- 🔔 문구의 예시 발화는 훅 테스트 케이스에 있는 것만 사용
- Completion Protocol 절 분리 시 크로스레퍼런스 전수 스윕 (규범 스윕 교훈)
- finish command 본문에 Superpowers finishing-a-development-branch와 별개임을 1줄 명시
- bootstrap 강화는 명령형 교체만 — "Iron Law"류 수사 격화 금지

## 9. 구현 결과 및 일탈 사항

**구현 완료 (2026-07-14, 태스크 7개 + 최종 리뷰 수정 1건 + main 머지):**
- 신규: `hooks/completion-nudge`(UserPromptSubmit), `hooks/lib/detect-remnants`(공용 잔존 감지), `hooks/statusline/dev-workflow-status`(자체 완결형 정본), `commands/finish.md`, `skills/workflow-orchestrator/references/completion-protocol.md`(시퀀스 SSOT), `tests/hooks/` 3스위트+러너(16케이스)
- 수정: orchestrator SKILL.md(절 분리·🔔 규범·completion-vocab), bootstrap.md(명령형 강화, 순증 1줄), document-consolidation(예외 절 3경로), setup.md(statusline opt-in), README·CLAUDE.md
- 검증: 태스크 리뷰 7회 전 통과, 최종 브랜치 리뷰(Critical 0 · Important 2 — 전부 해소), Evaluator AC 5/5 PASS, 테스트 16/16

**일탈 사항:**
- `tests/hooks/fixtures/` 정적 디렉토리 미생성 — 테스트가 mktemp 런타임 픽스처를 사용해 불필요해짐 (plan 문서적 편차)
- 최종 리뷰 수정 2건 반영: session-start의 detect-remnants 호출에 실패 가드(`|| true`) 추가 (set -euo pipefail 하 부트스트랩 주입 소실 방지, 부재 생존 테스트 실증) · README 🔔 지속성 서술 정정("사라짐=완료" 단정 제거)
- bootstrap.md 최종 크기 3089바이트 — 3000 지침 초과분은 main(1.19.0 persona-improvement)의 병행 추가분이며 본 기능의 순증은 계획대로 1줄
- main 21커밋 전진 머지 처리 — 충돌 README 1건 해소(우리 도입부 + main의 Step 0 절차 행 편입), 머지 후 전체 테스트 재통과

**잔여 검증·후속 과제:**
- REQ-010 라이브 스모크: 플러그인 재시작 후 "마무리" 포함 발화로 `<completion-signal>` 주입 실확인 필요 (문서상 등록 가능성은 공식 문서로 확정, 실동작 최종 확인만 잔여)
- 관측 루프: 주입 후 LLM 라우팅 성공률·🔔 규범 준수율·어휘("완료"·"정리해") 오탐 빈도 — Completion마다 §10 진입 경로 기록이 관측 데이터
- 확장 카드: Stop 훅 경고등 (🔔 규범 누락 실측 시 재검토) · statusline sed 폴백의 workspace.current_dir 미시도 (공식 스키마상 cwd 병행 제공되어 이론적)

## 10. 변경 이력
| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-07-14 | 브레인스토밍 완료, 설계 문서 초안 확정 | - | ready-for-plan |
| 2026-07-14 | 개발 완료 — 문서 통합 (진입: 자연어 감지) | 전체 | 완료 |
