---
feature: domain-merge-pipeline
category: dev-workflow
status: complete
created: 2026-05-18
last-updated: 2026-05-18
dependencies:
  - document-consolidation (기존 스킬, 변경 대상)
  - workflow-orchestrator (기존 스킬, Completion Protocol 변경)
affects:
  - document-consolidation (consolidate-main 모드에서 domain 머지 로직 제거 + Mode 3 deprecate)
  - workflow-orchestrator (Completion Protocol 동작 변경)
  - context-handling (resume 모드에 카운트 알림 추가)
  - CLAUDE.md (스킬 11개 갱신, 자기-도그푸딩 가이드 추가)
  - plugin.json/marketplace.json (1.8.0 → 1.9.0 MINOR)
---

# domain-merge-pipeline 설계 문서

> 한 줄 요약: 관리자가 슬래시 명령으로 트리거하는 intelligent domain 머지 파이프라인을 구축하여 여러 작업자의 complete 상태 feature 문서를 domain.md SSOT에 의미 보존 방식으로 통합한다.

---

## 1. 배경과 동기

dev-workflow 플러그인은 `docs/design/[category]/[feature]/[feature].md` 구조로 기능별 설계 문서를 관리하며, 동일 카테고리의 도메인 문서(`[category].md` 형태의 통합 SSOT)를 함께 운영한다. 현재 워크플로우는 단일 작업자 환경을 가정하여 다음과 같이 동작한다:

- 작업자가 feature 작업 완료 시점에 `document-consolidation` 스킬을 통해 phase/plan 파일을 feature 문서로 통합
- 같은 스킬이 즉시 도메인 문서로 머지를 제안
- 작업자가 도메인 문서를 직접 수정·커밋

이 모델은 여러 작업자가 같은 카테고리의 도메인 문서를 동시에 수정하는 팀 환경에서 다음 문제를 발생시킨다:

1. **작업 동시성 충돌** — 여러 작업자가 각자 동일 도메인 문서를 최신화하면 머지 충돌과 의미 손실 발생
2. **검증 부재** — concat 방식 통합으로 인한 중복·모순 누적, 머지 시 의미 보존 검증 메커니즘 없음
3. **권한 경계 모호** — 작업자가 도메인 문서를 직접 건드릴 수 있어 카테고리 단위 정책 일관성 보장이 어려움

본 기능은 다음 통찰을 바탕으로 머지 책임을 분리한다:

- 도메인 문서의 1차 독자는 **Claude Code**이며, 코드베이스 탐색 전 도메인 컨텍스트를 빠르게 로드하는 용도다. 따라서 사람 가독성보다 **의미 보존과 SSOT 일관성**이 최우선이다.
- "머지는 단순 텍스트 합치기가 아니라 정책 충돌 식별 + 의미 보존이 본질"이므로 **intelligent merge가 머지 스킬의 핵심 가치**다.

---

## 2. 목표와 비목표

### 목표

- **GOAL-001**: 다중 작업자 환경에서 일관된 도메인 문서(SSOT) 유지
- **GOAL-002**: feature 문서 → 도메인 문서로의 머지를 의미 보존 방식(intelligent merge)으로 수행
- **GOAL-003**: 작업자(feature)와 관리자(도메인) 책임 명확 분리. 작업자는 도메인 문서에 직접 접근하지 않는다
- **GOAL-004**: 머지 작업의 안전성(dry-run, 검증, 사용자 승인 게이트)을 강제하여 SSOT 손상 위험 통제
- **GOAL-005**: dev-workflow의 자기 도그푸딩 — 기존 도메인 문서들에 신규 머지 흐름을 후속 호환 가능하게 적용

### 비목표

- CI/CD 환경에서의 자동 머지 (AI 활용 한계로 명시적 제외)
- 작업자 측 domain.md 직접 편집 권한 제공
- 코드 변경과 문서의 일관성 검증 (별도 linter 책임으로 분리)
- git 외 다른 VCS 또는 자체 롤백 메커니즘 (git 위임으로 충분)
- 사람 가독성 최우선 (주 독자는 Claude Code, 의미 보존 우선)
- concat/append 기반 단순 문서 합치기
- 신규 스킬 이전 만들어진 도메인 문서의 사후 마이그레이션 작업

---

## 3. 확정된 요구사항

### 스킬 구조

- **REQ-001**: 신규 `merge-to-domain` 스킬을 생성한다 — 우선순위: HIGH
  - 슬래시 명령: `/dev-workflow:merge-to-domain`
  - 단일 진입점에서 도메인 머지 전담
- **REQ-002**: 기존 `document-consolidation` 스킬을 단순화한다 — 우선순위: HIGH
  - consolidate-main 모드는 **feature 문서 통합만** 담당 (phase/plan → feature.md)
  - 기존의 domain 머지 제안 로직은 제거
  - consolidate-issue 모드는 변경 없음
- **REQ-003**: `workflow-orchestrator`의 Completion Protocol을 갱신한다 — 우선순위: HIGH
  - Step 1 호출 결과가 더 이상 도메인 머지를 제안하지 않음을 반영

### 머지 알고리즘

- **REQ-004**: 머지 알고리즘은 5단계로 구성한다 — 우선순위: HIGH
  - (1) domain.md 학습
  - (2) feature.md 학습
  - (3) 머지 계획 수립
  - (4) 적용
  - (5) 검증
- **REQ-005**: (1)(2) 학습 단계는 **structured digest**를 산출한다 — 우선순위: HIGH
  - 자유 서술 요약은 금지
  - YAML 형식의 ID 기반 구조 (스키마는 섹션 8 참조)
  - **idempotent 의무**: 동일 입력에 대해 동일 ID/순서 보장 (ID 부여 = 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호)
  - **학습 단계 사용자 게이트**: 각 digest 산출 직후 사용자에게 "이렇게 해석이 맞나요?" 확인 1회 (Yes/수정)
- **REQ-006**: (3) 머지 계획은 정책 충돌을 식별하고 **자동 수정 vs 사용자 결정**으로 분류한다 — 우선순위: HIGH
  - 자동 수정: ID 충돌 renumbering, 표 형식 통일(헤더 동일 시만), 충돌 없는 신규 항목 append
  - 사용자 결정: 새 섹션 신설, 의미 충돌, 기존 결정 무효화, 의존성 맵 재정의
  - 분류 애매한 경우 사용자 결정으로 fallback (보수 원칙)
- **REQ-007**: (3) 머지 계획 단계에서 🏛️ Architect 페르소나 피드백 루프를 발동한다 — 우선순위: HIGH
  - 모든 머지에서 발동 (skip 없음)
  - 라운드 수는 외부 분류 규칙으로 결정 (1~3)
- **REQ-008**: (5) 검증은 🔧 Tech Lead 또는 📋 PM 페르소나가 담당한다 — 우선순위: HIGH
  - Architect와 별개 페르소나로 자기 검증 사각지대 회피
  - 체크리스트 항목: 정책 ID 보존, supersede 없는 정책 누락 X, 변경 이력 행 추가, 라인 수 변화율 ±50% 이내

### 안전 절차

- **REQ-009**: dry-run plan을 사용자에게 표시한 뒤 승인을 받아야 도메인 문서 적용을 수행한다 — 우선순위: HIGH
  - 자동 수정 항목도 **회계 형식**으로 노출 (수정 전/후 + 참조 갱신 위치)
- **REQ-010**: 머지 실패 시 in-session resolution을 우선한다 — 우선순위: MEDIUM
  - 4지 선택: (a) 🔧 Tech Lead 추가 투입 (b) 직접 수정 (c) skip (d) abort
  - abort는 사용자 명시 요청 시에만
- **REQ-011**: skip된 feature는 디렉토리를 보존하여 다음 머지 세션에서 재후보로 등장한다 — 우선순위: MEDIUM
- **REQ-012**: 충돌 시 사용자 질문을 우선한다 — 우선순위: HIGH
  - 사용자가 사전 승인한 경우만 자동 처리 가능
  - 사전 승인은 `--auto` 플래그 또는 보조 키워드 인식 + 1차 confirm

### 실행 모드

- **REQ-013**: 단일 카테고리 내 후보들은 git log의 main 머지 순서에 따라 누적 base 직렬 처리한다 — 우선순위: HIGH
  - no-git-mode에서는 파일 mtime 우선
- **REQ-014**: 카테고리 간 후보들은 병렬 처리 가능 — 우선순위: MEDIUM
  - 풀 크기 기본값 3, 상한 5 (`MERGE_POOL_SIZE` 환경 변수로 조정)
  - 처리 완료 시 다음 후보를 즉시 투입 (rolling pool)
- **REQ-015**: 시스템이 복합 임계값으로 실행 모드를 능동 판단한다 — 우선순위: MEDIUM
  - `feature_count < 3 AND tokens < 20K` → 순차 자동
  - `feature_count ≥ 5 OR tokens > 50K` → 병렬 자동
  - 그 외 → 사용자 3지 선택 (순차/병렬/자동위임)
  - 토큰 추정: `file_size_bytes / 3.5` (`MERGE_TOKEN_DIVISOR` 환경 변수로 조정)
- **REQ-016**: 병렬 모드에서 사용자 결정 큐는 FIFO 직렬화한다 — 우선순위: HIGH
  - 한 번에 하나의 결정 질문만 노출
  - 결정 대기 카테고리는 일시 정지, 다른 카테고리는 계속 진행
  - **노출 규칙**: 카테고리 워커가 "사용자 결정 필요" 항목 도달 시 메인 큐에 push (FIFO) → 메인이 큐에서 1개씩 꺼내 노출 → 사용자 응답 후 해당 워커 재개
- **REQ-017**: 출력은 카테고리 시작 순서대로 buffered 출력한다 — 우선순위: MEDIUM
  - 실시간 인터리브 금지
  - **flush 규칙**: 각 카테고리 결과를 buffer에 보관 → 시작 순서(git log main 머지 순서) 빠른 카테고리 결과부터 flush → 시작 순서가 빠른 카테고리가 진행 중이면 후속 출력 보류

### 부수 동작

- **REQ-018**: 빈 상태 케이스는 한 줄 출력 후 종료한다 — 우선순위: LOW
  - 메시지: `현재 '{category}' 카테고리에 머지 가능한 complete feature가 0건입니다.`
- **REQ-019**: 머지 성공 후 feature 디렉토리는 통째로 삭제한다 — 우선순위: MEDIUM
  - phase 파일, plan.md, [feature].md 모두 삭제
  - 역사적 맥락은 git log에 위임
- **REQ-020**: 도메인 문서의 섹션 10에 변경 이력을 자동 기록한다 — 우선순위: MEDIUM
  - 포맷: `| YYYY-MM-DD | {feature-name} 통합 (작성자: {git_author}) | {affected_sections} | 완료 |`
  - skip/abort는 기록하지 않음
- **REQ-021**: 머지 세션 종료 시 inline 요약을 출력한다 (휘발 허용) — 우선순위: LOW
- **REQ-022**: 호환성 첫 머지 체크리스트를 적용한다 (해당 도메인 1회만) — 우선순위: HIGH
  - 섹션 10 부재 → 시작점 행만 자동 추가 (소급 기록 금지)
  - 정책 ID 부재 → 사용자 결정 (자동 부여 vs 보존)
  - 의존성 맵 부재 → 머지 필요 시만 질문
  - frontmatter 부재 → 진행

### 옵션 플래그

- **REQ-023**: 옵션 플래그를 제공한다 — 우선순위: MEDIUM
  - `--no-review`: Architect 피드백 루프 강제 차단 (긴급 핫픽스용, 사용자 책임)
  - `--review-merge=N`: 라운드 수를 정확값으로 강제 (디버깅 모드)
  - `--auto`: 자동 모드 (자동 수정 항목의 사후 확인 생략). 사용자 결정 항목은 여전히 질문
  - **인터랙티브 fallback**: ARGUMENTS가 비어있거나 알려지지 않은 키워드일 경우 인터랙티브 번호 선택으로 옵션 수집 (자동완성 즉시 실행 환경 지원). 알려진 플래그가 있으면 키워드 매칭으로 즉시 적용
- **REQ-024**: 자동 모드의 의미 경계를 SKILL.md에 명시한다 — 우선순위: HIGH
  - 사용자 결정 항목까지 자동화 금지 (SSOT 손상 위험)
  - 세션 종료 시 자동 리셋, 파일 저장 없음

### Concurrency

- **REQ-025**: 별도 동시성 메커니즘을 두지 않는다 — 우선순위: HIGH
  - git native 메커니즘에 위임 (commit/push 시 git이 충돌 알림)
  - 머지 스킬은 git error를 사용자에게 그대로 노출

### Fallback

- **REQ-026**: domain.md 토큰이 80K를 초과하면 섹션 단위 분할 학습으로 fallback한다 — 우선순위: MEDIUM
  - 일괄 학습 컨텍스트 부족으로 인한 사일런트 오류 회피

### PLAN 단계 추가 결정 사항

- **REQ-027**: `context-handling` 스킬의 resume 모드에 "complete feature 누적 카운트 알림" 추가 — 우선순위: MEDIUM
  - 작업자가 `/dev-workflow:resume` 호출 시 카테고리별 complete feature 카운트를 한 줄로 표시
  - 머지가 무기한 지연되어 SSOT가 누적적으로 낡아질 위험 보완 (drift gap 약점 1 해소)
  - 자동 머지 트리거가 아닌 알림만 (관리자 단독 권한 유지)
- **REQ-028**: 기존 `document-consolidation`의 Mode 3 (consolidate-domain)을 폐기한다 — 우선순위: HIGH
  - 다음 릴리스에서 deprecated 표시, 그 다음 릴리스에서 완전 제거
  - 이중 경로 위험 차단 (구조 약점 2-1 해소)

---

## 4. 설계 개요

### 4.1 책임 분리 아키텍처

```
┌─ 작업자 흐름 ───────────────────────────────────┐
│  BRAINSTORM → PLAN → DEVELOP → REVIEW          │
│        ↓                                        │
│  Completion Protocol                            │
│    Step 1: document-consolidation               │
│            (consolidate-main, feature 통합만)   │
│    Step 2: README 영향                          │
│    Step 3: 커밋+푸시                            │
│        ↓                                        │
│  status: complete 마킹 + 커밋                   │
└─────────────────────────────────────────────────┘
                          │
                          ▼
              (작업자는 여기서 손을 뗀다)
                          │
                          ▼
┌─ 관리자 흐름 ───────────────────────────────────┐
│  /dev-workflow:merge-to-domain [category]       │
│        ↓                                        │
│  merge-to-domain 스킬 (신규)                    │
│    docs/design 스캔 → complete feature 식별    │
│    실행 모드 결정 (순차/병렬/사용자 선택)        │
│    5단계 머지 알고리즘                          │
│    dry-run → 승인 → 적용 → 검증                │
│    feature 디렉토리 삭제                        │
└─────────────────────────────────────────────────┘
```

### 4.2 5단계 머지 알고리즘 흐름

```
(1) domain.md 학습
    ├─ structured digest 추출 (YAML)
    │    policies, decisions, requirement_ids, section_index
    └─ 토큰 ≥ 80K → 섹션 단위 분할 학습 fallback

(2) feature.md 학습
    ├─ structured digest 추출
    └─ domain digest와의 관계 분석

(3) 머지 계획 수립
    ├─ 정책 충돌 식별 (ID 집합 연산)
    ├─ 분류:
    │    ├─ 자동 수정 (renumbering, 표 통일, append)
    │    └─ 사용자 결정 (의미 충돌, 구조 변경)
    ├─ 외부 분류 규칙으로 Architect 라운드 등급 결정
    ├─ 🏛️ Architect 피드백 루프 (1~3 라운드)
    └─ dry-run plan 생성 (자동 수정도 회계 형식 노출)

(4) 적용
    ├─ 사용자 dry-run 승인
    └─ domain.md 수정 + 섹션 10 변경 이력 자동 기록

(5) 검증
    ├─ diff 요약
    ├─ 🔧 Tech Lead / 📋 PM 체크리스트 (Architect와 분리)
    │    - 정책 ID 보존
    │    - supersede 없는 정책 누락 X
    │    - 변경 이력 행 추가 확인
    │    - 라인 수 변화율 ±50% 이내
    └─ 통과 시 feature 디렉토리 삭제

[실패 시 In-session resolution]
   4지 선택: Tech Lead 추가 / 직접 수정 / skip / abort
   skip 시 feature 디렉토리 보존
   abort 시 git 위임 롤백
```

### 4.3 병렬 모드 동작

```
docs/design 스캔 결과:
├─ 카테고리 A: [f1, f2, f3]   → target: A/A.md
├─ 카테고리 B: [g1, g2]        → target: B/B.md
└─ 카테고리 C: [h1]            → target: C/C.md

실행 모드 결정 (복합 임계값):
  feature_count = 6, estimated_tokens = ?
  → 6 ≥ 5 → 병렬 자동

병렬 풀 (max 3, 환경 변수로 5까지 조정 가능):
┌─ Worker 1: A 카테고리 (내부 직렬: f1→f2→f3, 누적 base)
├─ Worker 2: B 카테고리 (내부 직렬: g1→g2)
└─ Worker 3: C 카테고리 (h1)

병렬 처리 중 사용자 결정 발생 시:
  - FIFO 큐로 직렬화
  - 한 번에 하나의 질문만 노출
  - 결정 대기 워커는 일시 정지

출력 직렬화:
  - 카테고리 결과를 buffer로 모음
  - 카테고리 시작 순서대로 출력 (실시간 인터리브 X)
```

---

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|---|---|---|
| `merge-to-domain` (신규) | `document-consolidation` (consolidate-main이 feature 문서 통합 완료해야 함) | — |
| `merge-to-domain` (신규) | git CLI (git log, fetch, commit) | — |
| `merge-to-domain` (신규) | Claude Code 서브에이전트 디스패치 | — |
| `document-consolidation` (변경) | — | `workflow-orchestrator`의 Completion Protocol |
| `workflow-orchestrator` (변경) | — | Completion Protocol 호출 흐름 |
| `🏛️ Architect 페르소나` (Phase 4에서 활성) | `merge-to-domain`의 (3) 단계 | — |
| `🔧 Tech Lead / 📋 PM 페르소나` | `merge-to-domain`의 (5) 단계 | — |

---

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|---|---|---|---|---|
| 머지 실행 환경 | 로컬 Claude Code 세션 | CI에서는 AI 활용 한계 (비결정적 머지 자동화 불가) | GitHub Actions + Claude Code Action | AI 활용 한계, 사용자 명시 제외 |
| 실행 주체 | 프로젝트 리더(관리자) 단독 | 권한 분리, 통합 책임 일원화 | 작업자 셀프 서비스 | 권한 경계 모호화, SSOT 손상 위험 |
| Status 컨벤션 | 단일 `complete` 상태 | 관리자 호출 타이밍이 자연스러운 게이트 역할 | `complete` + `ready-for-merge` 2단계 게이트 | 운영 복잡도 증가, 게이트 효과 중복 |
| 머지 알고리즘 산출물 | Structured digest (YAML) | 비결정성 차단, ID 집합 연산으로 재현 가능 | 자유 서술 요약 | 같은 입력 → 다른 결과, 검증 기준 부재 |
| Architect 라운드 종료 권한 | 외부 분류 규칙 | 자기 신뢰 편향 차단, 예측 가능성 | Architect 자율 종료 | LLM 자기 검증의 사각지대 |
| 검증 페르소나 | 🔧 Tech Lead / 📋 PM | Architect와 분리하여 자기 검증 사각지대 회피 | Architect가 검증 겸함 | 동일 페르소나 자기 검증 한계 |
| 의존성 순서 결정 | git log main 머지 순서 | 자연스러운 작업 시간선 반영, 명시적 메타데이터 불요 | 알파벳순 / 사용자 명시 / mtime | 의미와 무관 / 매번 수동 / 부정확 |
| 병렬 단위 | 카테고리 | 같은 domain.md 동시 쓰기 충돌 원천 차단 | feature 단위 병렬 | 같은 domain 동시 쓰기 시 race condition |
| 풀 크기 기본값 | 3 (상한 5) | brainstorming Enhanced Mode 검증 범위 | 5 또는 무제한 | 5는 상한선, 운영 안정성 우선 |
| 토큰 추정 공식 | `bytes / 3.5` (고정 + 환경 변수) | 한·영 혼합 평균 근사, 임계값 트리거에 충분 | 파일 샘플링 / tiktoken | 추정값에 추정값 / 외부 의존성 |
| Concurrency 메커니즘 | git native만 활용 | 실제 충돌 가능성 매우 낮음, git가 자동 알림 | 시작 SHA + 커밋 직전 SHA 비교 / 락 | 과도한 메커니즘, 보호 가치 낮음 |
| 부분 머지 개념 | 폐기 | 매 머지가 "그 시점의 complete" 머지 — partial 개념 자체가 잘못된 프레이밍 | merge_status frontmatter / partial 마커 | 통합 문서는 항상 "현재까지의 누적" — 거짓말 아님 |
| 작성자 통보 | git log + 섹션 10 변경 이력만 | 별도 통보 없이 추적 가능 | `.merge-log.md` 파일 / 커밋 메시지 명시 | 별도 매체 분산, 추가 가치 낮음 |
| Skip/Abort 기록 | 기록하지 않음 | skip은 사용자 의도(디렉토리 보존으로 충분), abort는 다음 세션에서 자연 재시도 | 섹션 10 스키마 확장 / 별도 로그 파일 | over-engineering, 자연 재시도로 충분 |
| feature 디렉토리 정리 | 통째 삭제 | 사용자 경험상 `_archive` 보존이 가치 낮음 | `_archive/` 이동 / 압축 보존 / lazy 정리 | 디렉토리 청결 + git log에 위임 |
| `--auto` 플래그 의미 | 자동 수정의 사후 확인만 생략 | SSOT 손상 위험 최소화 | 사용자 결정까지 자동화 | 의미 충돌 자동 처리 시 손상 위험 큼 |
| 사전 승인 영속화 | 세션 1회 한정 | 정의 단순, 의도 명확 | 프로젝트 설정 파일 / 매 호출 옵션 | 영속화는 위험, 매 호출은 번거로움 |
| 인식 키워드 메커니즘 | `--auto` 정문 + 키워드 보조 인식 + 1차 confirm | 디버그 가능성, LLM 분류의 비결정성 회피 | LLM 의도 분류 | 비용/지연/비결정성 |
| 기존 도메인 마이그레이션 | 별도 작업 없음, 첫 머지에서 점진 보완 | 신규 스킬의 가장 위험한 첫 사용 시나리오 회피 | `/dev-workflow:migrate-domains` 명령 | 위험 시나리오 강제 발동 |
| 머지 트리거 인터페이스 | 슬래시 명령 (`/dev-workflow:merge-to-domain`) | 명시적 의도 + 일관된 패턴 | 훅 / 파일 감지 / 자동 트리거 | 의도 불명확, 자동화 위험 |

---

## 7. 제약조건과 가정

### 제약조건

- Markdown 전용 플러그인 — 실행 코드 없이 SKILL.md로만 구현
- 기존 Brainstorm→Plan→Develop→Review→Completion 워크플로우와 호환 유지
- 머지 권한은 프로젝트 리더 단독, 로컬 Claude Code 세션에서만 실행 (CI 불가)
- 작업자는 feature 문서 통합까지만 책임지며 domain.md를 절대 수정하지 않음
- concat 머지 금지 — domain + feature를 완전히 학습한 뒤 intelligent merge 수행
- 컨텍스트 부족 시 코드베이스를 직접 탐색하여 보강
- 충돌 시 사용자 질문 우선, 자동 처리는 사전 승인된 경우에만 허용
- 모든 domain.md 수정은 dry-run → 사용자 승인 → 적용 순서를 강제
- 롤백은 git에 위임 — 별도 복구 로직 구현 금지
- 코드↔문서 일치 검증은 본 파이프라인 범위 밖 (별도 linter)

### 가정

- 프로젝트 리더의 호출 타이밍이 자연스러운 게이트로 작동 (별도 2단계 게이트 불요)
- 단일 `complete` 플래그로 머지 후보 식별이 충분
- 한국어+Markdown 혼합 환경에서 `bytes/3.5` 토큰 추정이 실용적 정확도
- 풀 크기 3~5 동시 서브에이전트가 로컬 Claude Code 환경에서 안정적
- Claude Code가 domain.md의 주 독자이므로 사람 가독성보다 의미 보존 우선이 적합
- git log의 main 머지 순서가 feature 간 의존성을 충분히 반영
- 🏛️ Architect 페르소나가 머지 계획 품질 검증에 적합, 🔧 Tech Lead/📋 PM이 검증 단계에 적합
- 기존 도메인 문서가 신규 스킬의 학습 단계에서 충분한 구조로 digest 추출 가능 (호환성 첫 머지 체크리스트로 보완)

---

## 8. 기술 가이드라인

### 8.1 Structured Digest 스키마 (REQ-005)

학습 단계의 산출물은 다음 YAML 형식을 강제한다. 자유 서술 요약은 금지.

```yaml
domain_digest:
  policies:
    - id: POL-001
      statement: "큐잉 우선순위는 player MMR 기준"
      source_section: "4. 설계 개요"
      immutability_level: high | medium | low
  decisions:
    - id: DEC-001
      statement: "Redis pub/sub 사용"
      supersedes: null  # 또는 이전 결정 ID
  requirement_ids: [REQ-001, REQ-002, ...]
  section_index:
    "1. 배경": [1, 15]
    "4. 설계 개요": [50, 120]
```

feature digest도 동일 구조를 따른다 (id prefix `F-POL-`, `F-DEC-`).

누락된 항목이 있으면 해당 필드를 빈 배열로 둔다.

### 8.2 자동 수정 vs 사용자 결정 분류 규칙 (REQ-006)

| 충돌 유형 | 처리 방식 | 비고 |
|---|---|---|
| ID 중복 (REQ-001 등) | 자동 renumbering | 참조 갱신 포함, dry-run에 회계 형식 노출 |
| 표 형식 불일치 (헤더 동일) | 자동 통일 | 컬럼 순서 정렬 |
| 표 형식 불일치 (헤더 다름) | 사용자 결정 | 시맨틱 안전 위해 강등 |
| 충돌 없는 신규 항목 | 자동 append | 새 REQ, 새 모드 |
| 새 섹션 신설 | 사용자 결정 | 위치/이름 |
| 의미 충돌 (정책 vs 정책) | 사용자 결정 | "MMR vs latency" 등 |
| 기존 결정 무효화 (supersede) | 사용자 결정 | 명시적 확인 |
| 의존성 맵 재정의 | 사용자 결정 | 컴포넌트 관계 변경 |
| 분류 애매한 경우 | 사용자 결정 | 보수 원칙 |

### 8.3 Architect 라운드 등급 규칙 (REQ-007)

| 머지 계획 특성 | Architect 라운드 |
|---|---|
| 자동 수정 only + 사용자 결정 0 + append만 | 1 |
| 사용자 결정 1~2 + 의미 충돌 0 | 2 |
| 의미 충돌 ≥ 1 OR 의존성 재정의 OR 기존 결정 무효화 | 3 |

1라운드 종료 출력 템플릿 강제:

```
[Round 1/1] 검토 결론: PASS | FAIL
- 자동 수정 항목 N건 검증 완료
- 사용자 결정 항목 0건
- 발견된 우려: [없음 / 항목 나열]
```

"발견된 우려"가 비어있지 않으면 자동 2라운드 승급.

### 8.4 검증 페르소나 체크리스트 (REQ-008)

| 항목 | 검증 방법 |
|---|---|
| 정책 ID 보존 | pre-merge digest의 policy ID 집합 ⊆ post-merge |
| supersede 없는 정책 누락 X | 명시적 supersede 없이 사라진 정책 없는지 확인 |
| 섹션 10 변경 이력 행 추가 | 자동 추가된 행이 정확한 포맷인지 |
| 라인 수 변화율 ±50% 이내 | 대량 손실 탐지 |

### 8.5 호환성 첫 머지 체크리스트 (REQ-022)

| 항목 | 부재 시 처리 |
|---|---|
| 섹션 10 변경 이력 | 시작점 행만 자동 추가 ("기존 문서 — 신규 머지 시작 이전"), 소급 기록 금지 |
| 정책 ID | 첫 머지에서 사용자 결정 (자동 부여 vs 보존) |
| 의존성 맵 | 머지에 필요한 경우에만 사용자에게 질문 |
| frontmatter | 없어도 진행 (위치로 domain 판별) |

해당 도메인에서 1회만 발동.

### 8.6 자동 모드 발화 인식 (REQ-024)

**1차 정문:** `--auto` 플래그.

**2차 보조:** 발화 키워드 인식 시 즉시 1차 confirm 요청:
```
자동 모드로 전환을 요청하신 것으로 이해했습니다.
남은 머지 후보 N개를 자동 수정 항목까지 사용자 확인 없이 진행할까요?
(사용자 결정 필요 항목은 여전히 질문합니다)

1. Yes — 자동 모드 (이번 세션만)
2. No — 현재 모드 유지
```

**인식 키워드 (한국어/영어, 5~10개):**

| 한국어 | 영어 |
|---|---|
| "다 자동으로", "자동으로 진행" | "auto mode", "yolo" |
| "이번엔 그냥 진행", "알아서 해" | "all auto", "skip confirms" |
| "yolo", "자동 모드" | "yes to all", "go go" |

**자동 모드의 의미 경계:**
- 자동 수정 항목의 사후 확인을 생략한다.
- 사용자 결정 필요 항목은 여전히 질문한다.
- 세션 종료 시 자동 리셋, 파일 저장 없음.

### 8.7 실행 모드 결정 알고리즘 (REQ-015)

```
estimated_tokens = total_bytes(candidates + domain) / 3.5  # MERGE_TOKEN_DIVISOR 적용
feature_count = len(candidates)

if feature_count < 3 AND estimated_tokens < 20K:
    mode = "sequential"
elif feature_count >= 5 OR estimated_tokens > 50K:
    mode = "parallel"
else:
    mode = ask_user(["순차", "병렬", "자동위임"], default="자동위임")
    # "자동위임" 선택 시 시스템이 보수적으로 순차 결정
```

### 8.8 In-session Resolution 정책 (REQ-010, REQ-011)

머지 도중 실패 시 4지 선택지 제시:
1. 🔧 Tech Lead 추가 투입 (재시도)
2. 사용자 직접 수정
3. 이 feature만 skip (디렉토리 보존, 다음 세션 후보)
4. abort (사용자 명시 확인)

skip 시:
- A.md(v0) 유지 → 다음 feature는 v0 base로 진행
- 누적 base 체인이 깨지지 않음
- 머지 보고서에 "A/f1 — skip: 사유"

### 8.9 토큰 fallback (REQ-026)

domain.md 토큰 ≥ 80K 시 섹션 단위 분할 학습:
- 섹션 인덱스로 부분 로드
- 각 섹션의 digest를 합쳐서 domain_digest 구성
- (3) 머지 계획 단계에서는 전체 digest를 메모리 보유 가능

### 8.10 사용자에게 노출할 한계 인식

SKILL.md 본문에 "도구의 한계" 섹션 추가:
> 본 머지 스킬은 LLM 추론으로 SSOT를 변형한다. Structured digest와 검증 페르소나로 위험을 통제하지만, 의미 보존을 100% 보장하지 않는다. dry-run plan을 신중히 검토하고, 의심스러우면 abort하라.

---

## 9. 구현 결과 및 일탈 사항

### 구현 완료 항목

11개 Task 모두 완료 (commits `d2f61d1` ~ `8d78fef`):

| Task | 산출물 | Commit |
|---|---|---|
| 1 | `skills/document-consolidation/SKILL.md` — Mode 1 단순화, Mode 3 deprecate | d2f61d1 |
| 2 | `skills/workflow-orchestrator/SKILL.md` — Completion Protocol 갱신 | 2c8a8da |
| 3-6 | `skills/merge-to-domain/SKILL.md` 신규 (510 lines) | 9d8f88c, e7315a0, 9818b80, 9f784ad |
| 7 | `commands/merge-to-domain.md` 신규 | a55c32c |
| 8 | `dryrun-document-management.md` 가상 머지 + SKILL.md 호환성 체크리스트 보강 | 950624a, 2f581a0 |
| 9 | `skills/context-handling/SKILL.md` — resume 카운트 알림 (REQ-027) | 735c4ed |
| 10 | `CLAUDE.md` — 스킬 11개 + Commands 표 + 자기-도그푸딩 | f8cff2f |
| 11 | `plugin.json`/`marketplace.json` — 1.9.0 MINOR | 8d78fef |

### PLAN/DEVELOP 단계 일탈 사항

1. **commands/merge-to-domain.md 경로 패턴 — 의도적 일탈 (개선)**
   - Plan 원안: 하드코딩 버전 경로 `~/.claude/plugins/cache/.../1.9.0/skills/...`
   - 실제 구현: `${CLAUDE_PLUGIN_ROOT}/skills/...`
   - 사유: 기존 `commands/design-summary.md`, `commands/add-rule.md`가 모두 환경 변수 패턴을 사용. 하드코딩은 매 릴리스마다 경로 갱신 필요 → 버전 비종속 패턴이 적합.
   - 결과: Task 11 Step 4 "버전 경로 갱신"이 no-op이 됨 (개선이므로 회귀 아님).

2. **CLAUDE.md 메타 갱신 — 스코프 보강**
   - Plan 원안: `merge-to-domain` 스킬/명령만 추가
   - 실제 구현: 사전에 누락되어 있던 `rules-injection` 스킬과 `add-rule` 명령도 함께 반영
   - 사유: 스킬 카운트 일관성("11개" 명시) 충족을 위해 누락 보강 필수
   - 결과: CLAUDE.md가 실제 `skills/`, `commands/` 디렉토리와 1:1 일치

3. **Task 8 가상 머지 dry-run — SKILL.md 추가 보강**
   - 시뮬레이션 결과 호환성 체크리스트 부족 발견 → 3건 보강 (커밋 2f581a0)
   - 추가 항목: 요구사항 ID 부재 처리 / 결정 ID 자동 부여 및 영구화 / 변경 이력 신설 위치 (섹션 10 부재 도메인 지원)

### 검증 결과

- 28개 REQ 모두 구현 (REQ-001 ~ REQ-028)
- 두 시나리오(작업자 / 관리자) 모두 SKILL.md에서 명시적 지원
- Cross-file 일관성 검증 통과 (버전 1.9.0, 스킬 카운트 11, Commands 6, 도메인 6)
- 최종 통합 리뷰: **READY_TO_MERGE**

### 잔존 제약 (인지 사항)

- LLM 정성 시뮬레이션 한계 — 실제 첫 머지에서 dry-run에서 예측 못한 케이스 발견 가능성. 발견 시 호환성 체크리스트 추가 보강 필요.
- 자기-도그푸딩 first merge — 본 feature 디렉토리(`domain-merge-pipeline/`)는 향후 `/dev-workflow:merge-to-domain dev-workflow` 호출 시 `document-management.md`로 머지될 후보. 첫 머지 체크리스트 발동 예상.

---

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-05-18 | 초안 작성 (Phase 1~4 완료) | 신규 기능 | ready-for-plan |
| 2026-05-18 | PLAN 단계 보강 (REQ-005/016/017/023 갱신, REQ-027/028 신규, 구조 약점 2건 해소) | 본 문서 | ready-for-plan |
| 2026-05-18 | 개발 완료 — 11개 Task 구현 + 문서 통합 (status: complete) | 전체 | 완료 |
