# Phase 2: Discovery — skill-aliases

> 발견 완료: 2026-03-26

## 국면 2에서 새로 발견된 미정의 영역

1. 커맨드 포함 기준 정의
2. commands/ 파일의 구체적 구조 (frontmatter, 본문, ARGUMENTS 전달)
3. document-consolidation 최종 판정
4. 기존 SKILL.md와의 연동 — ARGUMENTS 전달 메커니즘
5. 플러그인 디렉토리 구조 변경

## 각 항목에 대한 Q&A 결정 사항

### 1. 커맨드 포함 기준

**확정된 기준:**
> "사용자가 워크플로우 자동 흐름 밖에서, 임의의 시점에, 명시적 의도를 가지고 호출하는 스킬"

이 기준으로 판별:
- save/resume: 컨텍스트 부족 인지 시 직접 호출 → **포함**
- design-summary: 자연어 감지 없는 수동 전용 → **포함**
- consolidate 계열: orchestrator Completion Protocol이 제안/자동 invoke → **제외**

### 2. ARGUMENTS 전달 메커니즘 (기술 검증 완료)

**검증 결과:**
- Ouroboros의 `{{ARGUMENTS}}`는 사용자 입력으로 치환되는 템플릿 변수
- 그러나 dev-workflow의 경우 콘솔 자동완성에서 엔터 시 아규먼트 없이 실행되는 문제가 있으므로, `{{ARGUMENTS}}`가 아닌 **하드코딩 방식** 채택
- save.md에 `ARGUMENTS: save`를 하드코딩하면 SKILL.md 로드 시 args로 전달됨

**Ouroboros 참조 파일 확인:**
- `interview.md`, `evolve.md`, `welcome.md`: `{{ARGUMENTS}}` 사용
- `run.md`, `evaluate.md`, `cancel.md`: ARGUMENTS 없음
- dev-workflow는 하드코딩 패턴 사용 (Ouroboros와 다른 접근)

### 3. document-consolidation 최종 판정

**제외 확정.** 이유:
- `consolidate-main`: Completion Protocol이 자동 invoke
- `consolidate-issue`: orchestrator가 제안 형태로 트리거
- 커맨드 포함 기준("자동 흐름 밖에서 임의 시점에 호출")에 해당하지 않음

### 4. commands/ 파일 구조

```markdown
---
description: "짧은 설명"
---

Read the file at `${CLAUDE_PLUGIN_ROOT}/skills/[스킬명]/SKILL.md`
using the Read tool and follow its instructions exactly.

ARGUMENTS: [하드코딩된 아규먼트]
```

### 5. 플러그인 디렉토리 구조

```
dev-workflow/
├── .claude-plugin/
├── commands/          ← 신규
│   ├── save.md
│   ├── resume.md
│   └── design-summary.md
├── hooks/
├── skills/
└── docs/
```

- `plugin.json`에 별도 등록 불필요 (Claude Code가 commands/ 자동 스캔)
- design-summary.md는 기존 스킬의 커맨드 래퍼

## 확정된 커맨드 목록

| 커맨드 파일 | 대상 스킬 | ARGUMENTS | 설명 |
|-------------|-----------|-----------|------|
| save.md | context-handling | save | 세션 컨텍스트를 HANDOFF.md에 저장 |
| resume.md | context-handling | resume | HANDOFF.md에서 작업 복구 |
| design-summary.md | design-summary | (없음) | 설계 문서 통합 요약 생성 |

## 페르소나 피드백 결과

### 합의 사항
- 커맨드 포함 기준 확정: "자동 흐름 밖, 임의 시점, 명시적 의도"
- ARGUMENTS 전달: 하드코딩 방식 ({{ARGUMENTS}} 대신)
- document-consolidation 제외 확정
- commands/ 디렉토리 플러그인 루트에 배치
- 대상: save.md, resume.md (신규), design-summary.md (래퍼)
