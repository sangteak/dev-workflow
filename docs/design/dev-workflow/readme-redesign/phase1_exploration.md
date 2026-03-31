# Phase 1: Exploration — README 재설계

> 생성: 2026-03-31 | 불변 스냅샷

---

## 탐색된 요구사항 전체

### 확정 요구사항

- README = 설득 문서 + 사용성 문서 (둘 다)
- 문서 순서: Why(목적/동기) → Key Features → Quick Start
- 게임 서버 도메인(인벤토리, Mail 시스템) 예시로 교체
- 내부 플러그인(Superpowers/Ouroboros)을 몰라도 흐름만 따르면 결과가 나온다는 철학 유지
- 오버 엔지니어링 인상 완화 설명 포함
- 최신 커맨드 표기(/dev-workflow:save, /dev-workflow:resume)
- Ouroboros Enhanced Mode 설명 추가
- HANDOFF 목적과 사용 시점 명확히 설명
- Skills Reference 섹션 제거 → 각 단계 설명에 통합 (한 줄)
- Quick Start: 설치 분리(Installation 섹션), 임팩트 훅 + 실제 대화 시뮬레이션
- Why 스니펫: 수긍 편향 훅(②) → 페르소나×에이전트 곱셈 효과(①) → HANDOFF 복구(③) 순서
- Ouroboros: 에이전트 특징 간략 설명 + 미설치 시 해당 기능 미적용 명시

### 명시적 제외 항목

- Superpowers/Ouroboros 내부 동작 상세 설명 (사용자가 알 필요 없음)
- Skills Reference 별도 섹션 (통합으로 대체)
- 긴 Why 섹션 (2~3문장 + 스니펫으로 압축)

---

## 페르소나 구성

- 🛠️ Claude Code Expert
- 🎯 Workflow Designer
- 📝 README Specialist
- 🔍 Ecosystem Analyst (국면 3 활성화)

---

## 페르소나 피드백 결과 요약

### Step C 라운드 1 (비판: 🛠️ Claude Code Expert / Contrarian)

**합의:**
- Why 섹션 유지하되 2~3문장으로 압축 + Before/After 실제 사례 1개
- 게임 서버 도메인 예시 유지 (팀 공감대 목적)
- FAQ 오버 엔지니어링 우려 → Quick Start 체감 복잡도로 승부
- Quick Start 3단계 이내 목표

### Step C 라운드 2 (비판: 🎯 Workflow Designer / Contrarian)

**합의: 옵션 C 채택**
- Quick Start = 임팩트 훅(30초) + 전체 시뮬레이션
- 설치(Installation)는 완전히 분리
- 페르소나 간 충돌 장면 또는 실제 대화 시뮬레이션을 훅으로 사용

---

## 시드 (Step B 확정본)

```yaml
goal: "dev-workflow README.md를 팀 오픈용으로 개선하여 '써볼 만하다'는 확신을 주는 설득+사용성 문서로 재작성"
constraints:
  - "문서 순서: Why(목적/동기) → Key Features → Quick Start"
  - "게임 서버 도메인(인벤토리, Mail 시스템) 예시로 교체"
  - "내부 플러그인 몰라도 흐름만 따르면 결과 나온다는 철학 유지"
  - "오버 엔지니어링 인상 완화 설명 포함"
  - "최신 커맨드 표기(/dev-workflow:save, /dev-workflow:resume)"
  - "Ouroboros Enhanced Mode 설명 추가"
  - "HANDOFF 목적과 사용 시점 명확히 설명"
success_criteria:
  - "README 읽은 후 '써볼 만하다'는 확신"
  - "'오버 엔지니어링 아냐?' 우려 완화 문구"
  - "Quick Start: 게임 서버 도메인(인벤토리, Mail)"
  - "커맨드 최신화(/dev-workflow:save, /dev-workflow:resume)"
  - "Ouroboros Enhanced Mode 설명 포함"
  - "HANDOFF 목적 + 사용 시점 명확히"
  - "Why 섹션이 문서 앞부분에 위치"
```

## 명확도 체크 (전환 시점)

- ✅ Goal Clarity: 설득 + 사용성 문서, 목적 명확
- ✅ Constraint Clarity: 문서 순서, 도메인, 커맨드 모두 구체적
- ✅ Success Criteria: 7개 모두 측정 가능
