---
feature: quick-start-restructure
category: dev-workflow
parent: readme-redesign
phase: 3
created: 2026-03-31
---

# Phase 3: 검증 — Quick Start 재설계

## TD 기술 검토 결과

| 요구사항 | 판단 | 리스크 |
|---|---|---|
| 세션 시작 자동 감지 출력 재현 | 실제 workflow-orchestrator 출력 형식 직접 참조 필수 | 낮음 |
| BRAINSTORM 대화 예시 재현 | brainstorming 스킬 실제 출력 포맷 준수 (Round 태그 등) | 중간 |
| plan.md 생성 완료 출력 | 내용 전체 전시 → 생성 완료 알림 + 경로로 축소 | 낮음 |

## 기술 가이드라인

1. **출력 재현 정확도:** README 작성 시 실제 스킬 파일(workflow-orchestrator, brainstorming) 출력 포맷을 직접 참조하여 재현한다. 임의 창작 금지.
2. **plan.md 표현:** plan.md 내용 전체를 Quick Start에 넣지 않는다. "→ plan.md 생성 완료" 한 줄 + 경로로 처리한다.
3. **대화 예시 길이:** 스크롤 허용이지만, 독자가 흐름을 이탈하지 않도록 각 섹션(BRAINSTORM/PLAN)이 하나의 완결된 흐름을 형성해야 한다.

## 재협의 없음

모든 요구사항이 기술적으로 실현 가능하며, 재협의가 필요한 항목 없음.
