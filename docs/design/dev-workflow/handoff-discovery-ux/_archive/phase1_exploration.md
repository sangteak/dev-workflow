# Phase 1: 탐색 (Exploration) — handoff-discovery-ux

## 페르소나
- 🛠️ Claude Code Expert
- 🎯 Workflow Designer (리드)
- 🔍 Ecosystem Analyst (국면 3 활성화)

## 발단
사용자가 `/clear` 후 "HANDOFF.md 읽고 작업 복귀해줘"를 실행했을 때:
1. 1차 glob 탐색 실패 메시지가 노출됨 ("docs/design/ 경로에 없습니다")
2. sequential-thinking MCP 내부 로그가 그대로 노출되어 가독성 극도 저하
3. 최종 HANDOFF 목록이 context-handling 스킬의 템플릿을 따르지 않음

## 탐색된 요구사항

### 핵심 요구사항
- REQ-01: 탐색 과정(glob 실패, 재탐색 등)을 사용자에게 출력하지 않는다
- REQ-02: 결과만 기존 템플릿 형식으로 일관되게 제시한다
- REQ-03: HANDOFF가 없는 미완료 작업도 같은 목록에 통합 표시한다
- REQ-04: `_archive/` 하위 HANDOFF는 제외한다

### 출력 템플릿 (기존 유지, 확장)
```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (현재 단계)
  2. [카테고리] 기능명 (Phase 1 완료 · ⚠️ HANDOFF 없음) — 최근: YYYY-MM-DD

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

### 구조적 결정
- orchestrator Step 2의 폴백 체인을 context-handling에 일원화
- orchestrator는 "invoke context-handling"만 수행
- context-handling이 HANDOFF 탐색 + phase 파일 탐색 + 설계 문서 탐색을 모두 담당

### 상태 판단 방식
- status 체계 확장 없이 **status + 보조 파일 조합**으로 판단
- 정규 status: `ready-for-plan`, `complete` (2개만)
- HANDOFF 있는 항목: `current-phase` 필드로 정확한 단계 파악
- HANDOFF 없는 항목: 파일 조합으로 추론
  - `phase*.md`만 존재 → 브레인스토밍 진행 중
  - `[기능명].md` 존재 + `status: ready-for-plan` → PLAN 대기
  - `plan.md` 존재 + `status: complete` 아님 → DEVELOP/REVIEW 진행 중
  - `status: complete` → 완료 (목록에서 제외)
  - `_archive/` 존재 → 완료 (목록에서 제외)

### 명시적 제외 사항
- 없음

## 피드백 결과 요약

### 탐색 과정 노출 문제 (합의)
- 원인: orchestrator의 단계적 탐색 지시 + context-handling의 출력 억제 규칙 부재
- 해결: orchestrator 단순화 + context-handling에 출력 규칙 명시

### 폴백 체인 일원화 (합의)
- context-handling에 통합하여 출력 템플릿을 한 곳에서 관리

### status 확장 여부 (합의)
- 확장하지 않음. HANDOFF의 `current-phase` + 파일 존재 여부 조합으로 충분
