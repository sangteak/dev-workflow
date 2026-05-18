# 가상 머지 dry-run: document-management.md

> PLAN 단계 산출물 — 신규 `merge-to-domain` 스킬의 5단계 알고리즘을 기존
> `document-management.md`에 적용했을 때 어떤 호환성 이슈가 발생할지 시뮬레이션.

## 검증 대상

- Domain: `docs/design/dev-workflow/document-management.md` (218 lines, ~6KB)
- 가상 feature: `doc-search` (검색 기능)
- 검증 일자: 2026-05-18
- 적용 스킬: `skills/merge-to-domain/SKILL.md` (Task 6 완료본)

## 가상 feature 본문

```markdown
---
feature: doc-search
category: dev-workflow
status: complete
---

# doc-search 설계 문서

## 3. 확정된 요구사항
- REQ-001: 키워드 기반 검색 지원
- REQ-002: 카테고리별 그룹핑 표시
- REQ-003: substring 매칭으로 디렉토리명 부분 일치 허용

## 4. 설계 개요
설계 문서 검색은 grep + glob 조합으로 처리한다.
검색 결과는 카테고리별로 그룹핑하여 표시.
1~3건은 즉시 로드, 4건 이상은 목록 제시 후 사용자가 선택.

## 5. 핵심 결정 사항
| 결정 사항 | 선택 | 근거 |
|---|---|---|
| 매칭 방식 | substring | 단순, 기존 네이밍 규칙 활용 |
| 로드 임계값 | 3건 | 컨텍스트 압박 방지 |
```

## 5단계 시뮬레이션 결과

### (1) document-management.md 학습

`domain_digest` 추출 시도 결과:

```yaml
domain_digest:
  policies: []  # 부재 — 정책 ID 체계 없음
  decisions:
    # "핵심 결정 사항" 섹션의 표를 자동 ID 부여로 디코드 시도
    - id: DEC-001
      statement: "문서 관리 단위 = domain 단위 2계층 모델 (domain.md + feature/)"
      source_section: "핵심 결정 사항"
      supersedes: null
    - id: DEC-002
      statement: "domain.md 판별 = 위치 기반 (category 디렉토리 직속 .md)"
      source_section: "핵심 결정 사항"
      supersedes: null
    - id: DEC-003
      statement: "domain 경계 결정 = 사후 발견"
      source_section: "핵심 결정 사항"
      supersedes: null
    # ... (총 18개 결정 항목, DEC-001 ~ DEC-018)
    - id: DEC-017
      statement: "경로 해소 규칙 배치 = development-principles 공통 정의"
      source_section: "핵심 결정 사항"
      supersedes: null
    - id: DEC-018
      statement: "경로 해소 지시문 = 실행할 명령 명시"
      source_section: "핵심 결정 사항"
      supersedes: null
  requirement_ids: []  # 부재 — REQ ID 체계 없음 (정책/구조 설명 중심 문서)
  section_index:
    "시스템 개요": [3, 8]
    "2계층 문서 모델": [9, 55]
    "문서 생명주기": [57, 86]
    "크로스 도메인 변경과 pending": [88, 94]
    "개발 중 문제 대응": [96, 118]
    "HANDOFF 멀티세션 관리": [120, 133]
    "설계 문서 탐색": [135, 144]
    "통합 요약 생성": [146, 152]
    "카테고리와 경로 규칙": [154, 180]
    "관련 파일": [182, 193]
    "핵심 결정 사항": [195, 218]
```

**발견된 호환성 이슈:**

1. **정책 ID 부재 (`policies: []`)**: document-management.md에는 `POL-NNN` 형식의 정책 ID가 전혀 없다. "핵심 결정 사항" 표는 결정(DEC)으로 매핑 가능하지만, "정책"으로 분류할 수 있는 별도 항목이 없다. 결과적으로 머지 시 feature가 새 정책을 도입하면 domain.md에 정책 ID 체계가 신설되어야 한다.

2. **요구사항 ID 부재 (`requirement_ids: []`)**: document-management.md는 정책/구조 설명 중심 문서로 `REQ-NNN` 체계가 없다. 이는 SKILL.md의 누락 처리 규칙("빈 배열로 둔다")으로 처리되지만, 호환성 첫 머지 체크리스트에는 명시적 항목이 없다.

3. **섹션 10 변경 이력 부재 + 구조적 모호성**: document-management.md는 약 9~11개의 H2 섹션을 가지나 명시적인 "섹션 10. 변경 이력"이 없다. SKILL.md 호환성 체크리스트의 처리 규칙("시작점 행만 자동 추가")은 명확하나, **변경 이력 섹션의 신설 위치**가 모호하다 — "관련 파일"과 "핵심 결정 사항" 사이? 문서 맨 끝? SKILL.md는 이를 명시하지 않는다.

4. **의존성 맵 부재**: "관련 파일" 섹션은 파일 목록이지 시스템 의존성 맵이 아니다. 가상 feature `doc-search`는 의존성 맵이 필요 없으므로(`머지에 필요한 경우에만` 조항으로) 이슈 없음.

5. **frontmatter 부재**: document-management.md 1번 라인은 인용문(`>`)으로 시작하며 frontmatter가 없다. 위치 기반(`docs/design/dev-workflow/` 직속 .md) 판별이므로 SKILL.md 규칙대로 진행 가능.

6. **DEC ID 자동 부여의 idempotency 우려**: "핵심 결정 사항" 표의 18개 행에 자동으로 DEC-001 ~ DEC-018을 부여할 때, 표 행 순서가 입력 안정성을 보장하므로 idempotent하다. 단, 향후 사용자가 표 행을 재배열하면 ID 재할당이 발생하므로 **첫 머지 후 ID를 명시 컬럼으로 기록**해야 idempotency가 영구 보장된다. SKILL.md는 이를 명시하지 않는다.

### (2) doc-search 학습

`feature_digest` 추출 결과:

```yaml
feature_digest:
  policies: []
  decisions:
    - id: F-DEC-001
      statement: "매칭 방식 = substring"
      source_section: "5. 핵심 결정 사항"
    - id: F-DEC-002
      statement: "로드 임계값 = 3건"
      source_section: "5. 핵심 결정 사항"
  requirement_ids: [REQ-001, REQ-002, REQ-003]
```

### (3) 머지 계획

**정책 충돌 식별:**

- 정책: 양측 모두 없음 → 충돌 없음
- 결정: F-DEC-001/002는 기존 DEC-010 ("매칭 방식 = 디렉토리명 부분 매칭 substring") 및 design-doc-index 관련 정책과 **부분 중복**. 구체적으로:
  - F-DEC-001 ("substring") ≈ DEC-010 (기존: "디렉토리명 부분 매칭 substring") → **중복**, append 불필요
  - F-DEC-002 ("로드 임계값 3건") → 기존에 본문 산문("1~3건은 즉시 로드, 4건 이상은 목록 제시")으로만 존재, 표 항목 부재 → **신규 항목으로 append 권장**
- 요구사항 ID: domain의 `requirement_ids: []`이므로 ID 중복 없음 → feature의 REQ-001~003은 그대로 보존하거나, 도메인이 REQ 체계 신규 도입 시 도메인 번호로 흡수.

**자동 수정 vs 사용자 결정 분류:**

| 항목 | 분류 | 처리 |
|---|---|---|
| F-DEC-001 중복 (DEC-010과 동일) | 자동 수정 | drop (중복 제거) |
| F-DEC-002 신규 결정 행 추가 | 사용자 결정 | 새 섹션? 기존 표 append? 위치 결정 필요 |
| REQ-001~003 신규 도입 | 사용자 결정 | domain에 REQ 체계 신설 여부 |
| 본문 산문 보강 (substring/임계값 설명) | 자동 수정 | append |

**Architect 라운드 등급 예상: 2**
- 사용자 결정 1~2건 + 의미 충돌 0
- (3건 이상 사용자 결정 + 의미 충돌 1개 발생 시 3라운드로 승급)

### (4) 적용 (가상)

dry-run plan 예상 출력:

```
ℹ️ 'document-management.md'는 신규 머지 흐름에 처음 진입합니다.
   호환성 체크리스트를 적용합니다.

   - 섹션 10 변경 이력 부재 → 시작점 행만 자동 추가
   - 정책 ID 부재 → 첫 머지에서 사용자 결정 (자동 부여 vs 보존)
   - 요구사항 ID 부재 → 신규 도입 여부 사용자 결정
   - 의존성 맵 부재 → 본 머지에 불필요, 건너뜀
   - frontmatter 부재 → 위치로 판별, 그대로 진행

── 머지 계획 (dry-run) ────────────────────────────

대상: document-management.md (도메인)
머지 후보: doc-search

[자동 수정 항목 — 회계 형식]
- F-DEC-001 중복 제거 (domain.DEC-010와 동일)
  근거: "매칭 방식 = substring" 의미적 동일
- 본문 산문 보강:
  "설계 문서 탐색" 섹션에 doc-search의 임계값 설명 통합

[사용자 결정 항목]
1. 정책/결정 ID 체계 보존 vs 자동 부여
   → 첫 머지 호환성 체크 항목입니다.
   a. 기존 결정 표에 DEC-001 ~ DEC-018 자동 부여 (idempotency 향상)
   b. ID 부여 보류 (현재 표 형식 유지)

2. F-DEC-002 ("로드 임계값 3건") 신규 추가 위치
   → 어느 섹션의 결정 표에 추가할지?
   a. "핵심 결정 사항" 표 끝에 append
   b. 새 결정 항목 그룹 신설

3. REQ 체계 신규 도입 여부
   → doc-search의 REQ-001~003을 도메인이 흡수할지?
   a. 도메인에 새 "요구사항" 섹션 신설 후 흡수
   b. feature 본문에서만 REQ ID 유지, 도메인은 산문 통합

4. 섹션 10 변경 이력 신설 위치
   → "관련 파일" 다음? "핵심 결정 사항" 다음? 문서 맨 끝?

이대로 진행할까요?
1. Yes
2. No (abort)
```

### (5) 검증 (가상)

체크리스트 통과 여부 예상:

| 항목 | 결과 | 이유 |
|---|---|---|
| 정책 ID 보존 | Y (vacuously) | pre-merge policies가 빈 집합이므로 ⊆ 관계 trivially 성립. 단, **사용자가 (1)에서 자동 부여를 선택한 경우** post-merge에 DEC-001~DEC-018이 추가되어 ID 집합이 확장된 것이지 누락은 없음. |
| supersede 없는 정책 누락 X | Y | 정책/결정 누락 없이 추가만 발생. |
| 섹션 10 변경 이력 행 추가 | Y (조건부) | 시작점 행 자동 추가 + 첫 머지 행 추가 = 2행. **단, 신설 위치가 사용자 결정 4번에 의존**하므로 결정이 빠진 경우 검증 실패 가능. |
| 라인 수 변화율 ±50% 이내 | Y | 218 lines → 약 240~260 lines 예상 (변경 이력 섹션 + 신규 결정 1행 + REQ 흡수 시 산문 추가). 변화율 ~10~20%로 안전. |

## 발견된 호환성 이슈 → SKILL.md 반영 사항

현재 `skills/merge-to-domain/SKILL.md`의 "호환성 첫 머지 체크리스트" 섹션
(lines 405–421)을 본 dry-run 결과와 대조한 결과:

### 잘 다뤄지고 있는 항목

| 발견 이슈 | SKILL.md 처리 | 평가 |
|---|---|---|
| 섹션 10 변경 이력 부재 | "시작점 행만 자동 추가, 소급 기록 금지" | ✅ 명확 |
| 정책 ID 부재 | "첫 머지에서 사용자 결정 (자동 부여 vs 보존)" | ✅ 명확 |
| 의존성 맵 부재 | "머지에 필요한 경우에만 사용자에게 질문" | ✅ 명확 |
| frontmatter 부재 | "없어도 진행 (위치로 domain 판별)" | ✅ 명확 |

### 추가 보강 필요 사항 (SKILL.md 갱신 권장)

| 발견 이슈 | 현재 SKILL.md | 권장 보강 |
|---|---|---|
| **요구사항 ID 부재** | (1) 단계 "누락 처리"에만 언급, 호환성 체크리스트 미포함 | 호환성 체크리스트에 "요구사항 ID — 부재 시 첫 머지에서 사용자 결정 (자동 부여 vs 보존, 정책 ID와 동일 규칙)" 추가 |
| **DEC 자동 부여 후 영구 기록** | (1) 단계 idempotency 의무에만 언급, 첫 머지 후 ID 영구화 절차 부재 | 호환성 체크리스트에 "정책/결정 ID 자동 부여 선택 시 → 머지 적용 시 표에 명시 컬럼 추가하여 후속 idempotency 보장" 추가 |
| **변경 이력 신설 위치** | SKILL.md는 "섹션 10"이라 가정하나 실제 도메인이 9개 섹션 이하일 수 있음 | 호환성 체크리스트에 "기존 도메인의 마지막 H2 섹션 다음에 '변경 이력' 섹션 신설. '섹션 10'은 권장 번호이며 실제 위치는 문서 구조에 맞춤" 추가 |

위 3가지 보강은 첫 머지 시 graceful degradation의 안정성을 높이며, **Task 8 결과로
SKILL.md를 별도 commit으로 갱신**하는 것을 권장한다.

## 결론

신규 `merge-to-domain` 스킬은 기존 `document-management.md`에 대해 **대체로 안전하게
동작**한다. 호환성 첫 머지 체크리스트가 4가지 주요 부재 케이스(섹션 10, 정책 ID,
의존성 맵, frontmatter)를 명시적으로 다루며, 누락 처리 규칙(빈 배열)이 5단계
알고리즘 전반의 견고성을 보장한다.

단, 다음 3가지 케이스가 **현재 SKILL.md에서 암시적으로만 다뤄지고 있어** 첫 머지
시 사용자 혼란을 일으킬 수 있다:

1. 요구사항 ID 부재 시 처리 절차
2. 정책/결정 ID 자동 부여 후 영구 기록 방법
3. 변경 이력 섹션의 실제 신설 위치 (도메인 섹션 수가 9개 이하일 때)

이 3가지를 SKILL.md "호환성 첫 머지 체크리스트" 섹션에 명시적으로 추가하면 첫
머지의 graceful degradation이 완전해진다. **본 dry-run의 결과로 SKILL.md 보강을
별도 commit으로 분리하여 진행한다.**
