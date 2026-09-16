---
feature: middle-dot-removal
category: dev-workflow
action: spec-change
current-phase: "DEVELOP — 실행 방식 선택 전"
last-updated: 2026-09-16
is-issue: false
parent-feature: ""
---

# Handoff: middle-dot-removal

## 현재 상태
- 진행 중인 국면: PLAN
- 중단 시점: plan.md 작성 완료(태스크 아홉, 치환 고정표 G1~G34). 실행 방식(서브에이전트 주도 또는 인라인) 선택 전

## 확정된 페르소나
- 브레인스토밍: 🛠️ Claude Code Expert, 🎯 Workflow Designer, 🔍 Ecosystem Analyst (국면 3 활성화)
- PLAN: 🏛️ Plugin Architect, 🔧 Tech Lead, 📋 PM

## 완료된 국면
- phase1_exploration.md
- phase2_discovery.md
- phase3_validation.md

## 현재 국면 진행 내용

### 확정된 항목
- 문제: 화면 문장이 가운뎃점(·)으로 나열을 잇는다 (예: 스크립트, 시나리오, 설계 문서 세 파일을 점으로 이은 문장). 원인은 흉내 — 모델이 읽는 규범 문서가 가운뎃점(·)으로 가득함(추적 파일 733개)
- 방향(사용자): 가운뎃점은 어디에도 쓰지 않는다. 문장 안 나열은 쉼표와 "와/과", 따로 보이려면 줄을 나눠 불릿, 표 칸과 커밋 제목은 쉼표
- 질문 1 완료 기준: 저장소 검사 0건 + 실사용 한 바퀴
- 질문 2 스윕 범위: 모델이 읽는 것 전부(규범, 스킬, 템플릿, README, CLAUDE.md, 훅 주입 문구, lessons.md) + docs/design 도메인 문서와 설계 문서. 예외 셋: phase 파일, _archive, 코드 블록 안 옛 화면 인용. svg와 MCP 소스 주석은 제외
- 질문 3 한 줄 표시(진행 헤더, 첫 질문 안내줄, 검증 결과 줄): 쉼표로 이은 한 줄
- 질문 4 결정 박스 꼬리표: 앞은 쉼표, 마지막만 "와/과"
- 질문 5 규범 줄 예시: 올바른 문장 예시 하나만 병기, bootstrap은 짧은 조각만
- 질문 6 상시 검사: test-restatements.sh 잔존 검사에 가운뎃점(·) 0건, 규칙 줄 한 자리만 예외, bootstrap 상한 없음(늘어난 줄 수는 설계 문서에 기록)
- 토큰 우려 답변(사용자 확인): 흉내 원천 제거 + 기존 「내보내기 전 검사」에 "가운뎃점(·) 0개" 항목. 별도 호출과 재생성 없음. 보장이 아니라 억제
- 릴리스 1.27.2 (PATCH)
- 시드: 사용자 확인 완료 (Goal, Constraints 열, Non-goals 여덟, Success Criteria 일곱, Assumptions 여덟, Open Questions 여섯)

- Open Questions 여섯 확정: ① 면제는 경로 셋(phase, _archive, evidence), 인용 29개는 evidence/로 ② 재귀 걷기 헬퍼 신설, sweep 그대로 ③ lessons.md 전부 고침 ④ 층이 있으면 줄 나눔, 표 칸은 쉼표, 항목 안 쉼표는 어순 재배치 ⑤ README 견본 새 모양 ⑥ 3절 요구사항 행과 9절 검증 표, session-start 주석 갱신

- 국면 2 결정 넷: A 문구 제거 후 세기와 포함 목록 걷기와 새 헤더 도착 검사, B 허용 연산 셋과 치환 고정표와 글자 다중집합 대조, C 새 evidence 폴더 없음과 행 번호 참조, D transcript 기계 세기와 유발 다섯

- 국면 3 재협의 열 가지 승인(phase3 참조)

- 국면 4: 설계 문서 확정(요구사항 스물하나)

### 미완료 항목 (다음 세션에서 이어서 진행)
- DEVELOP: plan.md 태스크 아홉 실행 (superpowers subagent-driven-development)

## 결정 흐름 상태
- 헤더: 확정 11/11, 진행 중: 없음, 다시 볼 것 0건
- ❓ 질문 진행: 6/6 완료, 국면: 국면 1
- 블라인드 첫 루프: 완료, 국면: 국면 1과 국면 2
- [✔] 최초 고지: 완료
- 판정 오답 횟수: 작업 방향 확인 0

### 결정 항목 (의존성 정렬 순서 보존 — 순서 자체가 상태다)
- [x] 카테고리 확정 — 확정: dev-workflow
- [x] 시드 확인 — 확정: Yes
- [x] 작업 방향 확인 — 확정: spec-change (진행)
- [x] 검사 예외의 기준 — 확정: 경로 면제만, 인용은 evidence/로
- [x] 잔존 검사 도구 — 확정: 재귀 걷기 헬퍼 신설
- [=] lessons.md 처리 — 페르소나 합의 통과: 전부 고침
- [x] 층이 있는 나열의 모양 — 확정: 줄 나눔, 못 나누면 어순 재배치
- [=] README와 설계 문서 옛 모양 — 페르소나 합의 통과: README 새 모양, 설계 문서는 ①에 흡수
- [x] bootstrap 크기 기록 자리 — 확정: 3절과 9절, 훅 주석 갱신
- [x] 이름 부르는 줄의 면제 방식 — 확정: 문구 제거 후 세기, 포함 목록, 새 헤더 도착 검사
- [=] 스윕 워커의 조작 범위 — 페르소나 합의 통과
- [=] 옛 인용을 옮기는 모양 — 페르소나 합의 통과
- [x] 실사용 확인의 판정 방식 — 확정: transcript 기계 세기

### 재논의 대기열
- 없음

## 다음 세션 시작 방법
1. 이 파일을 로드한다
2. phase1_exploration.md와 phase2_discovery.md를 로드한다
3. plan.md를 로드하고 DEVELOP(실행 방식 선택)부터 이어서 시작한다
