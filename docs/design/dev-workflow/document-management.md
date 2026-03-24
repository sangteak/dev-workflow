> 설계 문서의 생성·탐색·통합·생명주기를 domain 단위 2계층 모델로 관리하는 정책과 도구 체계. 경로 해소 규칙을 포함하여 대소문자 차이에 의한 탐색 실패를 구조적으로 방지한다.

## 시스템 개요

dev-workflow 플러그인으로 브레인스토밍, 계획, 개발을 반복하면 기능별로 설계 문서와 plan 파일이 축적된다. 초기에는 feature 단위로 문서를 관리했으나, 기능이 누적되면서 두 가지 근본적 문제가 드러났다. 첫째, 파일 탐색이 어려워지고 서브에이전트의 컨텍스트 로딩 범위가 넓어졌다. 둘째, 크로스 feature 변경 시 개별 feature.md가 stale 되어 "코드베이스 캐시" 역할을 하지 못했다.

이 문제를 해결하기 위해 Git 브랜치 전략에서 착안한 2계층 문서 모델을 도입했다. domain.md가 main branch 역할을 하는 영속적 SSOT이고, feature/ 디렉토리는 feature branch처럼 임시 작업 공간으로 기능한다. feature 완료 시 domain.md에 통합(merge)하고 feature 디렉토리를 삭제하는 흐름이다. 이 모델 위에 문서 탐색(design-doc-index), 통합 요약(design-summary) 도구가 결합되어, 설계 문서의 생성부터 소비까지 전체 생명주기를 체계적으로 관리한다.

## 2계층 문서 모델

### 구조

Git의 main/feature branch 관계를 문서에 그대로 적용한다.

| Git 개념 | 문서 개념 |
|---|---|
| main branch | domain.md — SSOT, 영속 |
| feature branch | feature/ 디렉토리 — 임시, 완료 후 삭제 |
| feature → main merge | feature 완료 → domain.md 통합 |
| feature branch 삭제 | feature/ 디렉토리 삭제 (아카이브 불필요) |
| issue branch | feature 내 issues/ (기존 패턴 그대로) |
| merge conflict | 수동 해소 |

domain.md는 category 디렉토리 직속에 위치하며, 이 위치 자체가 domain 문서임을 판별하는 기준이다. 별도 메타데이터가 필요 없다.

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

### category와 domain의 구분

category는 상위 분류(예: ai-system, dev-workflow)이고, domain은 시스템 단위(예: aggro-system, document-management)다. 모든 명칭은 lowercase kebab-case를 따른다.

### domain 경계 결정

domain 경계는 사전에 정의하지 않고, 작업이 쌓이며 자연스럽게 형성되도록 한다. 사전 정의는 초기 판단 오류 위험이 있기 때문이다. 판단 기준은 "이 feature의 내용이 기존 domain.md의 한 섹션으로 자연스러운가?"이다.

| 상황 | 행동 | 판단 시점 |
|---|---|---|
| 기존 domain이 있는 시스템 수정 | 해당 domain 아래 feature 생성 → 완료 시 merge | feature 완료 시 |
| 기존 domain이 없는 시스템 수정 | feature 생성 → 완료 시 domain 승격 | feature 완료 시 |
| 새 시스템 개발 | feature로 시작 → 완료 시 독립 domain 승격 or 기존 domain merge 판단 | feature 완료 시 |
| domain에 넣었다가 분리 필요 | domain.md에서 해당 내용 분리 → 새 domain 생성 | 필요 시 수동 |

## 문서 생명주기

문서는 생성에서 통합까지 명확한 생명주기를 따른다.

```
[브레인스토밍]        [개발 중]           [개발 완료]

phase1~3.md ──── 독립 유지 ──────→ 삭제 (feature 디렉토리 전체)
                                   + 핵심 → domain.md 통합

feature.md ──── 요구사항 기준 ──→ domain.md에 merge 또는 승격
                                   + issues/ 통합
                                   = domain.md가 자기완결적 최종 문서

plan.md ──────── 멀티세션 참조 ──→ 삭제 (feature 디렉토리 전체)

HANDOFF.md ──── 세션 간 전달 ───→ 삭제 (feature 디렉토리 전체)

issues/ ──────── hotfix 작업 ───→ 부모에 통합 후 삭제
```

feature 완료 시 domain.md에 통합/승격 후 feature 디렉토리를 삭제한다. 기존의 별도 아카이브 정책은 2계층 모델 도입으로 불필요해졌다.

### 통합 정책

통합은 반자동으로 수행한다. REVIEW 완료 시점에 consolidate-main을 실행하여 phase/plan 내용을 feature.md에 통합한 뒤, 작업 내용을 분석하여 domain 병합 필요 여부를 판단 근거와 함께 제안한다. 판단 기준은 (1) domain.md에 없는 새 REQ가 있는가, (2) domain.md와 다른 설계 결정이 있는가의 두 가지다. 사용자가 제안을 override할 수 있다.

domain 병합 시 consolidate-domain(Mode 3)이 merge 또는 승격을 실행한 후 feature 디렉토리를 삭제한다. domain 병합을 스킵하는 경우(결함 수정 등) consolidate-main이 직접 feature 디렉토리 삭제를 제안한다. 어떤 경로든 feature 디렉토리는 작업 완료 후 삭제된다.

issues/ 통합은 "원래 하나였던 것처럼" 자연스럽게 병합한다. 최종 domain.md는 자기완결적이어야 한다 — 문서 하나로 해당 domain의 전체 맥락을 파악할 수 있어야 한다.

## 크로스 도메인 변경과 pending

feature 작업 중 다른 domain에 영향을 주는 변경이 발생할 수 있다. 이때 현재 feature 완료 전에 의존성 문서에 직접 반영하지 않는다. feature가 폐기될 수 있기 때문이다(Eager 업데이트 기각). 대신 feature 완료 시점에 대상 domain.md에 즉시 반영한다.

대상 domain.md가 아직 존재하지 않으면 `[category]/_pending/`에 pending 파일을 생성한다. pending 파일에는 merge 키워드만 기록하고, 상세 내용은 코드베이스 참조로 보완한다. 대상 domain 통합 시 pending을 소비 후 삭제하며, feature 폐기 시 pending도 함께 소멸하여 domain.md 오염을 방지한다.

충돌 해소는 git과 동일하게 수동 처리한다. 완전 자동화를 목표로 하지 않는다.

## 개발 중 문제 대응

개발 도중 발생하는 문제는 git 전략에 비유하여 4그룹으로 분류한다.

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

issues/ 서브 워크플로우는 정규 4단계를 동일하게 적용하며, 완료 시 부모 문서에 자연스럽게 통합 후 디렉토리를 삭제한다. issues/ 내 중첩은 금지한다 — 같은 맥락이면 phase 리셋, 새 기능이면 별도 격상, 무관하면 별도 세션으로 처리한다.

## HANDOFF 멀티세션 관리

HANDOFF.md는 feature 디렉토리 내에 배치하여 멀티세션 작업을 지원한다. 세션 시작 시 `docs/design/**/HANDOFF.md` glob 탐색으로 미완료 작업 목록을 제시한다. 별도 인덱스 파일 없이 glob 스캔만 사용하는데, 이는 멀티세션 경쟁 조건을 방지하기 위한 결정이다. HANDOFF의 존재 자체가 "미완료"를 의미하며, 별도 상태 머신이 필요 없다.

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (Phase N 단계명) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (Phase N 단계명)
  2. [카테고리] 기능명 (Phase N 단계명) — 최근: YYYY-MM-DD
```

HANDOFF 프론트매터에는 feature, category, current-phase, last-updated, is-issue, parent-feature를 기록한다. HANDOFF가 없지만 feature 디렉토리 구조가 존재하면, 구조 분석으로 상태를 추론하여 HANDOFF 자동 생성을 제안한다.

## 설계 문서 탐색

design-doc-index 스킬은 브레인스토밍/플랜 단계에서 기존 설계 문서를 자연어로 참조할 수 있게 한다. 새 기능 설계 시 관련 시스템의 설계를 이해해야 하는 경우가 빈번하기 때문이다.

두 가지 모드를 제공한다.

- **색인 모드**: "어떤 기능 있어?", "목록 보여줘" 같은 탐색적 발화에 반응. `status: complete` 문서의 메타데이터 목록(feature, 한 줄 요약, dependencies, affects)을 제시한다.
- **전체 로드 모드**: "~~ 참고해서", "~~ 기반으로" 같은 참조 발화에 반응. 키워드로 카테고리/기능 디렉토리를 부분 매칭(substring)하여 문서를 컨텍스트에 주입한다. 1~3건은 즉시 로드, 4건 이상은 목록 제시 후 사용자가 선택한다.

2계층 모델 도입 후 domain.md를 우선 인덱싱하도록 변경되었다. 출력에서 Domain과 Feature를 분리하여 표시하며, domain.md가 존재하는 시스템은 domain.md를 먼저 제시한다. 색인 방식은 별도 인덱스 파일 없이 실시간 스캔을 사용한다 — 동기화 문제가 없고 관리 비용이 제로이기 때문이다.

## 통합 요약 생성

design-summary 스킬(`/dev-workflow:design-summary`)은 관련 설계 문서 그룹을 기획서 수준의 통합 요약으로 재구성한다. "이 시스템 전체가 무엇인가"를 파악하기 위해 모든 문서를 개별로 열어야 하는 부담을 해소한다.

domain.md 도입 후 domain.md 자체가 통합 문서 역할을 하므로, design-summary는 domain.md 기반으로 요약하고 feature 문서는 보조적으로 참조하는 방식으로 변경되었다. 물리적 파일을 생성하지 않고 화면 출력만으로 동작하며, 매번 최신 상태를 보장한다.

명령 전용 호출 방식을 채택한 이유는 자연어 감지 시 브레인스토밍 중 "요약해줘"와 오탐이 발생할 수 있기 때문이다. 문서 4개 이상이면 서브에이전트 2단계 전략(병렬 추출 → 통합 재구성)을 사용하여 메인 컨텍스트 압박을 방지한다.

## 카테고리와 경로 규칙

브레인스토밍 시작 시 요구사항 분석 기반으로 카테고리를 추천하고, 추천이 모호할 경우에만 기존 카테고리 목록을 제시한다. 신규 카테고리 생성 시 질의응답으로 적합한 이름을 도출한다.

경로 규칙은 다음과 같다.

- 모든 문서 경로: `docs/design/[카테고리]/`
- domain 문서: `docs/design/[카테고리]/[domain].md`
- feature 작업 공간: `docs/design/[카테고리]/[기능명]/`
- issues: `docs/design/[카테고리]/[기능명]/issues/[문제명]/`
- pending: `docs/design/[카테고리]/_pending/` 또는 `docs/design/[카테고리]/[기능명]/_pending/`
- 카테고리/기능명/domain명: 모두 lowercase kebab-case

### 경로 해소 규칙

`docs/design/` 경로를 참조하는 스킬이 9개 중 7개에 달하며, 실제 디렉토리가 `Docs/Design` 등 표준과 다른 케이싱일 경우 탐색이 사일런트 실패한다. 예를 들어 `context-handling resume` 실행 시 디렉토리를 찾지 못해 "진행 중인 작업이 없습니다"가 출력되면 사용자는 플러그인을 신뢰하지 못하게 된다. 이를 구조적으로 방지하기 위해 탐색과 생성을 분리하는 경로 해소 규칙을 적용한다.

**탐색 시** — 하드코딩된 `docs/design/` 대신 `find . -maxdepth 2 -iname "docs" -type d`로 실제 경로를 먼저 확인한 후, 결과에서 `design` 하위 디렉토리를 찾아 해소된 경로를 사용한다. 미발견 시 명확한 안내 메시지를 출력한다. 경로 해소는 스킬 실행당 1회만 수행하며 매 glob마다 반복하지 않는다.

**생성 시** — 표준 경로 `docs/design/`을 고정 사용한다. 플러그인이 직접 생성하는 경로이므로 케이싱이 보장된다.

| 동작 | 경로 결정 방식 | 예시 |
|------|-------------|------|
| 탐색 | 경로 해소 결과 사용 | `[해소된 경로]/**/HANDOFF.md` glob |
| 생성 | 표준 `docs/design/` 고정 | `docs/design/[카테고리]/[기능명]/phase1.md` 생성 |

경로 해소 규칙은 `development-principles` 스킬에 공통 정의하고, 7개 스킬이 이를 참조하는 구조를 취한다. 각 스킬에 개별 삽입하면 7곳 중복으로 유지보수 부담이 커지고, CLAUDE.md 프로젝트 레벨에 정의하면 플러그인 배포 시 포함되지 않기 때문이다. `find -iname` 인라인 명령을 선택한 이유는 shell=bash 환경이 보장되는 상황에서 별도 스크립트 파일 없이 "코드 없는 Markdown 플러그인" 정체성을 유지할 수 있기 때문이다. 또한 "대소문자를 무시하라"는 추상적 지시 대신 실행할 명령을 명시하는 방식을 채택했는데, 이는 Claude 재량에 의존하면 이행이 불확실하다는 교훈에 기반한다.

## 관련 파일

| 파일 | 용도 |
|---|---|
| `skills/document-consolidation/SKILL.md` | phase/plan → design 통합, 작업 분석 기반 domain 병합 제안, feature 디렉토리 삭제 (consolidate-main, consolidate-issue, consolidate-domain 3모드) |
| `skills/design-doc-index/SKILL.md` | 설계 문서 색인 및 크로스레퍼런스, domain.md 우선 인덱싱 |
| `skills/design-summary/SKILL.md` | 관련 설계 문서 그룹의 통합 요약 생성 (명령 호출 전용) |
| `skills/brainstorming/SKILL.md` | 카테고리 선택 절차, 설계 문서 크로스레퍼런스 섹션 포함 |
| `skills/plan-stage/SKILL.md` | 설계 문서 크로스레퍼런스 섹션 포함 |
| `skills/context-handling/SKILL.md` | HANDOFF 멀티세션 지원, glob 탐색, 목록 UI |
| `skills/workflow-orchestrator/SKILL.md` | 세션 시작 HANDOFF 목록 탐색, 카테고리 구조 인식 |
| `skills/development-principles/SKILL.md` | 경로 해소 규칙 공통 정의, 7개 스킬이 참조 |

## 핵심 결정 사항

| 결정 사항 | 선택 | 근거 |
|---|---|---|
| 문서 관리 단위 | domain 단위 2계층 모델 (domain.md + feature/) | feature 단위는 크로스 feature 변경 시 stale, domain.md가 SSOT로 항상 최신 유지 |
| domain.md 판별 | 위치 기반 (category 디렉토리 직속 .md) | 별도 메타데이터 불필요, 구조 자체가 의미 전달 |
| domain 경계 결정 | 사후 발견 (작업 축적 후 자연 형성) | 사전 정의는 초기 판단 오류 위험 |
| feature 완료 후 처리 | domain.md 통합 후 feature 디렉토리 삭제 | 아카이브 불필요, git branch 삭제와 동일 |
| domain 병합 판단 | 작업 내용 분석 기반 선택적 제안 | 결함 수정 등 domain 영향 없는 작업이 존재, 무조건 필수화 기각 |
| 크로스 도메인 업데이트 | feature 완료 시점에 즉시 반영 (Eager 기각) | 미완료 feature 폐기 시 의존성 문서 오염 방지 |
| design/plan 관계 | 같은 feature 디렉토리에 통합 | 기능의 모든 문서를 한곳에서 관리, 서브에이전트 컨텍스트 로딩 효율 |
| HANDOFF 탐색 | glob 스캔 (인덱스 파일 없음) | 멀티세션 경쟁 조건 없음, 항상 최신, 추가 파일 불필요 |
| HANDOFF 상태 관리 | 존재 = 미완료 | 상태 머신 불필요, 단순 |
| 색인 방식 | 실시간 스캔 | 동기화 문제 없음, 관리 비용 제로 |
| 매칭 방식 | 디렉토리명 부분 매칭 (substring) | 단순, 기존 네이밍 규칙 활용, 1차 버전에 충분 |
| design-summary 트리거 | 명령 전용 (/dev-workflow:design-summary) | 자연어 감지 시 브레인스토밍 토론 요약과 오탐 위험 |
| design-summary 출력 | 화면 전용 (파일 미생성) | 원본 변경 시 outdated 방지, 매번 최신 보장 |
| 통합 요약 스타일 | 서사적 재구성 | 정보 나열보다 시스템을 자연스럽게 이해 가능 |
| issues/ 처리 | hotfix 전략, 중첩 금지 | 메인 워크플로우 오염 방지, 복잡도 방지 |
| feature-group-summary 역할 | domain.md가 대체 | domain.md 자체가 통합 문서이므로 별도 요약 기능 불필요 |
| 경로 탐색 전략 | 탐색/생성 분리 (탐색: case-insensitive 해소, 생성: 표준 경로 고정) | 사용자 환경의 케이싱 차이에 의한 사일런트 실패 방지 |
| 경로 해소 메커니즘 | `find -iname` 인라인 명령 | shell=bash 보장, 별도 스크립트 불필요, "코드 없는 플러그인" 정체성 유지 |
| 경로 해소 규칙 배치 | `development-principles`에 공통 정의 + 각 스킬 참조 | DRY (7곳 중복 회피), 플러그인 자체 완결 (CLAUDE.md 배치 시 배포 불가) |
| 경로 해소 지시문 | 실행할 명령을 명시 (추상 지시 기각) | Claude 재량 의존 시 이행 불확실 |
