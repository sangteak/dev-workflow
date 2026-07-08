---
feature: domain-merge-pipeline
category: dev-workflow
phase: 2
created: 2026-05-18
status: immutable
---

# Phase 2: Discovery — domain-merge-pipeline

> 본 파일은 Phase 2 종료 시 생성된 **불변 스냅샷**이다. 이후 수정하지 않는다.

---

## 0. 발견된 미정의 영역

Phase 1 종료 시점에서 다음 영역이 미정의 상태로 식별되었다:

1. 빈 상태 케이스 — complete feature 0개일 때 스킬 동작
2. 머지 보고서 포맷 — 결과를 어떻게, 어디에 출력
3. 🏛️ Architect 피드백 루프 발동 조건
4. phase 파일 정리 책임
5. 상호작용/격리 (Concurrency)
6. 부분 머지 케이스
7. 사용자 사전 승인 발화 패턴
8. 기존 완료 도메인 호환성

Phase 2에서 1~6번을 다루었고, 7~8번은 Phase 3 또는 PLAN으로 이월한다.

---

## 1. Round 1 — 빈 상태 + 머지 보고서

**비판 담당:** 🛠️ Claude Code Expert [Contrarian]
**자유 발언:** 🎯 Workflow Designer

### 핵심 비판 요지
- "친절한 status 목록"은 사용자 멘탈 모델 오류를 가리는 편의의 가면
- "merge 스킬이 빈 상태에서도 무언가 출력해야 한다"는 스킬 책임 비대화
- "inline 출력은 충분히 영속적"이라는 가정은 휘발성 매체에 중요 정보를 흘려보냄

### 합의

**A. 빈 상태 케이스:**
- 한 줄 출력 후 종료
- 메시지: `현재 '{category}' 카테고리에 머지 가능한 complete feature가 0건입니다.`
- status별 진행 중 feature 목록, 후속 액션 제안 등 추가 정보는 출력하지 않음 (스킬 책임 분리)
- 진행 상태 안내는 `/dev-workflow:resume`의 책임

**B. 머지 보고서:**
- 별도 보고서 파일을 생성하지 않음
- 머지 시작 시 dry-run 계획을 inline으로 표시 (사용자 confirm)
- 결과 기록은 Phase 1 결정 그대로 — domain.md 섹션 10에 "완료" 행만 추가
- Skip / Abort는 **기록하지 않음**:
  - Skip: 사용자 의도. feature 디렉토리 보존만으로 다음 세션에 재처리 가능
  - Abort: 다음 세션에서 자연스럽게 재시도. 별도 기록 불필요
- 머지 세션 종료 시 inline 요약 출력 (휘발 허용):
  ```
  머지 세션 완료
    완료: N개 (feature명 목록)
    skip: M개 (feature명 목록)
    abort: K개 (feature명 목록)
  ```

---

## 2. Round 2 — Architect 피드백 루프 발동 + phase 파일 정리

**비판 담당:** 🎯 Workflow Designer [Contrarian]
**자유 발언:** 🛠️ Claude Code Expert

### 핵심 비판 요지
- "머지는 항상 고품질 보증 필요"는 이중 검증 인플레이션 (Phase 1에서 검증된 문서들 합치는 작업인데 또 검증?)
- "토큰만 더 쓰면 가치 있다"는 사용자 인지 비용/의사결정 피로 무시 → rubber-stamping 위험
- "phase 파일 의도는 [feature].md에 통합됐다"는 거짓 — phase는 폐기된 대안과 "왜?" 맥락 보유

### 토론 전개 (사용자 통찰)

사용자가 핵심 통찰 제기: "머지가 git merge처럼 단순할 수 없다. domain은 의미 있는 문서, feature는 특정 기능 시각의 문서이므로 정책 충돌은 머지의 본질. 트리거 조건 사전 분류는 머지를 단순화시키는 잘못된 프레이밍."

→ "트리거 조건 발동" 합의를 폐기하고 **모든 머지가 항상 intelligent하게 동작**하도록 재설계.

### 합의

**A. Architect 피드백 루프 발동 정책:**
- **모든 머지의 (3) 머지 계획 단계에서 항상 발동**
- **라운드 적응형 (1~3라운드 자동 조정)**:
  - 단순 머지 (충돌 없는 추가) → Architect가 "검토 결과 안전, 통과" 1라운드 종료
  - 의미 충돌 발견 → 2~3라운드로 확장
- **Rubber-stamping 회피**: 사용자에게는 Architect 라운드 본문이 아닌 **정제된 머지 계획 + Architect 결론**만 노출
- **옵션 플래그**:
  - `--no-review`: 사용자가 명시적으로 Architect 차단 (긴급 핫픽스용)
  - `--review-merge=N`: 라운드 수 강제 지정

**A-1. 머지 알고리즘 5단계 — intelligent 보강:**
```
(1) domain.md 학습 — 의미와 정책 추출 (단순 텍스트 파싱 X)
(2) feature.md 학습 — 의도와 정책 추출 + domain과의 관계 분석
(3) 머지 계획 수립
    ├─ 정책 충돌 식별
    ├─ 분류: 자동 수정 가능 vs 사용자 결정 필요
    ├─ 🏛️ Architect 피드백 루프 검증
    └─ dry-run plan 생성
(4) 적용 — 사용자 승인 후
(5) 검증 — diff 요약 + 검증 페르소나 체크리스트
```

**A-2. 자동 수정 vs 사용자 결정 분류 규칙:**

| 충돌 유형 | 처리 방식 | 예시 |
|---|---|---|
| ID 중복 (REQ-001 등) | 자동 renumbering | feature의 REQ-001 → domain에서 REQ-008로 |
| 표 형식 불일치 | 자동 통일 | 컬럼 순서, 정렬 기준 통일 |
| 충돌 없는 신규 항목 | 자동 append | 새 REQ, 새 모드 추가 |
| 새 섹션 신설 | **사용자 결정** | 신규 섹션 위치/이름 |
| 의미 충돌 | **사용자 결정** | "MMR 기준" vs "latency 기준" |
| 기존 결정 무효화 | **사용자 결정** | 정책 변경 명시 확인 |
| 의존성 맵 재정의 | **사용자 결정** | 컴포넌트 관계 변경 |

자동 수정 사항은 dry-run plan의 "자동 처리됨" 섹션에 나열 (별도 사용자 결정 불요).
사용자 결정 사항은 각각 질문 형태로 제시.

**B. phase 파일 정리:**
- Phase 1 결정 유지 — feature 디렉토리 **통째 삭제**
- `_archive/` 보존 안 함 (사용자가 이전 경험으로 _archive 활용 후 삭제 결론)
- 역사적 맥락은 git log로 위임

---

## 3. Round 3 — Concurrency + 부분 머지

**비판 담당:** 🛠️ Claude Code Expert [Contrarian]
**자유 발언:** 🎯 Workflow Designer

### 핵심 비판 요지
- "머지 세션은 짧다"는 낙관 (Architect 루프 추가 시 길어짐)
- 시작 시점 스냅샷과 커밋 시점 사이의 silent overwrite 위험
- 부분 머지는 통합 문서가 "거짓말"하게 함 (전체 그림 표방하지만 진행 중 누락)

### 토론 전개 (사용자 통찰)

사용자가 두 가지 본질을 가리킴:

**통찰 1:** "feature가 저장소에 올라갔고 complete 상태라면 작업이 끝난 것. 다른 feature가 develop 중이라고 이걸 '부분 머지'라고 보는 것 자체가 잘못된 프레이밍."
→ "부분 머지" 개념 폐기. 모든 머지는 단순히 "그 시점의 complete feature들을 머지".

**통찰 2:** "현재 최신화된 상태에서 완료된 feature를 머지하는데, 다른 사용자가 push했다는 게 왜 영향을 주는가?"
→ Concurrency 케이스 재분석 결과, 실제로 영향을 주는 케이스는 거의 없음. git native 메커니즘으로 충분.

### Concurrency 영향 분석

| Case | 시나리오 | 영향 |
|---|---|---|
| 1 | 다른 파일/카테고리 push | 없음 (git auto fast-forward) |
| 2 | 같은 카테고리에 새 feature 추가 | 없음 (다음 머지에서 처리) |
| 3 | 작업자가 domain.md 직접 수정 | 발생 불가 (Phase 1 권한 분리) |
| 4 | 다른 관리자가 동시 머지 | git이 commit/push 시 자동 알림 |

→ 별도 SHA 비교 메커니즘 불필요. git native 메커니즘 활용.

### 합의

**A. Concurrency:**
- 별도 SHA 비교, optimistic check 등 추가 메커니즘 없음
- 머지 스킬은 git error를 사용자에게 그대로 노출
- 머지 결과 → `git add` + `git commit` (로컬)
- push는 별도 단계 (Completion Protocol Step 3 또는 사용자 명시 push)
- push 시 rejected 발생 시 → 사용자가 git native 메커니즘으로 해결 (rebase/merge)

**B. 부분 머지:**
- "부분 머지" 개념 자체 폐기
- 머지 스킬은 그 시점의 complete feature만 식별하여 머지
- 사용자에게 "develop 중인 게 있는데 진행할까요?" confirm 요구 **없음**
- frontmatter에 `merge_status`, `merged_features`, `pending_features` 등 추가 필드 **없음**
- design-doc-index / design-summary 확장 **없음**

---

## 4. 페르소나 합의 요약

| 주제 | 합의/미합의 | 결론 |
|---|---|---|
| 빈 상태 케이스 | 합의 | 한 줄 출력 후 종료 |
| 머지 보고서 포맷 | 합의 | 별도 파일 없음. inline 요약 + 섹션 10 완료 행 기록만 |
| Skip/Abort 기록 | 합의 | 기록하지 않음 (디렉토리 보존 + 자연스러운 재시도로 충분) |
| Architect 발동 정책 | 합의 (재설계) | 모든 머지에서 항상 발동, 라운드 적응형 (1~3) |
| 머지 알고리즘 단계 | 합의 | 5단계 intelligent 보강 (의미 분석 강제) |
| 자동 수정 vs 사용자 결정 분류 | 합의 | 표 형식 / ID 충돌 / 단순 append는 자동, 의미 충돌 / 구조 변경은 사용자 결정 |
| phase 파일 정리 | 합의 | feature 디렉토리 통째 삭제, git log에 위임 |
| Concurrency 메커니즘 | 합의 | 별도 메커니즘 없음, git native 활용 |
| 부분 머지 | 합의 | 개념 자체 폐기, 사용자 confirm 불요 |

---

## 5. Phase 1 결정 변경 사항 (Phase 2 반영)

- 🆕 머지 알고리즘 5단계 — (3) 머지 계획 단계 동작이 더 구체화됨 (정책 충돌 식별 + 자동 수정 분류)
- 🆕 Architect 피드백 루프 — "트리거 조건 시 발동" 식으로 잠시 변경했다가 다시 "모든 머지에서 항상 발동, 라운드 적응형"으로 재설계
- 🆕 머지 스킬의 옵션 플래그 추가: `--no-review`, `--review-merge=N`

Phase 1 다른 결정은 변경 없음.

---

## 6. Phase 3 또는 PLAN 이월 항목

다음 항목은 Phase 2에서 다루지 않았으며 Phase 3 또는 PLAN 단계로 이월한다:

1. **사용자 사전 승인 발화 패턴** — "이번엔 다 자동으로 해줘" 같은 자연어 트리거 인식 규칙
2. **기존 완료 도메인 호환성** — 이미 머지된 도메인 (예: ouroboros-integration 같은 기존 도메인)이 있을 때 신규 머지 스킬과의 호환성
