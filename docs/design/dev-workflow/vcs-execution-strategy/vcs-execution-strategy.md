---
feature: vcs-execution-strategy
category: dev-workflow
status: complete
created: 2026-03-11
last-updated: 2026-03-11
dependencies:
  - document-management-policy
affects:
  - workflow-orchestrator skill
  - subagent-driven-development (Superpowers, 래핑만)
---

# VCS Execution Strategy 설계 문서

> 한 줄 요약: VCS 종류(Git/Perforce/기타)에 따라 DEVELOP 단계의 실행 모델을 자동 분기하여, worktree 사용 불가 환경에서도 Superpowers의 품질 보장 구조(2단계 리뷰 loop)를 유지한다.

## 1. 배경과 동기

dev-workflow는 Superpowers 위에서 동작하는 플러그인이다. Superpowers의 DEVELOP 단계(`subagent-driven-development`, `executing-plans`)는 git worktree를 REQUIRED로 명시하고 있다.

그러나 실제 사용 환경에서:
- **언리얼 프로젝트**: Perforce 사용 → `.git` 없음 → worktree 불가
- **게임 서버 프로젝트**: Git 사용 → worktree 가능

현재까지 Perforce 프로젝트에서도 dev-workflow가 동작해왔으나, 이는 Claude Code가 worktree 실패를 암묵적으로 무시하고 메인 디렉토리에서 직접 작업한 결과이다. 공식적인 대응 전략이 필요하다.

### worktree의 실제 가치 분석

| 시나리오 | Git 프로젝트 | Perforce 프로젝트 |
|---|---|---|
| 병렬 서브에이전트 격리 | ✅ 가치 있음 | ⚠️ 제한적 (바이너리 의존) |
| 작업 공간 보호 | ✅ 유용 | ❌ 무의미 (에디터 실행 필요) |
| 작업 전환 | ✅ 유용 | ❌ Perforce에서 불가 |

Superpowers의 Task 실행은 이미 순차 모델(병렬 디스패치 금지)이므로, worktree의 핵심 가치는 "격리"이며 "병렬성"은 부가 가치이다.

## 2. 목표와 비목표

### 목표
- GOAL-001: VCS 종류에 따라 DEVELOP 실행 모델을 자동 분기한다
- GOAL-002: worktree 불가 환경에서도 Superpowers의 2단계 리뷰 loop를 유지한다
- GOAL-003: 사용자가 VCS 차이를 의식하지 않고 동일한 워크플로우를 경험하도록 한다
- GOAL-004: Superpowers 자체를 수정하지 않고 dev-workflow 래퍼로 대응한다

### 비목표
- Perforce 전용 기능 구현 (p4 shelve, p4 stream 연동 등)
- Superpowers 스킬의 포크/수정
- Git-P4 브릿지 등 하이브리드 VCS 지원 (향후 필요 시 확장)
- VCS 마이그레이션 도구

## 3. 확정된 요구사항

### VCS 감지
- REQ-001: 세션 시작 시 프로젝트 루트의 `.git` 디렉토리 존재 여부로 VCS를 감지한다 — 우선순위: HIGH
- REQ-002: 감지 결과에 따라 `git-mode` 또는 `no-git-mode`를 설정한다 — 우선순위: HIGH
- REQ-003: 감지가 모호한 경우 사용자에게 worktree 사용 여부를 질문한다 — 우선순위: MEDIUM

### 실행 모델 분기
- REQ-004: `git-mode`에서는 기존 Superpowers 방식을 그대로 사용한다 (worktree + git commit + SHA 비교) — 우선순위: HIGH
- REQ-005: `no-git-mode`에서는 worktree 설정 단계를 스킵한다 — 우선순위: HIGH
- REQ-006: `no-git-mode`에서도 `subagent-driven-development`의 서브에이전트 디스패치 + 2단계 리뷰 loop를 유지한다 — 우선순위: HIGH
- REQ-007: `no-git-mode`에서 git commit 단계를 스킵하고 파일 기반 마커(TodoWrite + Implementer 리포트)로 대체한다 — 우선순위: HIGH

### Code Quality Review 대체
- REQ-008: `no-git-mode`에서 Code Quality Reviewer에게 SHA 대신 Implementer 리포트의 "Files changed" 목록을 전달한다 — 우선순위: HIGH
- REQ-009: 리뷰어는 전달받은 파일 목록을 기반으로 코드를 직접 읽어 리뷰한다 — 우선순위: HIGH

### 사용자 경험
- REQ-010: DEVELOP 진입 시 감지된 모드를 한 줄로 안내한다 (예: "Perforce 환경 — worktree 없이 진행합니다") — 우선순위: MEDIUM
- REQ-011: VCS 감지는 세션당 1회만 수행한다 — 우선순위: LOW

## 4. 설계 개요

### 실행 모델 분기 다이어그램

```
세션 시작
  │
  ├─ .git 존재? ──── Yes ──→ git-mode
  │                            │
  │                            ├─ using-git-worktrees 실행
  │                            ├─ subagent-driven-development 실행
  │                            └─ (기존 Superpowers 방식 그대로)
  │
  └─ .git 없음? ──── No ───→ no-git-mode
                               │
                               ├─ worktree 스킵 안내
                               ├─ subagent-driven-development 실행
                               │   ├─ Implementer: 구현 + 리포트 (commit 대신)
                               │   ├─ Spec Reviewer: 리포트 + 코드 직접 읽기 (변경 없음)
                               │   └─ Code Quality Reviewer: 파일 목록 기반 리뷰 (SHA 대신)
                               └─ TodoWrite로 Task 진행 추적
```

### subagent-driven-development Per-Task 흐름 비교

| 단계 | git-mode | no-git-mode |
|------|----------|-------------|
| 1. Implementer 디스패치 | 동일 | 동일 |
| 2. 구현 | 동일 | 동일 |
| 3. 테스트 | git 기반 테스트 | 로컬 테스트 (에디터 확인 위임) |
| 4. 체크포인트 | `git commit` | Implementer 리포트 제출 |
| 5. Spec Review | 동일 | 동일 |
| 6. Code Quality Review | `BASE_SHA..HEAD_SHA` | "Files changed" 목록 + 코드 직접 읽기 |
| 7. Task 완료 | TodoWrite 체크 | TodoWrite 체크 |

### workflow-orchestrator 래핑 구조

```
workflow-orchestrator (세션 시작)
  │
  ├─ VCS 감지 → vcs-mode 설정
  │
  └─ DEVELOP 진입 시:
       ├─ git-mode: "superpowers:using-git-worktrees 후
       │             superpowers:subagent-driven-development 실행"
       │
       └─ no-git-mode: "worktree 스킵,
                         superpowers:subagent-driven-development 실행 시
                         아래 규칙 적용:
                         - git commit → 스킵 (리포트로 대체)
                         - SHA 비교 → Files changed 목록으로 대체
                         - 프로젝트 디렉토리에서 직접 작업"
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| workflow-orchestrator | VCS 감지 로직 | DEVELOP 진입 분기 |
| subagent-driven-development (Superpowers) | 래핑 대상 (수정하지 않음) | Implementer/Reviewer 프롬프트에 모드 전달 |
| Code Quality Reviewer 프롬프트 | Implementer 리포트 형식 | 리뷰 정밀도 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| VCS 감지 방법 | .git 디렉토리 유무 | 단순, 확실, 추가 설정 불필요 | p4 CLI 감지, 설정 파일 | 복잡도 대비 가치 부족 |
| worktree 불가 시 실행 모델 | subagent-driven-development 유지 (worktree만 스킵) | 2단계 리뷰 loop 품질 유지 | executing-plans 폴백 | 리뷰 메커니즘 없음, 공식적으로 비권장 |
| Task 체크포인트 | 파일 기반 마커 (TodoWrite + 리포트) | VCS 완전 독립, 구현 단순 | p4 shelve | VCS 의존, 환경 설정 필요, 범위 과다 |
| 하이브리드 (p4+파일 마커) | 기각 | — | 환경별 최적 선택 | 분기 3갈래, 구현/유지보수 복잡도 과다 |
| Code Quality Review 방식 | 파일 목록 + 코드 직접 읽기 | Implementer 리포트에 이미 "Files changed" 존재 | p4 diff 연동 | VCS 의존, 비목표에 해당 |
| Superpowers 수정 여부 | 수정하지 않음 (래퍼만) | 외부 플러그인, 업데이트 호환성 | 포크/수정 | 유지보수 부담, 업스트림 추적 불가 |

## 7. 제약조건과 가정

### 제약조건
- Superpowers는 외부 플러그인으로 직접 수정 불가 → dev-workflow가 래퍼 역할만 수행
- Superpowers 업데이트 시 subagent-driven-development의 실행 흐름이 변경될 수 있음 → 호환성 확인 필요
- no-git-mode에서 Code Quality Review의 정밀도가 git-mode보다 낮을 수 있음

### 가정
- 언리얼 프로젝트의 최종 검증은 사용자가 에디터에서 수행 (자동 롤백 불필요)
- Git-P4 브릿지 등 하이브리드 VCS는 현재 사용하지 않음
- .git 유무로 VCS 판별이 충분한 환경
- Claude Code에서 서브에이전트 디스패치가 worktree 없이도 동작

## 8. 기술 가이드라인

### VCS 감지 규칙
- 프로젝트 루트에서 `.git` 디렉토리 존재 확인
- 존재 → `git-mode`, 미존재 → `no-git-mode`
- 모호한 경우 → 사용자에게 "worktree를 사용할 수 있는 환경인가요?" 질문

### 스킬 수정 범위

| 스킬 | 변경 내용 |
|------|----------|
| workflow-orchestrator | 세션 시작 시 VCS 감지 추가, DEVELOP 진입 시 모드별 가이드 분기 |

### no-git-mode 실행 규칙
- worktree 설정 단계 스킵
- git commit 대신 Implementer 리포트로 체크포인트
- Code Quality Review에 SHA 대신 "Files changed" 목록 전달
- Spec Review는 변경 없음 (원래 코드 직접 읽기 방식)
- TodoWrite로 Task 진행 추적 (기존과 동일)
- DEVELOP 진입 시 안내: "Perforce 환경 — worktree 없이 진행합니다"

### git-mode 실행 규칙
- 기존 Superpowers 방식 그대로 유지
- 변경 없음

## 9. 구현 결과 및 일탈 사항

### 구현 결과

plan.md의 3개 태스크를 모두 완료하였다.

| Task | 내용 | 결과 |
|------|------|------|
| Task 1 | Session Start Protocol에 VCS Detection 단계 추가 | step 3으로 삽입, 후속 번호 4→5→6 업데이트 |
| Task 2 | DEVELOP 단계에 git-mode/no-git-mode 분기 추가 | DEVELOP 섹션 분기, Delegation 테이블 업데이트, no-git-mode 규칙 6개 명시 |
| Task 3 | "Does NOT Cover" 섹션 업데이트 | git worktree 항목을 조건부로 수정 |

### 일탈 사항

- 없음. 설계 문서대로 구현 완료.

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-11 | 초기 설계 문서 작성 | 전체 | 완료 |
| 2026-03-11 | 개발 완료 — 문서 통합 | workflow-orchestrator | 완료 |

## PERSONAS_USED
- 🏛️ Architect: VCS 추상화 설계, 실행 모델 분기 구조
- 🔧 Plugin Developer: 기술 타당성 검토, 체크포인트 방안 분석
- 👤 End User: 사용성 관점, Perforce 환경 실사용 패턴
- 🏆 Claude Code Expert: Superpowers 내부 동작 분석, worktree 결합도 검증
