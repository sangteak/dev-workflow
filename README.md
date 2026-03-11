# dev-workflow

Structured development workflow plugin for Claude Code.

Brainstorming → Plan → Develop → Review with persona-based feedback loops.

## Installation

### 1. Install Superpowers (prerequisite)

```bash
/plugin install superpowers@claude-plugins-official
```

### 2. Install dev-workflow

```bash
/plugin marketplace add sangteak/dev-workflow
/plugin install dev-workflow@sangteak-dev-workflow
```

### 3. Update

```bash
/plugin update dev-workflow@sangteak-dev-workflow
```

### Alternative: Manual Installation

마켓플레이스 설치가 동작하지 않을 경우:

```bash
git clone https://github.com/sangteak/dev-workflow.git
# 프로젝트의 .claude/settings.json에 추가:
```

```json
{
  "extraKnownMarketplaces": {
    "dev-workflow": {
      "source": {
        "source": "local",
        "directory": "/path/to/dev-workflow"
      }
    }
  },
  "enabledPlugins": {
    "dev-workflow@dev-workflow": true
  }
}
```

## Skills

| Skill | Description |
|---|---|
| `workflow-orchestrator` | Session start protocol, stage detection, Superpowers delegation |
| `persona-resolution` | Persona confirmation at session start |
| `brainstorming` | 5-phase brainstorming (Category → Exploration → Discovery → Validation → Consolidation) |
| `plan-stage` | Feasibility Assessment, OPEN_QUESTIONS processing, persona feedback loop |
| `context-handling` | HANDOFF.md creation and recovery |
| `development-principles` | Core development philosophy, self-improvement loop |
| `document-consolidation` | Design document consolidation and archival workflow |

## Workflow Overview

```
BRAINSTORM (dev-workflow)
  Phase 0: Category     → 카테고리 결정
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
docs/design/[category]/[feature]/
├── phase1_exploration.md   ← Phase 1 완료 시, 불변
├── phase2_discovery.md     ← Phase 2 완료 시, 불변
├── phase3_validation.md    ← Phase 3 완료 시, 불변
├── [feature].md            ← 최종 설계 문서
├── plan.md                 ← PLAN 단계에서 생성
├── HANDOFF.md              ← 세션 중단 시 임시 파일 (국면 완료 시 삭제)
├── issues/                 ← 서브 문제 발생 시
│   └── [issue-name]/
└── _archive/               ← 개발 완료 후

.claude/
└── personas.md             ← 프로젝트별 페르소나 오버라이드 (선택)

tasks/
├── lessons.md              ← 세션 간 학습 누적
└── todo.md                 ← Superpowers writing-plans 산출물
```

