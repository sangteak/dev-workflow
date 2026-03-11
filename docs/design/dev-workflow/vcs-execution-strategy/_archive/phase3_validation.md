# Phase 3: 검증 (Validation)

> 기능명: vcs-execution-strategy
> 카테고리: dev-workflow
> 날짜: 2026-03-11
> 페르소나: 🏛️ Architect, 🔧 Plugin Developer, 👤 End User, 🏆 Claude Code Expert

## TD 기술 검토 결과

### [1] VCS 감지 (.git 유무)
- 판단: 기술적으로 단순하고 확실한 방법
- 가이드라인: 세션 시작 시 프로젝트 루트에서 .git 디렉토리 존재 여부 확인
- 리스크: 낮음

### [2] subagent-driven-development에서 worktree 단계 조건부 스킵
- 판단: 실현 가능. worktree는 사전 설정일 뿐, 실행 loop와 결합도 제로
- 가이드라인: workflow-orchestrator가 DEVELOP 진입 시 worktree 가능 여부에 따라 using-git-worktrees 스킬 호출 스킵
- 리스크: 낮음

### [3] Code Quality Reviewer SHA 비교 → 파일 목록 기반 리뷰
- 판단: 실현 가능하나 주의 필요
- 가이드라인: implementer 리포트의 "Files changed" 필드 + 코드 직접 읽기로 대체. 필요 시 p4 diff 보완
- 리스크: 중간 — 리뷰 정밀도가 약간 떨어질 수 있음

### [4] Superpowers 스킬 자체 수정 vs dev-workflow 래퍼
- 판단: Superpowers는 외부 플러그인이므로 직접 수정 불가
- 가이드라인: dev-workflow가 DEVELOP 진입 시 래퍼 역할 수행. Superpowers 호출 전 환경 세팅
- 리스크: 중간 — Superpowers 업데이트 시 호환성 확인 필요

### [5] Perforce 프로젝트에서 Task 체크포인트 관리
- 검토한 방안:
  - A. p4 shelve: VCS 의존, 롤백 가능, 구현 중간 복잡도
  - B. 파일 기반 마커: VCS 독립, 롤백 불가, 구현 단순
  - C. 하이브리드: 조건부 최적, 구현 복잡
- 최종 결정: **방안 B (파일 기반 마커)**
- 근거: VCS 완전 독립, 구현 단순, 에디터 최종 확인 구조상 롤백 불필요
- 리스크: 낮음

## 재협의 항목
- 없음. 모든 항목에서 사용자와 합의 완료

## 기술 가이드라인 요약
- Superpowers 직접 수정 불가 → dev-workflow가 래퍼 역할
- Git 환경: 기존 방식 유지 (worktree + git commit + SHA 비교)
- Non-Git 환경: worktree 스킵 + git commit 스킵 + 파일 목록 기반 리뷰
- VCS 감지는 .git 유무로 판단, 모호 시 사용자에게 질문
