---
feature: document-management-policy
created: 2026-03-11
personas: Architect, Plugin Developer, End User, Claude Code Expert
---

# Phase 2: Discovery - Document Management Policy

## 미정의 영역 및 해결 결과

### ① 카테고리 생성/할당 정책
- 기본: 요구사항 분석 → 카테고리 추천 제시 → 사용자 확정
- 모호할 때만: 기존 카테고리 목록 제시 + 선택
- 신규 생성 시: 질의응답을 통해 적합한 카테고리명 도출
- 기존 카테고리는 `docs/design/` 하위 디렉토리 스캔으로 자동 획득

### ② 디렉토리 전체 구조 (안 B + archive 통합 확정)
```
docs/design/
└── [카테고리]/
    └── [기능명]/
        ├── [기능명].md              ← 최종 설계 문서 (항상 존재)
        ├── phase1_exploration.md    ← 브레인스토밍 중 존재
        ├── phase2_discovery.md      ← 브레인스토밍 중 존재
        ├── phase3_validation.md     ← 브레인스토밍 중 존재
        ├── plan.md                  ← 개발 중 존재
        ├── HANDOFF.md               ← 미완료 시 존재
        ├── issues/                  ← 서브 문제 발생 시
        │   └── [문제명]/
        │       ├── phase1~3.md
        │       └── [문제명].md
        └── _archive/               ← 개발 완료 후
            ├── phase1~3.md
            ├── plan.md
            └── HANDOFF.md
```

### ③ Plan 파일 네이밍
- 파일명: `plan.md` 고정 (기능 디렉토리가 구분자)
- 날짜는 프론트매터의 `created`, `last-updated`에 기록

### ④ 개발 중 문제 대응 정책 (git 전략 비유)

#### 4그룹 분류
| 그룹 | git 비유 | 상황 | 처리 |
|------|---------|------|------|
| I. 즉시 수정 | commit | 결함, 경미한 기술 이슈 | 코드 수정 후 계속, 필요 시 변경 이력 기록 |
| II. 설계 보완 | hotfix 브랜치 | 설계 누락, 접근 방식 변경, 요구사항 변경 | issues/ 서브 워크플로우 → 메인 통합 후 삭제 |
| III. 별도 기능 | feature 브랜치 | 의존 기능 필요, 도구, 대규모 리팩토링 | 별도 기능 디렉토리 → 정규 워크플로우 |
| IV. 별도 세션 | 다른 repo | 무관한 기존 기능 결함, 컨텍스트 한계 | 메모/HANDOFF → 새 세션 |

#### 판단 플로우
```
테스트 중 문제 발생
  │
  ├─ 코드 수정만으로 해결? → 그룹 I
  │
  └─ 설계 논의 필요?
       ├─ 현재 기능의 설계? → 그룹 II (issues/ hotfix)
       ├─ 새로운 기능 필요? → 그룹 III (별도 feature)
       └─ 현재 기능과 무관? → 그룹 IV (별도 세션)
```

#### issues/ (hotfix) 운영 정책
- 정규 4단계 워크플로우 동일 적용
- 완료 시: 내용을 부모 design 문서에 자연스럽게 흡수 (참조 링크 아닌 직접 통합)
- 통합 후: issues/[문제명]/ 디렉토리 삭제
- 중첩 금지: issues/ 내에서 새 문제 발견 시
  - 같은 맥락 → phase 리셋 (범위 확장)
  - 새 기능 필요 → 그룹 III 격상
  - 무관한 문제 → 그룹 IV 별도 세션

#### 별도 기능 판단 기준
- "이 문제의 해결 결과물이 현재 기능에만 속하는가?"
  - Yes → issues/ (hotfix)
  - No → 별도 기능 (feature)

### ⑤ 기존 문서 마이그레이션
- 범위 제외 (별도 처리)

### ⑥ HANDOFF 프론트매터 스펙
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

#### 세션 시작 시 탐색 로직
1. `docs/design/**/HANDOFF.md` glob 스캔
2. 발견 → 프론트매터 읽기 → last-updated 역순 정렬 → 목록 제시
3. 미발견 → docs/design/ 구조 분석 → phase/plan 존재 시 HANDOFF 자동 생성 제안
4. 목록 최상단에 "새 작업 시작" 옵션 제공
5. 이슈 HANDOFF는 부모 기능 하위에 들여쓰기 표시

### ⑦ 스킬 파일 수정 범위
#### 변경 필요
- brainstorming: 카테고리 선택 절차, 디렉토리 경로, issues/ 지원
- plan-stage: plan.md 위치 변경, 프론트매터
- context-handling: HANDOFF 위치/프론트매터, glob 탐색, 목록 UI, 복구 로직
- workflow-orchestrator: HANDOFF 목록 제시, 카테고리 구조 인식

#### 변경 불필요
- persona-resolution
- development-principles

#### 신규 스킬
- document-consolidation: 개발 완료 후 phase/plan → design 통합, issues/ 흡수 실행
