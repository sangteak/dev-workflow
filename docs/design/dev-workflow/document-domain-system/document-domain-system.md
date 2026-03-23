---
title: Document Domain System
status: complete
last-updated: 2026-03-23
---

> 설계 문서 관리를 feature 단위에서 domain 단위 2계층 모델로 전환. domain.md가 SSOT, feature/는 임시 작업 공간.

## 1. 배경 및 동기

기존 feature 단위(aggro-*, peek-*) 설계 문서 구조에서 크로스 feature 변경 시 문서가 stale 되는 문제 발생. feature.md가 "코드베이스 캐시" 역할을 하도록 설계했으나, 다른 feature 작업으로 인한 정책 변경이 반영되지 않아 결국 코드를 다시 읽게 되는 상황.

## 2. 목표

- GOAL-001: 설계 문서가 항상 현재 시스템 상태를 정확히 반영
- GOAL-002: 크로스 feature 변경 시 문서 오염 방지
- GOAL-003: "어디를 봐야 하는가?"에 대한 명확한 답 제공

## 3. 핵심 설계 — 2계층 문서 모델

Git 브랜치 전략과 동일한 구조:

| Git 개념 | 문서 개념 |
|---|---|
| main branch | domain.md (SSOT, 영속) |
| feature branch | feature/ 디렉토리 (임시, 완료 후 삭제) |
| feature → main merge | feature 완료 → domain.md 통합 |
| feature branch 삭제 | feature/ 디렉토리 삭제 (아카이브 불필요) |
| issue branch | feature 내 issue/ (기존 패턴 그대로) |
| merge conflict | 수동 해소 |

### 디렉토리 구조

```
docs/design/[category]/
├── [domain].md                    ← SSOT (영속)
│
├── [feature-a]/                   ← 작업 단위 (완료 후 삭제)
│   ├── phase1_exploration.md
│   ├── phase2_discovery.md
│   ├── phase3_validation.md
│   ├── feature-a.md
│   └── _pending/
│       └── [other-domain].pending.md
│
└── [category]/_pending/           ← domain.md가 없는 대상의 pending
    └── [domain].pending.md
```

### category ≠ domain

- category: 상위 분류 (예: ai-system, dev-workflow)
- domain: 시스템 단위 (예: aggro-system, document-management)

## 4. 정책

### domain.md 생성

- 첫 feature 완료 시 domain.md가 없으면 승격 (feature.md → domain.md)
- 이미 있으면 기존 domain.md에 merge

### domain 경계 — 하이브리드 방식

| 상황 | 행동 | 판단 시점 |
|---|---|---|
| 기존 domain이 있는 시스템 수정 | 해당 domain 아래 feature 생성 → 완료 시 merge | feature 완료 시 |
| 기존 domain이 없는 시스템 수정 | feature 생성 → 완료 시 domain 승격 | feature 완료 시 |
| 새 시스템 개발 | feature로 시작 → 완료 시 독립 domain 승격 or 기존 domain merge 판단 | feature 완료 시 |
| domain에 넣었다가 분리 필요 | domain.md에서 해당 내용 분리 → 새 domain 생성 | 필요 시 수동 |

**판단 기준:** "이 feature의 내용이 기존 domain.md의 한 섹션으로 자연스러운가?"

### 크로스 도메인 변경

- 현재 feature 완료 전에 의존성 문서에 직접 반영하지 않음 (폐기 위험)
- feature 완료 시점에 대상 domain.md에 즉시 반영 (코드베이스 참조)
- 대상 domain.md가 없으면 `[category]/_pending/`에 pending 파일 생성

### pending 파일

- merge 키워드만 기록, 상세 내용은 코드베이스 참조로 보완
- 대상 domain 통합 시 소비 후 삭제
- feature 폐기 시 pending도 함께 소멸 (domain.md 오염 방지)

### 충돌 해소

- 수동 처리 (git과 동일, 완전 자동화를 목표로 하지 않음)

### feature 완료 후

- domain.md에 통합/승격 후 feature 디렉토리 삭제 (아카이브 불필요)

## 5. 기술 결정

| 결정 | 근거 |
|---|---|
| domain.md 판별 = 위치 기반 | category 디렉토리 직속 .md = domain, 하위 디렉토리 내 = feature. 별도 메타데이터 불필요 |
| Eager 업데이트 기각 | 현재 feature가 폐기될 수 있어 의존성 문서 즉시 반영은 위험 |
| pending 즉시 반영 (완료 시) | feature 완료 시점은 변경이 확정되었으므로 안전 |
| domain 경계는 사후 발견 | 사전 정의는 초기 판단 오류 위험, 작업이 쌓이며 자연 형성 |
| feature-group-summary 역할 대체 | domain.md 자체가 통합 문서이므로 별도 요약 기능 불필요 |

## 6. 영향받은 스킬

| 스킬 | 변경 내용 |
|---|---|
| document-consolidation | Mode 3 (consolidate-domain) 추가 — merge/승격/pending 처리 |
| design-doc-index | domain.md 우선 인덱싱, 위치 기반 판별, 출력 Domain/Feature 분리 |
| design-summary | domain.md 기반 요약, feature 보조 |
| brainstorming | 변경 없음 |
| workflow-orchestrator | 변경 없음 |

## 7. 마이그레이션 계획

현재 완료된 10개 feature를 4개 domain.md로 통합 (별도 작업으로 진행):

| Domain | 포함 Feature |
|---|---|
| workflow-lifecycle.md | completion-sequence, vcs-execution-strategy |
| document-management.md | document-management-policy, design-doc-index, feature-group-summary |
| session-management.md | context-handoff-automation, handoff-discovery-ux, issue-handoff-scope |
| ux-consistency.md | persona-feedback-loop, status-keyword-standardization |

진행 중 2개(case-insensitive-path-search, input-interaction-consistency)는 완료 후 새 정책 적용.

## 8. 변경 이력

| 날짜 | 변경 | 범위 | 상태 |
|---|---|---|---|
| 2026-03-23 | 초기 설계 및 구현 — 3개 스킬 변경, v1.4.0 | 전체 | 완료 |
