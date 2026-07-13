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
| fixup commit | 이슈 카드 — feature 내 `issues/NNN-*.md` (임시 로그, 해소 시 삭제) |
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

**문서 진실 계층 (v1.18.0):** 설계 문서(`[기능명].md`)가 feature의 단일 진실이며 변경은 즉시 반영한다. phase 파일은 국면 완료 시점의 동결 스냅샷이다 — "불변"의 의미는 완료 시점 동결이며, 이슈발 변경은 phase가 아니라 설계 문서에 반영된다. plan.md는 살아있는 실행 문서로 남은 태스크에 영향이 있는 변경만 갱신한다. 이슈 카드는 임시 과정 로그로 해소 시 삭제한다 (SSOT 이중화 금지).

```
[브레인스토밍]        [개발 중]           [개발 완료: 작업자]      [도메인 머지: 관리자]

phase1~3.md ──── 독립 유지 ──────→ 삭제 (consolidate-main)
                                   + 핵심 → feature.md 통합

feature.md ──── 요구사항 기준 ──→ status: complete로 보존 ──→ domain.md에 merge 또는 승격
                                                              후 디렉토리 삭제 (merge-to-domain)
                                                              = domain.md가 자기완결적 최종 문서

plan.md ──────── 멀티세션 참조 ──→ 삭제 (consolidate-main)

HANDOFF.md ──── 세션 간 전달 ───→ 삭제 (consolidate-main)

이슈 카드 ────── 경량 사이클 로그 ─→ 반영(부모 §10 등) 후 삭제
```

feature 완료 시 domain.md에 통합/승격 후 feature 디렉토리를 삭제한다. 기존의 별도 아카이브 정책은 2계층 모델 도입으로 불필요해졌다. 통합과 삭제의 행위자·시점은 아래 2단계 파이프라인을 따른다.

### 통합 정책 — 2단계 파이프라인 (작업자/관리자 분리)

다중 작업자 환경에서 여러 명이 같은 domain.md를 직접 수정하면 머지 충돌·의미 손실·권한 경계 모호 문제가 발생하므로, 통합 책임을 두 단계로 분리한다 (2026-07 domain-merge-pipeline이 구 단일 흐름을 대체).

**작업자 단계 (consolidate-main):** REVIEW 완료 시점에 phase/plan 내용을 feature.md에 통합하고 `status: complete`로 마킹한다. 중간 산출물(phase/plan/HANDOFF/seed)만 삭제하고 `[기능명].md`는 보존한다 — 이 파일이 도메인 머지 후보다. 작업자는 domain.md를 직접 수정하지 않는다.

**관리자 단계 (merge-to-domain):** 관리자가 `/dev-workflow:merge-to-domain [카테고리]`를 명시적으로 호출하여 complete feature들을 domain.md에 intelligent merge한다. 5단계 알고리즘(domain 학습 → feature 학습 → 머지 계획 → 적용 → 검증)으로 진행하며, 다음 안전장치가 강제된다:

- **Structured digest**: 자유 서술 요약을 금지하고 정책/결정/REQ를 구조화 추출 — 비결정성 차단, 머지 후 statement 매칭 검증의 기준선
- **Architect 라운드**: 충돌 복잡도에 따라 외부 분류 규칙으로 라운드 등급(1~3)을 결정 — LLM 자기 신뢰 편향 차단
- **dry-run 게이트**: 자동 수정도 회계 형식으로 노출하고 사용자 승인 후에만 적용. 어떤 자동 모드 플래그로도 생략 불가
- **첫 머지 호환성 체크리스트**: 신규 머지 흐름 이전에 생성된 도메인 문서(frontmatter·ID·변경 이력 부재)를 첫 머지에서 점진 보완 — 별도 마이그레이션 없음
- **병렬 2-pass**: 다중 카테고리 병렬 시 서브에이전트는 학습·분류까지만, 사용자 결정과 SSOT 수정은 메인에서 직렬 처리

머지 검증 통과 시 merge-to-domain이 feature 디렉토리를 삭제한다(커밋 2건: 머지+삭제). 관리자 판단의 참고 기준은 (1) domain.md에 없는 새 REQ가 있는가, (2) domain.md와 다른 설계 결정이 있는가의 두 가지다.

구 흐름(consolidate-main이 병합을 제안하고 Mode 3이 실행)은 v1.18.0에서 제거됐다 — document-consolidation은 consolidate-main 단일 모드이며, 승격·크로스 도메인 pending 소비 경로는 merge-to-domain으로 이관 완료됐다.

최종 domain.md는 자기완결적이어야 한다 — 문서 하나로 해당 domain의 전체 맥락을 파악할 수 있어야 한다.

## 크로스 도메인 변경과 pending

feature 작업 중 다른 domain에 영향을 주는 변경이 발생할 수 있다. 이때 현재 feature 완료 전에 의존성 문서에 직접 반영하지 않는다. feature가 폐기될 수 있기 때문이다(Eager 업데이트 기각). 대신 feature 완료 시점에 대상 domain.md에 즉시 반영한다.

대상 domain.md가 아직 존재하지 않으면 `[category]/_pending/`에 pending 파일을 생성한다. pending 파일에는 merge 키워드만 기록하고, 상세 내용은 코드베이스 참조로 보완한다. 대상 domain 통합 시 pending을 소비 후 삭제하며, feature 폐기 시 pending도 함께 소멸하여 domain.md 오염을 방지한다.

충돌 해소는 git과 동일하게 수동 처리한다. 완전 자동화를 목표로 하지 않는다.

## 개발 중 문제 대응

DEVELOP 중 계획 밖 결함은 이슈 카드로 대응한다 (v1.18.0 — 구 issues/ 서브워크플로우·4그룹 분류를 대체). 핵심 원칙은 두 가지다: 어떤 결함이든 분석이 수정에 선행하고, 이슈는 한 번에 하나만 활성화한다. 상세 규범은 workflow-orchestrator 「Issue Lifecycle」이 SSOT다.

**행동 기반 트리거:** 현재 plan 태스크 범위 밖의 결함 수정을 위해 코드 수정 도구를 잡는 순간, 이슈 카드 생성이 선행되어야 한다. 판정 기준은 발화 해석이 아니라 plan.md 대조(기계적)다 — 발화 키워드 감지는 표현이 무한히 다양해 기각됐다. 현재 태스크 범위 내 발견은 SDD의 기존 fix 루프가 처리하고(카드 없음), 태스크 경계 밖(완료 태스크 회귀·범위 밖 부작용·Evaluator FAIL·사용자 리포트)만 카드 대상이다.

**이슈 카드 — 구조가 곧 상태:** `issues/NNN-[문제명].md` 단일 파일에 5필드(심각도·증상 / 원인·영향 범위·수정 방향)를 기록한다. 증상·심각도만 있으면 대기, 분석 절이 채워지면 활성(항상 1장), 파일이 없으면 해소다. frontmatter·상태값·phase·HANDOFF가 없다 — 카드 자체가 대기열이며 번호 접두가 순서를 고정한다 (FIFO 추천 + 심각도 새치기 허용). 무관해 보이는 결함도 현 feature의 카드로 적재한다 (구 "메모 후 별도 세션" 분기는 의도적 미계승 — 실사용 관측 중).

**경량 3박자 사이클 (경미·중간):** ① 분석 — 카드의 "수정 방향"이 수정 작업의 입력이 된다 (카드 없이 수정 시작 불가 — 구조적 강제) ② 수정 — 같은 워크트리에서 구현+테스트 ③ 반영 — 부모 설계 문서 §10에 1~2줄, 설계 본문·plan은 실제 영향이 있을 때만 갱신 → 카드 삭제.

**크리티컬 2경로:** 심각도 "크리티컬" 기록이 판별문을 발동한다 — "설계 문서 §2(목표·비목표)가 그대로 유효한가?" Yes면 제자리 재계획(같은 feature·워크트리·브랜치에서 설계 갱신 → plan-stage 재계획 진입 → writing-plans 재호출), No면 아카이브+승계(§9/§10 기록 → `_archive/[기능명]/` 이동 → 원 브랜치 HEAD에서 새 feature 분기). 감지·분류 제안은 자동이고, 경로 전환 실행은 확인 게이트를 거친다.

**경계선과 구형 호환:** feature가 열려 있으면 이슈 카드, 닫혔으면(complete/머지됨) 별도 feature다. 구형 이슈 디렉토리(`issues/[문제명]/`)는 공존을 허용하며 세션 탐색에서 발견 시 안내만 한다 — 자동 변환 없음.

## HANDOFF 멀티세션 관리

HANDOFF.md는 feature 디렉토리 내에 배치하여 멀티세션 작업을 지원한다. 세션 시작 시 `docs/design/**/HANDOFF.md` glob 탐색으로 미완료 작업 목록을 제시한다. 별도 인덱스 파일 없이 glob 스캔만 사용하는데, 이는 멀티세션 경쟁 조건을 방지하기 위한 결정이다. HANDOFF의 존재 자체가 "미완료"를 의미하며, 별도 상태 머신이 필요 없다.

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (Phase N 단계명) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (진행 중 | 구형: 현재 단계)
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
- 이슈 카드: `docs/design/[카테고리]/[기능명]/issues/NNN-[문제명].md` (구형 디렉토리 `issues/[문제명]/`는 공존 허용)
- pending: `docs/design/[카테고리]/_pending/` 또는 `docs/design/[카테고리]/[기능명]/_pending/`
- 아카이브: `docs/design/[카테고리]/_archive/[기능명]/` (크리티컬 승계로 닫힌 feature — 세션 목록 제외)
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
| `skills/document-consolidation/SKILL.md` | phase/plan → feature.md 통합, 중간 산출물 삭제, [기능명].md 보존 (consolidate-main 단일 모드 — v1.18.0 Mode 2·3 제거) |
| `skills/merge-to-domain/SKILL.md` | 관리자 도메인 머지 파이프라인 — 5단계 알고리즘, structured digest, Architect 라운드, dry-run 게이트, feature 디렉토리 삭제 (`/dev-workflow:merge-to-domain`) |
| `skills/design-doc-index/SKILL.md` | 설계 문서 색인 및 크로스레퍼런스, domain.md 우선 인덱싱 |
| `skills/design-summary/SKILL.md` | 관련 설계 문서 그룹의 통합 요약 생성 (명령 호출 전용) |
| `skills/brainstorming/SKILL.md` | 카테고리 선택 절차, 설계 문서 크로스레퍼런스 섹션 포함 |
| `skills/plan-stage/SKILL.md` | 설계 문서 크로스레퍼런스 섹션 포함 |
| `skills/context-handling/SKILL.md` | HANDOFF 멀티세션 지원, glob 탐색, 목록 UI |
| `skills/workflow-orchestrator/SKILL.md` | 세션 시작 HANDOFF 목록 탐색, 카테고리 구조 인식, 「Issue Lifecycle」 절 (이슈 카드 규범 SSOT) |
| `skills/development-principles/SKILL.md` | 경로 해소 규칙 공통 정의, 7개 스킬이 참조 |

## 핵심 결정 사항

| 결정 사항 | 선택 | 근거 |
|---|---|---|
| 문서 관리 단위 | domain 단위 2계층 모델 (domain.md + feature/) | feature 단위는 크로스 feature 변경 시 stale, domain.md가 SSOT로 항상 최신 유지 |
| domain.md 판별 | 위치 기반 (category 디렉토리 직속 .md) | 별도 메타데이터 불필요, 구조 자체가 의미 전달 |
| domain 경계 결정 | 사후 발견 (작업 축적 후 자연 형성) | 사전 정의는 초기 판단 오류 위험 |
| feature 완료 후 처리 | domain.md 통합 후 feature 디렉토리 삭제 | 아카이브 불필요, git branch 삭제와 동일 |
| domain 병합 트리거 | 관리자 명시 호출 (`/dev-workflow:merge-to-domain`) — 구 "작업 내용 분석 기반 선택적 제안"을 대체 | 다중 작업자 환경에서 작업자의 domain 직접 수정은 충돌·권한 경계 모호 유발. 관리자 호출 타이밍이 자연스러운 게이트 |
| 통합 책임 분리 | 작업자(feature까지) / 관리자(domain) 2단계 | 권한 분리, 통합 책임 일원화. complete 상태가 머지 대기 신호 |
| 크로스 도메인 업데이트 | feature 완료 시점에 즉시 반영 (Eager 기각) | 미완료 feature 폐기 시 의존성 문서 오염 방지 |
| design/plan 관계 | 같은 feature 디렉토리에 통합 | 기능의 모든 문서를 한곳에서 관리, 서브에이전트 컨텍스트 로딩 효율 |
| HANDOFF 탐색 | glob 스캔 (인덱스 파일 없음) | 멀티세션 경쟁 조건 없음, 항상 최신, 추가 파일 불필요 |
| HANDOFF 상태 관리 | 존재 = 미완료 | 상태 머신 불필요, 단순 |
| 색인 방식 | 실시간 스캔 | 동기화 문제 없음, 관리 비용 제로 |
| 매칭 방식 | 디렉토리명 부분 매칭 (substring) | 단순, 기존 네이밍 규칙 활용, 1차 버전에 충분 |
| design-summary 트리거 | 명령 전용 (/dev-workflow:design-summary) | 자연어 감지 시 브레인스토밍 토론 요약과 오탐 위험 |
| design-summary 출력 | 화면 전용 (파일 미생성) | 원본 변경 시 outdated 방지, 매번 최신 보장 |
| 통합 요약 스타일 | 서사적 재구성 | 정보 나열보다 시스템을 자연스럽게 이해 가능 |
| issues/ 처리 (v1.18.0 supersede) | 이슈 카드 경량 사이클 + 크리티컬 2경로 — 구 issues/ 서브워크플로우·4그룹 분류 대체 | 정규 4국면은 경미 수정에 과함(실사용 실증) — 무거움이 우회의 원인 |
| 이슈 트리거 (v1.18.0) | 행동 기반 — 계획 밖 결함 수정에 코드 도구를 잡는 순간 카드 선행 (태스크 범위 기준) | 발화 감지는 과발동·미발동 동시 위험(사용자 기각) — plan 대조 판정은 기계적 |
| 이슈 카드 (v1.18.0) | `issues/NNN-*.md` 단일 파일 — 구조가 곧 상태, 카드의 "수정 방향"이 수정의 입력물(구조적 강제) | 별도 장부·상태값 불필요(mtime 불신), 경고문 단독은 2릴리스 연속 실패 실측 |
| 크리티컬 처리 (v1.18.0) | 판별문("설계 §2 유효?") + 2경로 — 제자리 재계획 기본 / `_archive/` 승계 예외 | 항상 닫고 새 feature는 자기유발 비용 — 정체성 유지 시 안 떠나는 게 정답 |
| Mode 2·3 폐기 (v1.18.0) | document-consolidation은 consolidate-main 단일 모드 | 반영은 사이클에 흡수(이중 마무리 소멸), pending 소비는 merge-to-domain 이관 |
| hotfix 은유 (v1.18.0) | 폐기 — 실제 동작 서술로 대체 | 경미 카드의 실체는 fixup 커밋 — 어긋난 은유는 오독 유발 |
| 완료 후 문제 경계선 (v1.18.0) | 열린 feature=이슈 카드 / 닫힌 feature=별도 feature, 구형 디렉토리는 공존+안내 | complete 되돌리기 복잡 — 별도 feature가 정확한 도구, "마이그레이션 없음" 선례 유지 |
| feature-group-summary 역할 | domain.md가 대체 | domain.md 자체가 통합 문서이므로 별도 요약 기능 불필요 |
| 경로 탐색 전략 | 탐색/생성 분리 (탐색: case-insensitive 해소, 생성: 표준 경로 고정) | 사용자 환경의 케이싱 차이에 의한 사일런트 실패 방지 |
| 경로 해소 메커니즘 | `find -iname` 인라인 명령 | shell=bash 보장, 별도 스크립트 불필요, "코드 없는 플러그인" 정체성 유지 |
| 경로 해소 규칙 배치 | `development-principles`에 공통 정의 + 각 스킬 참조 | DRY (7곳 중복 회피), 플러그인 자체 완결 (CLAUDE.md 배치 시 배포 불가) |
| 경로 해소 지시문 | 실행할 명령을 명시 (추상 지시 기각) | Claude 재량 의존 시 이행 불확실 |

## 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-07-08 | 기존 문서 — 신규 머지 시작 이전 | - | - |
| 2026-07-08 | domain-merge-pipeline 통합 (작성자: 권상택) — 통합 정책을 2단계 파이프라인으로 supersede, 생명주기·결정표·관련 파일 갱신 | 문서 생명주기, 핵심 결정 사항, 관련 파일, 변경 이력 신설 | 완료 |
| 2026-07-13 | issue-lifecycle 통합 (작성자: Sangtaek Kwon (권상택)) — 개발 중 문제 대응을 이슈 카드 체계로 supersede, 문서 진실 계층·경로 규칙·결정표 현행화 | 2계층 문서 모델, 문서 생명주기, 개발 중 문제 대응, HANDOFF 멀티세션 관리, 카테고리와 경로 규칙, 관련 파일, 핵심 결정 사항 | 완료 |
