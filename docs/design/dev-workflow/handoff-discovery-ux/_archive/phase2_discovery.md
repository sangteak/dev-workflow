# Phase 2: 발견 (Discovery) — handoff-discovery-ux

## 미정의 영역 및 해소 결과

### A. context-handling 탐색 절차 상세

**결정:** 단일 패스 탐색 (단계적 실패 방식 제거)

```
Step 1: 전체 탐색 (사용자에게 출력하지 않음)
  - docs/design/ 하위 전체를 한 번에 스캔
  - glob 3회: **/HANDOFF.md, **/phase*.md, **/*.md
  - _archive/ 경로 포함 항목 제거
  - 디렉토리별로 그룹핑

Step 2: 분류
  - 완료 항목 제외: status: complete 또는 _archive/ 존재
  - HANDOFF 있는 항목: current-phase + last-updated 추출
  - HANDOFF 없는 항목: 파일 조합으로 단계 추론 + 최근 파일 수정일 사용

Step 3: 정렬 및 출력
  - last-updated 역순 정렬
  - issues/ 항목은 부모 하위에 들여쓰기
  - 템플릿으로 출력
```

**출력 억제 — 금지 패턴:**
```
⛔ 금지 출력:
- "탐색합니다", "검색 중", "파일을 찾고 있습니다"
- glob 실행 결과 (파일 수, 경로 목록)
- "HANDOFF.md가 없습니다", "다른 위치에서 찾겠습니다"
- sequential-thinking 등 내부 추론 과정
```

### B. HANDOFF 없는 항목의 "현재 단계" 라벨 규칙

| 파일 조합 | 라벨 |
|-----------|------|
| HANDOFF 있음 | HANDOFF의 `current-phase` 값 그대로 |
| `phase1.md`만 | Phase 1 완료 |
| `phase1.md` + `phase2.md` | Phase 2 완료 |
| `phase1.md` + `phase2.md` + `phase3.md` | Phase 3 완료 |
| `[기능명].md` + `status: ready-for-plan` | PLAN 대기 |
| `plan.md` 존재 | DEVELOP 진행 중 |
| 위 어디에도 해당 안 됨 | 목록에서 제외 |

- HANDOFF 없는 항목에 `⚠️ HANDOFF 없음` 태그 부착

### C. orchestrator Step 2 수정 범위

**수정 전:**
```
2. HANDOFF & Design Document Check
   - 동일 세션 내 브레인스토밍 완료 직후 → 생략
   - 신규 세션 → 4단계 분기:
     1. HANDOFF glob → context-handling invoke
     2. HANDOFF 없음 + phase*.md → 이어서 진행 제안
     3. HANDOFF 없음 + 기능명.md → PLAN 진입
     4. docs/design/ 없음 → 새 작업 안내
```

**수정 후:**
```
2. HANDOFF & Design Document Check
   - 동일 세션 내 브레인스토밍 완료 직후 → 생략
   - 신규 세션 → invoke `dev-workflow:context-handling` skill
     (탐색, 분류, 목록 제시, 폴백을 모두 처리)
```

- 자동 PLAN 진입 제거 → 사용자 선택 기반으로 통일

### D. "HANDOFF 없음" 항목 선택 시 복구 흐름

| 라벨 | 복구 동작 |
|------|----------|
| Phase N 완료 · ⚠️ HANDOFF 없음 | phase 파일 로드 → Phase N+1부터 시작 |
| PLAN 대기 · ⚠️ HANDOFF 없음 | [기능명].md 로드 → PLAN 단계 진입 |
| DEVELOP 진행 중 · ⚠️ HANDOFF 없음 | plan.md 로드 → 태스크 체크리스트 확인 후 재개 |

**복구 안내 메시지 구분:**
```
HANDOFF 있는 경우:
⚠️ 이전 세션이 [국면명] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?

HANDOFF 없는 경우:
⚠️ 이 작업에는 HANDOFF.md가 없습니다.
마지막으로 완료된 단계는 [Phase N / PLAN 대기 / DEVELOP]입니다.
[다음 단계명]부터 새로 시작합니다. 계속할까요?
```

### E. docs/design/ 자체가 없는 경우

```
📋 진행 중인 작업이 없습니다.

  0. ✨ 새 작업 시작

새 작업을 시작하세요.
```

- 기술적 설명("설계 문서가 없습니다") 대신 자연스러운 안내
- 외부 설계 문서 질문("설계 문서를 제공하시겠습니까?")은 기존대로 orchestrator가 후속 처리

## 피드백 결과 요약

### 탐색 절차 (합의)
- 단일 패스 탐색으로 단순화, 금지 출력 패턴 명시

### 라벨 규칙 (합의)
- 파일 조합 기반 매핑 테이블 채택, ⚠️ HANDOFF 없음 태그

### orchestrator 수정 (합의)
- Step 2를 단순 invoke로 축소, 폴백 체인 전체를 context-handling에 일원화

### 복구 흐름 (합의)
- HANDOFF 유무에 따라 안내 메시지 구분 ("이어서" vs "새로 시작")

### docs/design/ 미존재 (합의)
- 목록 형식 유지, 0번만 표시, 외부 설계 문서 질문은 orchestrator 후속 처리
