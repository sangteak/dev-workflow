# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dev-workflow** — Claude Code 플러그인으로, 구조화된 개발 워크플로우(Brainstorm → Plan → Develop → Review)를 페르소나 기반 피드백 루프와 함께 제공한다. Superpowers 플러그인 위에서 동작하며, Git/Non-Git 환경 모두 지원한다.

## Architecture

이 프로젝트는 **코드 없는 문서 기반 플러그인**이다. 모든 로직은 Markdown 스킬 파일(`skills/*/SKILL.md`)에 정의된다.

### Core Components

- **`.claude-plugin/`** — 플러그인 메타데이터 (`plugin.json`, `marketplace.json`)
- **`hooks/`** — 세션 시작 시 `workflow-orchestrator` 스킬을 자동 주입하는 bash 스크립트
- **`skills/`** — 9개 핵심 스킬 (아래 참조)
- **`docs/design/`** — 설계 문서 저장소 (카테고리/기능 구조)

### Skills (9개)

| 스킬 | 역할 |
|---|---|
| `workflow-orchestrator` | 세션 시작 프로토콜, 단계 감지, Superpowers 위임 |
| `persona-resolution` | 세션 시작 시 페르소나 확정 |
| `brainstorming` | 5단계 브레인스토밍 + 페르소나 피드백 루프 |
| `plan-stage` | 실현 가능성 평가, OPEN_QUESTIONS 해소 |
| `context-handling` | HANDOFF.md 생성/복구 (멀티세션) |
| `development-principles` | 개발 철학 및 자기개선 루프 |
| `document-consolidation` | 개발 완료 후 phase/plan 파일 통합 |
| `design-doc-index` | 설계 문서 색인 및 크로스레퍼런스 (BRAINSTORM/PLAN 중 기존 문서 참조) |
| `design-summary` | 관련 설계 문서 그룹의 통합 요약 생성 (명령 호출: `/dev-workflow:design-summary`) |

### Workflow Stage → Delegation

| 단계 | 담당 | 페르소나 |
|---|---|---|
| BRAINSTORM | dev-workflow 스킬 | ✅ 사용 |
| PLAN | dev-workflow 스킬 | ✅ 사용 |
| DEVELOP | Superpowers `subagent-driven-development` | ❌ 없음 |
| REVIEW | Superpowers `requesting-code-review` | ❌ 없음 |

## Document Structure

```
docs/design/
└── [category]/           ← kebab-case
    └── [feature]/        ← kebab-case
        ├── [feature].md              ← 10섹션 표준 설계 문서 (SSOT)
        ├── phase1_exploration.md     ← 불변 스냅샷
        ├── phase2_discovery.md
        ├── phase3_validation.md
        ├── plan.md                   ← Superpowers writing-plans 산출물
        ├── HANDOFF.md                ← 멀티세션 복구용
        ├── issues/[problem-name]/    ← 핫픽스 서브워크플로우
```

## Conventions

- **응답 언어**: 한국어
- **커밋**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) — 커밋 전 반드시 사용자 확인
- **카테고리/기능명**: lowercase kebab-case
- **요구사항 번호**: `REQ-001`, 목표: `GOAL-001`
- **페르소나 표시**: 항상 이모지 접두사 (🎮 Game Designer, 👤 Player, 🔧 TD, 🏛️ Architect, 📋 PM)
- **피드백 루프**: 최대 3라운드, `[Round N/3]` 표기, 라운드 로빈 비평

## Versioning

- **`marketplace.json`의 `plugins[].version`이 SSOT** — 플러그인 시스템이 업데이트 판단에 사용
- **`plugin.json`의 `version`** — 동일 버전으로 동기화 유지
- 릴리스 시 두 파일 모두 버전을 함께 올릴 것

## Key Patterns

- **VCS 감지**: `.git` 존재 → git-mode (worktree 사용), 없음 → no-git-mode (파일 기반 체크포인트)
- **HANDOFF 복구**: 세션 시작 시 `docs/design/**/HANDOFF.md` glob 탐색 → 발견 시 목록 제시
- **Phase 파일 불변성**: phase1/2/3.md는 생성 후 수정 불가, 개발 완료 후 feature 디렉토리와 함께 삭제
- **issues/ 서브워크플로우**: 사용자 명시 요청 시에만 생성, Phase 0 스킵, 완료 후 부모 문서에 병합 후 삭제
- **자기개선 루프**: 수정받을 때마다 `tasks/lessons.md`에 기록, 세션 시작 시 내부적으로 검토
