# Phase 2: 발견 (Discovery)

> 기능명: vcs-execution-strategy
> 카테고리: dev-workflow
> 날짜: 2026-03-11
> 페르소나: 🏛️ Architect, 👤 End User, 🏆 Claude Code Expert

## 새로 발견된 미정의 영역

### 1. executing-plans vs subagent-driven-development 품질 차이
- executing-plans: 리뷰 메커니즘 없음, 공식적으로 "subagent 있으면 다른 스킬 써" 권고
- subagent-driven-development: 2단계 리뷰 loop (spec + code quality), 자동 수정 loop
- 결론: executing-plans를 폴백으로 쓰는 것은 품질 저하 → 대안 필요

### 2. subagent-driven-development의 worktree 결합도 분석
- worktree는 "사전 설정 단계"에만 존재, 실행 loop 내부에서 참조 제로
- 서브에이전트 디스패치, 2단계 리뷰 loop, 프롬프트 템플릿 모두 worktree와 무관
- 유일한 Git 의존점: Code Quality Reviewer의 SHA 비교

### 3. Code Quality Review의 Perforce 대응
- Git: BASE_SHA..HEAD_SHA 비교 (기존 방식)
- Perforce: implementer 리포트의 "Files changed" 목록 기반 리뷰 + 필요 시 p4 diff 활용
- Spec Reviewer는 VCS 무관 (코드 직접 읽기 방식)

### 4. VCS 감지 방법
- .git 존재 → worktree 사용 가능
- .git 없음 → worktree 불가
- 판단 모호 시 → 사용자에게 worktree 사용 여부 질문

### 5. 분기 담당 스킬
- workflow-orchestrator가 세션 시작 시 VCS 감지
- DEVELOP 진입 시 적절한 실행 모드 자동 선택

### 6. 사용자 안내 수준
- "이 프로젝트는 Perforce 환경이라 worktree 없이 진행합니다" 한 줄 알림
- 매번 질문하지 않음 (세션 시작 시 한 번 감지)

## 페르소나 간 충돌 항목

### executing-plans를 폴백으로 사용할 것인가?
- 🏛️ Architect: 품질 저하가 우려됨 → 대안 필요
- 👤 End User: 리뷰 없어도 에디터에서 최종 확인하므로 치명적이지 않을 수 있음
- 🏆 Claude Code Expert: subagent-driven-development를 worktree 없이 사용하는 것이 더 나은 대안

### 최종 결정
- subagent-driven-development의 실행 loop를 그대로 사용하되 worktree 설정만 조건부 스킵
- executing-plans는 사용하지 않음 → 품질 유지
