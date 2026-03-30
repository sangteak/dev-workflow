# Phase 2: Discovery — Subagent Prompt Injection

> 발견 완료 시점의 불변 스냅샷

## 국면 2에서 새로 발견된 미정의 영역

### 1. 적용 대상 템플릿 전수 조사

총 9개 지점, 3개 스킬 파일:

**명시적 프롬프트 템플릿 (7개):**

| 스킬 파일 | 에이전트 | 줄 번호 |
|---|---|---|
| brainstorming | Ontologist | 199 |
| brainstorming | Socratic Interviewer | 247 |
| brainstorming | Seed-Architect | 308 |
| brainstorming | Simplifier | 418 |
| plan-stage | Architect | 93 |
| plan-stage | Researcher | 157 |
| workflow-orchestrator | Evaluator | 123 |

**암묵적 참조 — 템플릿 신규 작성 필요 (2개):**

| 스킬 파일 | 에이전트 | 용도 |
|---|---|---|
| brainstorming | Contrarian | Step C 비판 슬롯 |
| brainstorming | Hacker | Step C 교착 돌파 |

### 2. "전문"의 경계

Ouroboros 에이전트 .md 파일에는 frontmatter가 없음.
"전문" = 파일 전체 내용 = Markdown 본문. 질문 소멸.

### 3. 검증 방법

비결정적 특성상 "100% 성공" 검증은 불가.
실용적 검증:
- 수정 후 브레인스토밍 1회 실행하여 전문 포함 확인
- 에이전트 태그 출력 확인
- 장기적으로 lessons.md에 추적 기록

## 각 항목에 대한 Q&A 결정 사항

- 수정 범위: brainstorming만이 아닌 플러그인 전체 (3개 스킬, 9개 지점)
- Contrarian/Hacker: 기존 4개 템플릿과 동일 구조로 신규 작성
- frontmatter 경계: 해당 없음 (파일에 frontmatter 없음)
- 검증: 실용적 1회 확인 + 장기 추적

## 페르소나 피드백 결과

- 합의: 3개 스킬 × 9개 지점 확정
- Contrarian/Hacker 신규 템플릿은 Step C 맥락에 맞는 컨텍스트 섹션 필요 → 국면 3에서 TD 검토
