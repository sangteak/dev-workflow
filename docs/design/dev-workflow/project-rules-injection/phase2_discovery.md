---
phase: 2
title: 발견 (Discovery)
feature: project-rules-injection
category: dev-workflow
created: 2026-05-14
immutable: true
---

# Phase 2: 발견 (Discovery)

## 미정의 영역 진입 시점

Phase 1 완료 후, 핵심 메커니즘(3계층 Defense in Depth, frontmatter 라우팅, REVIEW 강화)은 확정되었으나
구현 디테일과 사용자 경험 영역이 미정의 상태였다.

## 미정의 영역 → 결정 (8개 영역)

### 영역 1: 디렉토리 구조

**결정:** **옵션 C — 평면 구조 + prefix 명명 + 파일 내 헤더 세분화**

구조:
```
.claude/rules/
├── coding_style.md        # 헤더로 ## Functions, ## Naming 세분화
├── coding_test.md
├── commit_conventional.md
├── commit_branch.md
└── review_checklist.md
```

**근거:**
- 단계별 라우팅은 frontmatter `applies-to`에 일원화 (디렉토리는 인간 가독성 보조)
- 5~10개 규칙으로 시작하는 대다수 프로젝트에 최적
- 신규 규칙은 새 파일 또는 기존 파일 헤더 추가 양쪽 자유
- 글로브 단순 (`.claude/rules/*.md`, 재귀 없음)
- 30개+ 되면 사용자 자발적 prefix 도입 → 디렉토리 마이그레이션 불필요

**검토한 대안:**
- 옵션 A (순수 평면): 5~10개에는 최적이나 카테고리 시각화 약함
- 옵션 B (카테고리 하위 디렉토리): 5개 미만에 오버킬, 한 도메인이 여러 단계 걸칠 때 모호함

### 영역 2: 규칙 파일 본문 구조

**결정:** **옵션 C — 권장 템플릿, 강제 없음**

- frontmatter는 필수 (type, applies-to, auto-fix)
- 본문은 자유 형식 허용
- 권장 템플릿: Rule (필수) + Examples (강력 권장) + Rationale + Anti-patterns
- code-reviewer/Evaluator는 자연어 자유 처리, Examples이 있으면 정밀도 향상

**근거:**
- 부담 없는 시작 (5분 안에 규칙 1개 작성)
- 양질 규칙을 위한 가이드 제공 (강제하지 않음)
- LLM 검증자는 자연어를 어떻게든 처리 가능
- Examples 유무가 검증 품질을 결정한다는 점만 사용자에게 안내 → 자연스러운 학습 유도

### 영역 3: 규칙 충돌 해결

**결정:** **옵션 C — 충돌 감지 알림만 (v1)**

- 자동 해결(priority) 없음. 모든 충돌은 사용자가 결정
- code-reviewer가 충돌 감지 시 명시적 보고
- priority 필드는 충돌 빈도가 실제로 높아지면 v2에서 추가

**충돌 알림 흐름:**
```
⚠️ 규칙 충돌 감지:
  - coding_style.md (Functions): "함수 20줄 이하"
  - coding_legacy.md (Functions): "레거시는 50줄까지"
  대상 코드: src/legacy/parser.py:42

어떻게 처리할까요?
  1. coding_style.md 우선 적용
  2. coding_legacy.md 우선 적용
  3. 이 위치는 예외 처리 (수정 안 함)
```

**근거:**
- 사실상 모든 "충돌"은 사용자의 의도된 override이거나 실수
- 자동 해결은 의도와 실수를 구별 못 함 — 잘못된 자동 해결이 더 위험
- v1 단순화

### 영역 4: 자동 수정 안전망

**결정:** **옵션 D — 별도 커밋 + 테스트 재실행 + 실패 시 자동 롤백**

**git-mode 흐름:**
1. REVIEW에서 위반 검출
2. Superpowers Implementer 호출 (수정 지시)
3. 별도 커밋: `style(auto-fix): early return 패턴 적용 (rule: coding_style.md)`
4. 테스트 재실행
   - ✅ 통과 → 커밋 유지, REVIEW 완료
   - ❌ 실패 → `git reset HEAD~1` 자동 rollback + 사용자 보고

**no-git-mode:** 변경 사항을 별도 리포트로 분리, 테스트 실패 시 변경 텍스트로 보존 (사용자 수동 검토)

**근거:**
- 자동 수정 격리 → 한 줄로 롤백 가능 (git revert HEAD)
- 테스트 실패 자동 감지 → "자동화의 역설" 방지
- auto-fix 메타데이터(true/false/confirm)는 그대로 유지 (사용자 의도 존중)

### 영역 5: 마이그레이션 + setup 자동화

**결정:**
- `dev-workflow:setup` 커맨드 확장: `.claude/rules/` 디렉토리 생성 + 권장 템플릿 배치
- CLAUDE.md → `.claude/rules/` 마이그레이션은 **가이드 문서**로 제공 (자동 마이그레이션은 위험)
- setup 시 옵션 질문: "프로젝트 규칙 디렉토리를 초기화할까요?"
  1. Yes (빈 디렉토리)
  2. No (스킵)
  3. 샘플 포함 초기화 (examples/ 함께)

### 영역 6: 샘플 규칙 파일

**결정:** **examples/ 서브디렉토리로 격리**

구조:
```
.claude/rules/
├── examples/                  # dev-workflow 글로브 자동 제외
│   ├── coding_style.md       (semantic 샘플)
│   ├── commit_conventional.md (quantitative 샘플)
│   └── review_checklist.md   (structural 샘플)
└── (사용자 활성 규칙은 .claude/rules/ 루트에 직접 배치)
```

- 글로브는 `.claude/rules/*.md` (재귀 안 함) → examples/ 자동 제외
- 사용자가 examples/에서 위로 복사하면 활성

### 영역 7: 관측성 (디버그 출력)

**결정:** **2계층 관측 + v2 별도 커맨드**

1. **SessionStart 한 줄** (조용한 확인):
   ```
   🛡️ 프로젝트 규칙 4개 로드됨: coding_style, coding_test, commit_conventional, review_checklist
   ```

2. **단계 진입 시 라벨 한 줄** (적시 인지):
   ```
   ── DEVELOP 단계 진입 ──
   📋 활성 규칙: coding_style, coding_test (applies-to 매칭)
   ```

3. **상세 출력 커맨드** `/dev-workflow:rules-status`는 v2 검토 (v1은 텍스트 검색으로 충분)

**근거:** 노이즈 최소 + 디버깅 단서 보장.

### 영역 8: Ouroboros 에이전트 전파 (확장 결정)

**결정:**

| 에이전트 | 단계 | 규칙 전파 | 매칭 frontmatter |
|---|---|---|---|
| Ontologist, Socratic, Contrarian, Simplifier, Hacker | BRAINSTORM | ❌ 전파 안 함 | — |
| **Architect** | PLAN | ✅ **전파 (v1 확장)** | `applies-to: plan` 또는 `all` |
| Researcher | PLAN | ❌ 전파 안 함 (일반 정보 검색) | — |
| Evaluator | REVIEW | ✅ 전파 (시드 기존) | `type: quantitative` 또는 `structural` 라우팅 |

**v1 범위 확장:** `applies-to`에 `plan` 추가 → 5가지 (develop, review, completion, plan, all)

**근거:**
- 사용자 예시(Concurrency 패턴)는 코드 생성/리뷰뿐 아니라 **설계 의사결정 시점**(PLAN Architect)에도 가치 있음
- "이 기능을 어떻게 설계할까" 결정 시 팀 표준이 영향
- BRAINSTORM 페르소나는 요구사항 탐색 단계라 코드 패턴 규칙과 무관 → 노이즈만 늘림
- Researcher는 일반 정보 검색이라 규칙 인지 가치 낮음

## Phase 2 사용자 결정 (요약)

1. ✅ 디렉토리: 옵션 C + 헤더 세분화
2. ✅ 본문: 옵션 C (권장 템플릿, 강제 없음)
3. ✅ 충돌: 감지 알림만 (v1)
4. ✅ 자동 수정 안전망: 별도 커밋 + 테스트 재실행 + 자동 롤백
5. ✅ setup 자동화
6. ✅ examples/ 서브디렉토리
7. ✅ 2계층 관측성
8. ✅ Architect 전파 추가 + applies-to에 plan 포함 (v1 범위 확장)

## Phase 2 추가 시드 보완 사항

**Constraints 추가:**
- `applies-to` v1 범위 확장: `develop`, `review`, `completion`, `plan`, `all` (BRAINSTORM 단계만 v2)
- PLAN 단계 Architect 페르소나 호출 시 `applies-to: plan` 또는 `all` 매칭 규칙을 프롬프트에 명시 첨부
- 디렉토리 글로브는 평면(`.claude/rules/*.md`, 재귀 없음). `examples/` 서브디렉토리는 자동 제외
- 본문은 자유 형식 허용. frontmatter만 필수
- 규칙 충돌 시 자동 해결 안 함 — 사용자 결정에 위임 (감지 알림만)
- 자동 수정은 별도 커밋으로 격리, 테스트 재실행 후 실패 시 자동 롤백

**Non-goals 추가:**
- BRAINSTORM 단계 페르소나(Ontologist, Socratic, Contrarian, Simplifier, Hacker)에 규칙 전파 안 함
- Researcher 에이전트에 규칙 전파 안 함
- 헤더 단위 라우팅 안 함 (파일 단위만, 헤더 단위는 v2)
- priority 필드 추가 안 함 (충돌 자동 해결 안 함, v2 검토)
- 자동 CLAUDE.md → .claude/rules/ 마이그레이션 안 함 (가이드 문서만 제공)

**Success Criteria 추가:**
- PLAN 단계 Architect 호출 시 `applies-to: plan` 매칭 규칙이 프롬프트에 첨부됨
- 자동 수정 후 테스트 실패 시 변경 사항이 롤백되고 사용자에게 보고됨
- 충돌하는 규칙 발견 시 code-reviewer가 명시적 보고하고 사용자 결정을 요청함
- SessionStart 한 줄 출력 + 단계 진입 시 활성 규칙 라벨 출력
- examples/ 서브디렉토리의 샘플 파일은 글로브에서 자동 제외됨

## 페르소나 피드백 결과 (Phase 2)

Phase 2는 사용자가 명확한 의견을 빠르게 제시했고 옵션 비교가 핵심이었으므로, 본격적 페르소나 토론은 최소화되었다. 추천 → 사용자 결정 → 확정 흐름.

**합의 영역:** 모든 영역에서 사용자 결정이 추천과 일치하거나 추천을 확장(영역 8)했다. 페르소나 간 미합의 없음.

**유의 사항 (Phase 3에서 검증할 영역):**
- 디렉토리 평면 구조의 30개+ 확장성 (기술 검증 필요)
- 자동 수정 후 테스트 자동 실행의 기술적 실현 가능성 (Superpowers 패턴과 통합)
- 규칙 파일 글로브가 examples/ 서브디렉토리를 정확히 제외하는지 (Bash glob 검증)
- 단계 진입 시 활성 규칙 라벨 출력의 위치 (어느 스킬에 추가할지)
- Architect 페르소나에 규칙 첨부 시 토큰 비용 (plan-stage 스킬 영향)
