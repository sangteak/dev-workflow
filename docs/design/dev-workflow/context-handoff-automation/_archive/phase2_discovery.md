# Phase 2: Discovery — context-handoff-automation

> 발견일: 2026-03-19

---

## 국면 1에서 확인된 요구사항

- 저장 단축 명령 (자연어 → slash command)
- 복구 단축 명령 (자연어 → slash command)
- `/clear`는 자동화 불가, 안내로 대체

---

## 미정의 영역 및 해소 결과

### 1. 명령 이름과 구조

**Q:** 단일 명령 + 서브커맨드 vs 개별 명령?
**결정:** 기존 `context-handling` 스킬에 서브커맨드 추가.

- `/context-handling save` → HANDOFF 생성
- `/context-handling resume` → HANDOFF 탐색 + 복구
- 별도 스킬 생성 불필요

**근거:**
- 사용자가 "인자 없이 직관적으로"를 요구했으나, 기존 스킬의 서브커맨드 패턴(`document-consolidation consolidate-main`, `design-summary peek`)이 이미 프로젝트에 정착되어 있음
- 기능이 2개뿐이므로 서브커맨드가 충분히 직관적
- Claude Code 자동완성으로 `/context-handling`까지 빠르게 입력 가능

### 2. 기존 스킬 확장 vs 별도 스킬 생성

**Q:** `context-handling` 확장 vs 새 스킬?
**결정:** `context-handling` 스킬 확장.

**근거:**
- HANDOFF 생성/탐색 로직이 이미 `context-handling`에 존재
- 서브커맨드는 기존 로직의 명시적 트리거일 뿐, 새 로직이 아님
- 스킬 수 증가 없음 (9개 유지)
- plugin.json 수정 불필요

### 3. hook을 통한 자동 복구 강화 가능성

**Q:** hook으로 완전 자동 복구 가능한가?
**발견:** 이미 동작하고 있었다.

- `/clear` 후 아무 메시지 입력 → SessionStart hook 트리거 → orchestrator 주입 → Session Start Protocol 실행 → context-handling 자동 탐색
- 사용자가 `/clear` 후 구체적 지시("HANDOFF 읽어줘")를 먼저 입력하는 습관 때문에 자동 복구를 경험하지 못했을 뿐
- GW 프로젝트에서 "go" 입력으로 자동 복구 정상 동작 확인
- hook 자체의 추가 개선은 불필요

**`resume`의 역할 재정의:**
- primary 경로: 자동 복구 (아무 메시지 입력)
- fallback 경로: `/context-handling resume` (자동이 안 될 때)
- 대칭성: `save`가 있으면 `resume`도 명시적으로 제공해야 처음 사용자에게 자연스러움

### 4. 다른 프로젝트에서의 동작

**Q:** dev-workflow 플러그인이 설치된 다른 프로젝트에서도 동작하는가?
**확인:** GW 프로젝트에서 정상 동작 확인. 추가 논의 불필요.

---

## 페르소나 피드백 요약

### 주제 1: 명령 구조 (🎯 리드)
- **라운드 1:** 서브커맨드(A안) vs 개별 명령(B안) 논의. 사용자가 B안(직관성) 선호 표명
- **라운드 2:** 스킬 시스템에서 별도 스킬과 서브커맨드가 같은 효과임을 확인. 기존 `context-handling`에 서브커맨드 추가로 최종 합의

### 주제 2: 스킬 구조 (🎯 리드)
- **라운드 1:** C안(래퍼 스킬 + context-handling 위임) vs D안(alias) 검토
- **라운드 2:** plugin.json에 alias 미지원 확인. 사용자가 `/context-handling` 자동완성 확인 후 서브커맨드 방식 확정

### 주제 3: 자동 복구 (🎯 리드)
- **라운드 1:** hook 자동 복구가 플랫폼 제약으로 불가능하다는 초기 분석 → 실제 테스트에서 이미 동작 중임을 발견. `resume`은 fallback + 대칭성으로 유지 합의
