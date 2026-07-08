---
phase: 1
feature: skill-slimming
category: dev-workflow
status: complete
created: 2026-07-08
---

# Phase 1: Exploration

## 1. 확정된 페르소나

| 페르소나 | 역할 | 활성화 |
|---|---|---|
| 🛠️ Claude Code Expert | Claude Code 플랫폼 제약, 스킬/훅/플러그인 메커니즘, LLM 지시 준수 특성 | 국면 1~3 |
| 🎯 Workflow Designer | 워크플로우 UX, 단계 흐름, 사용자 상호작용 설계 | 국면 1~3 |
| 🔍 Ecosystem Analyst | 경쟁 플러그인 비교, 생태계 트렌드 분석 | 국면 3 |

(.claude/personas.md 자동 적용 — v1.12.0 Case A)

## 2. 탐색된 요구사항 전체 목록

시작점: 2026-07-07 Fable5 적합성 리뷰의 G4 권고 (스킬 본문 슬림화 148KB→~125KB).
Socratic 인터뷰(서브에이전트 2기) + 조사(실측) + Contrarian 라운드를 거쳐 아래로 재정의됨.

**확정 압축 항목 (전부 실측 근거 보유):**
1. brainstorming 서브에이전트 프롬프트 템플릿 공통부 통합 — 공통 규약 1회 + 디스패치 지점별 안전 크리티컬 제약 1줄 앵커 (공통부 221B×7곳, 리포 전체 ~1.3KB)
2. brainstorming /compact 컨텍스트 관리 3중 블록(1,859B) → phase 저장 확인 1줄로 축소
3. decision-flow.md §4 중복 불릿 → §3 표 참조, §5 재편입 → §8 참조 (삭제 금지 목록 엄수)
4. development-principles 4.5KB → ~2.5KB — 철학 4섹션을 원칙 요약 블록으로 (전역 CLAUDE.md·Superpowers와 3중 중복부), 경로 해소 SSOT 975B는 원문 유지
5. design-doc-index/design-summary의 완전 중복 "상태 정규화 전처리" 섹션 → silent-fix 1줄
6. orchestrator Evaluator 프롬프트/AC 박스 인라인 간소 압축 (외부화 아님)
7. 박스 스타일 통일 (design-summary ━━ → ──) 등 keep 소수정
8. decision-flow-hardening feature의 스테일 status 정정 (ready-for-plan → complete) — 도메인 머지 실행은 명시적으로 분리

**검증 요구사항:**
9. 스킬별 must-preserve 불변식 체크리스트 명문화 → 슬림화 후 기계적 확인 + 신선한 눈 1회 교차 검토 (국면 2에서 항목 구체화)

## 3. 사용자가 명시적으로 제외한 항목과 이유

| 제외 항목 | 이유 |
|---|---|
| stage-protocols.md 외부화 | 조사 실측: 절감 상한 823B(4.3%)·조건부·Read 오버헤드로 순절감 0~마이너스. G3 이후 orchestrator가 지연 로드라 외부화 가치 소멸 |
| 경로 해소 완전 참조화 | 조사 실측: 인라인 find 1줄은 단독 진입 안전판(10곳 전수, 공백 0건). 참조화 시 역효과 |
| design-doc-index/design-summary 스킬 병합 | 원 리뷰에서 기철회 |
| 디스크 KB 수치 목표 | 목표는 실질 로드 비용 절감 — KB는 지표 아님 (굿하트 회피) |
| 전역 정량 합격선 | 완료 기준 = 확정 항목 전수 완수 + 불변식 체크 통과 |
| progressive-disclosure (템플릿 분리 파일화) | 재논의 대기열 기각 — 시드 제약 "외부화 금지"와 충돌. 단 기각 근거의 조사 범위(823B 블록)와 제안 대상(33/27/19KB 스킬)이 달라 G7에서 도그푸딩 증거와 함께 재론 가치 있음 (Contrarian 제안 보존) |

## 4. 페르소나 피드백 결과 (주제별 합의)

- **[합의] status 정정**: G4 포함 + 머지 실행 분리 — status는 행동 트리거이므로 "1줄 수정" 가정을 기각하고 파이프라인 분리 (Contrarian 대안 채택)
- **[합의] 검증 절차**: 행동 등가성 "증명" 포기 → must-preserve 불변식 체크리스트로 대체. 3중 중복 제거분은 "1곳 완전 서술 + 참조 포인터" 패턴으로 강화 신호 헤지. 이상 시 git 파일 단위 revert 출구
- **[합의] 합격선**: 미설정 — 전역 KB는 굿하트 지표 (Contrarian: lazy 활성화 이후 실비용은 invoke당 개별 스킬 주입량)
- **[기각 기록] progressive-disclosure**: 위 3절 참조

## 5. 시드 (Step B 사용자 확인 완료)

```yaml
goal: "dev-workflow 플러그인 스킬 본문에서 증명된 축자 중복 블록만 안전하게 통합·압축하여, 행동 등가성을 유지한 채 실질 로드 비용을 절감한다 (G4)."
constraints:
  - "다중 모델 지원: Fable 5 전용 최적화 금지 — 약한 모델 병용 환경에서도 동작 (하드 제약)"
  - "형식 일관성 가드레일 전량 보존 — 사용자 노출 출력 템플릿과 형식 규범은 삭제·변형 불가"
  - "하이브리드 규약: 공통 규약 1회 정의 + 디스패치 지점마다 안전 크리티컬 제약 1줄 앵커 유지"
  - "decision-flow.md 삭제 금지 목록 엄수 (역질문·헤더 3케이스·N/M/K·응답 주권 5케이스·오픈 박스·대기열 박스 등)"
  - "development-principles 경로 해소 SSOT 본문(975B) 원문 유지"
  - "경로 해소 인라인 find 10곳 유지 — 단독 진입 안전판"
  - "외부화 금지: 인라인 유지 + 블록 자체 간소화만"
  - "행동 등가성(지시 의미 불변)이 모든 변경의 수용 조건"
non_goals:
  - "디스크 KB 수치 자체 / 외부화 / 경로 해소 완전 참조화 / 스킬 병합 / 미증명 중복의 공격적 압축"
success_criteria:
  - "확정 압축 항목 8건 전수 완수 (본 문서 2절)"
  - "불변식 체크리스트 전 항목 통과 + 신선한 눈 1회 교차 검토 통과"
  - "약한 모델에서도 안전 크리티컬 제약 준수 (앵커 체제)"
assumptions:
  - "공통 규약 1회 + 1줄 앵커만으로 약한 모델도 디스패치 제약을 준수한다 (미검증 — 도그푸딩 관측 대상)"
  - "/compact 안내 축소가 실사용 UX를 저해하지 않는다 (사용자 증언: statusline 참고, 안내 미참고)"
open_questions: []
context: "2026-07-07 Fable5 리뷰 G4 권고에서 출발, 인터뷰·조사·Contrarian 라운드로 외부화/참조화 2건 철회 및 다중 모델 하드 제약 추가. 시드 확정 후 결정 3건(status 정정 포함, 불변식 검증, 합격선 미설정) 완료, 재논의 대기열 1건 기각."
```

## 6. 명확도 체크리스트 (전환 시점)

- ✅ Goal Clarity: 증명된 중복 통합 + 행동 등가성 + 로드 비용 절감으로 명확
- ✅ Constraint Clarity: 다중 모델·가드레일·삭제 금지 목록·앵커 체제 구체화 완료
- ✅ Success Criteria: 항목 전수 완수 + 불변식 통과로 확정 (open_questions 0건)
- → 국면 2 집중 영역: 스킬별 must-preserve 불변식 체크리스트 항목 구체화
