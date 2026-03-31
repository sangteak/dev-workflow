---
feature: readme-redesign
category: dev-workflow
status: complete
created: 2026-03-31
last-updated: 2026-03-31

dependencies: []
affects:
  - README.md
---

# readme-redesign 설계 문서

> 한 줄 요약: dev-workflow README를 팀 오픈용 설득+사용성 문서로 재작성한다.

---

## 1. 배경과 동기

dev-workflow 플러그인을 팀에 오픈하기 전, 현재 README의 두 가지 문제를 해결해야 한다.

1. **최신 기능 누락**: Ouroboros 연동(Enhanced Mode)이 추가되었음에도 README에 반영되지 않았다. 이는 플러그인의 핵심 차별점 중 하나다.
2. **구성의 문제**: 이미지와 텍스트가 혼재하고 목적/동기 없이 기능 설명부터 시작하여, 팀원이 "이게 나한테 왜 필요한가"를 파악하기 전에 설치 단계부터 만나게 된다.

궁극 목표는 팀원이 README를 읽고 "써볼 만하다"는 확신을 갖게 하는 것이며, 나아가 이 플러그인이 제공하는 구조화된 사고 과정을 통해 팀원 스스로 성장하는 기회를 만드는 것이다.

---

## 2. 목표와 비목표

### 목표

- GOAL-001: README를 읽은 팀원이 "써볼 만하다"는 확신을 갖는다
- GOAL-002: "오버 엔지니어링 아냐?"라는 우려를 Quick Start 체감 복잡도로 반박한다
- GOAL-003: Ouroboros Enhanced Mode를 포함한 현재 기능 상태를 정확히 반영한다
- GOAL-004: 실제 사용 커맨드(/dev-workflow:save, /dev-workflow:resume)를 의도와 함께 설명한다

### 비목표

- Superpowers, Ouroboros 내부 동작 상세 설명 (사용자가 알 필요 없음)
- 플러그인 아키텍처/스킬 구조 상세 문서 (기여자용 별도 문서 영역)
- 설치 트러블슈팅 가이드 확장

---

## 3. 확정된 요구사항

### 구조 재편

- REQ-001: 문서 순서를 **Why → Workflow Overview → Key Features → Quick Start → Installation → Commands Reference → Workflow Stages → Configuration → FAQ → License**로 재편한다 — 우선순위: HIGH
- REQ-002: Skills Reference 별도 섹션을 제거하고, 내부 스킬은 각 Workflow Stage 설명에 한 줄로 통합한다 — 우선순위: MEDIUM

### Why 섹션 (신규)

- REQ-003: Why 섹션을 문서 최상단(Overview 다음)에 추가한다. 2~3문장 + 아래 3개 스니펫으로 구성한다 — 우선순위: HIGH
  - **스니펫 ①** (공감 훅): 수긍 편향 문제 진단 — "AI는 항상 동의해서 결국 내가 원하는 말만 돌아온다"는 경험과 dev-workflow의 구조적 해결 (`ouroboros-integration.md` §1 기반)
  - **스니펫 ②** (차별점): 페르소나 × 에이전트 곱셈 효과 — 도메인(페르소나)과 사고방식(에이전트)의 조합이 N×M 고유 관점을 생성하는 코드 블록 예시 (`ouroboros-integration.md` §4 기반)
  - **스니펫 ③** (실용성): HANDOFF 세션 복구 UX — Claude Code를 열었을 때 작업 목록이 표시되는 터미널 출력 그대로 (`context-handling/SKILL.md` 기반)

### Quick Start 재구성

- REQ-004: Quick Start에서 설치를 완전히 분리한다. 상단에 "설치 → [Installation](#installation) 참조" 한 줄만 남긴다 — 우선순위: HIGH
- REQ-005: Quick Start는 `/dev-workflow:resume` 실행 → 세션 시작 자동 감지 출력부터 시작하여 실제 대화 흐름을 보여준다 — 우선순위: HIGH *(수정: 임팩트 훅 → 세션 시작 전체 흐름으로 변경)*
- REQ-006: **알림/푸시 기능 추가**를 주제로 한 실제 대화 예시를 `### BRAINSTORM` / `### PLAN` 서브섹션으로 제공한다. DEVELOP/REVIEW/COMPLETION은 제거하고 링크로 대체한다 — 우선순위: HIGH *(수정: 인벤토리 시스템 → 알림 기능, 전체 워크플로우 → BRAINSTORM+PLAN만)*
  - 주제: 알림/푸시 기능 추가 (이메일/SMS/푸시, 채널별 설정, 재시도 정책, 이력 보관)
  - 형식: 실제 dev-workflow 출력 포맷 정확 재현 (임의 창작 금지)
  - BRAINSTORM: 페르소나 확정 → Socratic 질문 → 1라운드 피드백 루프 → 합의
  - PLAN: Feasibility Assessment → plan.md 생성 완료 알림 + 경로

### Ouroboros Enhanced Mode

- REQ-007: Key Features에 **Ouroboros Enhanced Mode** 항목을 추가한다 — 우선순위: HIGH
  - 4개 에이전트 특징 간략 설명: Socratic Interviewer, Contrarian, Seed-Architect, Ontologist
  - Ouroboros 미설치 시 해당 기능 미적용(Standalone Mode 동작) 명시
  - 설치 방법은 Installation 섹션으로 위임

### Commands Reference (재구성)

- REQ-008: Commands Reference 섹션을 별도로 구성하여 사용자가 직접 입력하는 커맨드를 모아 설명한다 — 우선순위: HIGH
  - `/dev-workflow:save`: 언제 쓰는가(세션 중단 전), 무엇을 저장하는가(HANDOFF.md), 왜 필요한가(컨텍스트 창 한계 대응)
  - `/dev-workflow:resume`: 언제 쓰는가(새 세션 시작 시), 자동 감지와의 차이
  - `/dev-workflow:design-summary`: 목적과 사용 시점
  - HANDOFF 생명주기: save → /clear → 새 세션 자동 감지 → resume

### 도메인 예시

- REQ-009: Quick Start 예시 도메인은 **알림/푸시 기능 추가**로 확정. 게임 특화 도메인은 사용하지 않는다 — 우선순위: MEDIUM *(수정: 인벤토리/게임 서버 → 알림 기능)*

---

## 4. 설계 개요

### 새 README 섹션 구조

```
1. 한 줄 소개 (기존 유지)
2. Why dev-workflow?              ← 신규
   - 수긍 편향 훅 (2~3문장)
   - 스니펫 ①②③
3. Workflow Overview              ← 기존 유지 (다이어그램)
4. Key Features                   ← Ouroboros Enhanced Mode 추가
   - Persona Feedback Loop
   - Ouroboros Enhanced Mode (신규)
   - Automatic Session Start
   - Multi-Session Support (HANDOFF)
   - Git / Non-Git Support
5. Quick Start                    ← 재작성 완료
   - 설치 참조 한 줄 + Enhanced Mode 주석
   - ### BRAINSTORM (알림 기능 실제 대화 예시)
   - ### PLAN (Feasibility Assessment + plan.md 생성)
   - → 전체 워크플로우 링크
6. Installation                   ← 기존 유지 + 최신화
7. Commands Reference             ← 신규 섹션
   - /dev-workflow:save
   - /dev-workflow:resume
   - /dev-workflow:design-summary
   - HANDOFF 생명주기
8. Workflow Stages in Detail      ← Skills 통합, 기존 유지
9. Configuration                  ← 기존 유지 (File Structure 섹션 삭제됨)
10. FAQ                           ← 오버 엔지니어링 항목 추가
11. License
```

### 삭제 섹션

- `Skills Reference` → 각 Workflow Stage로 통합

---

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| Why 스니펫 ① | `ouroboros-integration.md` §1 내용 | README Why 섹션 |
| Why 스니펫 ② | `ouroboros-integration.md` §4 내용 | README Why 섹션 |
| Why 스니펫 ③ | `context-handling/SKILL.md` HANDOFF 출력 | README Why 섹션 |
| Commands Reference | `commands/save.md`, `commands/resume.md` 실제 동작 | README Commands 섹션 |
| Ouroboros 에이전트 설명 | 4개 에이전트 역할 정의 | README Key Features 섹션 |
| Quick Start 시뮬레이션 | 현재 브레인스토밍 세션 편집 (교체 가능 구조) | README Quick Start 섹션 |

---

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| Quick Start 구조 | BRAINSTORM/PLAN 서브섹션 + 실제 대화 | 사용법 전달 + 빈틈 발견 과정 드러냄 | 임팩트 훅 + 시뮬레이션, 전체 워크플로우 포함 | DEVELOP 포함 시 시선 이탈, 임팩트 훅은 가치 증명으로 목적 혼재 |
| Quick Start 예시 도메인 | 알림/푸시 기능 추가 | 범용 신규 기능 개발 경험, 게임 특화 불필요 | 인벤토리 시스템, 할 일 앱, 메타 예시 | 게임 특화/너무 단순/초보자 혼란 |
| Quick Start DEVELOP 처리 | 제거 + 전체 워크플로우 링크 | 시선 이탈 방지, Quick Start 목적 집중 | DEVELOP 출력 한 줄 포함 | 불필요한 범위 확장 |
| Quick Start 시작점 | 세션 시작 전체 (`/dev-workflow:resume` → 자동 감지) | 설치 후 첫 경험 정확히 전달 | 사용자 첫 메시지부터, 페르소나 확정부터 | 흐름 누락으로 실제 경험과 불일치 |
| 오버 엔지니어링 대응 | Quick Start 체감 복잡도로 승부 | FAQ까지 읽지 않는 회의론자 대응 | FAQ에 Q&A 추가 | FAQ는 이미 설득된 사람의 레퍼런스 |
| Skills Reference | 각 단계로 통합 | 사용자가 직접 호출하는 스킬 없음, 간결성 우선 | 별도 섹션 유지 | 팀 오픈 목적에 불필요한 복잡도 |
| Ouroboros 표현 | 에이전트 특징 + 미적용 명시 | 권장 플러그인으로 명확한 가치 전달 | 언급 최소화 | 핵심 차별점 누락 위험 |
| Why 스니펫 | 실제 설계 문서 발췌 편집 | 구체성 + 신뢰도 | 가상 예시 창작 | 팀원이 실제 동작을 의심할 수 있음 |

---

## 7. 제약조건과 가정

- GitHub Markdown 렌더링 기준으로 작성 (collapsible 태그는 가독성 낮아 사용 안 함)
- 현재 브레인스토밍 세션을 Quick Start 시뮬레이션으로 사용하나, 추후 실제 게임 서버 세션으로 교체 가능한 구조로 작성
- Ouroboros 에이전트 설명은 현재 v0.25.2 기준 4개 에이전트 특징을 서술

---

## 8. 기술 가이드라인

1. Why 스니펫은 설계 문서 원문 그대로 쓰지 않고 팀원 언어로 편집한다
2. HANDOFF 흐름 설명은 context-handling 스킬 실제 동작과 1:1 일치 여부 확인 후 작성
3. Quick Start 예시는 실제 스킬 출력 포맷을 직접 참조하여 재현한다 — 임의 창작 금지
4. Quick Start에서 plan.md 내용 전체를 포함하지 않는다 — 생성 완료 알림 + 경로만
5. Ouroboros Enhanced Mode 기준 예시임을 Quick Start 상단 주석으로 명시 (Standalone Mode 사용자 혼란 방지)
6. 모든 커맨드는 복사-붙여넣기 즉시 동작하는 형태로 표기 (`/dev-workflow:save` 등)
7. 버전 정보는 marketplace.json 기준 최신값(1.7.5) 사용

---

## 9. 구현 결과 및 일탈 사항

> 구현 완료 후 작성

---

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-31 | 초기 설계 문서 작성 | README.md 전면 재작성 | ready-for-plan |
| 2026-03-31 | quick-start-restructure 이슈 해결 — Quick Start 재설계 통합 | REQ-005/006/009, 섹션 4/6/8 | 완료 |
