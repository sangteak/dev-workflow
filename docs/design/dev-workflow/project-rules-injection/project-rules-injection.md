---
feature: project-rules-injection
category: dev-workflow
status: ready-for-plan
created: 2026-05-14
last-updated: 2026-05-14
dependencies:
  - workflow-lifecycle
  - session-management
  - ouroboros-integration
affects:
  - hooks/session-start
  - skills/workflow-orchestrator
  - skills/plan-stage
  - commands/setup
  - skills/development-principles
---

# project-rules-injection 설계 문서

> 한 줄 요약: dev-workflow를 사용하는 프로젝트가 `.claude/rules/*.md`로 도메인 분리된 규칙을 두면 dev-workflow가 자동 주입·전파·검증하는 3계층 Defense in Depth 메커니즘.

## 1. 배경과 동기

dev-workflow를 사용하는 프로젝트가 코딩 스타일·커밋 규칙·아키텍처 원칙 같은 팀 표준을 CLAUDE.md에 누적할수록 파일이 비대해지고, 모든 컨텍스트에 무차별 주입되는 문제가 생긴다. 사용자는 도메인별로 규칙을 분리하고, dev-workflow가 워크플로우 단계마다 적절히 주입·강제하기를 원한다.

**조사 결론 (Phase 1):**
- Claude Code 자체 메커니즘만으로는 `.claude/rules/*.md` 자동 글로브 주입 불가 (CLAUDE.md `@import`는 수동 명시, Skills description은 자동 활성화 보장 안 됨)
- `SessionStart` 훅의 `additionalContext`만이 자동 주입 가능한 유일한 경로
- 서브에이전트는 메인 컨텍스트 비상속(fresh context) — 명시 첨부 필수
- CLAUDE.md "YOU MUST" 패턴은 명령 인지를 보장하지만 **행동 강제·단계별 적시 재강조·자동 검증/수정·메타데이터 라우팅을 보장하지 못함**

dev-workflow의 차별화 가치는 이 네 가지를 메커니즘으로 자동화하는 데 있다.

## 2. 목표와 비목표

### 목표
- **GOAL-001**: `.claude/rules/*.md` 도메인 규칙 파일을 dev-workflow가 자동 주입·전파·검증하는 3계층 Defense in Depth 메커니즘 구현
- **GOAL-002**: CLAUDE.md 비대화 방지 — 코딩 규칙 등 도메인 분리 가능한 규칙은 별도 디렉토리로 격리
- **GOAL-003**: 워크플로우 단계별 적시 강조 — DEVELOP/REVIEW/PLAN/COMPLETION에서 applies-to 매칭 규칙만 정밀 주입
- **GOAL-004**: 자동 수정 안전망 — 자동 수정은 별도 커밋으로 격리 + 테스트 재실행 + 실패 시 자동 롤백
- **GOAL-005**: 후방 호환 — 규칙 파일이 없는 기존 프로젝트는 변경 없이 동일 동작

### 비목표
- 신규 워크플로우 단계 추가 — REVIEW 강화로 흡수
- pre-commit git hook 레벨 강제 — Superpowers 내부 수정 필요, 범위 외
- 시맨틱 규칙의 100% 강제 보장 — LLM 판단 의존 불가피, best-effort
- PreToolUse/UserPromptSubmit 훅 기반 실시간 차단 — v2 검토
- CLAUDE.md 대체 — 도메인 분리 이점이 있는 규칙만 `.claude/rules/`로 이동
- BRAINSTORM 단계 규칙 적용 — 요구사항 탐색 단계라 코드 패턴 규칙과 무관
- Researcher 에이전트 규칙 전파 — 일반 정보 검색이라 가치 낮음
- 헤더 단위 라우팅 — 파일 단위만, 헤더 단위는 v2
- priority 필드 (충돌 자동 해결) — v1은 감지 알림만
- 별도 메타 파일 `.claude/dev-workflow.yaml` — v2 검토
- 자동 CLAUDE.md → `.claude/rules/` 마이그레이션 — 가이드 문서만 제공
- frontmatter `auto-fix-test` 필드 — 안전망 약화 우려, 비채택

## 3. 확정된 요구사항

### 규칙 파일 작성 규약
- **REQ-001**: 규칙 파일은 `.claude/rules/*.md` 평면 디렉토리에 배치 — 우선순위: HIGH
- **REQ-002**: 파일명은 도메인 prefix 권장(`coding_`, `commit_`, `review_` 등) — 우선순위: MEDIUM
- **REQ-003**: 한 파일 내 여러 규칙은 헤더(`##`, `###`)로 세분화 — 우선순위: MEDIUM
- **REQ-004**: frontmatter 필수 필드: `type`, `applies-to`, `auto-fix` — 우선순위: HIGH
  - `type`: `semantic | quantitative | structural`
  - `applies-to`: `[develop, review, completion, plan, all]` 부분집합
  - `auto-fix`: `true | false | confirm`
- **REQ-005**: 본문은 자유 형식 허용. 권장 템플릿(Rule + Examples + Rationale + Anti-patterns) 제공, 강제 안 함 — 우선순위: MEDIUM
- **REQ-006**: `.claude/rules/examples/` 서브디렉토리는 글로브 자동 제외 — 사용자 학습용 샘플 — 우선순위: MEDIUM

### 자동 주입 메커니즘 (3계층 Defense in Depth)
- **REQ-010**: **1차 — SessionStart 훅**: 새 훅 `hooks/inject-rules` 독립 스크립트가 `.claude/rules/*.md`를 글로브하여 `additionalContext`로 일괄 주입 — 우선순위: HIGH
- **REQ-011**: 1차 훅은 기존 orchestrator 훅과 분리. `hooks.json`의 같은 `SessionStart` matcher에 누적 등록 — 우선순위: HIGH
- **REQ-012**: **2차 — 단계별 프롬프트 주입**: workflow-orchestrator SKILL이 DEVELOP/REVIEW/COMPLETION 진입 시, `applies-to`에 해당 단계가 명시된 규칙을 Superpowers 서브에이전트 호출 프롬프트에 명시 첨부 — 우선순위: HIGH
- **REQ-013**: plan-stage 스킬이 Architect 페르소나 호출 시 `applies-to: plan` 또는 `all` 매칭 규칙을 프롬프트에 첨부 — 우선순위: MEDIUM
- **REQ-014**: `applies-to: all` 규칙은 SessionStart에서만 노출, 단계별 2차 주입에서 제외 (중복 방지) — 우선순위: MEDIUM

### REVIEW 단계 검증 메커니즘 (3차)
- **REQ-020**: REVIEW 단계는 type별로 검증자를 라우팅 — 우선순위: HIGH
  - `type: semantic` → Superpowers `code-reviewer` 프롬프트에 규칙 첨부, 자연어 평가
  - `type: quantitative | structural` → Ouroboros Evaluator에 자연어 AC 형태로 전달, PASS/FAIL/PARTIAL 판정
- **REQ-021**: 위반 검출 시 `auto-fix` 메타데이터에 따른 동작 — 우선순위: HIGH
  - `auto-fix: true` → 자동 수정 라운드 실행
  - `auto-fix: confirm` → 사용자에게 번호 선택 질문 후 결정
  - `auto-fix: false` → 보고만, 사용자가 수동 처리
- **REQ-022**: 자동 수정 안전망 (git-mode) — 우선순위: HIGH
  - 자동 수정은 별도 커밋으로 격리: `style(auto-fix): [규칙명] 적용 (rule: [파일명])`
  - 수정 후 테스트 재실행 (Implementer가 CLAUDE.md/package.json에서 추론)
  - 테스트 실패 시 `git reset HEAD~1` 자동 롤백 + 사용자 보고
- **REQ-023**: 자동 수정 안전망 (no-git-mode) — 우선순위: HIGH
  - 변경 사항을 별도 리포트로 분리
  - 테스트 실패 시 변경 텍스트로 보존, 사용자 수동 검토
- **REQ-024**: 롤백 시 사용자 보고 강화 — 우선순위: MEDIUM
  - 변경 diff를 텍스트로 출력
  - 실패한 테스트 이름 명시
  - 사용자가 수동 결정 가능하도록 컨텍스트 제공

### 충돌 처리
- **REQ-030**: 규칙 간 충돌은 자동 해결 없이 감지만 — 우선순위: MEDIUM
  - REVIEW 단계 `code-reviewer`가 동일 항목에 대한 상충 규칙 발견 시 알림
  - 사용자에게 번호 선택 질문으로 결정 위임

### 관측성
- **REQ-040**: SessionStart 시 로드된 규칙 개수와 파일명 한 줄 출력 — 우선순위: MEDIUM
  - 예: `🛡️ 프로젝트 규칙 4개 로드됨: coding_style, coding_test, commit_conventional, review_checklist`
- **REQ-041**: 단계 진입 시 활성 규칙 라벨 한 줄 출력 — 우선순위: MEDIUM
  - 예: `📋 활성 규칙: coding_style, coding_test (applies-to 매칭)`

### setup 자동화
- **REQ-050**: `dev-workflow:setup` 커맨드 확장 — 우선순위: MEDIUM
  - `.claude/rules/` 디렉토리 생성 옵션 제공
  - 권장 템플릿(`docs/templates/rule-template.md`) 배치
  - 옵션 질문: "프로젝트 규칙 디렉토리를 초기화할까요? 1. Yes / 2. No / 3. 샘플 포함 초기화"
  - 샘플 포함 시 `examples/` 서브디렉토리에 3종 샘플 배치 (coding_style, commit_conventional, review_checklist)
- **REQ-051**: setup 가이드 문서에 *"CLAUDE.md에 `## Test Command` 섹션 명시 권장"* 강화 — 우선순위: MEDIUM
- **REQ-052**: CLAUDE.md → `.claude/rules/` 마이그레이션 가이드 문서 제공 (자동 마이그레이션 안 함) — 우선순위: LOW

### 폴백/오류 처리
- **REQ-060**: `.claude/rules/` 디렉토리 또는 파일이 없으면 조용히 skip — 우선순위: HIGH
- **REQ-061**: frontmatter 파싱 오류 시 단계별 주입에서 제외 + 사용자 경고 출력 — 우선순위: MEDIUM

## 4. 설계 개요

### 3계층 Defense in Depth 아키텍처

```
사용자 프로젝트 루트
│
├── CLAUDE.md                          ← 일반 프로젝트 컨텍스트
├── .claude/
│   └── rules/                         ← dev-workflow 규칙 디렉토리
│       ├── coding_style.md            (type: semantic, applies-to: [develop, review])
│       ├── commit_conventional.md     (type: quantitative, applies-to: [completion])
│       ├── review_checklist.md        (type: structural, applies-to: [review])
│       └── examples/                  ← 글로브 자동 제외
│           └── (학습용 샘플)
└── docs/

   ↓ dev-workflow가 동작하면

[1차] SessionStart 훅 (hooks/inject-rules)
       └─ .claude/rules/*.md 일괄 → additionalContext 주입 (모든 단계 베이스라인)

[2차] 단계별 프롬프트 주입
       ├─ DEVELOP 진입 → workflow-orchestrator → Superpowers Implementer 호출 프롬프트에
       │                applies-to:[develop, all] 매칭 규칙 첨부
       ├─ PLAN 진입 → plan-stage → Ouroboros Architect 호출 프롬프트에
       │              applies-to:[plan, all] 매칭 규칙 첨부
       ├─ REVIEW 진입 → workflow-orchestrator → Superpowers code-reviewer 호출 프롬프트에
       │                applies-to:[review, all] 매칭 규칙 첨부
       └─ COMPLETION 진입 → workflow-orchestrator → 커밋 단계에
                            applies-to:[completion, all] 매칭 규칙 첨부

[3차] REVIEW 단계 검증 + 자동 수정
       ├─ type:semantic → Superpowers code-reviewer 자연어 평가
       ├─ type:quantitative/structural → Ouroboros Evaluator AC 판정
       └─ 위반 발견 + auto-fix:true → Implementer 자동 수정 라운드
                                       ├─ 별도 커밋 격리
                                       ├─ 테스트 재실행
                                       └─ 실패 시 자동 롤백 + 사용자 보고
```

### 책임 분담

| 컴포넌트 | 책임 |
|---|---|
| `hooks/inject-rules` (신규) | `.claude/rules/*.md` 글로브 → `additionalContext` 주입 (1차) |
| `skills/workflow-orchestrator` (수정) | DEVELOP/REVIEW/COMPLETION 위임 시 단계별 규칙 첨부 지시 명시 (2차) |
| `skills/plan-stage` (수정) | Architect 호출 시 `applies-to: plan` 규칙 첨부 (2차) |
| Superpowers `code-reviewer` | `type: semantic` 규칙으로 자연어 평가 (3차) |
| Ouroboros `Evaluator` | `type: quantitative/structural` 규칙을 자연어 AC로 받아 PASS/FAIL 판정 (3차) |
| Superpowers `Implementer` | 자동 수정 라운드 실행 + 테스트 재실행 + 롤백 (3차) |
| `commands/setup` (확장) | `.claude/rules/` 디렉토리 + 권장 템플릿 + 샘플 초기화 |
| `docs/templates/rule-template.md` (신규) | 규칙 작성 권장 템플릿 |

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| `hooks/inject-rules` | Claude Code SessionStart 훅 메커니즘, Bash glob | 메인 세션 컨텍스트 |
| `workflow-orchestrator` (수정) | 기존 workflow-orchestrator, frontmatter 파싱 (grep 기반) | DEVELOP/REVIEW/COMPLETION 단계의 Superpowers 위임 흐름 |
| `plan-stage` (수정) | 기존 plan-stage, Ouroboros Architect 에이전트 패턴 | PLAN 단계 Architect 호출 |
| `commands/setup` (확장) | 기존 setup 커맨드 로직 | `.claude/rules/` 디렉토리 |
| 자동 수정 흐름 | Superpowers Implementer, git (git-mode), 테스트 명령 추론 (CLAUDE.md) | 코드 변경 + 커밋 + 테스트 |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 디렉토리 구조 | 평면 + prefix 명명 + 헤더 세분화 | 단계 라우팅을 frontmatter에 일원화, 5~10개에 최적 | 카테고리 하위 디렉토리 | 한 도메인이 여러 단계 걸칠 때 모호함, 5개 미만에 오버킬 |
| 본문 구조 | 권장 템플릿 (강제 없음) | 부담 없는 시작 + 양질 작성 가이드 | 표준 섹션 강제 | 작성 부담 증가, 가벼운 메모로 시작 어려움 |
| 충돌 해결 | 감지 알림만 (v1) | 자동 해결은 의도/실수 구별 불가, 사용자 결정이 안전 | priority 필드 자동 해결 | 잘못된 자동 해결이 더 위험 |
| 자동 수정 안전망 | 별도 커밋 + 테스트 재실행 + 자동 롤백 | 자동화 + 안전망 균형, revert 용이 | 매번 사용자 confirm 강제 | 자동화 효과 약화 |
| SessionStart 훅 통합 | 분리 (`hooks/inject-rules` 독립) | 단일 책임, rules 옵션이므로 독립 | 기존 훅 통합 | 책임 분산 |
| 6번째 워크플로우 단계 | 추가 안 함 (REVIEW 강화로 흡수) | UX 비용, 기존 메커니즘이 충분 | 신규 단계 신설 | 책임 분리의 위장된 중복 |
| Evaluator AC 입력 포맷 | 자연어 AC (별도 DSL 없음) | Evaluator는 자연어 기반, 추가 학습 부담 회피 | 구조화 DSL | 사용자 학습 부담, 복잡도 증가 |
| Architect 페르소나 전파 | 포함 (`applies-to: plan` 매칭) | 설계 의사결정 시점에도 팀 표준 가치 | v2로 미루기 | 사용자 사례(Concurrency 패턴)가 설계 시점에도 가치 입증 |
| 다른 Ouroboros 에이전트 전파 | 안 함 (Ontologist/Socratic/Contrarian/Simplifier/Hacker/Researcher) | 설계 단계 페르소나라 코드 규칙과 무관 | 전부 전파 | 노이즈, 토큰 낭비 |
| 자동 수정 테스트 명령 인지 | Implementer 추론 + CLAUDE.md 가이드 강화 | dev-workflow의 "마크다운만" 정신 유지 | `.claude/dev-workflow.yaml` 메타 파일 | YAML 추가로 정신 어긋남, v2 검토 |
| frontmatter `auto-fix-test` | 추가 안 함 | 본질 회피, 안전망 약화 | 옵션화 | 영역 4 안전망 결정과 충돌 |
| 헤더 단위 라우팅 | 안 함 (파일 단위만) | 단순성 유지 | 헤더별 frontmatter | 복잡도 폭증, 파일 단위로 충분 |

## 7. 제약조건과 가정

### 제약조건
- dev-workflow는 코드 없는 Markdown 스킬 플러그인 형식 유지 (모든 로직은 `skills/*/SKILL.md`에 정의)
- 기존 5단계 워크플로우(BRAINSTORM → PLAN → DEVELOP → REVIEW → COMPLETION) 변경 없음
- Superpowers(`subagent-driven-development`, `requesting-code-review`) 위임 패턴 유지
- 자동 주입은 Claude Code SessionStart 훅의 `additionalContext`만 사용 (v1)
- 서브에이전트는 메인 컨텍스트 비상속 → 호출 프롬프트에 규칙 명시 첨부 필수
- MAJOR 버전 업 없도록 후방 호환 유지 (기존 `docs/design/` 구조 그대로 동작)

### 가정
- SessionStart `additionalContext`는 컨텍스트 최상위 배치되어 lost-in-the-middle 영향 최소화
- 규칙 파일 5~10개 수준으로 컨텍스트 위협 없음 (1M 컨텍스트 모델 대비 1% 미만)
- Superpowers Implementer/code-reviewer는 호출 프롬프트의 추가 컨텍스트를 적절히 활용
- Ouroboros Evaluator는 자연어 AC를 PASS/FAIL/PARTIAL로 판정 가능
- 사용자는 frontmatter 규약(type/applies-to/auto-fix) 학습 의지가 있음
- 코딩 스타일 강제가 주된 동기, 다른 도메인 규칙은 후속 확장
- CLAUDE.md에 테스트 명령이 명시되어 있거나, Implementer가 package.json/Makefile에서 추론 가능

## 8. 기술 가이드라인

### 구현 시 준수해야 할 방향

1. **마크다운 정신 유지**
   - 모든 로직은 SKILL.md의 자연어 지시문으로 표현 (정밀 파싱 회피)
   - Bash 훅 스크립트는 단순 글로브 + 파일 읽기 + JSON 출력만
   - frontmatter 추출은 grep으로 단순 매칭 (정밀 YAML 파싱 금지)
   - 글로브는 `.claude/rules/*.md` 평면 패턴만 사용. `**` 재귀 패턴 금지 — `examples/` 서브디렉토리 자동 제외 보장

2. **기존 패턴 확장**
   - workflow-orchestrator의 기존 컨텍스트 전달 패턴(80~106줄) 재활용
   - Ouroboros 에이전트 프롬프트 템플릿의 추가 컨텍스트 슬롯 패턴 확장
   - 새 패턴 도입 최소화

3. **후방 호환성**
   - `.claude/rules/` 디렉토리 없으면 모든 기능 자동 비활성화
   - 기존 dev-workflow 사용자 프로젝트가 변경 없이 동일하게 동작해야 함
   - MAJOR 버전 업 없이 MINOR로 릴리스

4. **자동 수정 안전망**
   - git-mode에서는 항상 별도 커밋으로 격리
   - 테스트 재실행 결과를 명확히 보고
   - 롤백 시 변경 diff + 실패 테스트명을 사용자에게 제시

5. **관측성**
   - 1차 SessionStart 출력 한 줄: 로드된 규칙 개수와 파일명
   - 2차 단계 진입 라벨 한 줄: 활성 규칙 목록
   - 노이즈 최소화, 디버깅 단서 보장

6. **사용자 학습 부담 최소화**
   - frontmatter는 필수, 본문은 자유 형식
   - 권장 템플릿 제공, 강제 안 함
   - `examples/` 서브디렉토리로 학습용 샘플 격리

## 9. 구현 결과 및 일탈 사항

### 검증 완료 항목 (2026-05-14)
- [x] 후방 호환: `.claude/rules/` 없는 프로젝트 무변경 동작 (Scenario 1)
- [x] 1차 SessionStart 주입: 한 줄 헤더 + `<project-rules>` 블록 출력 (Scenario 2)
- [x] 다중 파일 주입: 2개 파일 모두 포함, 헤더에 N개 로드됨 표시 (Scenario 3)
- [x] examples/ 글로브 자동 제외 (Scenario 4)
- [x] setup.md Step 6에 3종 샘플 명세 포함 (Scenario 5)
- [x] 모든 신규/수정 파일 존재 + 12+ 커밋 (Scenario 6)
- [x] 버전 1.8.0 동기화 완료 (Scenario 7)

### 구현된 파일 (Phase A~E)

**Phase A (인프라):**
- `hooks/inject-rules` (신규) — 1차 SessionStart 훅
- `hooks/hooks.json` (수정) — inject-rules 등록
- `hooks/session-start` (수정) — `<!-- dev-workflow:orchestrator -->` 마커 추가

**Phase B (핵심 스킬):**
- `skills/rules-injection/SKILL.md` (신규) — 2/3차 응집 책임 스킬

**Phase C (통합):**
- `skills/workflow-orchestrator/SKILL.md` (수정) — DEVELOP/REVIEW/COMPLETION 위임 지점
- `skills/plan-stage/SKILL.md` (수정) — Architect 호출 시 rules-injection
- `skills/development-principles/SKILL.md` (수정) — 규칙 작성 가이드 참조

**Phase D (사용자 인터페이스):**
- `commands/add-rule.md` (신규) — 인터랙티브 규칙 생성
- `commands/setup.md` (수정) — `.claude/rules/` 초기화 옵션 + 3종 샘플
- `docs/templates/rule-template.md` (신규) — 권장 템플릿
- `docs/guides/migrate-claude-md.md` (신규) — CLAUDE.md 마이그레이션 가이드

**Phase E (릴리스):**
- `.claude-plugin/marketplace.json` + `plugin.json` (수정) — 1.7.7 → 1.8.0

### 일탈 사항 / Architect 권장 반영

PLAN 단계 Architect 구조 분석에서 식별된 3가지 권장을 다음과 같이 처리:
1. **rules-injection 별도 스킬 분리** ✅ 수용 — `skills/rules-injection/SKILL.md` 신설로 workflow-orchestrator의 책임 폭증 방지
2. **frontmatter 단순화** ⚠️ 부분 수용 — 의미 손실 우려로 3필드 유지하되 `type`만 필수, `applies-to`/`auto-fix`는 기본값 부여로 진입 부담 완화. add-rule 명령으로 frontmatter 자동 생성 지원
3. **SessionStart 훅 출력 헤더 분리** ✅ 수용 — `<!-- dev-workflow:orchestrator -->` + `<!-- dev-workflow:rules -->` 마커

### 알려진 한계
- 자동 수정 라운드의 end-to-end 동작은 Superpowers Implementer 환경 의존성으로 실 사용 환경에서 검증해야 함 (Task 13에서는 정적 검증만)
- frontmatter 파싱은 grep 기반 단순 추출 — 복잡한 YAML(중첩, 멀티라인 값) 미지원
- 테스트 명령은 Implementer가 CLAUDE.md/package.json/Makefile에서 추론 — 명시 없으면 검증 불가 (CLAUDE.md `## Test Command` 섹션 권장)

### v2 후보 (이번 릴리스 비목표)
- PreToolUse/UserPromptSubmit 훅 기반 실시간 차단
- frontmatter `priority` 필드 (충돌 자동 해결)
- 별도 메타 파일(`.claude/dev-workflow.yaml`)로 테스트 명령 등 설정 명시
- 헤더 단위 라우팅 (현재는 파일 단위)
- 자동 CLAUDE.md → `.claude/rules/` 마이그레이션 도구
- `/dev-workflow:rules-status` 디버그 커맨드

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-05-14 | 최초 설계 문서 작성 (Phase 1~3 종합) | 신규 기능 | ready-for-plan |
| 2026-05-14 | 구현 완료 — `.claude/rules/` 3계층 메커니즘 + add-rule 명령 + 마이그레이션 가이드 | 전체 | implemented |
