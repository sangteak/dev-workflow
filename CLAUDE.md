# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dev-workflow** — Claude Code 플러그인으로, 구조화된 개발 워크플로우(Brainstorm → Plan → Develop → Review)를 페르소나 기반 피드백 루프와 함께 제공한다. Superpowers 플러그인 위에서 동작하며, Git/Non-Git 환경 모두 지원한다.

## Architecture

이 프로젝트는 **코드 없는 문서 기반 플러그인**이다. 모든 로직은 Markdown 스킬 파일(`skills/*/SKILL.md`)에 정의된다.

### Core Components

- **`.claude-plugin/`** — 플러그인 메타데이터 (`plugin.json`, `marketplace.json`)
- **`hooks/`** — 세션 시작 시 `workflow-orchestrator` 스킬을 자동 주입하는 bash 스크립트
- **`skills/`** — 11개 핵심 스킬 (아래 참조)
- **`commands/`** — 콘솔 자동완성용 독립 명령 파일 (save, resume, design-summary, setup, add-rule, merge-to-domain)
- **`docs/design/`** — 설계 문서 저장소 (카테고리/기능 구조)

### Skills (11개)

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
| `rules-injection` | 프로젝트별 규칙을 워크플로우 스테이지에 자동 주입 (명령 호출: `/dev-workflow:add-rule`) |
| `merge-to-domain` | 관리자가 카테고리 도메인 문서(SSOT)에 complete feature를 intelligent merge. 5단계 알고리즘 + Architect 라운드 + dry-run 안전 게이트 |

### Workflow Stage → Delegation

| 단계 | 담당 | 페르소나 |
|---|---|---|
| BRAINSTORM | dev-workflow 스킬 | ✅ 사용 |
| PLAN | dev-workflow 스킬 | ✅ 사용 |
| DEVELOP | Superpowers `subagent-driven-development` | ❌ 없음 |
| REVIEW | Superpowers `requesting-code-review` | ❌ 없음 |
| COMPLETION | dev-workflow (Completion Protocol 작업자 측) + dev-workflow (merge-to-domain, 관리자 측) | ❌ 없음 |

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

### SemVer 기준 (MAJOR.MINOR.PATCH)

| 구분 | 기준 | 예시 |
|---|---|---|
| **MAJOR** | 사용자 프로젝트의 기존 문서 구조/워크플로우와 호환되지 않는 변경 | 디렉토리 구조 규칙 변경, 필수 설정 추가, 기존 스킬 삭제/이름 변경 |
| **MINOR** | 하위 호환을 유지하는 기능 추가 또는 동작 변경 | 새 스킬 추가, 기존 흐름 개선, 선택적 기능 도입, 기존 동작 제거(대체 경로 존재) |
| **PATCH** | 버그 수정, 문서 오타, 비기능적 개선 | 오탐 수정, 문구 교정, 내부 정리 |

**판단 기준:** "이 변경을 적용한 후 기존 사용자 프로젝트의 `docs/design/` 구조가 그대로 동작하는가?"
- 그대로 동작 → MINOR 또는 PATCH
- 마이그레이션 필요 → MAJOR

## Key Patterns

- **VCS 감지**: `.git` 존재 → git-mode (worktree 사용), 없음 → no-git-mode (파일 기반 체크포인트)
- **HANDOFF 복구**: 세션 시작 시 `docs/design/**/HANDOFF.md` glob 탐색 → 발견 시 목록 제시
- **Phase 파일 불변성**: phase1/2/3.md는 생성 후 수정 불가, 개발 완료 후 feature 디렉토리와 함께 삭제
- **issues/ 서브워크플로우**: 사용자 명시 요청 시에만 생성, Phase 0 스킵, 완료 후 부모 문서에 병합 후 삭제
- **자기개선 루프**: 수정받을 때마다 `tasks/lessons.md`에 기록, 세션 시작 시 내부적으로 검토

### Commands (슬래시 명령 별칭)

`commands/` 디렉토리에는 콘솔 자동완성으로 즉시 실행 가능한 독립 명령 파일을 배치한다.

**포함 기준:** "사용자가 워크플로우 자동 흐름 밖에서, 임의의 시점에, 명시적 의도를 가지고 호출하는 스킬"

| 커맨드 | 대상 스킬 | ARGUMENTS | 설명 |
|--------|-----------|-----------|------|
| save | context-handling | save (하드코딩) | 세션 컨텍스트를 HANDOFF.md에 저장 |
| resume | context-handling | resume (하드코딩) | HANDOFF.md에서 작업 복구 |
| design-summary | design-summary | {{ARGUMENTS}} | 설계 문서 통합 요약 생성 |
| setup | — (자체 로직) | — | 권장 플러그인 의존성 설치 및 검증 |
| add-rule | rules-injection | {{ARGUMENTS}} | 프로젝트별 규칙을 워크플로우 스테이지에 자동 주입하는 룰 추가 |
| merge-to-domain | merge-to-domain | {{ARGUMENTS}} | 관리자가 도메인 머지 파이프라인 호출 (카테고리명/플래그/공란 지원) |

- 자동 트리거 스킬(orchestrator, persona-resolution 등)에는 커맨드를 추가하지 않는다
- 하드코딩 ARGUMENTS: 콘솔 자동완성 즉시 실행 시 아규먼트 입력 불가 문제 해결
- {{ARGUMENTS}}: 사용자 입력이 필요한 경우 사용 (Ouroboros 패턴)

### 자기-도그푸딩 (Self-Dogfooding)

dev-workflow 플러그인은 자기 도메인 문서를 신규 `merge-to-domain` 스킬로 관리한다.
현재 6개 도메인 문서 (document-management, session-management, ux-consistency,
workflow-lifecycle, thinking-enhancement, project-customization)는 신규 스킬 도입 이전에
생성되었으므로 **첫 머지 시 호환성 체크리스트** (REQ-022)가 발동된다:

- 정책 ID 부재 → 사용자 결정 (자동 부여 vs 보존)
- 섹션 10 변경 이력 부재 → 시작점 행 자동 추가
- 의존성 맵 부재 → 머지에 필요할 때만 질문

마이그레이션을 별도 작업으로 만들지 않는다. 신규 스킬이 자연스럽게 첫 머지에서
점진 보완한다.
