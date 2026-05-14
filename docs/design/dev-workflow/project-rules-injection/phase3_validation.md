---
phase: 3
title: 검증 (Validation)
feature: project-rules-injection
category: dev-workflow
created: 2026-05-14
immutable: true
---

# Phase 3: 검증 (Validation)

## TD/기술 페르소나 합류

- 🛠️ Claude Code Expert (TD 역할, 기술 검증)
- 🎯 Workflow Designer (기존, UX 관점)
- 🔍 Ecosystem Analyst (Phase 3 활성화, 생태계 비교)

## TD 기술 검토 — 항목별 판단 결과

### 1. SessionStart 훅 통합 vs 분리
- **판단:** `hooks.json`에 동일 `SessionStart` matcher 아래 두 훅 등록 가능. 두 훅의 `additionalContext`는 각각 누적 주입 (덮어쓰기 아님)
- **가이드라인:** 새 훅 `hooks/inject-rules` 독립 스크립트로 구성, 매칭 패턴 `startup|resume|clear|compact`
- **리스크:** 낮음

### 2. 글로브 정확도 (examples/ 제외)
- **판단:** Bash glob `.claude/rules/*.md`는 재귀 없음 → examples/ 자동 제외 ✅
- **가이드라인:** 훅 스크립트에서 `for file in "${PROJECT_ROOT}/.claude/rules/"*.md; do` 패턴 사용. `**` 사용 금지
- **리스크:** 낮음

### 3. 단계별 프롬프트 첨부 구현 위치
- **판단:** workflow-orchestrator SKILL의 DEVELOP/REVIEW/COMPLETION 위임 지점에 규칙 첨부 텍스트 추가 (이미 패턴 존재 — 80~106줄). plan-stage 스킬에 Architect 호출 보강
- **가이드라인:** 마크다운 스킬 내에서 "applies-to에 [stage] 매칭 규칙을 프롬프트에 첨부하라" 지시문 명시
- **리스크:** 낮음 (기존 패턴 확장)

### 4. 자동 수정 후 테스트 재실행 ⚠️ 핵심 리스크
- **판단:** dev-workflow가 직접 테스트 명령을 알 수 없음. CLAUDE.md/README/package.json 등에 명시되어야 함. Implementer 추론 의존 시 거짓 통과 가능
- **가이드라인 (옵션 A 확정):**
  - Superpowers Implementer가 컨텍스트(package.json, Makefile, CLAUDE.md 등)에서 테스트 명령 추론
  - 추론 실패 시 사용자에게 1회 요청
  - **setup 가이드 문서에 *"CLAUDE.md에 `## Test Command` 섹션 명시 권장"* 강화 추가**
- **검토한 대안:**
  - 옵션 B (`.claude/dev-workflow.yaml` 메타 파일): 거짓 통과 위험 제거되나 dev-workflow의 "마크다운만" 정신에 어긋남. v2 검토
  - 옵션 C (frontmatter `auto-fix-test`): 본질 회피, 영역 4 안전망 결정과 충돌 → 비채택
- **리스크:** 중간 → 낮음 (CLAUDE.md 가이드 강화로 완화)

### 5. frontmatter 파싱 안정성
- **판단:** Bash 정밀 YAML 파싱 어려움 (외부 의존 없이). grep/sed 단순 추출 가능
- **가이드라인:**
  - SessionStart 훅은 파일 전체를 컨텍스트에 박아넣음 (frontmatter 포함) — LLM이 해석
  - 단계별 라우팅 시 grep으로 `applies-to:` 라인 추출 매칭
  - 잘못된 frontmatter는 매칭 실패 → 단계별 주입 안 됨 + 사용자 경고 출력
- **리스크:** 낮음~중간

### 6. 토큰 비용
- **판단:** 5~10개 규칙 × 1000~2000 토큰 = 약 1만 토큰. 1M 컨텍스트 모델 대비 1% 미만
- **가이드라인:** 30개+ 규칙으로 확장 시 v2에서 응답 성능 모니터링 검토
- **리스크:** 낮음

### 7. Architect 페르소나 호출 시 규칙 첨부
- **판단:** 기존 Ouroboros 에이전트 프롬프트 템플릿(plan-stage.md:84~119)에 "--- 프로젝트 규칙 ---" 슬롯 추가
- **가이드라인:** plan-stage 스킬의 Architect 호출 섹션에 명시
- **리스크:** 낮음

### 8. 충돌 감지 책임자
- **판단:** REVIEW 단계의 Superpowers `code-reviewer` 프롬프트에 "규칙 간 충돌 감지 시 사용자에게 명시 보고" 지시 추가
- **가이드라인:** code-reviewer가 규칙 컨텍스트를 읽고 동일 항목에 대한 상충 발견 시 알림
- **리스크:** 낮음~중간 (LLM 충돌 감지 정밀도 의존)

## 🔍 Ecosystem Analyst 비교 분석

**경쟁 플러그인 대비 dev-workflow 위치:**
- hookify (`.claude/hookify.*.local.md`): 이벤트 hook 기반 실시간 차단 — 강제력 최상, 사용자 학습 부담 큼 (DSL 필수)
- centminmod 템플릿 (`.claude/rules/core-rules.md`): 단일 파일 + CLAUDE.md 참조 — 단순하나 단계별 매핑 없음
- dev-workflow: frontmatter 라우팅 + 단계별 적시 주입 + REVIEW 검증 — 둘의 중간 위치

**차별화 포인트 검증:**

| 포인트 | dev-workflow | 경쟁 |
|---|---|---|
| 단계별 규칙 슬라이스 주입 | ✅ | ❌ |
| 페르소나-규칙 매핑 (Architect 등) | ✅ | ❌ |
| 자동 수정 + 테스트 재실행 + 롤백 | ✅ | ❌ |
| 자연 학습 곡선 (frontmatter만 필수) | ✅ | hookify는 DSL 필수 |

→ 생태계에서 명확한 차별화 위치. hookify 수준의 강제력은 없음 (v1 비목표로 인정).

## 🎯 Workflow Designer UX 검토

**점검 결과:**
- 디렉토리 단순성(평면) + 본문 자유 형식 → 진입 장벽 낮음 ✅
- 관측성 2계층 → 노이즈 적정 ✅
- 자동 수정 별도 커밋 → 변경 추적 명확 ✅

**우려 보강 (사용자 결정 반영):**
- 자동 수정 롤백 시 사용자 보고 강화:
  - 변경 diff를 텍스트로 보여줌
  - 실패한 테스트명 명시
  - 사용자가 수동 결정 가능하도록 컨텍스트 제공

## Phase 3 사용자 결정

1. ✅ 자동 수정 테스트 재실행: **옵션 A** (Implementer 추론 + CLAUDE.md 가이드 강화)
2. ✅ 자동 수정 롤백 시 사용자 보고 강화 (diff + 실패 테스트명)
3. ✅ 추가 검증 항목 없음 — 국면 4 진입

## 종합 리스크 매트릭스

| 항목 | 초기 리스크 | 보완 후 |
|---|---|---|
| 두 SessionStart 훅 누적 | 낮음 | 낮음 |
| examples/ 글로브 제외 | 낮음 | 낮음 |
| 단계별 프롬프트 첨부 구현 | 낮음 | 낮음 |
| 자동 수정 테스트 재실행 | **중간** | **낮음** (CLAUDE.md 가이드 강화) |
| frontmatter 파싱 안정성 | 낮음~중간 | 낮음 (경고 + LLM 해석) |
| 토큰 비용 | 낮음 | 낮음 |
| Architect 규칙 첨부 | 낮음 | 낮음 |
| 충돌 감지 정밀도 | 낮음~중간 | 낮음~중간 (사용자 결정 위임) |

## Phase 3 추가 시드 보완 사항

**Constraints 추가:**
- 자동 수정 테스트 재실행은 Implementer 추론에 의존. CLAUDE.md에 `## Test Command` 명시 권장
- 자동 수정 롤백 시 변경 diff + 실패 테스트명을 사용자에게 출력
- frontmatter 파싱 오류 시 단계별 주입은 스킵하고 사용자에게 경고 출력
- 충돌 감지는 REVIEW 단계 Superpowers code-reviewer가 담당하며, 자동 해결 없이 사용자 결정에 위임

**Non-goals 추가:**
- 별도 메타 파일(.claude/dev-workflow.yaml) 도입 안 함 (v2 검토)
- frontmatter에 `auto-fix-test` 필드 추가 안 함 (안전망 약화 우려)
- 30개+ 규칙 환경 최적화 안 함 (v2 검토)

**Success Criteria 추가:**
- 자동 수정 롤백 시 사용자에게 변경 diff와 실패한 테스트 이름이 함께 출력됨
- 잘못된 frontmatter 규칙 파일이 발견되면 사용자에게 경고가 출력되고 해당 파일은 단계별 주입에서 제외됨
- code-reviewer가 규칙 충돌을 감지하면 사용자에게 명시적 보고하고 결정을 요청함

## 페르소나 피드백 결과 (Phase 3)

**합의 영역:**
- 자동 수정 테스트 재실행은 옵션 A로 진행 (CLAUDE.md 가이드로 위험 완화)
- 롤백 보고 강화 (UX 우려 반영)
- 생태계 차별화 위치 확보
- 8개 검증 항목 모두 낮음~중간 리스크로 진행 가능 판정

**미합의 영역:** 없음
