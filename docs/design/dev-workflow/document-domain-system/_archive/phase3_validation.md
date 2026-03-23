# Phase 3: Validation — Document Domain System

> 작성일: 2026-03-23
> 페르소나: 🛠️ Claude Code Expert / 🎯 Workflow Designer (리드) / 🔍 Ecosystem Analyst

## 시나리오 검증

### 검증 1: SearchTarget 전체 라이프사이클

```
[시작]
docs/design/ai-system/
├── aggro-system.md                ← domain (SSOT)

[feature 생성]
docs/design/ai-system/
├── aggro-system.md
└── search-target/
    ├── phase1~3, search-target.md
    └── _pending/
        └── aggro-system.pending.md

[완료 — "독립 domain으로 승격" 판단]
docs/design/ai-system/
├── aggro-system.md                ← pending 반영 완료
└── search-target-system.md        ← 새 domain 승격, feature/ 삭제
```

✅ 통과

### 검증 2: 소규모 유지보수

```
[feature 생성]
docs/design/ai-system/
├── aggro-system.md
└── threat-decay-tuning/

[완료 — "한 섹션으로 자연스러운가?" → Yes]
docs/design/ai-system/
├── aggro-system.md                ← merge 완료, feature/ 삭제
```

✅ 통과

### 검증 3: feature 폐기

```
search-target/ 작업 중단, 폐기 결정
→ search-target/ 디렉토리 삭제
→ _pending/aggro-system.pending.md도 함께 삭제
→ aggro-system.md 오염 없음
```

✅ 통과

### 검증 4: 다중 pending

```
search-target/_pending/
├── aggro-system.pending.md
└── perception-system.pending.md
```

각 pending이 대상 domain.md에 개별 반영. 특별한 추가 메커니즘 불필요.

✅ 통과

## 마이그레이션 계획

### 대상: 완료된 10개 feature → 4개 domain.md

| Domain | 포함 Feature | 비고 |
|---|---|---|
| **workflow-lifecycle.md** | completion-sequence, vcs-execution-strategy | vcs는 향후 분리 가능 |
| **document-management.md** | document-management-policy, design-doc-index, feature-group-summary | 이번 논의의 새 정책 반영, feature-group-summary는 domain.md 체계로 역할 변경 |
| **session-management.md** | context-handoff-automation, handoff-discovery-ux, issue-handoff-scope | |
| **ux-consistency.md** | persona-feedback-loop, status-keyword-standardization | input-interaction-consistency는 진행 중이므로 완료 후 적용 |

### 제외

- case-insensitive-path-search — 진행 중, 완료 후 새 정책 적용
- input-interaction-consistency — 진행 중, 완료 후 새 정책 적용

### 마이그레이션 실행 시점

현재 작업(스킬 파일 변경)이 완료되고 플러그인 패치 후 별도 작업으로 진행

## 스킬 변경 영향

| 스킬 | 변경 내용 |
|---|---|
| **document-consolidation** | feature.md → domain.md 통합 단계 추가, pending 반영 프로세스 추가 |
| **design-doc-index** | 인덱싱 대상: feature.md → domain.md 우선, 진행 중 feature.md 보조 |
| **design-summary** | feature-group-summary 역할을 대체, domain.md 기반으로 동작 변경 |
| **brainstorming** | phase 파일 생성 경로 변경 없음 (feature/ 안에 그대로) |
| **workflow-orchestrator** | 변경 없음 |
