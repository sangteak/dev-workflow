# Socratic Investigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 소크라틱 인터뷰에서 사용자가 답변하지 않은 질문에 대해 코드/문서 기반 잠정 답변을 제공하여 답변 부담을 줄인다.

**Architecture:** `skills/brainstorming/SKILL.md` 단일 파일에 3개 섹션을 추가한다. (1) 통합 정제 출력에 안내 문구 추가, (2) 통합 정제 직후에 2-pass 처리 + 미답변 조사 섹션 삽입, (3) Step A-0 후속에 동일 패턴 1회 적용. 기존 텍스트 삭제 없는 순수 추가(additive) 변경.

**Tech Stack:** Markdown (SKILL.md 지시문), Agent 도구 (Enhanced Mode 서브에이전트)

---

## File Structure

- Modify: `skills/brainstorming/SKILL.md` — 3개 지점에 텍스트 삽입
- Modify: `.claude-plugin/plugin.json` — version bump
- Modify: `.claude-plugin/marketplace.json` — version bump

---

### Task 1: 통합 정제 출력에 안내 문구 추가

**Files:**
- Modify: `skills/brainstorming/SKILL.md:268-279` (Enhanced 통합 정제 출력 형식)
- Modify: `skills/brainstorming/SKILL.md:290` (Standalone 통합 정제 참조)

**Context:** 현재 통합 정제 출력 형식(268~279행)의 마지막 줄은 `번호별로 답변하거나, 자유롭게 설명해 주세요.`이다. 이 줄을 설계 문서 §7.1의 안내 문구로 교체한다.

- [ ] **Step 1: Enhanced Mode 통합 정제 출력 형식의 안내 문구 변경**

`skills/brainstorming/SKILL.md` 278행의 기존 텍스트:

```
번호별로 답변하거나, 자유롭게 설명해 주세요.
```

아래로 교체:

```
답변할 수 있는 질문에 답해 주세요.
답변하지 않은 질문은 코드/문서 조사를 진행합니다.
```

- [ ] **Step 2: Standalone Mode 통합 정제 참조 확인**

290행의 `출력 형식도 동일.` 문구가 이미 Enhanced Mode 출력 형식을 참조하고 있으므로, 안내 문구 변경이 Standalone에도 자동으로 적용됨을 확인한다. 추가 수정 불필요.

- [ ] **Step 3: 변경 검증**

수정 후 파일을 읽어서 아래를 확인한다:
- 268~280행의 출력 형식 블록이 정상적으로 닫혀 있는가 (``` 짝 확인)
- 안내 문구가 코드 블록 내부에 위치하는가
- 기존 278행의 텍스트가 완전히 교체되었는가 (중복 없음)

---

### Task 2: 2-pass 처리 + 미답변 질문 조사 섹션 삽입

**Files:**
- Modify: `skills/brainstorming/SKILL.md:290` 직후 (Standalone 통합 정제와 Step B 사이)

**Context:** 현재 290행(`출력 형식도 동일.`) 다음은 빈 줄 후 `### Step B: 시드 추출`(292행)이다. 290행과 292행 사이에 새로운 섹션 `### 미답변 질문 조사`를 삽입한다. 이 섹션은 Step A의 통합 정제 직후, Step B 진입 전에 실행되는 후처리 단계이다.

- [ ] **Step 1: 미답변 질문 조사 섹션 작성 및 삽입**

`skills/brainstorming/SKILL.md` 290행(`출력 형식도 동일.`) 직후에 아래 전체 블록을 삽입한다:

````markdown

### 미답변 질문 조사

**목적:** 사용자가 답변하지 않은 질문에 대해 코드/문서 기반 잠정 답변을 제공한다.

**트리거:** 통합 정제된 질문에 대한 사용자 응답 후, 미답변 질문이 존재할 때.
모든 질문에 답변한 경우 이 섹션을 스킵하고 Step B로 진행한다.

**처리 순서 (2-pass):**

**Pass 1 — 직접 답변 반영:**
사용자가 답변한 질문을 먼저 처리하고 반영 결과를 표시한다:
```
✅ 답변 반영: [답변한 질문 번호 목록]
```

**Pass 2 — 미답변 확인 + 조사:**
미답변 질문이 있으면 사용자에게 조사 여부를 확인한다:
```
미답변 질문이 있습니다: [미답변 번호 목록]
코드/문서 조사를 진행할까요?

1. 전부 조사
2. 선택 조사 (번호 지정)
3. 스킵 — 다음 라운드로
```

- 1(전부 조사) → 모든 미답변 질문을 조사한다
- 2(선택 조사) → 사용자가 지정한 번호만 조사한다
- 3(스킵) → 조사 없이 Step B(또는 다음 라운드)로 진행한다

**조사 실행:**

**📎 Enhanced Mode:**
Agent 도구로 조사 서브에이전트를 1회 실행한다 (미답변 질문을 일괄 전달):

```
아래 질문들에 대해 프로젝트의 코드베이스와 설계 문서를 조사하라.

탐색 전략:
1순위: docs/design 디렉토리 — 관련 설계 문서 검색 및 읽기
2순위: 코드베이스 — Grep/Glob/Read로 관련 코드 탐색

각 질문에 대해:
- 발견한 내용 요약
- 확신도 표시 (높음/중간/낮음)
- 근거 파일 경로 명시

조사 대상:
[미답변 질문 번호와 내용을 원본 그대로 나열]
```

**Standalone Mode:**
메인 컨텍스트에서 직접 Glob/Grep/Read 도구로 조사한다. 프롬프트와 출력 형식은 동일.

**조사 결과 제시:**
```
── 🔍 조사 결과 ──────────────────────────────────────
[번호]. [질문]
   → [조사 내용 요약]
   확신도: [높음/중간/낮음] | 근거: [파일 경로]

[번호]. [질문]
   → [조사 내용 요약]
   확신도: [높음/중간/낮음] | 근거: [파일 경로]
────────────────────────────────────────────────────────
수정이 필요하면 알려주세요. 없으면 다음으로 진행합니다.
```

**사용자 확인:**
- 수정/이의 없음 → 조사 결과를 잠정 답변으로 확정, Step B로 진행
- 이의 제기 → 재조사(범위 변경) 또는 사용자 직접 답변으로 교체
- 추가 조사 요청 → 추가 질문에 대해 조사 실행

````

- [ ] **Step 2: 삽입 위치 검증**

삽입 후 파일을 읽어서 아래를 확인한다:
- `### 미답변 질문 조사` 섹션이 290행(Standalone 통합 정제) 직후에 위치하는가
- `### Step B: 시드 추출` 이 미답변 조사 섹션 직후에 정상 위치하는가
- Markdown 코드 블록(```)의 짝이 모두 맞는가
- Enhanced/Standalone 분기가 명확하게 구분되어 있는가

---

### Task 3: Step A-0 후속에 미답변 조사 패턴 적용

**Files:**
- Modify: `skills/brainstorming/SKILL.md:220-226` (Step A-0 출력 형식 후속 처리)

**Context:** 현재 220~226행은 Step A-0 출력 형식의 하단부이다:
```
220: 답변 후 Step A(인터뷰)로 진행합니다.
221: 건너뛰려면 "넘어가자"라고 말씀하세요.
222: ```
223:
224: - 사용자가 답변하면 → 답변을 Step A의 초기 컨텍스트에 포함한다
225: - 사용자가 "넘어가자" → Step A로 즉시 이동
226: - Standalone Mode에서는 Step A-0를 생략하고 Step A의 ESSENCE 질문 패턴으로 대체한다
```

226행 직후에 A-0 전용 미답변 조사 블록을 추가한다.

- [ ] **Step 1: Step A-0 미답변 조사 블록 삽입**

`skills/brainstorming/SKILL.md` 226행 직후에 아래 블록을 삽입한다:

```markdown

**미답변 질문 조사 (A-0 전용):**
Step A-0의 4개 본질 질문에 대해서도 미답변 조사 패턴을 적용한다. 단, A-0 출력 직후 1회만 실행한다.
처리 절차는 `### 미답변 질문 조사` 섹션과 동일하다 (2-pass: 직접 답변 반영 → 미답변 확인 → 조사 실행 → 결과 제시).
조사 결과 확정 후 Step A의 초기 컨텍스트에 포함한다.
```

- [ ] **Step 2: 삽입 위치 검증**

삽입 후 파일을 읽어서 아래를 확인한다:
- 미답변 조사 블록이 226행(Standalone 대체 규칙) 직후에 위치하는가
- `### Step A: 인터뷰` 헤더(228행)가 미답변 조사 블록 직후에 정상 위치하는가
- 기존 224~226행의 불릿 리스트가 변경되지 않았는가

---

### Task 4: 전체 정합성 검증

**Files:**
- Read: `skills/brainstorming/SKILL.md` (전체)

- [ ] **Step 1: 구조 정합성 확인**

전체 파일을 읽고 아래를 확인한다:
1. Step A-0 → (미답변 조사 A-0) → Step A → (통합 정제 + 안내 문구) → (미답변 조사) → Step B 순서가 올바른가
2. Markdown 헤더 계층이 일관적인가 (### Step A-0, ### Step A, ### 미답변 질문 조사, ### Step B)
3. 모든 코드 블록(```)의 열기/닫기 짝이 맞는가
4. Enhanced/Standalone 분기가 누락 없이 반영되었는가

- [ ] **Step 2: 설계 문서 대비 누락 검사**

`socratic-investigation.md`의 AC-001~011과 대조한다:

| AC | 검증 항목 | 확인 방법 |
|---|---|---|
| AC-001 | 미답변 → 확인 → 조사 흐름 | Task 2의 2-pass 처리 확인 |
| AC-002 | docs/design 우선 탐색 | Task 2의 조사 프롬프트 탐색 전략 확인 |
| AC-003 | 자유 응답 형태 확인 | Task 2의 사용자 확인 섹션 확인 |
| AC-004 | 이의 제기 시 재조사/교체 | Task 2의 사용자 확인 섹션 확인 |
| AC-005 | 2-pass 분리 | Task 2의 Pass 1/Pass 2 구분 확인 |
| AC-006 | 안내 문구 포함 | Task 1의 안내 문구 교체 확인 |
| AC-007 | 모든 질문 답변 시 조사 스킵 | Task 2의 트리거 조건 확인 |
| AC-008 | 모든 질문 답변해도 정상 동작 | Task 2의 트리거 조건 ("스킵하고 Step B") 확인 |
| AC-009 | 기존 Phase 0~3 흐름 정상 | 기존 텍스트 무변경 확인 (additive만) |
| AC-010 | Step A-0 미답변 조사 | Task 3의 A-0 전용 블록 확인 |
| AC-011 | Standalone 직접 조사 | Task 2의 Standalone Mode 분기 확인 |

- [ ] **Step 3: 커밋 준비 확인**

모든 검증 통과 후 커밋 대상 파일 목록:
```
skills/brainstorming/SKILL.md
```

---

### Task 5: 버전 업데이트

**Files:**
- Modify: `.claude-plugin/plugin.json` — version 필드
- Modify: `.claude-plugin/marketplace.json` — plugins[].version 필드

- [ ] **Step 1: 현재 버전 확인**

두 파일의 현재 version 값을 읽는다.

- [ ] **Step 2: MINOR 버전 증가**

현재 버전 `X.Y.Z` → `X.(Y+1).0` 으로 업데이트한다.
두 파일의 버전을 동일하게 맞춘다.

- [ ] **Step 3: 버전 동기화 확인**

두 파일의 version 값이 동일한지 확인한다.
