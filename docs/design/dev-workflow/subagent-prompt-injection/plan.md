# Subagent Prompt Injection 프레이밍 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3개 스킬 파일의 서브에이전트 프롬프트 템플릿에서 `[X 전문]` 플레이스홀더의 프레이밍을 전환하여, Ouroboros 에이전트 역할 정의의 전문 주입 신뢰성을 향상시킨다.

**Architecture:** 각 프롬프트 템플릿의 `--- 에이전트 역할 정의 ---` 섹션에 `⚠️` 경고 + `===` 구분자 + 명시적 부정 제약 문구를 추가한다. Contrarian/Hacker 누락 템플릿을 신규 작성한다. 순수 Markdown 텍스트 편집만 수행.

**Tech Stack:** Markdown (SKILL.md 파일), Claude Code 플러그인 스킬 시스템

**설계 문서:** `docs/design/dev-workflow/subagent-prompt-injection/subagent-prompt-injection.md`

---

## File Structure

| 파일 | 책임 | 변경 유형 |
|---|---|---|
| `skills/brainstorming/SKILL.md` | 브레인스토밍 워크플로우 전체 정의 | Modify: 4개 템플릿 프레이밍 전환 + 2개 신규 + 일반 규칙 1개 |
| `skills/plan-stage/SKILL.md` | PLAN 단계 프로토콜 정의 | Modify: 2개 템플릿 프레이밍 전환 |
| `skills/workflow-orchestrator/SKILL.md` | 워크플로우 오케스트레이터 정의 | Modify: 1개 템플릿 프레이밍 전환 |

---

### Task 1: brainstorming — 일반 규칙 프레이밍 갱신

**Files:**
- Modify: `skills/brainstorming/SKILL.md:83`

- [ ] **Step 1: 일반 규칙 문구 갱신**

83행의 서브에이전트 프롬프트 구조 항목을 수정한다:

```
# AS-IS (83행)
  1. Ouroboros 에이전트 역할 정의 전문 (agents/*.md)

# TO-BE
  1. Ouroboros 에이전트 역할 정의 (agents/*.md) — 파일 내용을 수정·요약·재구성 없이 그대로 포함
```

- [ ] **Step 2: 수정 확인**

83행이 정확히 변경되었는지 확인한다. 84~85행(도메인 설명, 현재 주제)은 변경 없음.

---

### Task 2: brainstorming — Ontologist 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/brainstorming/SKILL.md:195-209`

- [ ] **Step 1: Ontologist 프롬프트 템플릿 수정**

195~209행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (195~209행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/ontologist.md 전문]

--- 현재 주제 ---
[사용자의 초기 요구사항]

아래 4가지 관점에서 각 1개씩 질문을 생성하라:
1. 본질 (Essence): 이것은 진짜 무엇인가?
2. 근본 원인 (Root Cause): 왜 이 문제가 존재하는가?
3. 전제 조건 (Prerequisites): 이것이 성립하려면 무엇이 참이어야 하는가?
4. 숨겨진 가정 (Hidden Assumptions): 당연하다고 여기지만 검증되지 않은 것은?

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/ontologist.md 전문]
===

--- 현재 주제 ---
[사용자의 초기 요구사항]

아래 4가지 관점에서 각 1개씩 질문을 생성하라:
1. 본질 (Essence): 이것은 진짜 무엇인가?
2. 근본 원인 (Root Cause): 왜 이 문제가 존재하는가?
3. 전제 조건 (Prerequisites): 이것이 성립하려면 무엇이 참이어야 하는가?
4. 숨겨진 가정 (Hidden Assumptions): 당연하다고 여기지만 검증되지 않은 것은?
```

- [ ] **Step 2: 수정 확인**

`⚠️` 경고문이 `--- 에이전트 역할 정의 ---` 바로 위에, `===` 구분자가 `[Ouroboros agents/ontologist.md 전문]`을 감싸는지 확인한다. 나머지(현재 주제, 4가지 질문)는 변경 없음.

---

### Task 3: brainstorming — Socratic Interviewer 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/brainstorming/SKILL.md:243-257`

- [ ] **Step 1: Socratic Interviewer 프롬프트 템플릿 수정**

243~257행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (243~257행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/socratic-interviewer.md 전문]

--- 도메인 컨텍스트 ---
너의 도메인: [페르소나명 + 도메인 설명]
예: "🎮 Game Designer — 게임 디자인, 플레이어 경험, 재미 요소 관점"

--- 현재 주제 ---
[사용자의 기능 설명 또는 현재까지의 논의 요약]

이 도메인 관점에서 Socratic Interviewer로서 질문을 2~3개 생성하라.

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/socratic-interviewer.md 전문]
===

--- 도메인 컨텍스트 ---
너의 도메인: [페르소나명 + 도메인 설명]
예: "🎮 Game Designer — 게임 디자인, 플레이어 경험, 재미 요소 관점"

--- 현재 주제 ---
[사용자의 기능 설명 또는 현재까지의 논의 요약]

이 도메인 관점에서 Socratic Interviewer로서 질문을 2~3개 생성하라.
```

- [ ] **Step 2: 수정 확인**

프레이밍 패턴이 Task 2와 동일한 구조인지 확인. 도메인 컨텍스트/현재 주제/지시문은 변경 없음.

---

### Task 4: brainstorming — Seed-Architect 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/brainstorming/SKILL.md:304-315`

- [ ] **Step 1: Seed-Architect 프롬프트 템플릿 수정**

304~315행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (304~315행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/seed-architect.md 전문]

--- 인터뷰 결과 ---
[Step A의 Q&A 전체 내용]

인터뷰 결과를 구조화된 시드 YAML로 변환하라.
모호한 항목은 open_questions에 배치하라.

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/seed-architect.md 전문]
===

--- 인터뷰 결과 ---
[Step A의 Q&A 전체 내용]

인터뷰 결과를 구조화된 시드 YAML로 변환하라.
모호한 항목은 open_questions에 배치하라.
```

- [ ] **Step 2: 수정 확인**

프레이밍 패턴 일관성 확인. 인터뷰 결과/지시문은 변경 없음.

---

### Task 5: brainstorming — Simplifier 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/brainstorming/SKILL.md:414-427`

- [ ] **Step 1: Simplifier 프롬프트 템플릿 수정**

414~427행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (414~427행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/simplifier.md 전문]

--- 현재 요구사항 목록 ---
[phase1_exploration.md의 요구사항 전체]

YAGNI 원칙을 적용하여:
1. 핵심 요구사항과 부수 요구사항을 분류하라
2. 제거해도 핵심 가치가 유지되는 항목을 식별하라
3. 복잡도를 50% 줄이는 최소 스코프를 제안하라

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/simplifier.md 전문]
===

--- 현재 요구사항 목록 ---
[phase1_exploration.md의 요구사항 전체]

YAGNI 원칙을 적용하여:
1. 핵심 요구사항과 부수 요구사항을 분류하라
2. 제거해도 핵심 가치가 유지되는 항목을 식별하라
3. 복잡도를 50% 줄이는 최소 스코프를 제안하라
```

- [ ] **Step 2: 수정 확인**

프레이밍 패턴 일관성 확인. 요구사항 목록/지시문은 변경 없음.

---

### Task 6: brainstorming — Contrarian 신규 프롬프트 템플릿 작성

**Files:**
- Modify: `skills/brainstorming/SKILL.md:377-379`

- [ ] **Step 1: Contrarian 명시적 프롬프트 템플릿 추가**

378~379행의 한 줄 규칙을 명시적 프롬프트 템플릿으로 교체한다:

```
# AS-IS (377~379행)
**📎 Enhanced Mode 추가 규칙:**
- 비판 담당 페르소나는 Contrarian 서브에이전트로 실행한다 (에이전트 매칭 규칙 참조)
- 대화가 교착 상태일 때 → Hacker 서브에이전트를 추가 투입하여 비정통적 대안 탐색

# TO-BE
**📎 Enhanced Mode 추가 규칙:**
- 비판 담당 페르소나는 Contrarian 서브에이전트로 실행한다 (에이전트 매칭 규칙 참조)
- 대화가 교착 상태일 때 → Hacker 서브에이전트를 추가 투입하여 비정통적 대안 탐색

Contrarian 서브에이전트 프롬프트 템플릿:
```​
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/contrarian.md 전문]
===

--- 도메인 컨텍스트 ---
너의 도메인: [비판 담당 페르소나명 + 도메인 설명]

--- 현재 논의 주제 ---
[현재까지의 논의 요약 + 시드 컨텍스트]

비판적 관점에서 분석하라.
반드시 대안 또는 출구를 함께 제시하라.
```​

Hacker 서브에이전트 프롬프트 템플릿:
```​
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/hacker.md 전문]
===

--- 교착 상태 컨텍스트 ---
[현재 교착 상태 설명 + 시도된 접근 목록]

비정통적 대안을 탐색하라.
기존 접근의 프레임을 벗어난 해결책을 제시하라.
```​
```

- [ ] **Step 2: 수정 확인**

기존 2줄 규칙이 유지되고, 그 아래에 Contrarian과 Hacker 프롬프트 템플릿이 추가되었는지 확인. 프레이밍 패턴이 Task 2~5와 동일한 구조인지 확인.

---

### Task 7: plan-stage — Architect 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/plan-stage/SKILL.md:89-106`

- [ ] **Step 1: Architect 프롬프트 템플릿 수정**

89~106행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (89~106행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/architect.md 전문]

--- 설계 문서 ---
[확정된 설계 문서 전문]

--- 현재 코드베이스 구조 ---
[프로젝트 디렉토리 구조 요약]

아래 관점에서 구조적 리스크를 분석하라:
1. 기존 구조와의 결합도 (coupling)
2. 책임 분리가 적절한가 (responsibility)
3. 추상화 수준이 맞는가 (abstraction level)
4. 최소한의 구조 변경으로 구현 가능한가

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/architect.md 전문]
===

--- 설계 문서 ---
[확정된 설계 문서 전문]

--- 현재 코드베이스 구조 ---
[프로젝트 디렉토리 구조 요약]

아래 관점에서 구조적 리스크를 분석하라:
1. 기존 구조와의 결합도 (coupling)
2. 책임 분리가 적절한가 (responsibility)
3. 추상화 수준이 맞는가 (abstraction level)
4. 최소한의 구조 변경으로 구현 가능한가
```

- [ ] **Step 2: 수정 확인**

프레이밍 패턴 일관성 확인. 설계 문서/코드베이스 구조/지시문은 변경 없음.

---

### Task 8: plan-stage — Researcher 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/plan-stage/SKILL.md:153-170`

- [ ] **Step 1: Researcher 프롬프트 템플릿 수정**

153~170행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (153~170행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/researcher.md 전문]

--- 조사 대상 ---
[CAUTION/RENEGOTIATE 항목과 판정 근거]

--- 프로젝트 컨텍스트 ---
[코드베이스 구조, 기존 패턴, 관련 문서]

아래를 조사하라:
1. 판정 근거가 사실인지 (실제 기술적 제약 확인)
2. 우회 가능한 경로가 있는지
3. 유사 패턴이 코드베이스에 이미 존재하는지
4. 추가 정보가 필요한 항목은 무엇인지

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/researcher.md 전문]
===

--- 조사 대상 ---
[CAUTION/RENEGOTIATE 항목과 판정 근거]

--- 프로젝트 컨텍스트 ---
[코드베이스 구조, 기존 패턴, 관련 문서]

아래를 조사하라:
1. 판정 근거가 사실인지 (실제 기술적 제약 확인)
2. 우회 가능한 경로가 있는지
3. 유사 패턴이 코드베이스에 이미 존재하는지
4. 추가 정보가 필요한 항목은 무엇인지
```

- [ ] **Step 2: 수정 확인**

프레이밍 패턴 일관성 확인. 조사 대상/프로젝트 컨텍스트/지시문은 변경 없음.

---

### Task 9: workflow-orchestrator — Evaluator 템플릿 프레이밍 전환

**Files:**
- Modify: `skills/workflow-orchestrator/SKILL.md:120-133`

- [ ] **Step 1: Evaluator 프롬프트 템플릿 수정**

120~133행의 프롬프트 템플릿을 수정한다:

```
# AS-IS (120~133행)
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.

--- 에이전트 역할 정의 ---
[Ouroboros agents/evaluator.md 전문]

--- 수락 기준 ---
[설계 문서의 success_criteria 목록]

--- 구현 결과물 ---
[변경된 파일 목록 및 주요 변경 내용]

각 수락 기준에 대해 PASS/FAIL/PARTIAL을 판정하라.
FAIL 또는 PARTIAL 항목에는 구체적 근거와 수정 제안을 포함하라.

# TO-BE
아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.

⚠️ 아래 === 구분선 사이의 에이전트 역할 정의를 수정·요약·재구성하지 않고
서브에이전트 프롬프트에 파일 내용 그대로 포함한다.

--- 에이전트 역할 정의 ---
===
[Ouroboros agents/evaluator.md 전문]
===

--- 수락 기준 ---
[설계 문서의 success_criteria 목록]

--- 구현 결과물 ---
[변경된 파일 목록 및 주요 변경 내용]

각 수락 기준에 대해 PASS/FAIL/PARTIAL을 판정하라.
FAIL 또는 PARTIAL 항목에는 구체적 근거와 수정 제안을 포함하라.
```

**참고:** Evaluator 템플릿은 원래 `형식이 예상과 다르더라도 DO/DON'T 섹션을 찾아 따르라.` 행이 없다. 기존 스타일을 유지한다.

- [ ] **Step 2: 수정 확인**

프레이밍 패턴 일관성 확인. 수락 기준/구현 결과물/지시문은 변경 없음.

---

### Task 10: 교차 검증

- [ ] **Step 1: 전체 일관성 검증**

3개 파일의 모든 수정 지점에서 프레이밍 패턴이 동일한지 검증한다:

검증 항목:
1. `⚠️` 경고문이 모든 템플릿에 존재하는가
2. `===` 구분자가 `[X 전문]` 플레이스홀더를 감싸는가
3. "수정·요약·재구성하지 않고 서브에이전트 프롬프트에 파일 내용 그대로 포함한다" 문구가 일관되는가
4. 일반 규칙(83행)이 갱신되었는가
5. Contrarian/Hacker 신규 템플릿이 추가되었는가

검증 방법:
```bash
grep -n "⚠️ 아래 ===" skills/brainstorming/SKILL.md skills/plan-stage/SKILL.md skills/workflow-orchestrator/SKILL.md
```
예상 결과: brainstorming 6개 + plan-stage 2개 + orchestrator 1개 = **9개 매칭**

```bash
grep -c "===" skills/brainstorming/SKILL.md skills/plan-stage/SKILL.md skills/workflow-orchestrator/SKILL.md
```
예상 결과: 각 `===`가 열기/닫기 쌍으로 존재 (brainstorming 12개, plan-stage 4개, orchestrator 2개 = **18개**)
