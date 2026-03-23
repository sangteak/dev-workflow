# Phase 2: Discovery — Document Domain System

> 작성일: 2026-03-23
> 페르소나: 🛠️ Claude Code Expert / 🎯 Workflow Designer (리드) / 🔍 Ecosystem Analyst

## 2계층 문서 모델 = Git 브랜치 전략

| Git 개념 | 문서 개념 |
|---|---|
| main branch | domain.md |
| feature branch | feature/ 디렉토리 + 작업 문서들 |
| feature → main merge | feature 완료 → domain.md 통합 |
| feature branch 삭제 | feature/ 삭제 (아카이브 불필요) |
| issue branch | feature 내 issue/ (기존 패턴 그대로) |
| merge conflict | 수동 해소 (자동화 불가, 수용) |

## 핵심 결정사항

### 1. domain.md가 SSOT

- 해당 시스템의 현재 정책, 결정, 구조를 반영하는 영속 문서
- 유지보수 시 참조하는 대상 = domain.md

### 2. feature/는 작업 단위

- domain에 대한 변경 작업을 수행하는 임시 공간
- 완료 시 domain.md에 merge 후 삭제
- domain.md가 없으면 첫 feature 완료 시 승격

### 3. 크로스 도메인 변경 — pending 파일

- 현재 feature 디렉토리 안에 `_pending/[대상domain].pending.md` 생성
- merge 키워드만 기록, 상세 내용은 코드베이스 참조로 보완
- feature 폐기 시 pending도 함께 삭제 → domain.md 오염 방지

### 4. 충돌 해소

- 수동 처리 (git과 동일)
- 완전 자동화를 목표로 하지 않음

## domain 경계 정의 — 하이브리드 방식

### 규칙

| 상황 | 행동 | 판단 시점 |
|---|---|---|
| 기존 domain이 있는 시스템 수정 | 해당 domain 아래 feature 생성 → 완료 시 merge | feature 완료 시 |
| 기존 domain이 없는 시스템 수정 | feature 생성 → 완료 시 domain 승격 | feature 완료 시 |
| 새 시스템 개발 | feature로 시작 → 완료 시 독립 domain 승격 or 기존 domain merge 판단 | feature 완료 시 |
| domain에 넣었다가 분리 필요 | domain.md에서 해당 내용 분리 → 새 domain 생성 | 필요 시 수동 |

### 판단 기준

> "이 feature의 내용이 기존 domain.md의 한 섹션으로 자연스러운가?"

- Yes → 기존 domain에 merge
- No → 새 domain으로 승격

### domain ≠ category

- category: 상위 분류 (예: ai-system, dev-workflow)
- domain: 시스템 단위 (예: aggro-system, document-management)

## 디렉토리 구조

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
└── [feature-b]/                   ← 진행 중
    └── ...
```
