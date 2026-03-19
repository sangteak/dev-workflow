# Phase 1: Exploration — context-handoff-automation

> 탐색일: 2026-03-19

---

## 페르소나 구성
- 🛠️ Claude Code Expert (국면 1~3)
- 🎯 Workflow Designer (국면 1~3, 리드)
- 🔍 Ecosystem Analyst (국면 3 활성화)

---

## 사용자 페인포인트

컨텍스트가 가득 찼을 때 세션을 이어가기 위해 매번 3단계를 수동 자연어로 입력해야 하는 반복적 마찰:

1. "HANDOFF.md 작성해줘" (자연어 지시)
2. `/clear` (세션 초기화)
3. "HANDOFF.md 읽고 작업 복귀해줘" (자연어 지시)

---

## 탐색된 요구사항

### REQ-EXPLORE-001: 저장 단축 명령
- 자연어 "HANDOFF.md 작성해줘" 대신 단축 명령(slash command)으로 HANDOFF 생성
- 현재 `context-handling` 스킬에 HANDOFF 생성 로직이 이미 존재

### REQ-EXPLORE-002: 복구 단축 명령
- 자연어 "HANDOFF.md 읽고 복귀해줘" 대신 단축 명령으로 HANDOFF 탐색 및 작업 복구
- 현재 `context-handling` 스킬에 HANDOFF 탐색/목록 제시 로직이 이미 존재

### REQ-EXPLORE-003: `/clear`는 자동화 불가
- `/clear`는 Claude Code CLI 내장 명령으로 프로그래밍적 호출 불가
- 저장 완료 후 안내 메시지로 대체

---

## 기술적 발견 사항

### SessionStart hook의 한계
- `hooks.json` matcher: `startup|resume|clear|compact`
- hook은 orchestrator 텍스트를 `additional_context`로 주입하지만, Claude에게 "먼저 말하게" 하지 못함
- `/clear` 후 사용자가 입력하기 전까지 Claude는 대기 상태
- 사용자가 구체적 지시를 먼저 입력하면 Session Start Protocol이 우회됨

### context-handling 자동 복구의 현실
- 설계상 세션 시작 시 자동 탐색/복구 가능
- 실제로는 사용자가 직접 지시를 입력하는 패턴이 고착화되어 자동 복구가 발동한 적 없음
- 근본 원인: hook이 context만 주입하고 Claude의 선제 행동을 트리거하지 못함

---

## 사용자가 명시적으로 제외한 항목
- 자동 감지 방식 (컨텍스트 부족 시 선제적 HANDOFF 제안) — 사용자가 직접 모니터링 가능하므로 불필요

---

## 페르소나 피드백 요약

### 라운드 1: 접근 방식 탐색
- **합의:** 단축 명령 방식이 확실한 1차 해결책. 자동 감지는 플랫폼 제약으로 불확실.

### 라운드 2: 자동 복구 검증
- **합의:** 생성과 복구 모두 단축 명령 필요. hook의 context 주입만으로는 자동 복구 불충분. 기존 context-handling 스킬 확장이 가장 경제적.
