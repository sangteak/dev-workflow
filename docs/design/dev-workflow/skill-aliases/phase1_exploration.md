# Phase 1: Exploration — skill-aliases

> 탐색 완료: 2026-03-26

## 확정된 페르소나

- 🛠️ Claude Code Expert: Claude Code 플랫폼 제약, 스킬/훅/플러그인 메커니즘 관점
- 🎯 Workflow Designer: 워크플로우 UX, 단계 흐름, 사용자 경험 관점
- 🔍 Ecosystem Analyst: 경쟁 플러그인 비교, 생태계 트렌드 (국면 3 활성화)

## 시드 (사용자 확인 완료)

```yaml
goal: "dev-workflow 플러그인에 commands/ 디렉토리 기반의 독립 명령 파일을 추가하여, Claude Code 콘솔에서 슬래시 자동완성으로 스킬을 즉시 실행할 수 있게 한다."
constraints:
  - "Claude Code의 commands/ 디렉토리 메커니즘을 활용 (Ouroboros 패턴 참조)"
  - "코드 없는 문서 기반 플러그인 제약 유지"
  - "기존 스킬 로직(SKILL.md) 중복 없이 간접 호출"
  - "플러그인 prefix(dev-workflow:)는 자동 부여되므로 명령명 자체는 짧게"
non_goals:
  - "keyword-detector.py 같은 훅 스크립트 도입 (commands/만으로 충분)"
  - "자동 트리거 스킬(orchestrator, persona-resolution 등)에 별칭 추가"
  - "짧은 접두사(dw:) 도입 — 불필요"
success_criteria:
  - "/save 자동완성 → dev-workflow:save 선택 → 엔터로 즉시 실행"
  - "/resume 자동완성 → dev-workflow:resume 선택 → 엔터로 즉시 실행"
  - "기존 자연어 트리거 및 orchestrator 자동 invoke와 충돌 없음"
assumptions:
  - "Claude Code 플러그인의 commands/ 디렉토리가 슬래시 명령 자동완성에 등록됨"
  - "commands/ 파일에서 SKILL.md를 Read하여 간접 호출하는 패턴이 동작함"
  - "아규먼트는 commands/ 파일 내에 하드코딩 가능 (save.md → ARGUMENTS: save)"
open_questions:
  - "document-consolidation의 consolidate-issue 모드도 커맨드로 분리할 것인가?"
  - "향후 새 스킬 추가 시 커맨드 필요 여부 판단 기준을 문서화할 것인가?"
context: "현재 dev-workflow 스킬은 /dev-workflow:context-handling resume 같은 긴 슬래시 명령으로만 호출 가능. Claude Code 콘솔에서 슬래시 자동완성 시 엔터를 치면 아규먼트 없이 즉시 실행되어 서브커맨드 전달 불가."
```

## 명확도 체크리스트

| 항목 | 상태 | 설명 |
|------|------|------|
| Goal Clarity | ✅ | commands/ 기반 독립 명령 파일 추가 |
| Constraint Clarity | ✅ | 기존 패턴(Ouroboros) 참조, 문서 기반 유지 |
| Success Criteria | ⚠️ | 커맨드 대상 범위 미확정 (context-handling 2개 확정, 나머지 미정) |

## 탐색된 요구사항

### 핵심 문제
- Claude Code 콘솔에서 슬래시 명령 자동완성 시 엔터를 치면 아규먼트 없이 즉시 실행됨
- `/dev-workflow:context-handling` + `resume` 조합이 불가능
- 사용자는 세션 중 임의 시점에 save/resume을 직접 호출해야 함 (특히 컨텍스트 부족 시)

### Ouroboros 참조 메커니즘
- `commands/` 디렉토리에 독립 명령 파일(interview.md, run.md 등)을 배치
- 각 파일은 YAML frontmatter(description, aliases) + `Read the file at ${CLAUDE_PLUGIN_ROOT}/skills/[name]/SKILL.md` 형태
- UserPromptSubmit 훅의 keyword-detector.py도 있지만, 이번 스코프에서는 commands/만 활용

### 스킬별 커맨드 필요성 분석

| 스킬 | 분류 | 커맨드 필요 |
|------|------|------------|
| workflow-orchestrator | 자동 | 불필요 |
| persona-resolution | 자동 | 불필요 |
| brainstorming | 자동 | 불필요 |
| plan-stage | 자동 | 불필요 |
| context-handling | 혼합 | **필요** (save, resume) |
| development-principles | 참조 전용 | 불필요 |
| document-consolidation | 혼합 | 보류 (orchestrator 제안과 중복 UX 위험) |
| design-doc-index | 자동 | 불필요 |
| design-summary | 수동 | 이미 존재 |

### 사용자가 제외한 항목
- keyword-detector.py 같은 훅 스크립트: commands/만으로 충분
- dw: 짧은 접두사: 플러그인이 dev-workflow: prefix를 자동 부여하므로 불필요
- 자동 트리거 스킬에 대한 별칭: 필요 없음

## 페르소나 피드백 결과

### 합의 사항
- save.md / resume.md 분리 유지 (Claude Code 플랫폼 제약상 서브커맨드 불가)
- `consolidate-issue`는 orchestrator 제안 흐름과 중복 UX 위험이 있어 보류
- **커맨드 포함 기준을 먼저 정의**한 뒤 대상을 확정해야 함

### 비판에서 도출된 주요 쟁점
1. "자동 트리거 여부"와 "커맨드 제공 여부"는 직교 축 — 판단 기준 재정립 필요
2. consolidate-issue의 트리거 이중성(orchestrator 제안 + 수동 호출) 정리 필요
3. 커맨드 포함 조건을 정의해야 향후 일관성 유지 가능
