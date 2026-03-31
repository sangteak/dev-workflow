---
feature: quick-start-restructure
category: dev-workflow
parent: readme-redesign
phase: 1
created: 2026-03-31
---

# Phase 1: 탐색 — Quick Start 재설계

## 확정된 페르소나

- 📝 README Specialist: 기술 문서 독자 경험, 정보 구조 설계
- 🆕 First-time User: dev-workflow를 처음 접하는 개발자, 온보딩 관점
- 🎯 Workflow Designer: dev-workflow 설계 의도와 핵심 가치 관점

---

## 본질 질문 (Ontologist)

1. **[Essence]** Quick Start는 "이 도구가 나한테 맞는가?"를 판단하는 신뢰 획득 인터페이스인가, 아니면 "어떻게 쓰는가?"를 가르치는 튜토리얼인가?
   → **결론:** 사용법(How-to) 전달이 핵심 목적

2. **[Root Cause]** 현재 실패의 원인이 콘텐츠 부재인가, 서술 구조 선택인가?
   → **결론:** 구조 문제. 실제 대화 흐름 없이 결과만 나열되어 이도저도 아닌 형식이 됨

3. **[Prerequisites]** 단계 설명 텍스트가 별도로 필요한가?
   → **결론:** 불필요. 실제 대화 흐름이 단계를 자연스럽게 드러냄

4. **[Hidden Assumptions]** 어느 수준의 예시가 Quick Start에 필요한가?
   → **결론:** 시작 프롬프트는 구체적 요구사항 포함. BRAINSTORM에서 예외/빈틈 발견→해결 과정 강조. PLAN 완료 후 DEVELOP는 링크로만 처리

---

## 시드 (확정)

```yaml
goal: "실제 대화 흐름(프롬프트 + 응답)을 보여주는 Quick Start로 dev-workflow의 사용법을 직관적으로 전달한다"

constraints:
  - "예시 프롬프트는 구체적인 요구사항이 담긴 상태로 시작해야 한다"
  - "BRAINSTORM → PLAN 흐름이 중심이 되어야 하며, DEVELOP는 링크 하나로만 언급한다"
  - "단계 설명을 별도 텍스트로 나열하지 않는다 — 실제 대화가 단계를 자연스럽게 드러내야 한다"

non_goals:
  - "dev-workflow의 가치 증명 또는 설득"
  - "DEVELOP / REVIEW 단계의 상세 설명"
  - "단계 구조를 명시적으로 레이블링하거나 교육하는 것"

success_criteria:
  - "독자가 Quick Start만 읽고 첫 번째 프롬프트를 어떻게 입력해야 하는지 알 수 있다"
  - "브레인스토밍 과정에서 예외/빈틈이 발견되고 해결되는 흐름이 예시 대화 안에서 명확히 드러난다"
  - "BRAINSTORM + PLAN의 실제 대화 예시가 최소 1회 완결된 흐름으로 포함된다"

context: "README의 현재 Quick Start는 실제 대화 흐름 없이 서술 구조로 이루어져 있어,
  사용자 입력 이후 흐름이 자동 진행처럼 오해될 수 있다. 실제 dev-workflow는
  BRAINSTORM → PLAN 단계에서 페르소나 피드백과 빈틈 발견 루프를 거치는
  대화형 프로세스이므로, Quick Start는 이 실제 흐름을 대화 예시로 직접 보여줘야 한다."
```

---

## 확정 결정 사항

| 항목 | 결정 |
|---|---|
| Quick Start 목적 | 사용법(How-to) 전달 |
| 예시 형식 | 실제 대화 예시 (프롬프트 + 실제 출력 유사 응답) |
| 예시 도메인 | 알림/푸시 기능 추가 |
| 시작 프롬프트 | 구체적 요구사항 포함 |
| 강조 단계 | BRAINSTORM + PLAN |
| DEVELOP 처리 | Quick Start에서 제거 → 전체 워크플로우 링크 |
| 대화 길이 | 스크롤 허용 |

## 기각된 아이디어 (이유 포함)

| 아이디어 | 기각 이유 |
|---|---|
| Output-first 구조 | 가치 증명 영역, Quick Start 목적(사용법) 범위 밖 |
| 플레이스홀더 빈칸 | 독자 부담 가중, 현실적 대안 부재 |
| 메타 예시 (이 플러그인 자체) | 초보자 혼란 우려 |
| Quick Start 삭제 | 사용법 전달 필요성 유지 |

## 페르소나 피드백 결과

**Round 1 (비판: 🎯 Workflow Designer/Contrarian):**
- Output-first 제안 → 기각 (목적 범위 밖)
- 빈칸 유도 → 보편적 도메인 선택으로 대체
- Quick Start 삭제 → 보존 필요성 확인

**Round 2 (비판: 📝 README Specialist/Contrarian):**
- DEVELOP 언급 제거 합의 → PLAN 완료 후 링크
- 메타 예시 제안 → 초보자 혼란 우려로 기각
- 범용 신규 기능 설계 방향 확정 → 알림/푸시 기능 선택
