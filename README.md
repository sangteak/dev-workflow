# dev-workflow

Structured development workflow plugin for Claude Code.

Brainstorming → Plan → Develop → Review with persona-based feedback loops.

## Installation

### 1. Install Superpowers (prerequisite)

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### 2. Install dev-workflow

```bash
/plugin marketplace add sangteak/dev-workflow
/plugin install dev-workflow@dev-workflow
```

## Skills

| Skill | Description |
|---|---|
| `workflow-orchestrator` | Session start protocol, stage detection, Superpowers delegation |
| `persona-resolution` | Persona confirmation at session start |
| `brainstorming` | 4-phase brainstorming (Exploration → Discovery → Validation → Consolidation) |
| `plan-stage` | Feasibility Assessment, OPEN_QUESTIONS processing, persona feedback loop |
| `context-handling` | HANDOFF.md creation and recovery |
| `development-principles` | Core development philosophy, self-improvement loop |

## Workflow Overview

```
BRAINSTORM (dev-workflow)
  Phase 1: Exploration  → phase1_exploration.md
  Phase 2: Discovery    → phase2_discovery.md
  Phase 3: Validation   → phase3_validation.md
  Phase 4: Consolidation → [feature].md
        ↓
PLAN (dev-workflow)
  Feasibility Assessment (Persona 3인)
  OPEN_QUESTIONS 처리
  설계 방향 수립
        ↓ Superpowers writing-plans
DEVELOP (Superpowers subagent-driven-development)
        ↓
REVIEW (Superpowers requesting-code-review)
```

## File Structure per Feature

```
docs/design/[feature]/
├── phase1_exploration.md   ← Phase 1 완료 시, 불변
├── phase2_discovery.md     ← Phase 2 완료 시, 불변
├── phase3_validation.md    ← Phase 3 완료 시, 불변
├── [feature].md            ← 최종 설계 문서
└── HANDOFF.md              ← 세션 중단 시 임시 파일 (국면 완료 시 삭제)

.claude/
└── personas.md             ← 프로젝트별 페르소나 오버라이드 (선택)

tasks/
├── lessons.md              ← 세션 간 학습 누적
└── todo.md                 ← Superpowers writing-plans 산출물
```

## Versioning

버전 업데이트 시 `.claude-plugin/plugin.json` 의 `version` 필드를 변경한다.

팀원은 `/plugin update dev-workflow` 로 최신 버전을 적용한다.
