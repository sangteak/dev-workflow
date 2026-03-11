---
feature: document-management-policy
category: dev-workflow
status: ready-for-plan
created: 2026-03-11
last-updated: 2026-03-11
dependencies: []
affects:
  - brainstorming skill
  - plan-stage skill
  - context-handling skill
  - workflow-orchestrator skill
---

# Document Management Policy 설계 문서

> 한 줄 요약: dev-workflow 플러그인의 중간 기록용 문서들을 카테고리 기반으로 관리하고, 문서 생명주기를 체계화하여 멀티세션 환경에서 효율적으로 운영한다.

## 1. 배경과 동기

dev-workflow를 통해 브레인스토밍, 계획, 개발을 진행하면 기능별로 design 문서와 plan 파일이 생성된다. 현재는 `docs/design/`과 `docs/plans/`에 플랫 구조로 저장되어, Peek 기능만으로도 8개 이상의 디렉토리가 동일 레벨에 나열되는 상황이다.

기능이 누적될수록:
- 파일 탐색이 어려워짐
- Claude Code 서브에이전트의 컨텍스트 로딩 범위가 넓어짐
- 관련 기능 간의 그룹핑이 불가능
- 향후 인덱싱/검색 스킬 도입 시 검색 범위를 좁힐 수 없음

또한 HANDOFF.md가 루트에 단일 파일로 존재하여 멀티세션 작업이 불가능하고, 개발 완료 후 중간 문서(phase, plan)의 정리 정책이 없어 불필요한 파일이 계속 쌓인다.

## 2. 목표와 비목표

### 목표
- GOAL-001: 도메인/시스템 단위 카테고리로 문서를 계층화한다
- GOAL-002: 문서의 생명주기(생성→활용→통합→아카이브)를 명확히 정의한다
- GOAL-003: 멀티세션 환경에서 독립적인 HANDOFF 관리를 지원한다
- GOAL-004: 개발 중 발생하는 서브 문제를 격리하여 처리하는 구조를 제공한다
- GOAL-005: 최종 design 문서를 자기완결적으로 만들어 향후 요구사항 변경에 대응한다

### 비목표
- 기존 GW 프로젝트 문서의 마이그레이션 (별도 작업)
- 운영 고려사항 (배포/모니터링/롤백)
- 인덱싱/검색 스킬 구현 (향후 과제)

## 3. 확정된 요구사항

### 디렉토리 구조
- REQ-001: 문서를 도메인/시스템 단위 카테고리로 그룹핑한다 — 우선순위: HIGH
- REQ-002: design과 plan을 하나의 기능 디렉토리에 통합한다 — 우선순위: HIGH
- REQ-003: archive를 기능 디렉토리 내 `_archive/`로 관리한다 — 우선순위: HIGH
- REQ-004: plan 파일명을 `plan.md`로 고정하고, 날짜는 프론트매터에 기록한다 — 우선순위: MEDIUM

### 카테고리 관리
- REQ-005: 브레인스토밍 시작 시 요구사항 분석 기반 카테고리 추천을 제시한다 — 우선순위: HIGH
- REQ-006: 추천이 모호할 경우에만 기존 카테고리 목록을 제시한다 — 우선순위: MEDIUM
- REQ-007: 신규 카테고리 생성 시 질의응답으로 적합한 이름을 도출한다 — 우선순위: MEDIUM

### HANDOFF 멀티세션
- REQ-008: HANDOFF.md를 기능 디렉토리 내에 배치한다 — 우선순위: HIGH
- REQ-009: 세션 시작 시 glob 탐색으로 미완료 HANDOFF 목록을 제시한다 — 우선순위: HIGH
- REQ-010: 목록을 last-updated 역순으로 정렬하고 최상단에 "새 작업 시작"을 배치한다 — 우선순위: HIGH
- REQ-011: HANDOFF 미존재 시 docs/design/ 구조 분석으로 상태를 추론하여 HANDOFF 자동 생성을 제안한다 — 우선순위: MEDIUM
- REQ-012: 인덱스 파일 없이 glob 스캔만 사용한다 (멀티세션 경쟁 방지) — 우선순위: HIGH

### 문서 생명주기
- REQ-013: 개발 완료 후 phase/plan/HANDOFF를 `_archive/`로 이동하고, 핵심 내용을 최종 design 문서에 통합한다 — 우선순위: HIGH
- REQ-014: 통합은 반자동으로 수행한다 (REVIEW 완료 시 제안 → 사용자 승인 → 자동 실행) — 우선순위: HIGH
- REQ-015: 최종 design 문서는 자기완결적이어야 한다 (문서 하나로 기능의 전체 맥락 파악 가능) — 우선순위: HIGH

### 개발 중 문제 대응 (issues/)
- REQ-016: 설계 보완이 필요한 서브 문제를 `issues/[문제명]/`에서 hotfix 전략으로 처리한다 — 우선순위: HIGH
- REQ-017: issues/ 서브 워크플로우는 정규 4단계를 동일 적용한다 — 우선순위: MEDIUM
- REQ-018: 이슈 완료 시 부모 design 문서에 자연스럽게 통합 후 issues/ 디렉토리를 삭제한다 — 우선순위: HIGH
- REQ-019: issues/ 내 중첩을 금지한다 (같은 맥락 → phase 리셋, 새 기능 → 별도 격상, 무관 → 별도 세션) — 우선순위: HIGH

## 4. 설계 개요

### 디렉토리 구조

```
docs/design/
└── [카테고리]/
    └── [기능명]/
        ├── [기능명].md              ← 최종 설계 문서 (항상 존재)
        ├── phase1_exploration.md    ← 브레인스토밍 중
        ├── phase2_discovery.md      ← 브레인스토밍 중
        ├── phase3_validation.md     ← 브레인스토밍 중
        ├── plan.md                  ← 개발 중
        ├── HANDOFF.md               ← 미완료 시
        ├── issues/                  ← 서브 문제 발생 시
        │   └── [문제명]/
        │       ├── phase1~4 + [문제명].md
        │       └── HANDOFF.md
        └── _archive/               ← 개발 완료 후
            ├── phase1~3.md
            ├── plan.md
            └── HANDOFF.md
```

### 문서 생명주기

```
[브레인스토밍]        [개발 중]           [개발 완료]

phase1~3.md ──── 독립 유지 ──────→ _archive/ 이동
                                   + 핵심 → design 흡수

[기능명].md ──── 요구사항 기준 ──→ + plan 핵심 흡수
                                   + issues/ 통합
                                   = 자기완결적 최종 문서

plan.md ──────── 멀티세션 참조 ──→ _archive/ 이동

HANDOFF.md ──── 세션 간 전달 ───→ _archive/ 이동

issues/ ──────── hotfix 작업 ───→ 부모에 통합 후 삭제
```

### 개발 중 문제 대응 (git 전략 비유)

```
테스트 중 문제 발생
  │
  ├─ 코드 수정만으로 해결?
  │  → 그룹 I (commit): 즉시 수정, 계속 진행
  │
  └─ 설계 논의 필요?
       │
       ├─ 현재 기능의 설계?
       │  → 그룹 II (hotfix): issues/ 서브 워크플로우
       │
       ├─ 새로운 기능 필요?
       │  → 그룹 III (feature): 별도 기능 디렉토리, 정규 워크플로우
       │
       └─ 현재 기능과 무관?
          → 그룹 IV (다른 repo): 메모 후 별도 세션
```

### 세션 시작 HANDOFF 목록

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (Phase N 단계명) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (Phase N 단계명)
  2. [카테고리] 기능명 (Phase N 단계명) — 최근: YYYY-MM-DD
```

### HANDOFF 프론트매터

```yaml
---
feature: [기능명]
category: [카테고리명]
current-phase: "[Phase N 단계명]"
last-updated: YYYY-MM-DD
is-issue: false
parent-feature: ""
---
```

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| brainstorming skill | 카테고리 경로 규칙 | phase 파일 생성 위치, design 문서 템플릿 |
| plan-stage skill | 카테고리 경로 규칙, Superpowers writing-plans | plan.md 생성 위치 |
| context-handling skill | HANDOFF 프론트매터 스펙, glob 탐색 | 세션 복구 로직 |
| workflow-orchestrator skill | context-handling, HANDOFF 스펙 | 세션 시작 프로토콜 |
| document-consolidation skill (신규) | design 문서 템플릿, issues/ 구조 | 최종 문서 통합, _archive/ 관리 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| design/plan 관계 | 통합 (같은 디렉토리) | 기능의 모든 문서를 한곳에서 관리, 서브에이전트 컨텍스트 로딩 효율 | 분리 유지 (별도 plans/) | 두 경로 탐색 필요, 관리 분산 |
| archive 위치 | 기능 디렉토리 내 `_archive/` | 기능 단위 응집도, 디렉토리 이동/삭제 용이 | 별도 `docs/archive/` | 기능 맥락과 분리됨 |
| HANDOFF 탐색 | glob 스캔 | 경쟁 조건 없음, 항상 최신, 추가 파일 불필요 | 루트 인덱스 파일 | 멀티세션 경쟁 충돌, 동기화 필요 |
| HANDOFF 상태 관리 | 존재 = 미완료 | 상태 머신 불필요, 단순 | active/paused 상태 플래그 | 복잡도 대비 가치 부족 |
| 서브 문제 처리 | issues/ (hotfix 전략) | 메인 워크플로우 오염 방지, 폐기 용이 | design 문서 직접 수정 | 논의 과정 미보존, 롤백 불가 |
| issues/ 통합 방식 | 부모에 자연스럽게 흡수 후 삭제 | git merge 후 branch 삭제와 동일, 최종 문서 일관성 | 참조 링크로 연결 | 자기완결성 훼손 |
| issues/ 중첩 | 금지 (리셋/격상/별도세션) | 복잡도 방지 | 중첩 허용 | 관리 불가, hotfix 원칙 위반 |

## 7. 제약조건과 가정

### 제약조건
- Superpowers writing-plans 스킬의 파일 출력 경로 제어 가능 여부 미확인 (제어 불가 시 후처리 이동)
- Claude의 지능적 문서 병합 품질이 복잡한 설계 문서에서 일관적이지 않을 수 있음

### 가정
- 프로젝트당 카테고리 수는 수십 개 이내 (glob 성능 이슈 없음)
- 동시 활성 HANDOFF는 10개 미만 (목록 UI에서 관리 가능)
- 사용자는 문서 통합 결과를 리뷰할 의향이 있음

## 8. 기술 가이드라인

### 경로 규칙
- 모든 문서 경로: `docs/design/[카테고리]/[기능명]/`
- 카테고리: 도메인/시스템 단위 소문자 kebab-case
- 기능명: 소문자 kebab-case
- archive: `docs/design/[카테고리]/[기능명]/_archive/`
- issues: `docs/design/[카테고리]/[기능명]/issues/[문제명]/`

### 스킬 수정 범위
| 스킬 | 변경 내용 |
|------|----------|
| brainstorming | 카테고리 선택 절차 추가, 디렉토리 경로 변경, issues/ 진입/탈출 로직 |
| plan-stage | plan.md 위치 변경, 프론트매터 스펙 적용 |
| context-handling | HANDOFF 위치/프론트매터 변경, glob 탐색, 목록 UI, 복구 로직 |
| workflow-orchestrator | 세션 시작 HANDOFF 목록 제시, 카테고리 구조 인식 |
| document-consolidation (신규) | phase/plan → design 통합, issues/ 흡수, _archive/ 이동 |

### 통합 정책
- 통합은 반자동: 완료 시점에 제안 → 사용자 승인 → 자동 실행
- 자동 병합 결과를 사용자에게 보여주고 확인 후 확정
- issues/ 통합은 "원래 하나였던 것처럼" 자연스럽게 병합

## 9. 구현 결과 및 일탈 사항

> 구현 완료 후 작성

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-11 | 초기 설계 문서 작성 | 전체 | 완료 |

## PERSONAS_USED
- 🏛️ Architect: 디렉토리 구조, 확장성, 문서 생명주기 설계
- 🔧 Plugin Developer: 스킬 구현 관점, 기술 타당성 검토
- 👤 End User: 실사용 경험, 사용성 관점
- 🏆 Claude Code Expert: 서브에이전트 최적화, 컨텍스트 로딩 효율
