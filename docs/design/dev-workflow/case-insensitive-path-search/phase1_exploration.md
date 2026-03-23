# Phase 1: 탐색 (Exploration)

> 기능: case-insensitive-path-search
> 카테고리: dev-workflow
> 생성일: 2026-03-20

---

## 확정된 페르소나

- 🛠️ Claude Code Expert
- 🎯 Workflow Designer
- 🔍 Ecosystem Analyst (국면 3 활성화)

---

## 탐색된 요구사항

### 핵심 문제

- `context-handling resume` 실행 시 `docs/design/` 경로가 하드코딩되어 있어, 실제 디렉토리가 `Docs/design` 등 다른 케이싱일 경우 작업을 찾지 못함
- 결과: "진행 중인 작업이 없습니다" — 사일런트 실패
- 사용자 신뢰 훼손: 플러그인을 믿지 못하고 직접 디렉토리를 확인하게 됨

### 사용자 요구

1. **대소문자 구분 없이** docs/design 디렉토리를 찾아야 한다
2. 어떤 케이싱이든 반드시 찾아야 한다 (찾지 못하는 경우 0)
3. 이는 편의성이 아닌 **신뢰성** 문제

### 영향 범위

- `context-handling` 뿐 아니라 `docs/design/` 경로를 참조하는 모든 스킬에 해당
  - workflow-orchestrator, brainstorming, document-consolidation 등

### 해결 방향 후보

- **방향 A**: 경로 탐색 자체를 대소문자 무시하게 만들기
- **방향 B**: 변형 감지 후 정규화 제안

→ 방향 A가 사용자 경험상 우월 (합의)

## 페르소나 피드백 요약

| 주제 | 결과 |
|------|------|
| 해결 방향 (A vs B) | 합의: 방향 A (탐색 자체를 case-insensitive) |
| 영향 범위 | 합의: context-handling 단독이 아닌 전체 스킬 대상 |
