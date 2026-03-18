# Plan: input-interaction-consistency

> 설계 문서: `docs/design/dev-workflow/input-interaction-consistency/input-interaction-consistency.md`
> 생성일: 2026-03-17

## 개요

dev-workflow 플러그인의 사용자 입력 형식을 텍스트 기반 번호 목록으로 통일한다.
workflow-orchestrator에 Input Format Rules 섹션을 추가하고, 기존 스킬의 비일관 패턴을 수정한다.

## Feasibility 요약

- ✅ FEASIBLE: 7개 (REQ-001~004, REQ-006~008)
- ⚠️ CAUTION: 2개 (REQ-005 0번 예약, REQ-009 일괄 수정)
- 🚫 RENEGOTIATE: 0개

CAUTION 항목 합의 사항:
- REQ-005: 0번은 "닫힌 선택에서 탈출구 필요 시에만 추가", 레이블은 맥락에 맞게 변경 가능, 번호와 마지막 위치는 고정
- REQ-009: 변환 대상 3곳(2개 스킬)으로 확인됨. 기존 예상(36건 전면 수정)보다 범위가 축소되어 리스크 하향

## 태스크 목록

### Phase A: 핵심 규칙 수립 + 주요 스킬 수정

#### Task 1: workflow-orchestrator에 Input Format Rules 섹션 추가
- **파일:** `skills/workflow-orchestrator/SKILL.md`
- **위치:** Output Format Rules 섹션 바로 아래
- **내용:**
  ```markdown
  ## Input Format Rules

  사용자에게 입력을 요청할 때 아래 형식을 따른다. AskUserQuestion 도구를 사용하지 않는다.

  ### 닫힌 선택 (선택지가 있는 질문)
  [질문 텍스트]

  1. 선택지A
  2. 선택지B
  3. 선택지C
  0. [탈출 레이블]          ← 자유 입력 탈출구 필요 시에만 추가, 항상 마지막

  ### Yes/No 질문
  [질문 텍스트]

  1. Yes
  2. No

  ### 열린 입력 (선택지 없는 자유 텍스트)
  [질문 텍스트]
  > 예: "[예시 입력]"

  ### 공통 규칙
  - 번호만 사용한다 (문자 선택 A/B/C/D 금지)
  - AskUserQuestion 도구를 사용하지 않는다
  - 슬래시 구분 "(Yes / No)" 형식을 사용하지 않는다
  - 사용자가 번호 또는 자연어로 응답할 수 있다. 의미가 모호한 경우에만 재확인한다
  ```
- **검증:** 섹션 추가 후 기존 Output Format Rules와 충돌 없는지 확인

#### Task 2: persona-resolution — "(Yes / No)" 패턴 2곳 변환
- **파일:** `skills/persona-resolution/SKILL.md`
- **변환 1 (Case A 페르소나 사용 확인):**
  - Before: `이 페르소나를 사용할까요? (Yes / No)`
  - After:
    ```
    이 페르소나를 사용할까요?

    1. Yes
    2. No
    ```
- **변환 2 (Session End 페르소나 저장):**
  - Before: `.claude/personas.md 로 저장할까요? (Yes / No)`
  - After:
    ```
    `.claude/personas.md` 로 저장할까요?

    1. Yes
    2. No
    ```
- **검증:** 변환 전후 의미 동일성 확인

#### Task 3: plan-stage — A/B/C/D 문자 선택 → 번호 목록 변환
- **파일:** `skills/plan-stage/SKILL.md`
- **변환 (Step 3 재협의 선택지):**
  - Before:
    ```
    선택지:
      A) 브레인스토밍 문서를 수정하고 다시 검토
      B) 해당 요구사항을 스코프에서 제외하고 진행
      C) CAUTION으로 하향 조정하여 리스크를 감수하고 진행
      D) 대안 접근 방향을 제안받고 논의

    어떻게 진행할까요?
    ```
  - After:
    ```
    어떻게 진행할까요?

    1. 브레인스토밍 문서를 수정하고 다시 검토
    2. 해당 요구사항을 스코프에서 제외하고 진행
    3. CAUTION으로 하향 조정하여 리스크를 감수하고 진행
    4. 대안 접근 방향을 제안받고 논의
    ```
- **검증:** 변환 전후 선택지 내용 동일성 확인

### Phase B: 나머지 스킬 검토 + 버전 업데이트

#### Task 4: 나머지 스킬 검토 및 형식 보강
- **대상 스킬:** brainstorming, context-handling, design-doc-index, design-summary, document-consolidation, development-principles
- **작업:** 각 스킬의 입력 요청 프롬프트 예시가 새 Input Format Rules와 일치하는지 검토. 불일치 시 수정.
- **참고:** 탐색 결과 대부분의 스킬이 이미 자유 형식 텍스트 기반이므로, 대규모 수정보다는 형식 일치 확인이 주 작업
- **검증:** 각 스킬의 모든 입력 지점이 3가지 표준 형식 중 하나에 해당하는지 확인

#### Task 5: 설계 문서 상태 업데이트 + 버전 관리
- **파일 1:** `docs/design/dev-workflow/input-interaction-consistency/input-interaction-consistency.md`
  - status: `ready-for-plan` → `in-development` (개발 시작 시) → `completed` (완료 시)
- **파일 2:** `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`
  - 버전 범프 (patch)
- **검증:** 두 파일 버전 동기화 확인

## 리스크 및 완화 전략

| 리스크 | 확률 | 완화 전략 |
|--------|------|-----------|
| Claude가 AskUserQuestion을 간헐적으로 사용 | 낮음 | CRITICAL 섹션에 금지 규칙 배치, 스킬 예시에서 구 형식 완전 제거 |
| 기존 스킬 프롬프트 맥락 훼손 | 낮음 | 변환 대상 3곳뿐, 각각 변환 전후 비교 검증 |
| 0번 예약이 사용자에게 비직관적 | 낮음 | 항상 마지막에 배치 + 명시적 레이블 필수 |

## 작업 순서

```
Task 1 (orchestrator 규칙 추가)
  ↓
Task 2 (persona-resolution 변환) + Task 3 (plan-stage 변환)  ← 병렬 가능
  ↓
Task 4 (나머지 스킬 검토)
  ↓
Task 5 (상태 업데이트 + 버전)
```
