---
name: document-consolidation
description: Use when development is complete (after REVIEW) or when an issue is resolved. Consolidates phase/plan files into the final design document, suggests domain merge, and cleans up feature directory.
---

# Document Consolidation

개발 완료 후 중간 문서를 최종 설계 문서에 통합하고 정리한다.
세 가지 모드로 동작한다.

**모든 파일 경로 규칙:** `docs/design/[카테고리]/[기능명]/`

---

## 트리거

자동 실행하지 않는다. 아래 시점에 **제안**하고 사용자 승인 후 실행한다:
- REVIEW 완료 시: "문서 통합을 진행할까요?" (consolidate-main)
- issues/ 완료 시: "이슈 내용을 설계 문서에 통합할까요?" (consolidate-issue)
- consolidate-main 완료 시: "domain.md 통합을 진행할까요?" (consolidate-domain)

---

## Mode 1: consolidate-main

개발 완료 후 phase/plan/HANDOFF를 최종 design 문서에 통합한다.

### 실행 절차

0. **경로 해소:** `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
   (상세: development-principles "경로 해소 규칙" 참조)

1. **소스 파일 읽기**
   - `[해소된 경로]/[카테고리]/[기능명]/phase1_exploration.md`
   - `[해소된 경로]/[카테고리]/[기능명]/phase2_discovery.md`
   - `[해소된 경로]/[카테고리]/[기능명]/phase3_validation.md`
   - `[해소된 경로]/[카테고리]/[기능명]/plan.md`
   - `[해소된 경로]/[카테고리]/[기능명]/seed.yaml` (존재 시, Enhanced Mode에서 생성)
   - `[해소된 경로]/[카테고리]/[기능명]/HANDOFF.md` (존재 시)

2. **섹션별 매핑 규칙에 따라 design 문서 업데이트**

   | 소스 | 대상 섹션 | 매핑 내용 |
   |------|-----------|-----------|
   | phase1 요구사항 | 섹션 3 확정된 요구사항 | 최종 상태 반영 (이미 반영된 경우 스킵) |
   | phase2 Q&A 결정 | 섹션 6 기술 결정 | 주요 결정 사항 추가 |
   | phase3 TD 검토 | 섹션 8 기술 가이드라인 | TD 가이드라인 보강 |
   | plan 구현 전략 | 섹션 4 설계 개요 | 실제 구현 아키텍처로 보강 |
   | plan 설계 변경 | 섹션 6 기술 결정 | 구현 중 변경된 결정 추가 |
   | seed.yaml 제약/가정 | 섹션 7 제약조건과 가정 | seed의 constraints/assumptions 보강 |
   | 실제 구현 결과 | 섹션 9 구현 결과 | 설계 대비 일탈 사항 기록 |

3. **프론트매터 업데이트**
   - `status: ready-for-plan` → `status: complete`
   - `last-updated: [오늘 날짜]`
   - **⚠️ 정규값 우선순위 규칙:** plan.md 등 다른 소스에 명시된 상태값에 관계없이, 프론트매터 `status`는 반드시 정규값 `complete`를 사용한다. 정규 상태값은 `ready-for-plan`과 `complete` 2개만 존재한다.

4. **변경 이력(섹션 10) 추가**
   ```
   | [날짜] | 개발 완료 — 문서 통합 | 전체 | 완료 |
   ```

5. **사용자 리뷰**
   ```
   📋 문서 통합 결과:

   업데이트된 섹션:
   - 섹션 3: 요구사항 [N]건 최종 확인
   - 섹션 4: 구현 아키텍처 반영
   - 섹션 6: 기술 결정 [N]건 추가
   - 섹션 8: 가이드라인 보강
   - 섹션 9: 구현 결과 및 일탈 사항 작성
   - 섹션 10: 변경 이력 추가

   확인 후 다음 단계를 진행합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **작업 내용 분석 및 domain 병합 제안**

   feature.md의 내용을 분석하여 domain.md에 반영할 변경이 있는지 판단한다.
   판단 체크리스트:
   - 섹션 3에 domain.md에 없는 새 REQ가 있는가?
   - 섹션 4/6에 domain.md와 다른 설계 결정이 있는가?

   **병합 권장 시:**
   ```
   📋 작업 내용 분석 결과:

   - 새로운 요구사항: [있음/없음 + 요약]
   - 설계 변경: [있음/없음 + 요약]
   - 기술 결정 추가: [있음/없음 + 요약]

   → domain.md 병합을 권장합니다. 진행할까요?

   1. Yes — domain 병합 후 feature 디렉토리 삭제
   2. No — feature 디렉토리만 삭제
   ```

   **병합 불필요 시:**
   ```
   📋 작업 내용 분석 결과:

   - domain.md에 반영할 새로운 내용이 없습니다.
   - feature 디렉토리를 삭제합니다. 진행할까요?

   1. Yes
   2. No
   ```

   - Yes (병합 권장) → consolidate-domain(Mode 3) 진행
   - No (병합 권장) 또는 Yes (병합 불필요) → Step 7로 진행
   - No (병합 불필요) → 삭제 취소, feature 디렉토리 유지

   > 참고: 사용자가 삭제를 거부한 경우 feature 디렉토리가 유지된다. 이는 사용자 override를 허용하는 설계이다.

7. **feature 디렉토리 삭제 (domain 병합 스킵 시)**

   domain 병합을 하지 않는 경우, feature 디렉토리를 직접 삭제한다.

   ```
   📋 feature 디렉토리를 삭제합니다.

   삭제 대상: docs/design/[카테고리]/[기능명]/
   (설계 문서의 핵심 내용은 이미 통합되었습니다)

   진행할까요?
   1. Yes
   2. No
   ```

   사용자 승인 후 feature 디렉토리 전체 삭제.

### 최종 상태

**domain 병합한 경우:**
Mode 3 완료 상태와 동일 (feature 디렉토리 삭제됨, domain.md에 통합)

**domain 병합 스킵한 경우:**
```
docs/design/[카테고리]/
└── (feature 디렉토리 삭제됨)
```
feature.md의 핵심 내용은 Mode 1 Step 1~4에서 이미 통합 처리됨.

---

## Mode 2: consolidate-issue

이슈(hotfix) 완료 후 이슈 내용을 부모 design 문서에 통합한다.

### 실행 절차

0. **경로 해소:** `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
   (상세: development-principles "경로 해소 규칙" 참조)

1. **이슈 설계 문서 읽기**
   - `[해소된 경로]/[카테고리]/[기능명]/issues/[문제명]/[문제명].md`

2. **부모 design 문서에 자연스럽게 통합**

   통합 원칙: **"원래 하나였던 것처럼"** — 참조 링크가 아닌 직접 병합

   | 이슈 내용 | 부모 대상 섹션 | 병합 방식 |
   |-----------|---------------|-----------|
   | 변경된 요구사항 | 섹션 3 | 기존 REQ 업데이트 또는 신규 REQ 추가 |
   | 새 기술 결정 | 섹션 6 | 행 추가 |
   | 변경된 설계 | 섹션 4 | 해당 부분 갱신 |
   | 새 가이드라인 | 섹션 8 | 항목 추가 |
   | 새 의존성 | 섹션 5 | 행 추가 |
   | 새 제약조건 | 섹션 7 | 항목 추가 |

3. **변경 이력(섹션 10) 추가**
   ```
   | [날짜] | [문제명] 이슈 해결 — 설계 통합 | [영향 범위] | 완료 |
   ```

4. **프론트매터 업데이트**
   - `last-updated: [오늘 날짜]`

5. **사용자 리뷰**
   ```
   📋 이슈 통합 결과:

   이슈: [문제명]
   업데이트된 섹션:
   - [변경된 섹션 목록]

   확인 후 issues/[문제명]/ 디렉토리를 삭제합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **사용자 승인 후 이슈 디렉토리 삭제**
   - `issues/[문제명]/` 디렉토리 전체 삭제
   - `issues/` 디렉토리가 비어있으면 `issues/` 디렉토리도 삭제

---

## Mode 3: consolidate-domain

feature 완료 후 설계 문서를 domain.md에 통합하거나 새 domain으로 승격한다.
consolidate-main 실행 후 자동으로 이어지는 단계이다.

### 실행 절차

0. **경로 해소:** Mode 1에서 이어지는 경우 이미 해소된 경로를 사용한다. 독립 실행 시 `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인 (상세: development-principles "경로 해소 규칙" 참조)

1. **domain.md 존재 확인**
   - `[해소된 경로]/[카테고리]/` 직속의 .md 파일 중 관련 domain.md를 탐색한다
   - domain.md 판별: category 디렉토리 직속에 위치한 .md 파일 = domain

2. **통합 방향 판단 — 사용자에게 질문**

   **domain.md가 존재하는 경우:**
   ```
   📋 이 feature의 내용을 어디에 통합할까요?

   1. 기존 domain에 merge ([domain명].md)
   2. 새 domain으로 승격
   ```

   **domain.md가 존재하지 않는 경우:**
   ```
   📋 관련 domain.md가 없습니다. 새 domain으로 승격합니다.
   domain 이름을 지정해주세요.
   > 예: "workflow-lifecycle"
   ```

3. **merge 실행 (기존 domain에 통합)**
   - feature 설계 문서(`[기능명].md`)의 핵심 내용을 domain.md의 적절한 섹션에 병합
   - 병합 원칙: "원래 하나였던 것처럼" — 참조 링크가 아닌 직접 병합
   - domain.md에 없던 정책/결정은 새 섹션 또는 기존 섹션에 추가
   - 충돌하는 내용은 최신(현재 feature)의 결정을 우선하되, 변경 사유를 명시

4. **승격 실행 (새 domain 생성)**
   - feature 설계 문서(`[기능명].md`)를 기반으로 `[domain명].md`를 category 직속에 생성
   - domain.md 형식으로 재구성: 시스템 개요, 정책, 결정 사항, 파일 목록

5. **사용자 리뷰**
   ```
   📋 domain 통합 결과:

   통합 방식: [merge / 승격]
   대상: [domain명].md
   반영된 내용:
   - [변경 섹션 목록]

   확인 후 다음 단계를 진행합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **크로스 도메인 변경 반영**
   ```
   📋 다른 domain에 영향을 준 변경이 있나요?

   1. 있음
   2. 없음
   ```

   "있음" 선택 시:
   ```
   어떤 domain에 영향을 줬나요?
   > 예: "aggro-system"

   변경 키워드를 간단히 기록해주세요.
   > 예: "상태 전이 추가: Combat → Threat"
   ```
   → 대상 domain.md에 즉시 반영한다 (코드베이스를 참조하며 정확성 확보)
   → feature가 완료된 시점이므로 즉시 반영이 안전하다
   → 대상 domain.md가 존재하지 않으면 `_pending/` 파일로 category 직속에 생성한다

   **대상 domain.md가 없는 경우의 pending 파일:**
   ```
   [카테고리]/_pending/[대상domain].pending.md
   ```
   ```markdown
   # [대상domain] pending
   - from: [기능명]
   - [사용자 입력 키워드]
   ```

7. **기존 pending 소비**
   - `[해소된 경로]/[카테고리]/_pending/` 에 현재 domain을 대상으로 한 pending 파일이 있으면 반영
   - 반영 방식: pending 키워드를 기반으로 코드베이스를 참조하며 domain.md 업데이트
   - 반영 후 pending 파일 삭제
   - _pending/ 디렉토리가 비어있으면 디렉토리도 삭제

8. **feature 디렉토리 삭제**
   ```
   📋 domain 통합 완료. feature 디렉토리를 삭제합니다.

   삭제 대상: docs/design/[카테고리]/[기능명]/
   (domain.md에 모든 내용이 통합되었습니다)

   진행할까요?
   1. Yes
   2. No
   ```
   사용자 승인 후 feature 디렉토리 전체 삭제.

### 최종 상태

**merge의 경우:**
```
docs/design/[카테고리]/
├── [domain명].md              ← 업데이트된 SSOT
└── (feature 디렉토리 삭제됨)
```

**승격의 경우:**
```
docs/design/[카테고리]/
├── [domain명].md              ← 새로 생성된 SSOT
└── (feature 디렉토리 삭제됨)
```

---

## 주의 사항

- 세 모드 모두 반자동이다 — 자동 병합 후 반드시 사용자 리뷰를 거친다
- 병합 결과가 부자연스러우면 사용자가 직접 수정할 수 있도록 안내한다
- 통합 실행 전 대상 파일이 존재하는지 확인한다
- feature 디렉토리 삭제 또는 issues/ 삭제는 사용자 승인 후에만 실행한다
- 변경된 섹션만 하이라이트하여 사용자 리뷰를 빠르게 한다
- domain.md 통합 시 기존 domain.md의 구조와 톤을 유지한다
- pending 파일은 merge 키워드만 기록하고, 상세 내용은 코드베이스 참조로 보완한다
- feature 디렉토리 삭제는 domain.md 통합이 확인된 후에만 실행한다
