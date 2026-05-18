---
name: merge-to-domain
description: "관리자가 호출하여 docs/design/[카테고리] 하위 complete 상태 feature 문서들을 카테고리 도메인 문서(SSOT)로 intelligent merge한다. 다중 작업자 환경에서 의미 보존 머지 강제."
---

# merge-to-domain — 도메인 머지 파이프라인

> 관리자(프로젝트 리더) 단독으로 슬래시 명령 `/dev-workflow:merge-to-domain`을 통해 호출한다.
> 작업자는 이 스킬을 호출하지 않으며, domain.md를 직접 수정하지 않는다.

## 도구의 한계 (사용자에게 노출)

본 머지 스킬은 LLM 추론으로 SSOT를 변형한다. Structured digest와 검증 페르소나로 위험을
통제하지만, 의미 보존을 100% 보장하지 않는다. dry-run plan을 신중히 검토하고,
의심스러우면 abort하라.

---

## 진입 흐름

1. ARGUMENTS 해석 (자세한 옵션 처리는 후속 Task에서 추가될 "옵션 처리" 섹션 참조)
2. 대상 카테고리 결정:
   - ARGUMENTS에 카테고리명이 있으면 그것을 사용
   - 없으면 사용자에게 카테고리 선택 (인터랙티브)
3. `docs/design/[카테고리]/**` 스캔하여 `status: complete`인 feature 식별
4. **빈 상태 케이스 (REQ-018)**: 후보 0건이면 한 줄 출력 후 즉시 종료
   `현재 '{category}' 카테고리에 머지 가능한 complete feature가 0건입니다.`
5. 후보가 있으면 실행 모드 결정 (병렬/순차) → 5단계 머지 알고리즘 진입

---

## 5단계 머지 알고리즘

각 후보 feature에 대해 다음 5단계를 순서대로 실행한다:

(1) **domain.md 학습** — Structured Digest 추출
(2) **feature.md 학습** — Structured Digest 추출
(3) **머지 계획 수립** — 충돌 분류 + Architect 피드백 루프
(4) **적용** — dry-run → 사용자 승인 → domain.md 수정
(5) **검증** — Tech Lead/PM 체크리스트

---

## (1) domain.md 학습

domain.md를 읽고 다음 형식의 structured digest를 생성하라.
자유 서술 요약은 **금지**.

```yaml
domain_digest:
  policies:
    - id: POL-001
      statement: "..."
      source_section: "..."
      immutability_level: high | medium | low
  decisions:
    - id: DEC-001
      statement: "..."
      supersedes: null  # 또는 이전 결정 ID
  requirement_ids: [REQ-001, REQ-002, ...]
  section_index:
    "1. 배경": [1, 15]
    "4. 설계 개요": [50, 120]
```

**Idempotent 의무 (REQ-005):**
- 동일 입력에 대해 동일 ID/순서 보장
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (POL-001부터)
- 재학습 시에도 동일한 ID/순서 산출

**누락 처리:**
- policies / decisions / requirement_ids 어느 것이라도 부재 시 해당 필드를 빈 배열로 둔다
- 호환성 첫 머지 체크리스트(후속 Task에서 추가될 "호환성 첫 머지" 섹션 참조)에 따라 후속 처리

**Fallback (REQ-026):**
- domain.md 토큰이 80K를 초과하면 섹션 단위 분할 학습으로 fallback
- 섹션 인덱스로 부분 로드 → 각 섹션의 digest를 합쳐서 domain_digest 구성
- 토큰 추정: `file_size_bytes / 3.5` (`MERGE_TOKEN_DIVISOR` 환경 변수로 조정)

**학습 단계 사용자 게이트 (REQ-005):**

domain digest 산출 직후 사용자에게 검토 요청:

```
── domain.md 학습 결과 (digest) ───────────

추출된 정책: [요약 출력]
추출된 결정: [요약 출력]
요구사항 ID: [REQ ID 범위]
섹션 인덱스: [섹션명 목록]

이렇게 해석이 맞나요?

1. Yes
2. 수정 필요
```

"수정 필요" 선택 시 → 사용자에게 어느 부분이 잘못되었는지 받고 재추출.

---

## (2) feature.md 학습

각 feature.md에 대해 동일한 structured digest 형식으로 추출한다.
ID prefix는 `F-POL-`, `F-DEC-`를 사용 (domain과 구분).

```yaml
feature_digest:
  policies:
    - id: F-POL-001
      statement: "..."
      source_section: "..."
  decisions:
    - id: F-DEC-001
      statement: "..."
  requirement_ids: [REQ-001, ...]  # feature가 사용하는 REQ ID (domain과 충돌 가능)
```

**Idempotent 의무 (REQ-005):**
- domain.md 학습과 동일한 규칙 적용 (동일 입력 → 동일 ID/순서)
- ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호 (F-POL-001부터)

**학습 단계 사용자 게이트 (REQ-005):**

feature digest 산출 직후 사용자에게 검토 요청 (domain과 동일 패턴).
복수 feature가 있을 경우, **카테고리당 1회로 묶어 표시** (인지 부담 절감).

```
── feature.md 학습 결과 (digest) ───────────

[feature-A]
  정책: [요약 출력]
  결정: [요약 출력]
  요구사항 ID: [REQ ID 범위]

[feature-B]
  정책: [요약 출력]
  결정: [요약 출력]
  요구사항 ID: [REQ ID 범위]

...

이렇게 해석이 맞나요?

1. Yes
2. 수정 필요
```

"수정 필요" 선택 시 → 어느 feature의 어느 부분이 잘못되었는지 받고 해당 feature만 재추출.

---

<!-- 후속 Task에서 추가될 섹션 (forward reference):
     - (3) 머지 계획 수립
     - (4) 적용 (dry-run → 승인 → 수정)
     - (5) 검증
     - 옵션 처리 (ARGUMENTS, --auto 플래그, 자동 모드 발화)
     - 호환성 첫 머지 체크리스트
     - In-session Resolution 정책 (실패 시 4지 선택)
-->
