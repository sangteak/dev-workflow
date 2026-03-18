---
feature: issue-handoff-scope
category: dev-workflow
phase: exploration
created: 2026-03-18
---

# Phase 1: 탐색 (Exploration)

## 탐색된 요구사항

### 확정 항목

1. **이슈 HANDOFF 저장 시 부모 HANDOFF 수정/생성 금지**
   - 이슈에서 "HANDOFF 저장해줘" 요청 시 이슈의 HANDOFF만 저장
   - 부모 Feature의 HANDOFF.md를 수정하거나 새로 생성하지 않음
   - 이슈는 hotfix 전략 — 작업 완료 후 부모에 정리·반영

2. **이슈 생성 시 부모 HANDOFF 자동 저장 불필요**
   - 이슈는 DEVELOP 단계에서만 발생 (설계 의도)
   - DEVELOP 상태는 기존 산출물로 복구 가능: plan.md 태스크 목록, 코드 변경(git), TodoWrite 추적
   - 부모 맥락 보존이 별도로 필요하면 사용자가 직접 요청

3. **부모-이슈 관계 표시는 이슈 측 메타데이터로 충분**
   - `is-issue: true`, `parent-feature: [부모 기능명]` 필드
   - 세션 시작 목록에서 부모 하위에 들여쓰기로 자동 표시됨
   - 부모 HANDOFF 본문에 이슈 참조를 추가할 필요 없음

### 제외 항목

- BRAINSTORM/PLAN 중간에서의 이슈 생성 시나리오 — 설계 의도상 이슈는 DEVELOP에서만 발생하므로 스코프에서 제외

## 확정된 페르소나

- 🛠️ Claude Code Expert (국면 1~3)
- 🎯 Workflow Designer (국면 1~3, 리드)
- 🔍 Ecosystem Analyst (국면 3 활성화)

## 근본 원인 분석

- context-handling 스킬에 이슈 HANDOFF 저장 시 부모 HANDOFF에 대한 **명시적 격리 규칙이 없음**
- Claude가 "더 많이 저장하는 게 안전하다"고 넓게 해석하여 부모 HANDOFF까지 수정
- 해결: context-handling 스킬에 금지 규칙 추가

## 페르소나 피드백 결과

### 라운드 1: 이슈 HANDOFF 격리 원칙
- **합의**: 이슈 HANDOFF 저장 시 부모 HANDOFF 수정은 불필요. 메타데이터로 관계 충분히 표현됨

### 라운드 2: 이슈 생성 시 부모 상태 보존 자동화 여부
- **합의**: 자동 저장 불필요. DEVELOP 상태는 기존 산출물(plan.md, git, TodoWrite)로 복구 가능. 사용자도 현재 이 방식으로 성공적으로 운영 중

### 라운드 3 (재설정 후): 부모 HANDOFF 자동 생성 필요성
- **미합의 → 사용자 결정으로 해소**:
  - 🛠️: DEVELOP에서만 이슈 생성 → 기존 산출물로 복구 가능 → 불필요
  - 🎯: 국면 중간 유실 위험 → 안전장치 필요
  - 사용자: 🛠️ 입장 채택 — 복구 가능하므로 불필요
