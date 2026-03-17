# feature-group-summary Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 관련 설계 문서 그룹의 통합 요약을 기획서 수준으로 생성하는 `design-summary` 스킬을 추가한다.

**Architecture:** Markdown 스킬 파일 기반 (코드 없는 플러그인). 기존 design-doc-index와 동일한 패턴.

**Tech Stack:** Markdown SKILL.md (프론트매터 + 지시문)

---

### Task 1: design-summary 스킬 생성

**Files:**
- Create: `skills/design-summary/SKILL.md` (신규 스킬)

**Step 1: 디렉토리 및 SKILL.md 생성**

`skills/design-summary/SKILL.md` 파일을 생성한다. 프론트매터와 전체 스킬 지시문을 포함한다.

```markdown
---
name: design-summary
description: Generate a narrative system overview from related design documents. Invoke via /dev-workflow:design-summary command.
---

# Design Summary

관련 설계 문서 그룹을 기획서 수준의 통합 요약으로 재구성하여 화면에 출력한다.
물리적 파일을 생성하지 않으며, 매 호출 시 최신 상태를 반영한다.

---

## 트리거

명령 호출 전용. 자연어 자동 감지 없음.

**호출 방법:** `/dev-workflow:design-summary`

**인자 형식:**
- 키워드: `/dev-workflow:design-summary peek` → `peek-*` 패턴 매칭
- 카테고리: `/dev-workflow:design-summary dev-workflow` → 카테고리 전체
- 기능명 목록: `/dev-workflow:design-summary peek-overview peek-detail` → 지정 문서만
- 인자 없음: 범위를 질문한다

---

## 대상 문서 탐색

### 탐색 규칙

1. `docs/design/` 하위의 설계 문서(`[카테고리]/[기능명]/[기능명].md`)를 glob 탐색한다
2. 프론트매터 `status: complete` 인 문서만 대상으로 한다
3. 인자에 따른 매칭:
   - **키워드 매칭**: 디렉토리명 부분 매칭(substring). design-doc-index와 동일 규칙
     - 카테고리 레벨: `docs/design/*[키워드]*/[기능명]/[기능명].md`
     - 기능 레벨: `docs/design/[카테고리]/*[키워드]*/[기능명].md`
     - 두 결과 합산 후 중복 제거
   - **카테고리 전체**: 해당 카테고리 하위 모든 complete 문서
   - **기능명 목록**: 지정된 기능만

### 매칭 결과 확인

매칭된 문서 목록을 사용자에게 제시하고 확인을 받는다:

```
📖 [N]건의 설계 문서가 매칭되었습니다.
  1. [카테고리]/[기능명] — "[한 줄 요약]"
  2. [카테고리]/[기능명] — "[한 줄 요약]"
  ...

이 문서들의 통합 요약을 생성할까요?
```

매칭 실패 시: `📖 "[키워드]" 관련 구현 완료된 설계 문서를 찾지 못했습니다.`

---

## 요약 생성 전략

### 문서 수에 따른 분기

**1~3개 → 직접 로드:**
- 모든 문서를 직접 읽고 서사적 재구성을 수행한다

**4개 이상 → 서브에이전트 2단계:**

1단계: 서브에이전트가 각 문서를 병렬로 읽고 핵심을 추출한다

서브에이전트에 전달하는 추출 지시 (표준화된 항목):
```
아래 설계 문서를 읽고 다음 항목을 추출해서 정리해줘:
1. 한 줄 요약
2. 배경과 동기 (핵심 2~3줄)
3. 목표 (GOAL 목록)
4. 확정된 요구사항 (REQ 번호 + 한 줄 설명)
5. 설계 개요 (핵심 구조/흐름)
6. 의존성 (의존 대상 + 영향받는 컴포넌트)
7. 제약조건과 가정
8. 현재 상태 (status, 구현 결과 요약)
```

2단계: 메인 에이전트가 추출 결과를 조합하여 출력 구조 가이드에 따라 서사적 재구성을 수행한다

---

## 출력 구조 가이드

화면 출력만 수행한다. 파일을 생성하지 않는다.

### 필수 섹션 구조

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 [그룹명/카테고리명] 시스템 개요
생성일: [날짜] | 대상 기능: [N]개 ([완료 수] 완료 / [미완료 수] 진행 중)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 이 시스템은 무엇인가
[전체 그룹이 해결하는 문제와 구성을 서사적으로 서술]

## [기능명]
[서사적 서술]

...

## 기능 간 관계
[의존성을 서사적으로, 필요 시 ASCII 다이어그램]

## 제약조건 및 전제
[공통 제약과 가정을 통합 서술]
```

### 기능별 섹션 필수 포함 항목

각 기능 섹션에 반드시 포함해야 하는 정보:
- **배경**: 이 기능이 필요한 이유
- **동작 방식**: 핵심 메커니즘이 어떻게 작동하는지
- **핵심 설계 결정**: 중요한 기술 결정과 그 근거
- **현재 상태**: 완료/미완료, 구현 결과

### 서술 규칙

- 기능별로 나열하지 않고, 시스템 관점에서 흐름이 자연스럽게 연결되도록 서술한다
- 전문 용어를 처음 사용할 때 간략히 설명한다
- 기능 간 관계를 서술할 때 의존성 방향을 명확히 한다
```

**Step 2: 생성 확인**

`skills/design-summary/SKILL.md` 파일이 올바르게 생성되었는지 확인한다:
- 프론트매터 `name: design-summary`, `description` 존재
- 트리거, 대상 문서 탐색, 요약 생성 전략, 출력 구조 가이드 4개 섹션 존재

---

### Task 2: design-doc-index 힌트 추가

**Files:**
- Modify: `skills/design-doc-index/SKILL.md` (기존 스킬에 힌트 1줄 추가)

**Step 1: 색인 모드 출력에 힌트 조건 추가**

`skills/design-doc-index/SKILL.md`의 "색인 모드" 섹션 내 절차 3번(목록 제시) 이후에 다음 조건을 추가한다:

기존:
```markdown
- `status: complete`인 문서가 없으면: "구현 완료된 설계 문서가 없습니다."
```

이 줄 바로 아래에 추가:
```markdown
- 같은 접두사를 공유하는 문서가 3개 이상이면 통합 요약 힌트를 표시한다: "💡 관련 문서가 [N]건 있습니다. 통합 요약이 필요하시면 `/dev-workflow:design-summary [접두사]`를 사용해주세요."
```

**Step 2: 변경 확인**

수정된 `skills/design-doc-index/SKILL.md`에서 힌트 조건이 올바르게 추가되었는지 확인한다.

---

### Task 3: CLAUDE.md 스킬 테이블 업데이트

**Files:**
- Modify: `CLAUDE.md` (스킬 목록 테이블에 행 추가)

**Step 1: Skills 테이블에 design-summary 추가**

`CLAUDE.md`의 "### Skills (8개)" 섹션을 수정한다:

1. 제목을 `### Skills (9개)`로 변경한다
2. 테이블에 아래 행을 추가한다 (`design-doc-index` 행 바로 아래):

```markdown
| `design-summary` | 관련 설계 문서 그룹의 통합 요약 생성 (명령 호출: `/dev-workflow:design-summary`) |
```

**Step 2: 변경 확인**

CLAUDE.md에서 Skills 테이블이 9개 스킬을 포함하고 있는지, `design-summary` 행이 올바른 위치에 있는지 확인한다.

---

### Task 4: 버전 bump (1.3.0 → 1.3.1)

**Files:**
- Modify: `.claude-plugin/plugin.json` (version 필드)
- Modify: `.claude-plugin/marketplace.json` (version 필드)

**Step 1: plugin.json 버전 업데이트**

`.claude-plugin/plugin.json`의 `"version": "1.3.0"`을 `"version": "1.3.1"`로 변경한다.

**Step 2: marketplace.json 버전 업데이트**

`.claude-plugin/marketplace.json`의 `plugins[0].version`을 `"1.3.0"`에서 `"1.3.1"`로 변경한다.

**Step 3: 버전 동기화 확인**

두 파일의 버전이 모두 `1.3.1`로 일치하는지 확인한다.
