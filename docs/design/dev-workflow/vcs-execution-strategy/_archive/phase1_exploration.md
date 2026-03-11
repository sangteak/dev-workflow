# Phase 1: 탐색 (Exploration)

> 기능명: vcs-execution-strategy
> 카테고리: dev-workflow
> 날짜: 2026-03-11
> 페르소나: 🏛️ Architect, 🔧 Plugin Developer, 👤 End User, 🏆 Claude Code Expert

## 탐색된 요구사항

### 배경
- Superpowers는 git worktree를 기반으로 DEVELOP 단계를 실행
- `subagent-driven-development`와 `executing-plans` 모두 worktree를 REQUIRED로 명시
- 그러나 Perforce 프로젝트(언리얼)에서는 .git이 존재하지 않아 worktree 사용 불가
- 현재 Perforce 프로젝트에서도 dev-workflow가 동작하고 있음 (암묵적 폴백)

### 프로젝트 환경
- 언리얼 프로젝트: Perforce (worktree ❌)
- 게임 서버 프로젝트: Git (worktree ✅)
- 언리얼 작업 패턴: Claude가 CPP 생성 → 사용자가 에디터에서 바이너리(BB, BT 등) 작업

### worktree의 실제 가치 분석

| 시나리오 | Git 서버 프로젝트 | 언리얼 Perforce 프로젝트 |
|---|---|---|
| A. 병렬 서브에이전트 격리 | ✅ 가치 있음 | ⚠️ 제한적 (바이너리 의존) |
| B. 작업 공간 보호 | ✅ 유용 | ❌ 무의미 (에디터 실행 필요) |
| C. 작업 전환 | ✅ 유용 | ❌ Perforce에서 불가 |

### 핵심 발견사항

1. **Superpowers는 이미 순차 실행 모델**: Task 병렬 실행은 금지, 번호 순서대로 순차 처리
2. **worktree의 실제 역할**: 병렬 실행이 아닌 "서브에이전트에게 깨끗한 작업 공간 제공"
3. **두 가지 실행 경로 존재**:
   - `subagent-driven-development`: 서브에이전트 순차 디스패치 (worktree 필요)
   - `executing-plans`: 현재 세션에서 직접 순차 실행 (worktree 불필요 가능성)
4. **VCS 감지 시점**: 세션 시작 시 한 번이면 충분

### 사용자가 명시적으로 제외한 항목
- Perforce workspace/stream을 활용한 격리 전략 (팀 환경상 힘든 상황)

### 확정된 페르소나
- 🏛️ Architect: 시스템 구조, VCS 추상화 설계
- 🔧 Plugin Developer: dev-workflow/Superpowers 스킬 구현 관점
- 👤 End User: Perforce/Git 혼용 환경 실사용자 관점
- 🏆 Claude Code Expert: Claude Code 내부 동작, worktree 메커니즘
