---
feature: case-insensitive-path-search
category: dev-workflow
status: in-development
created: 2026-03-20
last-updated: 2026-03-23
dependencies: []
affects:
  - context-handling
  - brainstorming
  - design-doc-index
  - design-summary
  - document-consolidation
  - plan-stage
  - workflow-orchestrator
  - development-principles
---

# case-insensitive-path-search 설계 문서

> 한 줄 요약: `docs/design/` 경로 탐색 시 대소문자 차이로 작업을 찾지 못하는 사일런트 실패를 제거하여 플러그인 신뢰성을 확보한다.

## 1. 배경과 동기

- `context-handling resume` 실행 시, 실제 디렉토리가 `Docs/design` 등 표준과 다른 케이싱일 경우 작업 목록이 비어서 출력됨
- 사용자는 "진행 중인 작업이 없습니다"를 보고 플러그인을 신뢰하지 못하게 됨
- 결국 매번 디렉토리를 직접 뒤져봐야 하는 상황이 발생 — 플러그인의 존재 이유 상실
- `docs/design/` 경로를 참조하는 스킬이 9개 중 7개로, 단일 스킬 문제가 아닌 플러그인 전반의 구조적 취약점

## 2. 목표와 비목표

### 목표
- GOAL-001: 어떤 케이싱의 `docs/design` 디렉토리든 반드시 찾아내는 탐색 메커니즘 도입
- GOAL-002: 찾지 못하는 경우 0 — 신뢰성 기준 충족
- GOAL-003: "코드 없는 Markdown 플러그인" 정체성 유지

### 비목표
- 파일명(phase1_exploration.md 등)의 대소문자 변형 대응 — 파일명은 플러그인이 직접 생성하므로 케이싱이 보장됨
- Python/Node.js 등 런타임 스크립트 추가 — 플러그인 성격 변경 회피
- 사용자의 기존 디렉토리 자동 리네임/정규화 — 강제 변경 회피

## 3. 확정된 요구사항

- REQ-001: 탐색(glob, 존재 확인, 스캔) 시 `docs/design/` 경로를 case-insensitive로 해소한다 — 우선순위: HIGH
- REQ-002: 생성(mkdir, 파일 쓰기) 시 표준 경로 `docs/design/`을 고정 사용한다 — 우선순위: HIGH
- REQ-003: 경로 해소 규칙을 `development-principles`에 공통 정의하고, 7개 스킬이 이를 참조한다 — 우선순위: HIGH
- REQ-004: 경로 해소 실패 시(docs 디렉토리 자체가 없을 때) 명확한 안내 메시지를 출력한다 — 우선순위: MEDIUM

## 4. 설계 개요

### 핵심 전략: "경로 해소 스텝 (Path Resolution Step)"

`docs/design/` 탐색이 필요한 모든 시점에서, 하드코딩된 경로 대신 실제 경로를 먼저 확인한다.

```
[경로 해소 절차]
1. find . -maxdepth 2 -iname "docs" -type d 실행
2. 결과에서 design 하위 디렉토리 확인
3. 발견된 실제 경로를 이후 탐색에 사용
4. 미발견 → 안내 메시지 출력
```

### 적용 구조

```
development-principles (SKILL.md)
├── [기존 내용]
└── [신규] 경로 해소 규칙 섹션
      ├── 탐색 시: find -iname 기반 실제 경로 확보
      └── 생성 시: docs/design/ 고정

context-handling (SKILL.md)
├── 탐색 절차 상단에 "경로 해소 규칙 참조" 명시
└── 기존 docs/design/ 하드코딩 → "해소된 경로" 사용으로 변경

brainstorming (SKILL.md)
├── 카테고리 스캔 시 경로 해소 규칙 참조
└── 파일 생성 시 표준 경로 사용 (변경 없음)

[나머지 4개 스킬도 동일 패턴]
```

### 탐색 vs 생성 분리

| 동작 | 경로 결정 방식 | 예시 |
|------|-------------|------|
| 탐색 | 경로 해소 결과 사용 | `[해소된 경로]/**/HANDOFF.md` glob |
| 생성 | 표준 `docs/design/` 고정 | `docs/design/[카테고리]/[기능명]/phase1.md` 생성 |

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| development-principles | (없음) | context-handling, brainstorming, design-doc-index, design-summary, document-consolidation, plan-stage, workflow-orchestrator |
| context-handling | development-principles 경로 해소 규칙 | (사용자 대면 탐색 결과) |
| brainstorming | development-principles 경로 해소 규칙 | (카테고리 스캔 결과) |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 탐색 메커니즘 | `find -iname` 인라인 명령 | shell=bash 환경 보장, 크로스 플랫폼 호환 | Python/bash 스크립트 파일 | "코드 없는 플러그인" 정체성 훼손, 크로스 플랫폼 이슈 |
| 적용 방식 | 공통 규칙 + 참조 (방식 B) | DRY, 유지보수 1곳 | 각 스킬 개별 삽입 (A) | 7곳 중복, 유지보수 부담 |
| 적용 방식 | 공통 규칙 + 참조 (방식 B) | 플러그인 자체 완결 | CLAUDE.md 프로젝트 레벨 (C) | 플러그인 배포 시 포함 불가 |
| 지시문 구체성 | 실행할 명령을 명시 | lessons.md 교훈: "지시문과 실제 출력의 괴리" | "대소문자 무시하라" 추상 지시 | Claude 재량 의존, 이행 불확실 |

## 7. 제약조건과 가정

- Claude Code 실행 환경이 bash (또는 bash 호환 셸)임을 전제한다
- `find` 명령의 `-iname` 옵션이 사용 가능한 환경을 전제한다
- 파일명 케이싱은 플러그인이 생성하므로 항상 표준을 따른다는 가정
- 프로젝트 루트에서 `docs` 디렉토리까지 최대 2depth 이내에 위치한다는 가정

## 8. 기술 가이드라인

- `development-principles`에 추가하는 경로 해소 규칙은 섹션 단위로 독립 배치 — 기존 내용과 혼합하지 않을 것
- 각 스킬의 참조는 "경로 해소는 development-principles의 [섹션명]을 따른다" 한 줄로 충분
- 탐색 절차에서 `docs/design/` 하드코딩을 "해소된 경로"로 치환할 때, 생성 경로는 건드리지 않을 것
- 경로 해소는 스킬 실행당 1회만 수행 (매 glob마다 반복하지 않음)

## 9. 구현 결과 및 일탈 사항

> 구현 완료 후 작성

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-20 | 초안 작성 | 전체 | ready-for-plan |
