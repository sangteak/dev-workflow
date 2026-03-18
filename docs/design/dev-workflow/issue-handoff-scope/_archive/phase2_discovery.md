---
feature: issue-handoff-scope
category: dev-workflow
phase: discovery
created: 2026-03-18
---

# Phase 2: 발견 (Discovery)

## 미정의 영역 → 해소 결과

### 1. 구체적 규칙 위치

**Q:** context-handling 스킬의 어느 섹션에 격리 규칙을 추가할 것인가?

**A:** 2곳 수정
- "HANDOFF.md 생성 규칙" 섹션 — 격리 규칙 추가
- "중간 결정 사항 업데이트" 섹션 — 스코프 한정 보강

### 2. 규칙 표현 방식

**Q:** "금지 규칙" 한 줄이면 충분한가, 시나리오별 가이드가 필요한가?

**A:** 금지 규칙 + 근거 = 2줄 방식
- 금지: issues/ 서브워크플로우에서 HANDOFF 생성·업데이트 시 부모 Feature의 HANDOFF.md를 수정하거나 새로 생성하지 않는다
- 근거: 부모-이슈 관계는 이슈 측 메타데이터(is-issue, parent-feature)로 표현되므로 중복 기록 불필요

### 3. 기존 규칙과의 충돌 방지

**Q:** "중간 결정 사항 업데이트" 섹션에서 이슈 작업 중 부모 HANDOFF 업데이트가 트리거될 여지는?

**A:** 현재 "HANDOFF.md에 중간 결정 사항을 업데이트" 문구가 어떤 HANDOFF인지 한정하지 않음. 현재 작업 위치의 HANDOFF만 대상으로 한정하는 스코프 보강 필요.

### 4. 수정 대상 스킬 범위

**Q:** context-handling 외 다른 스킬도 수정해야 하는가?

**A:** context-handling 1개만 수정. HANDOFF 정책의 SSOT는 context-handling. brainstorming의 issues/ 디렉토리 구조 설명은 정책이 아닌 참조이므로 건드리지 않음 (DRY 원칙).

## 페르소나 피드백 결과

### 라운드 1: 규칙 위치
- **합의**: "HANDOFF.md 생성 규칙" + "중간 결정 사항 업데이트" 2곳 수정

### 라운드 2: 규칙 표현 방식
- **합의**: 금지 규칙 + 근거 2줄. 시나리오별 가이드 불필요

### 라운드 3: 수정 대상 스킬 범위
- **합의**: context-handling 1개만. brainstorming에 중복 추가하면 DRY 위반

## 스코프 외 메모

- "issues/ 서브워크플로우 로직의 스킬 배치 재검토" — 별도 기능으로 추후 논의
