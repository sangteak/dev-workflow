---
feature: domain-merge-pipeline
category: dev-workflow
phase: 1
created: 2026-05-18
status: immutable
---

# Phase 1: Exploration — domain-merge-pipeline

> 본 파일은 Phase 1 종료 시 생성된 **불변 스냅샷**이다. 이후 수정하지 않는다.

---

## 0. 카테고리 결정

- 카테고리: `dev-workflow` (기존 카테고리 재사용)
- 근거: dev-workflow 플러그인 자체의 문서 관리 흐름을 변경하는 기능
- 기능명: `domain-merge-pipeline` (3개 후보 중 선택: `domain-merge-pipeline` / `manager-driven-domain-merge` / `intelligent-domain-consolidation`)

## 1. 확정된 페르소나

- BRAINSTORM:
  - 🛠️ Claude Code Expert — Claude Code 플랫폼 제약, 스킬/훅/MCP 메커니즘
  - 🎯 Workflow Designer — 워크플로우 UX, 단계 흐름, 페르소나 상호작용
  - 🔍 Ecosystem Analyst (국면 3 활성화) — 경쟁 플러그인 비교, 생태계 트렌드

## 2. 사용자 초기 요구사항 (원문 요약)

**현재 상태:**
- 로컬에서 domain.md(기능 별 통합 문서)에 머지하여 단일 파일 유지
- 여러 작업자가 작업 시 해당 파일에 충돌 발생, 최신화 어려움, 머지 검증 기능 부재

**개선 제안:**
- feature 단위로 문서를 커밋 (최종 취합된 문서만 남김)
- CI 또는 관리자가 문서 취합 스킬을 실행하여 domain으로 머지
- 실제 코드베이스와 비교하여 최신화하는 기능 추가 (별도 linter로 분리 예정)

**예시 구조:**
```
docs/design/matchmaking/
├── matchmaking.md                                    ← 도메인 (관리자/CI 일괄 취합)
├── feature-rating-system/rating-system.md            ← 작업자 커밋
└── feature-br-mode-system/br-mode-system.md          ← 작업자 커밋
```

---

## 3. Step A-0: 본질 질문 (Ontologist)

### 4가지 본질 질문과 사용자 답변

**1. [Essence] 진짜 해결하려는 것은 무엇인가?**
- 질문: "머지 충돌 제거"인가, "설계 문서와 실제 코드의 신뢰성 있는 SSOT 확보"인가?
- 답변: 여러 작업자의 작업 내용 또는 지식을 일관되게 관리하는 것이 가장 큰 목적이며, 이를 통해 신뢰할 수 있는 문서가 유지될 것

**2. [Root Cause] 충돌의 근본 원인은 무엇인가?**
- 답변: 본질은 **단일 파일 구조 + 각자 최신화**로 인한 **작업 동시성**. 코드↔문서 일치 검증은 별도 linter로 분리.

**3. [Prerequisites] CI/관리자 취합 모델의 전제 조건은?**
- 답변: 단순 concat 금지. **도메인 + feature를 학습한 상태에서 intelligent merge**, 부족 시 코드베이스 직접 파악.

**4. [Hidden Assumptions] domain.md 필요성과 CI 적합성 가정은 검증되었는가?**
- 답변: domain.md의 **주 독자는 Claude Code** (사람보다 더 자주 읽음). 코드베이스 파악 전 주제 문서를 로드하여 컨텍스트 확보 후 추가는 코드 직접 탐색.

---

## 4. Step A: Socratic 인터뷰 (3 Rounds)

### Round 1: 실행 환경 / 트리거 / 충돌 정책

**Q1. 실행 환경 & 주체** — 어디서, 누가, 어떤 방식으로 실행?
- A: CI에서는 AI 활용 어려움. **로컬 Claude Code 세션 + 프로젝트 리더(관리자)** 가 커맨드/스킬로 진행.

**Q2. 작업자 종료 경계** — 작업자의 "내 작업 완료" 선언 지점?
- A: Completion Protocol 변경 필요. feature는 **상태값**으로 완료 표시. 현 `document-consolidation`은 "feature 문서를 domain 머지 가능 상태로 취합"까지 책임.

**Q3. 머지 트리거 메커니즘** — 무엇이 도메인 머지를 발동?
- A: 슬래시 명령 또는 스킬로 작업. `docs/design` 스캔 → 완료된 feature 식별 → domain 머지 수행.

**Q4. 충돌 처리 정책** — Intelligent merge 판단 불확실 시?
- A: (b) **사용자 질문 우선**, 답변 불가 시 사용자 요청에 따라 자동 처리 가능. 머지 완료 후 feature 디렉토리 삭제. **결정 권한은 관리자**.

### Round 2: 상태값 / 알고리즘 / 의존성 / 안전성

**Q1. Status 컨벤션 + 작업자 액션** — 머지 가능 상태 표현?
- A: 단일 `complete` 상태로 충분. 프로젝트 리더의 머지 명령 호출 타이밍이 자연스러운 게이트. 2단계 게이트 불필요.

**Q2. 머지 알고리즘 단계화 + 페르소나 투입** — 어떤 단계로 실행?
- A: 흐름 (학습 → 학습 → 계획 → 적용 → 검증) 유지. **기본 메인 세션 순차**, feature가 N개 이상일 때 **서브에이전트 병렬**(풀 5, 처리 완료 시 다음 투입). 시스템이 능동적으로 병렬/순차 판단, 모호 시 사용자에게 선택지 제시. **🏛️ Architect 페르소나 피드백 루프**로 머지 계획 품질 검증.

**Q3. 의존성 + 일괄/개별 처리** — 여러 feature 동시 ready 시?
- A: **main 브랜치 머지 순서**(git log)를 기반으로 처리 순서 결정.

**Q4. 머지 안전성: 검증 + 복구**
- A: 검증 **(c) diff 요약 + 검증 페르소나 체크리스트 순차 실행**. 실패/복구 **(b) dry-run 계획 출력 → 승인 → 적용**. 롤백은 **git에 위임** (별도 복구 로직 없음).

### Round 3: 임계값 / 스킬 분리 / 추적성

**Q1. 병렬 발동 기준** — 자동 판단 신호?
- A: **복합 임계값** (feature 개수 × 평균 토큰). 토큰 계산은 `file_size_bytes / 3.5` (한·영 혼합 평균). 결정 규칙: `feature<3 AND tokens<20K → 순차`, `feature≥5 OR tokens>50K → 병렬`, 그 외 → 사용자 3지 선택.

**Q2. document-consolidation 변경 범위** — 기존 스킬 재구성?
- A: 옵션 (b) — 기존 스킬은 **feature 문서 취합만** 담당, **신규 `merge-to-domain` 스킬** 추가 생성.

**Q3. 작성자 추적성 + 부담 임계점** — 머지 후 작업 추적?
- A: **git log + domain.md 섹션 10 변경 이력**으로 충분. 별도 통보 메커니즘 불필요.

---

## 5. Step B: 시드 (Seed-Architect)

```yaml
goal: "관리자가 슬래시 명령으로 트리거하는 지능형 domain 머지 파이프라인을 구축하여, 여러 작업자가 동시에 작성한 complete 상태의 feature 문서들을 domain.md SSOT에 의미 보존 방식으로 통합한다."

constraints:
  - "Markdown 전용 플러그인 — 실행 코드 없이 SKILL.md로만 구현"
  - "기존 Brainstorm→Plan→Develop→Review→Completion 워크플로우와 호환 유지"
  - "머지 권한은 프로젝트 리더(관리자) 단독, 로컬 Claude Code 세션에서만 실행 (CI 불가)"
  - "작업자는 feature 문서 통합까지만 책임지며 domain.md를 절대 수정하지 않음"
  - "concat 머지 금지 — domain + feature를 완전히 학습한 뒤 intelligent merge 수행"
  - "컨텍스트 부족 시 코드베이스를 직접 탐색하여 보강"
  - "충돌 시 사용자 질문 우선, 자동 처리는 사전 승인된 경우에만 허용"
  - "모든 domain.md 수정은 dry-run → 사용자 승인 → 적용 순서를 강제"
  - "롤백은 git에 위임 — 별도 복구 로직 구현 금지"
  - "코드↔문서 일치 검증은 본 파이프라인 범위 밖 (별도 linter)"

non_goals:
  - "CI/CD 환경에서의 자동 머지 (AI 활용 한계로 명시적 제외)"
  - "작업자 측 domain.md 직접 편집 권한 제공"
  - "코드 변경과 문서의 일관성 검증(별도 linter 책임)"
  - "git 외 다른 VCS 또는 자체 롤백 메커니즘"
  - "사람 가독성 최우선 — domain.md 주 독자는 Claude Code"
  - "concat/append 기반의 단순 문서 합치기"

success_criteria:
  - "신규 merge-to-domain 스킬이 docs/design/** 스캔으로 complete 상태 feature를 식별하고 머지 후보 목록을 제시한다"
  - "document-consolidation(consolidate-main 모드)에서 domain 머지 로직이 완전히 제거되고 feature 문서 통합 책임만 남는다"
  - "머지 알고리즘이 (1) domain 학습 → (2) feature 학습 → (3) 머지 계획 → (4) 적용 → (5) 검증 5단계를 순서대로 실행한다"
  - "🏛️ Architect 페르소나 피드백 루프(최대 3라운드)가 머지 계획을 검증한 뒤에만 dry-run을 생성한다"
  - "복합 임계값으로 실행 모드를 결정: (feature<3 AND tokens<20K → 순차) / (feature≥5 OR tokens>50K → 병렬 풀5) / 그 외 → 사용자 3지 선택(자동위임 기본 highlight)"
  - "토큰 추정은 file_size_bytes / 3.5 공식을 사용하며 MERGE_TOKEN_DIVISOR 환경 변수로 조정 가능"
  - "의존성 순서는 git log의 main 브랜치 머지 순서를 기준으로 한다 (no-git-mode에서는 mtime 우선)"
  - "검증 단계가 diff 요약 + 검증 페르소나 체크리스트를 순차 실행하고 모두 통과해야 머지가 확정된다"
  - "병렬 처리는 카테고리 단위로 발동되며, 같은 카테고리(=같은 domain.md) 내부는 누적 base 직렬 처리한다"
  - "실패 시 in-session resolution 우선 (4지 선택: Tech Lead 추가 / 직접 수정 / skip / abort), abort는 사용자 명시 요청 시에만"
  - "머지 성공 후 feature 디렉토리가 삭제되고 domain.md 섹션 10에 변경 이력이 자동 기록된다"
  - "git-mode와 no-git-mode 모두에서 동작한다 (no-git-mode에서는 git 의존 부분이 graceful degrade)"

assumptions:
  - "프로젝트 리더의 호출 타이밍이 자연스러운 게이트로 작동"
  - "단일 complete 플래그로 머지 후보 식별이 충분"
  - "한국어+Markdown 혼합 환경에서 bytes/3.5 토큰 추정이 실용적 정확도"
  - "5개 동시 서브에이전트 풀이 로컬 Claude Code 환경에서 안정적으로 동작"
  - "Claude Code가 domain.md의 주 독자이므로 사람 가독성보다 의미 보존 우선이 적합"
  - "git log의 main 머지 순서가 feature 간 의존성을 충분히 반영"
  - "🏛️ Architect 페르소나가 머지 계획 품질 검증에 적합"

open_questions: []   # 모두 Phase 1에서 해소

context: |
  dev-workflow 플러그인은 Markdown 기반 코드 없음 플러그인으로, 구조화된 개발 워크플로우를 제공한다.
  현재 document-consolidation 스킬이 (a) phase/plan → feature.md 통합과 (b) feature → domain.md 머지를
  모두 담당하지만, 여러 작업자가 동시에 작성한 feature를 단일 domain.md에 반영하는 과정에서 다음 문제가 발생한다:

  1. 작업 동시성 충돌 — 각자 domain.md를 최신화하면 머지 충돌과 의미 손실 발생
  2. SSOT 신뢰성 — concat 방식 통합 시 중복·모순 누적
  3. 권한 경계 — 작업자가 domain.md를 건드릴 권한이 없어야 함

  해결 방향은 책임 분리다:
  - 작업자: Completion Protocol에서 feature 문서 통합까지만 (domain.md 불가침)
  - 관리자: 슬래시 명령으로 신규 merge-to-domain 스킬을 호출해 일괄 intelligent merge

  domain.md의 주 독자는 Claude Code 자신이며, 코드베이스 탐색 전 도메인 컨텍스트를 빠르게 로드하는 용도다.
  따라서 사람 가독성보다 의미 보존과 SSOT 일관성이 최우선이며, 부족한 컨텍스트는 머지 시점에 코드베이스를 직접 탐색해 보강한다.

  본 파이프라인은 🏛️ Architect 페르소나 피드백 루프로 머지 계획을 검증하고, dry-run → 사용자 승인 → 적용 → 검증의
  안전 절차를 강제하며, 워크로드에 따라 순차/병렬 모드를 자동 선택한다. 롤백은 git에 위임한다.
```

---

## 6. Step C: 확장 토론 — OpenQuestions 해소

8개 OpenQuestions에 대한 최종 결정 (Phase 1 내 해소 완료):

| # | 항목 | 결정 |
|---|---|---|
| 1 | 스킬/명령 이름 | 스킬 `merge-to-domain`, 명령 `/dev-workflow:merge-to-domain` |
| 2 | 중간 임계값 영역 사용자 선택 기본 highlight | `자동위임` 기본 (시스템 보수적 순차 결정) |
| 3 | 사용자 사전 승인 영속화 | 세션 1회 한정 ("이번엔 다 자동으로 해줘" 발언 시) |
| 4 | no-git-mode 의존성 순서 | mtime 우선 → 모호 시 사용자 지정 |
| 5 | domain.md 섹션 10 변경 이력 포맷 | `\| YYYY-MM-DD \| {feature} 통합 (작성자: {git_author}) \| {sections} \| 완료 \|` |
| 6 | Architect 3라운드 수렴 실패 시 | 4지 선택: (a) 🔧 Tech Lead 추가 투입 (b) 직접 수정 (c) skip (d) abort |
| 7 | 동일 domain.md 직렬화 | 카테고리 단위 직렬 (병렬 충돌 원천 차단), 카테고리 간만 병렬 |
| 8 | 토큰 공식 보정 | `bytes/3.5` 고정 + `MERGE_TOKEN_DIVISOR` 환경 변수 |

### 6.1 추가 확정 사항 (확장 토론 중 도출)

- **누적 base 직렬**: 카테고리 내 f1→f2→f3 시 직전 머지 결과를 다음의 base로 사용. 이전 머지 변경이 다음 단계에서 인지됨.
- **In-session resolution**: 실패 시 abort 회피 우선. 그 자리에서 사용자가 결정 가능한 모든 케이스는 즉시 해소 → 다음 후보 진행.
- **Skip 정책**: 사용자가 즉시 결정할 수 없을 때(예: 타 작성자 컨펌 필요, 외부 시스템 동기화 필요)의 출구. f1만 skip하고 f2/f3 진행. **f1 디렉토리는 보존**(다음 머지 시 재후보), 머지 보고서에 사유 기록.
- **머지 보고서**: 각 머지 세션 종료 시 완료/skip/abort 내역 + 사유를 출력.

---

## 7. 페르소나 합의 요약

| 주제 | 합의/미합의 | 결론 |
|---|---|---|
| 실행 환경 (로컬 vs CI) | 합의 | 로컬 Claude Code 세션 단독 (CI는 AI 활용 한계로 제외) |
| 실행 주체 | 합의 | 프로젝트 리더(관리자) 단독 |
| 작업자 책임 경계 | 합의 | document-consolidation의 feature 문서 통합까지 |
| 머지 알고리즘 단계 | 합의 | 5단계: 학습 → 학습 → 계획 → 적용 → 검증 |
| Architect 페르소나 투입 | 합의 | 머지 계획 검증 단계에서 피드백 루프 (최대 3라운드) |
| 의존성 순서 | 합의 | git log main 머지 순서 (no-git-mode는 mtime) |
| 충돌 처리 우선순위 | 합의 | 사용자 질문 우선, 사전 승인 시 자동 처리 가능 |
| 검증 메커니즘 | 합의 | diff 요약 + 페르소나 체크리스트 순차 |
| 실패/복구 | 합의 | dry-run → 승인 → 적용. 롤백은 git 위임 |
| 병렬/순차 모드 결정 | 합의 | 복합 임계값 + 자동 결정 + 모호 시 사용자 선택 |
| 병렬 단위 | 합의 | 카테고리 (같은 domain.md는 카테고리 내 직렬) |
| Skip 정책 | 합의 | 결정 불가 케이스 출구로 유지. f1 보존, f2/f3 진행 |

---

## 8. 명확도 체크리스트 (Phase 1 종료 시점)

- ✅ **Goal Clarity**: 핵심 목표 명확. "관리자 트리거 + intelligent merge + SSOT 보존" 한 문장 요약 가능.
- ✅ **Constraint Clarity**: 10개 제약조건 모두 측정 가능하고 강제 가능.
- ✅ **Success Criteria**: 12개 항목으로 구체화. OpenQuestions 해소를 통해 정량 기준 추가됨.

→ 다음 국면(발견) 집중 영역: 없음 (모호 영역 모두 해소). Phase 2에서는 미정의 영역 보완 + edge case 발견에 집중.

---

## 9. 명시적으로 제외한 항목과 이유

| 항목 | 이유 |
|---|---|
| CI/CD 자동 머지 | AI 활용 한계 (Claude Code는 로컬 세션 기반) |
| 코드↔문서 일치 검증 | 별도 linter 책임 (별도 기능으로 계획 중) |
| 자체 롤백 메커니즘 | git 위임으로 충분 |
| 작업자의 domain.md 편집 권한 | 권한 분리 원칙 위배 |
| 사람 가독성 최우선 | 주 독자가 Claude Code이므로 의미 보존 우선이 적합 |
| concat/append 머지 | 의미 손실 위험. intelligent merge 강제 |
| 2단계 status 게이트 (`complete` + `ready-for-merge`) | 관리자 호출 타이밍이 자연스러운 게이트, 단순함 우선 |
| 작성자 별도 통보 메커니즘 (.merge-log.md 등) | git log + 섹션 10 변경 이력으로 충분 |
| 자동 토큰 비율 추정 (파일 샘플링) | 추정값에 추정값 곱하기, ROI 낮음 |
| tiktoken 등 외부 토큰 카운터 | "코드 없는 Markdown 플러그인" 원칙 위배 |
