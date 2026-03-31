# Phase 2: Discovery — README 재설계

> 생성: 2026-03-31 | 불변 스냅샷

---

## 국면 2에서 새로 발견된 미정의 영역

### 1. Quick Start 시뮬레이션 소스

**결정:** 현재 브레인스토밍 세션 대화를 시뮬레이션으로 활용
- 작성 후 실제 새 세션 로그로 교체가 필요하면 별도 feature로 관리
- 게임 서버 주제 + 실제 사용자-AI 대화 흐름을 그대로 보여주는 방식

### 2. Ouroboros 표현 방식

**결정:** "권장 플러그인" 포지셔닝
- Ouroboros 에이전트 특징 간략 설명 (Socratic, Contrarian, Seed-Architect 등)
- 미설치 시 해당 기능 미적용 명시 (Standalone Mode 동작)
- 설치 여부를 사용자가 명확히 인식할 수 있도록

### 3. Skills Reference 섹션 처리

**결정:** 통합 (섹션 제거)
- 9개 스킬 표 제거
- 각 Workflow Stages 설명 내에 "🔧 내부 스킬: `skill-name`" 한 줄로 표기
- 사용자 직접 호출 커맨드는 Commands Reference 섹션에서 별도 처리

---

## Q&A 결정 사항

| 질문 | 결정 |
|------|------|
| Quick Start에 설치 포함 여부 | 분리 — Installation 별도 섹션 |
| Quick Start 형식 | 임팩트 훅(30초) + 전체 워크플로우 시뮬레이션 |
| Ouroboros 언급 깊이 | 에이전트 특징 한 단락 + 미적용 명시 |
| Skills Reference | 각 단계로 통합, 별도 섹션 제거 |
| 도메인 예시 | 게임 서버 (인벤토리, Mail 시스템) |
