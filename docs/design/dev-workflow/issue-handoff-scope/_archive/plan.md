---
feature: issue-handoff-scope
category: dev-workflow
created: 2026-03-18
---

# Implementation Plan: issue-handoff-scope

## 수정 대상

- **파일**: `skills/context-handling/SKILL.md`
- **수정 위치**: 2곳

## Task 1: "HANDOFF.md 생성 규칙" 섹션에 격리 규칙 추가

**위치**: 70~72행 (`issues/ 내 HANDOFF 생성 시:` 블록) 직후

**추가 내용**:
```markdown
**issues/ 내 HANDOFF 생성·업데이트 시 부모 격리 규칙:**
- issues/ 내 HANDOFF 생성·업데이트 시 부모 Feature의 HANDOFF.md를 수정하거나 새로 생성하지 않는다
- 부모-이슈 관계는 이슈 측 메타데이터(`is-issue`, `parent-feature`)로 표현되므로 부모 HANDOFF에 이슈 정보를 중복 기록할 필요가 없다
```

## Task 2: "중간 결정 사항 업데이트" 섹션 스코프 한정

**위치**: 127행

**변경**:
- Before: `작업 진행 중 HANDOFF.md에 중간 결정 사항을 업데이트할 수 있다.`
- After: `작업 진행 중 현재 작업 위치의 HANDOFF.md에 중간 결정 사항을 업데이트할 수 있다.`

## 검증 방법

1. 이슈 서브워크플로우 진입 후 "HANDOFF 저장해줘" 요청 시 이슈 HANDOFF만 생성/수정되는지 확인
2. 부모 Feature의 HANDOFF.md가 변경되지 않는지 확인
