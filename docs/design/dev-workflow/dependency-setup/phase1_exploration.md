# Phase 1: 탐색 (Exploration)

## 날짜: 2026-03-30

## A-0. 본질 질문 [Ontologist]

### 질문 목록
1. "이 문제의 본질은 무엇인가?" — 사용자의 요구사항 뒤에 숨겨진 진짜 문제는 무엇인가?
2. "이것은 어떤 범주의 문제인가?" — 의존성 관리? 온보딩? DX(개발자 경험)?
3. "이것이 없으면 무엇이 달라지는가?" — setup이 없을 때 실제 사용자 여정에서 발생하는 마찰은?
4. "핵심 동기는 무엇인가?" — 왜 이것을 지금 해야 하는가?
5. "의존성의 비대칭이 문제를 만드는가?" — Superpowers(필수)와 Ouroboros(권장)의 우선순위 차이가 setup 설계에 영향을 주는가?

### 사용자 답변
- **Q4 (직접 답변)**: 오케스트레이션 플러그인의 접근성 향상. 하나의 명령으로 의존성 일괄 설치.
- **Q1 (조사)**: 현재 README를 보고 수동으로 `/plugin install`을 반복해야 함. 사용자가 내부 의존성을 알 필요 없이 자체 명령으로 처리하면 편리.
- **Q2 (조사)**: Superpowers(기반) + Ouroboros(향상). 둘 다 권장이지만 필수는 아님. Standalone 모드 존재. 우선순위: Superpowers > Ouroboros.
- **Q3 (조사)**: 의도적 설계가 아니라 README 언급으로 마무리한 상태.
- **Q5 (직접 답변)**: 비대칭은 크게 영향 없음. 사용 영역이 다르기 때문.

### 결론
핵심 문제는 **온보딩 마찰** — 사용자가 내부 의존성 구조를 알아야만 완전한 기능을 사용할 수 있는 상태.

## A. 기술 조사

### Ouroboros setup 패턴
- 6단계 위저드: 환경 감지 → MCP 등록 → CLAUDE.md 통합 → 검증
- Python 런타임 + MCP 서버가 필요해서 복잡한 setup
- `commands/setup.md`에 배치 (스킬 아님)

### dev-workflow 현재 상태
- 의존성 문서화: README.md 산문만 존재
- plugin.json에 dependency 메타데이터 없음
- hooks/session-start: orchestrator 스킬 주입만 수행
- Ouroboros 런타임 감지는 orchestrator에 이미 구현됨

### Superpowers 구조
- 마켓플레이스 기반 설치 (공식)
- 순수 마크다운 플러그인, setup 스킬 없음
- SessionStart hook으로 using-superpowers 스킬 주입

### 핵심 발견: `claude plugin` CLI
- `claude plugin install <plugin>` — 비대화형 동작 확인
- `claude plugin marketplace add <source>` — 마켓플레이스 등록
- `claude plugin list` — 설치 확인
- 스킬/Bash에서 프로그래밍적 호출 가능
