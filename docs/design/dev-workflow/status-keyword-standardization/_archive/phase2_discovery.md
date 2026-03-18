# Phase 2: 발견 (Discovery)

> 기능명: status-keyword-standardization
> 카테고리: dev-workflow
> 날짜: 2026-03-18
> 페르소나: 🛠️ Claude Code Expert / 🎯 Workflow Designer

---

## 미정의 영역 및 해소 결과

### 영역 1: 자동 수정 절차의 구체적 단계

**Q:** 읽기 시점 자동 수정을 어떤 순서로 명시할 것인가?

**A:** 인덱싱 흐름 안에 자연스럽게 녹이는 4단계 절차:
1. 프론트매터의 status 값을 읽는다
2. 정규값(`complete`) → 그대로 진행
3. 허용 변형(`completed`, `완료`) → 해당 파일의 프론트매터를 `complete`로 수정 → 인덱싱 계속
4. 그 외 값 또는 status 없음 → 해당 문서 스킵

- 양쪽 스킬(`design-doc-index`, `design-summary`)에 동일 표현으로 명시
- Markdown 스킬은 코드처럼 함수 공유가 불가하므로 중복 명시가 현실적

### 영역 2: `in-development` 제안 처리

**Q:** `input-interaction-consistency/plan.md`에 남아있는 `in-development` 상태 제안을 어떻게 처리할 것인가?

**A:** 이 plan.md가 근본 원인이었음이 확인됨:
- plan.md 라인 116에서 `status: completed`를 최종 상태로 명시
- Claude가 `document-consolidation` 스킬의 `complete` 지시보다 plan의 `completed`를 우선 적용
- 해결: `document-consolidation` 스킬에 "plan.md 값에 관계없이 정규값 `complete`를 사용한다"는 우선순위 규칙 추가
- plan.md 자체는 Superpowers `writing-plans` 소관이므로 직접 개입하지 않음

### 영역 3: 불일치 발생 위치 확인

**Q:** 최종 feature.md가 잘못된 건지, 중간 파일이 잘못된 건지?

**A:** 최종 feature.md 자체가 `completed`로 잘못 들어감 (8개 중 2개):
- `input-interaction-consistency.md`: `status: completed` ❌
- `persona-feedback-loop.md`: `status: completed` ❌
- 나머지 6개: `status: complete` ✅

---

## 페르소나 피드백 요약

### 주제: 자동 수정 절차
- **합의**: 4단계 절차로 확정. 양쪽 스킬에 동일 표현으로 명시.

### 주제: plan.md와 스킬 지시 충돌
- **합의**: `document-consolidation`에 우선순위 규칙 추가. plan.md는 Superpowers 소관이므로 개입하지 않음.
