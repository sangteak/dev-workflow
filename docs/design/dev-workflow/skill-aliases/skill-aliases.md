---
feature: skill-aliases
category: dev-workflow
status: complete
created: 2026-03-26
last-updated: 2026-03-26
dependencies: []
affects:
  - context-handling
  - design-summary
---

# skill-aliases 설계 문서

> 한 줄 요약: commands/ 디렉토리 기반의 독립 명령 파일을 추가하여, Claude Code 콘솔에서 슬래시 자동완성으로 스킬을 즉시 실행할 수 있게 한다.

## 1. 배경과 동기

- 현재 dev-workflow 스킬은 `/dev-workflow:context-handling resume` 같은 긴 슬래시 명령으로만 호출 가능
- Claude Code 콘솔에서 슬래시 자동완성 시 엔터를 치면 아규먼트 없이 즉시 실행됨
- 따라서 `context-handling save`, `context-handling resume` 같은 서브커맨드 전달이 불가능
- Ouroboros 플러그인은 `commands/` 디렉토리에 독립 명령 파일을 배치하여 이 문제를 해결

## 2. 목표와 비목표

### 목표
- GOAL-001: commands/ 디렉토리에 독립 명령 파일을 추가하여 콘솔 자동완성 즉시 실행 지원
- GOAL-002: 기존 스킬 로직(SKILL.md) 중복 없이 간접 호출 구조 유지

### 비목표
- keyword-detector.py 같은 훅 스크립트 도입 (commands/만으로 충분)
- 자동 트리거 스킬(orchestrator, persona-resolution 등)에 별칭 추가 (불필요)
- 짧은 접두사(dw:) 도입 (플러그인 prefix가 자동 부여됨)

## 3. 확정된 요구사항

- REQ-001: commands/save.md 생성 — context-handling 스킬을 `ARGUMENTS: save`로 호출 — 우선순위: HIGH
- REQ-002: commands/resume.md 생성 — context-handling 스킬을 `ARGUMENTS: resume`로 호출 — 우선순위: HIGH
- REQ-003: commands/design-summary.md 생성 — design-summary 스킬의 커맨드 래퍼 — 우선순위: MEDIUM
- REQ-004: 커맨드 포함 기준을 CLAUDE.md에 문서화 — 우선순위: LOW

## 4. 설계 개요

### 아키텍처

```
사용자 입력: /save (콘솔 자동완성)
    ↓
Claude Code: dev-workflow:save 매칭 → commands/save.md 로드
    ↓
commands/save.md: "Read SKILL.md" + "ARGUMENTS: save"
    ↓
SKILL.md: args 라우팅 → save 모드 실행
```

### commands/ 파일 구조

각 command 파일은 Ouroboros 패턴을 따르되, 하드코딩된 ARGUMENTS를 사용한다:

```markdown
---
description: "짧은 설명"
---

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/[스킬명]/SKILL.md`
using the Read tool and follow its instructions exactly.

ARGUMENTS: [하드코딩된 아규먼트]
```

### 플러그인 디렉토리 변경

```
dev-workflow/
├── .claude-plugin/
├── commands/          ← 신규 디렉토리
│   ├── save.md        ← context-handling save
│   ├── resume.md      ← context-handling resume
│   └── design-summary.md  ← design-summary 래퍼
├── hooks/
├── skills/
└── docs/
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| commands/save.md | skills/context-handling/SKILL.md | 없음 (신규 진입점) |
| commands/resume.md | skills/context-handling/SKILL.md | 없음 (신규 진입점) |
| commands/design-summary.md | skills/design-summary/SKILL.md | 없음 (래퍼) |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 아규먼트 전달 방식 | 하드코딩 (ARGUMENTS: save) | 콘솔 자동완성 즉시 실행 문제 해결 | {{ARGUMENTS}} 템플릿 | 자동완성 시 아규먼트 입력 불가 |
| 명령 분리 단위 | 서브커맨드별 분리 (save.md, resume.md) | Claude Code가 서브커맨드 미지원 | 단일 명령 + 내부 분기 | 원래 문제(아규먼트 전달 불가) 반복 |
| 커맨드 대상 범위 | 수동 호출 스킬만 (3개) | 자동 트리거 스킬은 불필요 | 전체 스킬에 별칭 | 오버엔지니어링, UX 혼란 |
| 훅 스크립트 도입 | 미도입 | commands/만으로 충분 | keyword-detector.py | 코드 없는 플러그인 제약, 불필요한 복잡성 |

## 7. 제약조건과 가정

### 제약조건
- 코드 없는 문서 기반 플러그인 유지
- Claude Code의 commands/ 자동 스캔 메커니즘에 의존

### 가정
- Claude Code 플러그인 시스템이 commands/ 디렉토리를 자동 스캔하여 슬래시 명령에 등록함
- commands/ 파일 본문이 Claude 프롬프트로 전달되어 SKILL.md와 함께 컨텍스트에 포함됨
- plugin.json에 별도 등록 불필요 (Ouroboros 선례)

## 8. 기술 가이드라인

### 커맨드 포함 기준
> "사용자가 워크플로우 자동 흐름 밖에서, 임의의 시점에, 명시적 의도를 가지고 호출하는 스킬"

이 기준에 해당하는 스킬만 commands/ 파일을 생성한다.

### 구현 규칙
1. commands/ 파일은 SKILL.md 로직을 중복하지 않는다 — Read + ARGUMENTS만 포함
2. 하드코딩된 ARGUMENTS를 사용한다 ({{ARGUMENTS}} 미사용)
3. frontmatter의 description은 콘솔 자동완성 시 표시되는 설명이므로 간결하게 작성
4. 구현 후 반드시 콘솔 자동완성 → 엔터 → 실행 흐름 테스트

### Ouroboros 패턴과의 차이점
- Ouroboros: `{{ARGUMENTS}}`로 사용자 입력을 동적 전달
- dev-workflow: `ARGUMENTS: [값]`으로 하드코딩 전달
- 이유: 콘솔 자동완성 즉시 실행 시 사용자가 아규먼트를 입력할 기회가 없음

## 9. 구현 결과 및 일탈 사항

- 설계대로 commands/ 디렉토리에 3개 파일(save.md, resume.md, design-summary.md) 생성 완료
- design-summary.md는 구현 규칙 2번(하드코딩)의 의도된 예외로 `{{ARGUMENTS}}` 패턴을 사용 — 사용자 입력(키워드, 카테고리, 기능명)을 전달해야 하므로
- CLAUDE.md에 커맨드 포함 기준 및 Core Components 업데이트 완료
- 콘솔 자동완성 통합 테스트는 플러그인 설치 후 수동 검증 예정

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-26 | 초기 설계 문서 작성 | - | ready-for-plan |
| 2026-03-26 | 개발 완료 — 문서 통합 | 전체 | 완료 |
