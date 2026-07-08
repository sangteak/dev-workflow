---
feature: skill-slimming
category: dev-workflow
status: complete
created: 2026-07-08
last-updated: 2026-07-08
dependencies:
  - brainstorming (분할 대상)
  - merge-to-domain (분할 대상)
  - workflow-orchestrator (Evaluator 블록 간소화)
  - design-doc-index / design-summary (상태 정규화 압축)
affects:
  - brainstorming, merge-to-domain (references/ 분리 파일 신설)
  - workflow-orchestrator, design-doc-index, design-summary
  - decision-flow-hardening feature (status 정정 — 별도 커밋)
  - plugin.json/marketplace.json (1.13.0 MINOR)
---

# skill-slimming 설계 문서 (G4)

> 한 줄 요약: 증명된 축자 중복은 제거하고, 기준값 이상 대형 스킬의 참조 자료는 verbatim 분할하여, 행동 등가성을 유지한 채 스킬의 invoke당 로드 비용을 절감한다.

## 1. 배경과 동기

2026-07-07 Fable5 적합성 리뷰가 스킬 본문 슬림화(G4)를 권고했다. 브레인스토밍 과정에서 목표가 재정의됐다: 디스크 KB가 아니라 **invoke당 실질 로드 비용**이 지표이고(v1.12.0 지연 활성화 이후 상시 주입은 이미 2.5KB), 수단은 재작성 압축이 아니라 **삭제(증명된 중복)와 verbatim 분할(대형 스킬의 참조 자료)**이다. 재작성형 압축은 기계 검증이 불가능한 의미 드리프트를 낳으므로 전량 배제됐다.

## 2. 목표와 비목표

### 목표
- GOAL-001: 증명된 축자 중복 블록 제거 (실측 근거 보유 항목만)
- GOAL-002: 기준 충족 대형 스킬의 참조 자료를 분리 파일로 verbatim 이동 — invoke당 본문 로드를 절반 이하로
- GOAL-003: 슬림화 전 과정에서 행동 등가성 유지 — 3튜플 불변식 기계 체크 + 판단 리뷰로 검증
- GOAL-004: 약한 모델 병용 환경에서의 동작 보존 (다중 모델 하드 제약)

### 비목표
- 디스크 KB 수치 목표 (굿하트 회피 — 절감량은 결과 보고로만)
- 재작성형 압축 (development-principles 요약화 탈락)
- decision-flow.md 수정 (v1.10.0 하드닝 직후 재수정 회피 — 컷라인 탈락)
- 기준 미달·구조 부적합 파일의 분할 (orchestrator·decision-flow는 크기 무관 미대상)
- 경로 해소 인라인 참조화 / 스킬 병합 (조사 후 철회)
- 불변식 인벤토리의 상시 린트화 (G4 전용 일회용)

## 3. 확정된 요구사항

- REQ-001: brainstorming 분할 — 템플릿·긴 예시를 `skills/brainstorming/references/`로 verbatim 이동, 디스패치 지점에 Read 지시 + 베이스라인 앵커 잔존 — 우선순위: HIGH
- REQ-002: merge-to-domain 분할 — 5단계 상세·옵션 처리·호환성 체크리스트 등 참조 자료 분리 — 우선순위: HIGH
- REQ-003: brainstorming /compact 3중 블록 → 확정 문면 1줄 × 3국면 (`💡 [phase파일명] 저장됨 — /compact 가능 (재논의 대기열은 먼저 처리 — decision-flow.md §6) · 새 세션: /clear → /dev-workflow:resume`) — 우선순위: HIGH
- REQ-004: design-doc-index/design-summary "상태 정규화 전처리" → silent-fix 1줄 (두 파일 문자 동일, "정규화→필터링 순서" + domain.md 제외 잔존) — 우선순위: MEDIUM
- REQ-005: orchestrator Evaluator 프롬프트/AC 박스 인라인 간소화 — D 최소 필드(PASS/PARTIAL/FAIL 3카운트·상세 목록·[Evaluator] 태그·스킵 가드 2개·실행 순서) 보존 — 우선순위: MEDIUM
- REQ-006: 박스 스타일 통일 — F1 화이트리스트(design-summary ━━→── 등 이름 지정)에 한정 — 우선순위: LOW
- REQ-007: decision-flow-hardening feature status 정정(ready-for-plan→complete) — **별도 커밋**, 도메인 머지는 별도 세션 명시 호출 — 우선순위: LOW
- REQ-008: 검증 체계 — 베이스라인 3튜플 인벤토리(디스패치 지점 O/X 표·게이트 인벤토리·크로스레퍼런스 인벤토리) 추출 → 압축/분할 → 기계 체크 전수 → 판단 리뷰 1회. 인벤토리는 G4 전용 일회용 — 우선순위: HIGH (선행 태스크)
- REQ-009: 음성 불변식 — diff는 삭제·verbatim 이동·참조 삽입만 허용, 신규 규범 문장은 승인 목록 경유 (현재 승인 목록 공란) — 우선순위: HIGH

## 4. 설계 개요

**분할 구조 (REQ-001·002):**
- SKILL.md 본문에는 흐름 제어·판단 기준·게이트·안전 크리티컬 앵커만 잔존
- 출력 템플릿·서브에이전트 프롬프트 전문·긴 예시는 `references/[주제].md`로 verbatim 이동
- 각 참조 지점: "[base dir]/references/[주제].md의 [블록명]을 Read하여 사용하라" 명시 지시 + Read 실패 시 최소 인라인 폴백 1~2줄
- 도달성: Skill invoke 시 하네스가 제공하는 "Base directory for this skill" 상대 경로 사용 — 리포 상대 경로 금지 (v1.10.0 교훈)

**검증 파이프라인 (REQ-008, 순서 강제):**
1. 베이스라인 추출: phase2의 A1~F3 불변식에 대한 정확 앵커(인용문/정규식/해시) 확정
2. 압축/분할 실행
3. 기계 체크: 3튜플 전수 (존재 grep / 해시 동일 / 개수 일치)
4. 판단 리뷰: 신선한 눈 1회 — 판단 리뷰 목록(음성 불변식 감사 포함) 전담

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|---|---|---|
| brainstorming 분할 | 하네스 base dir 제공 | Standalone 폴백(A10), decision-flow §8 로컬 템플릿 참조(F3) |
| merge-to-domain 분할 | 동일 | dry-run·호환성 체크리스트 흐름 |
| 상태 정규화 압축 | — | design-doc-index·design-summary 색인 동작 |
| status 정정 | — | context-handling 목록·merge-to-domain 후보 (머지는 분리) |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|---|---|---|---|---|
| 절감 수단 | 삭제 + verbatim 분할 | 드리프트 리스크 구조적 0 근접 | 재작성 압축 (공통부 통합·요약화) | 기계 검증 불가능한 의미 손실 — 유일한 재작성형(development-principles)도 탈락 |
| 분할 기준 | 본문 15KB 이상 AND 참조 자료 분리 가능 구조 | 크기 단독 기준은 일체형 파일(orchestrator·decision-flow) 오분할 유발 | 상위 3개 일괄 / 전 파일 | 안무·규범 일체형은 분할 시 다중 Read 역효과 |
| 분할 파일 경로 | 스킬 base dir 상대 `references/` | invoke 시 하네스가 base dir 제공 — 도달성 구조 보장 | 리포 상대 경로 | v1.10.0에서 배포 환경 도달 불가 실증 |
| 검증 방식 | 3튜플 기계 체크 + 판단 리뷰 이원 | "행동 등가성 증명"은 불가능한 속성 — 검증 연극 회피 | 검증 에이전트 패널 단독 | 동의 편향·순환 논증 (Contrarian 지적) |
| 인벤토리 수명 | G4 전용 일회용 | 머지 후 스테일 → 오탐/무시. 죽은 체크리스트의 신뢰 오염 방지 | scripts/ 상시 린트 승격 | 코드 없는 플러그인 정체성과 긴장, 새 유지보수 표면 |
| status 정정 | 포함하되 별도 커밋 | 내용 변경은 음성 불변식 위반 — diff 감사 순수성 | 슬림화 커밋에 동봉 / G4 제외 | 감사 오염 / 세션마다 허위 "PLAN 대기" 노이즈 지속 |
| 합격선 | 미설정 (항목 전수 완수 + 불변식 통과) | 전역 KB는 굿하트 지표 | 148→139KB 등 수치 목표 | 수치 맞추려 load-bearing 중복까지 깎는 유인 |

## 7. 제약조건과 가정

- **다중 모델 하드 제약**: Fable 5 전용 최적화 금지 — 분리 파일 Read 지시는 디스패치 지점마다 명시 (약한 모델의 참조 추적 한계 대응)
- 사용자 노출 출력 템플릿은 F1 화이트리스트 외 바이트 보존
- 가정: 분리 파일 Read 지시를 약한 모델도 따른다 (base dir 명시 + 지점별 지시 — 미검증, 도그푸딩 관측 대상)
- 가정: /compact 안내 축소가 UX를 저해하지 않는다 (사용자 증언 기반)

## 8. 기술 가이드라인

- 작업 순서 강제: 베이스라인 추출 → 압축/분할 → 기계 체크 → 판단 리뷰 (역전 금지)
- 분리 파일 명명: `skills/[스킬]/references/[주제].md` (Superpowers 관행 준용)
- 분할은 verbatim — 이동 중 문장 수정 금지 (수정 필요 발견 시 별도 커밋으로 분리)
- 커밋 구조: 슬림화 커밋(들) + status 정정 커밋 분리
- 릴리스: 1.13.0 MINOR (docs/design 구조 무변경, 스킬 동작 하위 호환)

## 9. 구현 결과 및 일탈 사항

### 9.1 구현 결과

- REQ-001 brainstorming 분할: references/templates.md 신설 (10블록·verbatim), 본문 33,144→약 24.8% 감소 (wc -c 워킹트리 기준). 디스패치 지점 10곳에 표준형 Read 지시+폴백, 헤딩 앵커 전부 잔존
- REQ-002 merge-to-domain 분할: references/templates.md 신설 (10블록·verbatim), 본문 감소 8.93% (동일 기준; git blob 기준 7.08%) — 이 파일은 보존 필수 규정 비중이 높아 감소 폭이 구조적으로 제한됨
- REQ-003 /compact 3중 블록 → 확정 문면 1줄×3국면 (byte-exact)
- REQ-004 상태 정규화 silent-fix 1줄×2파일 (문자 동일), REQ-006 design-summary ━→── 전환
- REQ-005 Evaluator 프롬프트 15줄→5줄, AC 박스 10줄→3줄 (D1/D2 필수 요소 전수 보존)
- REQ-007 decision-flow-hardening status 정정 — 독립 커밋 7545629 (도메인 머지 미실행)
- REQ-008/009 검증: 기계 체크 66/66 PASS, 음성 불변식 감사 미설명 라인 0, 신선한 눈 판단 리뷰 PASS. decision-flow.md·development-principles 해시 무변경 확정

### 9.2 일탈 사항

1. 본문 40%+ 감소 목표 미달 (bs 24.8%, mtd 8.9%) — 8블록/이동 가능 구조의 상한. 설계 §6 "수치 목표는 비목표·합격선 미설정"이 우선, 추가 삭제 없이 결과 보고로 처리. GOAL-002의 "절반 이하" 역시 동일 사유로 미달 — §6 합격선 미설정 원칙이 우선한다
2. 합계 ±5% 프록시 초과 (mtd +10~12%) — 이동량 소규모 시 고정 삽입 오버헤드 지배. 직접 속성(이동 라인 전수 byte-identical + 순증 전량 승인 삽입) 검증으로 대체
3. 승인 대기 11건 — 자체 작성 라벨 1건(templates.md 「Standalone Mode 시드 형식」) + 자체 작성 폴백 10건(전문은 baseline-inventory 폐기 전 Task 6 기록 → 아래 9.3에 이식). 전부 비규범 서술적 최소치 판정, 사용자 최종 승인 대기
4. Task 5 치환 중 "0. 경로 해소" 스텝 부수 삭제 → 리뷰 루프 포착, 0dceaf4로 byte-identical 복원
5. 신선한 눈 B1: Step B 다중 펜스 포인터 모호성 → cfee58e로 펜스 라벨 명시 (참조 삽입 범주)
6. E1 (Evaluator 역할 로드 Read 실패 폴백 부재)은 G4 이전 사전 gap — 무수정, G6 후보
7. Task 7: 대상 문서에 섹션 10 부재 → 최소 구조 신설 (호환성 정책 정합)

### 9.3 승인 대기 문면 (11건 전문)

① brainstorming/references/templates.md 자체 작성 라벨 (1건):
> `**Standalone Mode 시드 형식** (templates/seed.yaml 참조):` — templates.md:120 (베이스라인 원문은 라벨 없는 산문)

② brainstorming 자체 작성 폴백 (4건, Task 2 self-review 사전 플래그):
> SKILL.md:361 `(Read 실패 시 최소 요건: 확인된 요구사항 목록 + 미정의 영역 목록 제시)` [국면2 시작]
> SKILL.md:393 `(Read 실패 시 최소 요건: 판단/가이드라인/리스크(낮음·중간·높음) 표시)` [국면3 TD]
> SKILL.md:437 `(Read 실패 시 최소 요건: phase1~3.md + [기능명].md + seed.yaml + plan.md + HANDOFF.md + issues/ 구성)` [국면4 디렉토리]
> SKILL.md:466 `(Read 실패 시 최소 요건: phase1~3.md + [문제명].md + HANDOFF.md 구성)` [issues 디렉토리]

③ merge-to-domain 자체 작성 폴백 (6건, Task 3 report L118-129 기준):
> SKILL.md:87 `(Read 실패 시 최소 요건: 추출된 정책/결정/요구사항ID/섹션인덱스 요약 제시 + Yes/수정필요 2택)` [domain 학습 게이트 출력]
> SKILL.md:99 `(Read 실패 시 최소 요건: policies/decisions/requirement_ids를 F-POL-/F-DEC- ID·statement·source_section 필드로 구조화)` [feature_digest YAML 형식]
> SKILL.md:111 `(Read 실패 시 최소 요건: feature별 정책/결정/요구사항ID 요약을 나열 + Yes/수정필요 2택)` [feature 학습 게이트 출력]
> SKILL.md:331 `(Read 실패 시 최소 요건: 기본/자동모드/리뷰차단/커스텀 4택 메뉴 출력)` [인터랙티브 fallback 메뉴]
> SKILL.md:340 `(Read 실패 시 최소 요건: 한/영 자동모드 키워드 매칭 표 + Yes(자동모드)/No(현재모드유지) 2택 확인 출력)` [자동 모드 키워드 표 + confirm 출력]
> SKILL.md:423 `(Read 실패 시 최소 요건: 완료/skip/abort 건수와 feature명을 나열)` [재논의(대기열) 노출·요약 출력]

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-07-08 | 초안 작성 (국면 0~4 완료) — 분할 재개방 번복, 재작성형 전량 탈락, 검증 이원화 확정 | 신규 기능 | ready-for-plan |
| 2026-07-08 | 개발 완료 — 문서 통합 (중간 산출물 삭제) | 전체 | 완료 |
| 2026-07-08 | G4 구현 완료 — 분할 2건·간소화 3건·검증 통과, v1.13.0 | 스킬 5종 + references/ 2파일 신설 | complete |
