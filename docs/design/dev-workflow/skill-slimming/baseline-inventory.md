---
feature: skill-slimming
category: dev-workflow
type: baseline-inventory
created: 2026-07-08
---

# Baseline Invariant Inventory (G4 skill-slimming)

> PLAN Task 1 산출물. phase2_discovery.md "기계 체크 목록"(A1~F3)의 각 항목을 현재(슬림화 전) 파일에서 정확 인용문/정규식으로 확정한다. 이 문서 자체는 슬림화 대상이 아니며, 이후 태스크(특히 Task 6 전수 재검)가 이 문서의 값을 그대로 재실행하여 베이스라인으로 삼는다.
>
> 기준 시점: 아래 커밋 직전 워킹 트리 상태 (worktree `worktree-g4-skill-slimming`, 브랜치 동일).

---

## 크기 스냅샷

Step 1 커맨드 실행 결과 (바이트 수, `wc -c`):

| 파일 | 바이트 수 |
|---|---|
| skills/brainstorming/SKILL.md | 33748 |
| skills/merge-to-domain/SKILL.md | 27669 |
| skills/workflow-orchestrator/SKILL.md | 19074 |
| skills/design-doc-index/SKILL.md | 6758 |
| skills/design-summary/SKILL.md | 5888 |

실행 커맨드:
```
for f in skills/brainstorming/SKILL.md skills/merge-to-domain/SKILL.md skills/workflow-orchestrator/SKILL.md skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md; do echo "$f $(wc -c <$f)"; done
```

---

## 디스패치 지점 O/X 표 (A3)

**Step 2 실행 커맨드:** `grep -n "에이전트 역할 정의를 읽고" skills/brainstorming/SKILL.md skills/plan-stage/SKILL.md skills/workflow-orchestrator/SKILL.md`

**실제 출력:**
```
skills/brainstorming/SKILL.md:80:- 서브에이전트는 Ouroboros 에이전트 역할 정의를 읽고, 페르소나 도메인 컨텍스트를 주입받아 응답을 생성한다
skills/brainstorming/SKILL.md:170:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
skills/brainstorming/SKILL.md:225:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
skills/brainstorming/SKILL.md:360:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
skills/brainstorming/SKILL.md:470:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
skills/plan-stage/SKILL.md:99:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
skills/plan-stage/SKILL.md:166:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
skills/workflow-orchestrator/SKILL.md:145:아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.
```

brainstorming 파일 내 4곳(line 170/225/360/470)이 phase2가 열거한 brainstorming의 4개 프롬프트 지점(A-0 Ontologist / Step A Socratic / Step B Seed-Architect / Simplifier)이다. line 80은 프롬프트 본문이 아니라 서술문(피드백 루프 섹션 요약)이므로 별도 지점으로 세지 않는다.

brainstorming 내 서브에이전트 디스패치는 위 4곳(프롬프트 헤더 존재) + 프롬프트 헤더가 없는 3곳(미답변 조사·피드백루프 비판·Step C Hacker) + 국면 4 Seed-Architect(별도 프롬프트 헤더 없음, 인라인 지시)로 최대 9곳까지 phase2가 열거했다. 아래 표는 실제 파일에서 확인 가능한 지점만 앵커와 함께 O/X를 기록한다.

| # | 지점 | 위치(파일:라인) | ①역할 정의 로드 | ②페르소나 도메인 | ③출력 제약(결정 요청 금지) |
|---|---|---|---|---|---|
| 1 | A-0 Ontologist | brainstorming/SKILL.md:170 | O (`[Ouroboros agents/ontologist.md 전문]`) | X (본질 질문 전용, 도메인 페르소나 아님) | X |
| 2 | Step A Socratic | brainstorming/SKILL.md:225 | O (`[Ouroboros agents/socratic-interviewer.md 전문]`) | O (`너의 도메인: [페르소나명 + 도메인 설명]`) | X |
| 3 | Step B Seed-Architect | brainstorming/SKILL.md:360 | O (`[Ouroboros agents/seed-architect.md 전문]`) | X (시드 구조화 전용) | X |
| 4 | 피드백루프 비판 슬롯 | brainstorming/SKILL.md:82~86 (서술문, 프롬프트 헤더 없음) | O (`Ouroboros 에이전트 역할 정의 전문 (agents/*.md)`) | O (`페르소나 도메인 설명`) | **O** (`출력 제약: 사용자를 향한 결정 요청 문구를 포함하지 않는다 — 의견·비판·대안만 반환한다`) |
| 5 | 미답변 조사 서브에이전트 | brainstorming/SKILL.md:310~324 (프롬프트 헤더 없음, "아래 질문들에 대해...조사하라"로 시작) | X (역할 정의 로드 문구 없음) | X | X |
| 6 | Step C Contrarian(비판) | brainstorming/SKILL.md:434 (본문 참조, 프롬프트 블록 없음) | 참조("에이전트 매칭 규칙 참조") — 규칙 1 표에 Contrarian 정의 있음 | O (규칙 1 표: 비판 슬롯만 서브에이전트) | X (본문에 출력 제약 명시 없음) |
| 7 | Step C Hacker(교착) | brainstorming/SKILL.md:435 | X (Ad-hoc 서술만, 프롬프트 헤더 없음) | X | X |
| 8 | Simplifier 스코프 정리 | brainstorming/SKILL.md:470 | O (`[Ouroboros agents/simplifier.md 전문]`) | X (스코프 정리 전용) | X |
| 9 | 국면 4 Seed-Architect | brainstorming/SKILL.md:614~617 (프롬프트 헤더 없음, "입력/출력" 서술) | X (프롬프트 전문 인용 없음, "Seed-Architect 서브에이전트로 최종 시드 YAML을 생성한다"만) | X | X |

**③(결정 요청 금지) 확인 결과:** 9개 지점 중 ③이 **O인 지점은 지점 4(피드백루프 비판 슬롯) 1곳뿐**임을 확인. phase2 A3 "③ 결정 요청 금지 앵커는 베이스라인에 있던 지점(피드백루프 비판 슬롯)만 잔존 요구 — 신설은 승인 목록 경유" 조건과 일치.

개수 판정 기준선: **O 표시 총 개수 = ①7 + ②3 + ③1 = 11개**. 슬림화 후 이 11개 O가 전수 잔존해야 한다(①③은 정확 문자열 grep, ②는 표 구조 grep으로 재확인).

---

## 게이트 인벤토리 (F2)

**Step 3 실행 커맨드:** `grep -n "^1\. \|^  1\. \|1\. Yes" skills/brainstorming/SKILL.md skills/merge-to-domain/SKILL.md skills/workflow-orchestrator/SKILL.md skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md | head -60`

**실제 출력 (전문):**
```
skills/brainstorming/SKILL.md:32:1. 사용자의 요구사항을 분석하여 적합한 카테고리를 추천한다
skills/brainstorming/SKILL.md:49:  1. [카테고리A] — [소속 기능 수]개 기능
skills/brainstorming/SKILL.md:83:  1. Ouroboros 에이전트 역할 정의 전문 (agents/*.md)
skills/brainstorming/SKILL.md:180:1. 본질 (Essence): 이것은 진짜 무엇인가?
skills/brainstorming/SKILL.md:190:1. [Essence] 질문 내용
skills/brainstorming/SKILL.md:243:1. 모든 서브에이전트의 질문을 수집한다
skills/brainstorming/SKILL.md:252:1. [주제] 질문 내용
skills/brainstorming/SKILL.md:296:1. 전부 조사
skills/brainstorming/SKILL.md:404:  1. Yes
skills/brainstorming/SKILL.md:480:1. 핵심 요구사항과 부수 요구사항을 분류하라
skills/brainstorming/SKILL.md:498:1. 제안 수용 (선택적 항목 v2로 미룸)
skills/brainstorming/SKILL.md:710:1. 부모 기능 디렉토리 확인: `docs/design/[카테고리]/[기능명]/`
skills/merge-to-domain/SKILL.md:30:1. **Pre-flight (git-mode)**: `git status`로 [해소된 경로] 하위 미커밋 변경을 확인한다 → 존재 시 경고하고 커밋/스태시를 유도한다. 사용자가 정리를 확인하기 전에는 (4) 적용 단계에 진입하지 않는다
skills/merge-to-domain/SKILL.md:110:1. Yes
skills/merge-to-domain/SKILL.md:161:1. Yes
skills/merge-to-domain/SKILL.md:235:1. 의미 충돌: domain의 "MMR 기준" vs feature의 "latency 기준"
skills/merge-to-domain/SKILL.md:242:1. Yes
skills/merge-to-domain/SKILL.md:251:1. **no-git-mode 체크포인트**: domain.md 수정 직전에 같은 디렉토리에 `[도메인 문서명].premerge-YYYYMMDD.bak`을 생성한다 (git-mode는 git이 복원 수단이므로 생략). 세션 정상 종료 시 체크포인트 파일을 정리한다
skills/merge-to-domain/SKILL.md:278:1. 머지 결과(domain.md 수정 + 섹션 10)를 즉시 커밋한다 — 메시지 규약: `docs(merge): {category} ← {feature}` (dry-run 승인이 이 커밋에 대한 동의다)
skills/merge-to-domain/SKILL.md:284:1. in-session resolution 4지 선택지 노출 (REQ-010)
skills/merge-to-domain/SKILL.md:316:1. 순차 (안전, 약간 느림)
skills/merge-to-domain/SKILL.md:394:1. **알려진 플래그 (`--auto`, `--no-review`, `--review-merge=N`) 매칭** → 해당 모드 활성
skills/merge-to-domain/SKILL.md:407:1. 기본 (Architect 자동 발동, 자동 수정 확인 요구)
skills/merge-to-domain/SKILL.md:433:1. Yes — 자동 모드 (이번 세션만)
skills/merge-to-domain/SKILL.md:476:1. 🔧 Tech Lead 추가 투입 (재시도)
skills/merge-to-domain/SKILL.md:513:- no-git-mode: 삭제 직전 확인 1회를 요구한다 — "[기능명] 디렉토리를 삭제합니다. git 히스토리가 없어 복구할 수 없습니다. 진행할까요? 1. Yes 2. No (보존)"
skills/workflow-orchestrator/SKILL.md:23:1. **작업 상태 확인**
skills/workflow-orchestrator/SKILL.md:87:  1. **단계 진입 즉시**: invoke `dev-workflow:rules-injection` with:
skills/workflow-orchestrator/SKILL.md:122:1. **REVIEW 진입 즉시 (사전 첨부):**
skills/workflow-orchestrator/SKILL.md:183:1. 브레인스토밍
skills/workflow-orchestrator/SKILL.md:267:1. 플러그인 루트를 아는 경우 (세션 시작 컨텍스트에 주입된 "플러그인 루트" 값 사용): `[플러그인 루트]/skills/workflow-orchestrator/decision-flow.md`
skills/workflow-orchestrator/SKILL.md:282:1. 선택지A
skills/workflow-orchestrator/SKILL.md:293:1. Yes
skills/design-doc-index/SKILL.md:20:1. `[해소된 경로]/[카테고리]/[기능명]/[기능명].md` 패턴의 모든 파일을 탐색한다
skills/design-doc-index/SKILL.md:37:1. **domain.md** (1순위) — category 디렉토리 직속 .md 파일
skills/design-doc-index/SKILL.md:69:1. `[해소된 경로]` 하위의 모든 설계 문서를 glob 탐색한다 (domain.md + feature 문서)
skills/design-doc-index/SKILL.md:79:  1. [카테고리]/[domain명] — "[한 줄 요약]"
skills/design-doc-index/SKILL.md:144:  1. [카테고리]/[기능명] — "[한 줄 요약]"
skills/design-summary/SKILL.md:34:1. `[해소된 경로]/[카테고리]/[기능명]/[기능명].md` 패턴의 모든 파일을 탐색한다
skills/design-summary/SKILL.md:49:1. `[해소된 경로]/` 하위의 설계 문서를 glob 탐색한다
skills/design-summary/SKILL.md:69:  1. [카테고리]/[기능명] — "[한 줄 요약]"
skills/design-summary/SKILL.md:94:1. 한 줄 요약
```

출력 60줄 중 `^1\. ` 패턴이 절차 단계 열거(비-게이트, 예: "1. 사용자의 요구사항을 분석하여")와 실제 번호 선택 게이트를 모두 포함한다. 아래는 **실제 사용자 응답용 번호 선택 게이트**만 선별하여 {게이트명, 선택지 수, 0번 유무}로 정리한 것 (전체 파일을 열어 각 게이트의 선택지 끝까지 확인):

| 게이트명 | 파일:라인(시작) | 선택지 수 | 0번 유무 |
|---|---|---|---|
| 국면 0 카테고리 선택 (모호 시) | brainstorming/SKILL.md:49 | 3 (카테고리A/B/✨새 카테고리) | X |
| 미답변 질문 조사 여부 | brainstorming/SKILL.md:296 | 3 (전부조사/선택조사/스킵) | X |
| Step B 시드 확인 | brainstorming/SKILL.md:404 | 2 (Yes/수정 필요) | X |
| Simplifier 스코프 정리 수용 | brainstorming/SKILL.md:498 | 3 (수용/일부만/유지) | X |
| workflow-orchestrator Ambiguous 단계 선택 | workflow-orchestrator/SKILL.md:183 | 4 + 0번 (브레인스토밍/계획/개발/리뷰 + 0.해당없음) | **O** |
| Input Format Rules 예시(닫힌 선택) | workflow-orchestrator/SKILL.md:282 | 예시 3(A/B/C) + 0번 예시 | O (예시 템플릿, 실제 게이트 아님) |
| Input Format Rules 예시(Yes/No) | workflow-orchestrator/SKILL.md:293 | 예시 2(Yes/No) | X |
| merge-to-domain domain digest 검토 | merge-to-domain/SKILL.md:110 | 2 (Yes/수정 필요) | X |
| merge-to-domain feature 학습 검토(다중) | merge-to-domain/SKILL.md:161 | 2 (Yes/수정 필요) | X |
| merge-to-domain 머지 계획 승인 | merge-to-domain/SKILL.md:242 | 2 (Yes/No(abort)) | X |
| merge-to-domain 실행 모드 선택 | merge-to-domain/SKILL.md:316 | 3 (순차/병렬/자동위임) | X |
| merge-to-domain ARGUMENTS 옵션 선택 | merge-to-domain/SKILL.md:407 | 4 (기본/자동모드/리뷰차단/커스텀) | X |
| merge-to-domain 자동 모드 전환 확인 | merge-to-domain/SKILL.md:433 | 2 (Yes 자동모드/No 현재모드유지) | X |
| merge-to-domain in-session resolution | merge-to-domain/SKILL.md:476 | 4 (TD투입/직접수정/skip/abort) | X |
| merge-to-domain no-git-mode 삭제 확인 | merge-to-domain/SKILL.md:513 (인라인) | 2 (1.Yes 2.No(보존)) | X |

**개수 판정 기준선:** 위 표에서 "예시 템플릿"으로 표시한 2건(workflow-orchestrator:282, :293 — Input Format Rules 섹션의 형식 정의 예시)을 제외하면, **실제 번호 선택 게이트는 13개**이며 그중 0번을 사용하는 게이트는 **1개**(workflow-orchestrator Ambiguous 단계 선택)뿐이다. 슬림화 후 이 13개 게이트가 선택지 수·0번 유무 동일하게 재현되어야 한다.

---

## 크로스레퍼런스 인벤토리 (F3)

**Step 4 실행 커맨드:** `grep -n "참조\|§[0-9]\|references" skills/*/SKILL.md skills/workflow-orchestrator/decision-flow.md | grep -v "^Binary" | head -80`

**실제 출력 (전문, 80줄 이내로 전량 캡처됨):**
```
skills/brainstorming/SKILL.md:35:     (상세: development-principles "경로 해소 규칙" 참조)
skills/brainstorming/SKILL.md:143:국면 1~3 진행 중 사용자가 기존에 구현 완료된 설계 문서를 참조하려 할 때,
skills/brainstorming/SKILL.md:149:설계 문서 참조는 브레인스토밍 흐름을 중단하지 않는다 — 로드 완료 후 현재 국면을 이어간다.
skills/brainstorming/SKILL.md:376:아래 시드 형식으로 대화 내용을 구조화한다 (templates/seed.yaml 참조):
skills/brainstorming/SKILL.md:434:- 비판 담당 페르소나는 Contrarian 서브에이전트로 실행한다 (에이전트 매칭 규칙 참조)
skills/brainstorming/SKILL.md:438:- 비판 담당에게 DO/DON'T 제약을 적용한다 (비판적 관점 할당 참조)
skills/brainstorming/SKILL.md:510:- ⚠️ 재논의 대기열이 비어있지 않으면 먼저 일괄 처리하거나 HANDOFF에 저장 후 압축하세요 — 대기열 내용은 대화 컨텍스트에만 존재하므로 압축 시 유실될 수 있습니다 (decision-flow.md §6)
skills/brainstorming/SKILL.md:520:- 도메인 페르소나들이 피드백 루프를 통해 요구사항을 구체화한다 (페르소나 피드백 루프 규칙 참조)
skills/brainstorming/SKILL.md:556:- ⚠️ 재논의 대기열이 비어있지 않으면 먼저 일괄 처리하거나 HANDOFF에 저장 후 압축하세요 (decision-flow.md §6)
skills/brainstorming/SKILL.md:600:- ⚠️ 재논의 대기열이 비어있지 않으면 먼저 일괄 처리하거나 HANDOFF에 저장 후 압축하세요 (decision-flow.md §6)
skills/brainstorming/SKILL.md:617:  - 이 시드는 Ouroboros `ooo run` 또는 PLAN 단계의 참조 자료로 활용할 수 있다
skills/brainstorming/SKILL.md:731:통합은 "원래 하나였던 것처럼" 자연스럽게 병합한다 (참조 링크 아님).
skills/context-handling/SKILL.md:19:| args | 동작 | 참조 섹션 |
skills/context-handling/SKILL.md:81:<!-- decision-flow.md §6에 따른 조건부 섹션 — 결정 흐름이 활성이 아니었으면 이 섹션 전체를 생략한다 -->
skills/context-handling/SKILL.md:129:   - 상세 규칙: development-principles "경로 해소 규칙" 섹션 참조
skills/context-handling/SKILL.md:234:3. HANDOFF에 "결정 흐름 상태" 섹션이 있으면: 한 줄 헤더(N/M/K)·미확정 잔여 순서·재논의 대기열을 원장 값으로 복원하고 `[>] 진행 중` 항목부터 결정 흐름을 재개한다. 대기열 내용을 기억으로 재구성하지 않는다 (decision-flow.md §6)
skills/context-handling/SKILL.md:266:- 결정 흐름이 활성이면 "결정 흐름 상태" 섹션 갱신 (재논의 대기열은 항목 전문 기록 — decision-flow.md §6)
skills/design-doc-index/SKILL.md:8:브레인스토밍/플랜 중 기존에 구현 완료된 설계 문서를 자연어로 참조하여 컨텍스트에 로드한다.
skills/design-doc-index/SKILL.md:19:   (상세: development-principles "경로 해소 규칙" 참조)
skills/design-doc-index/SKILL.md:33:구현 완료된 설계 문서를 대상으로 하며, domain.md를 우선 참조한다.
skills/design-doc-index/SKILL.md:96:사용자가 목록을 본 후 특정 문서를 참조하려 하면 전체 로드 모드로 전환한다:
skills/design-summary/SKILL.md:33:   (상세: development-principles "경로 해소 규칙" 참조)
skills/development-principles/SKILL.md:116:- **규칙 작성:** `docs/templates/rule-template.md` 참조
skills/development-principles/SKILL.md:117:- **CLAUDE.md 분리 가이드:** `docs/guides/migrate-claude-md.md` 참조
skills/development-principles/SKILL.md:120:자세한 메커니즘은 `skills/rules-injection/SKILL.md` 참조. 규칙 파일이 없는 프로젝트는 변경 없이 동일하게 동작한다 (후방 호환).
skills/document-consolidation/SKILL.md:36:   (상세: development-principles "경로 해소 규칙" 참조)
skills/document-consolidation/SKILL.md:131:   (상세: development-principles "경로 해소 규칙" 참조)
skills/document-consolidation/SKILL.md:138:   통합 원칙: **"원래 하나였던 것처럼"** — 참조 링크가 아닌 직접 병합
skills/document-consolidation/SKILL.md:185:0. **경로 해소:** Mode 1에서 이어지는 경우 이미 해소된 경로를 사용한다. 독립 실행 시 `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인 (상세: development-principles "경로 해소 규칙" 참조)
skills/document-consolidation/SKILL.md:210:   - 병합 원칙: "원래 하나였던 것처럼" — 참조 링크가 아닌 직접 병합
skills/document-consolidation/SKILL.md:246:   → 대상 domain.md에 즉시 반영한다 (코드베이스를 참조하며 정확성 확보)
skills/document-consolidation/SKILL.md:262:   - 반영 방식: pending 키워드를 기반으로 코드베이스를 참조하며 domain.md 업데이트
skills/document-consolidation/SKILL.md:305:- pending 파일은 merge 키워드만 기록하고, 상세 내용은 코드베이스 참조로 보완한다
skills/merge-to-domain/SKILL.md:29:0. **경로 해소**: `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인 (상세: development-principles "경로 해소 규칙" 참조). 이후 모든 `docs/design/` 참조는 [해소된 경로]를 사용한다
skills/merge-to-domain/SKILL.md:31:2. ARGUMENTS 해석 (자세한 옵션 처리는 아래 "옵션 처리" 섹션 참조)
skills/merge-to-domain/SKILL.md:89:- 호환성 첫 머지 체크리스트(아래 "호환성 첫 머지 체크리스트" 섹션 참조)에 따라 후속 처리
skills/merge-to-domain/SKILL.md:179:| ID 중복 (REQ-001 등) | 자동 renumbering | 참조 갱신 포함, dry-run에 회계 형식 노출 |
skills/merge-to-domain/SKILL.md:231:  참조 갱신: feature.md 섹션 4 (2건), 섹션 6 (1건)
skills/merge-to-domain/SKILL.md:305:    mode = "parallel"    # 카테고리 단위 2-pass 병렬 (REQ-016 참조)
skills/merge-to-domain/SKILL.md:515:skip된 feature는 디렉토리 보존 (위 In-session Resolution 참조).
skills/plan-stage/SKILL.md:27:(상세: development-principles "경로 해소 규칙" 참조):
skills/plan-stage/SKILL.md:81:PLAN 진행 중 사용자가 기존에 구현 완료된 설계 문서를 참조하려 할 때,
skills/workflow-orchestrator/SKILL.md:57:  - 에이전트 파일 경로는 Path A/B 판정 시 기록하여 brainstorming 스킬에서 참조한다
skills/workflow-orchestrator/SKILL.md:76:  (상세: development-principles "경로 해소 규칙" 참조)
skills/workflow-orchestrator/decision-flow.md:4:> 적용 스킬: workflow-orchestrator, brainstorming, plan-stage, document-consolidation(§8 적용 예외 조항의 규율을 받음), merge-to-domain(결정 박스만 적용 — dry-run 목록이 브리핑 대체 로컬 템플릿, 헤더·대기열은 적용 예외) — 본 파일을 참조로 명시한 스킬.
skills/workflow-orchestrator/decision-flow.md:17:**응답 주권 — 사용자 응답이 형식을 이긴다:** 사용자가 일괄 응답·순서 무시·위임·즉시 번복 등 어떤 형태로 답하든 그 의도를 수용한다. 이미 답한 항목을 재질문하지 않는다. 구체 처리는 §4. 열거되지 않은 응답 형태도 이 원칙에 따라 사용자 의도를 수용하는 방향으로 처리한다.
skills/workflow-orchestrator/decision-flow.md:19:**충돌 처리:** 모델/페르소나가 자체 감지한 충돌은 재논의 대기열(§5)에 추가하고 현재 결정을 마무리한다. 사용자가 명시적으로 번복/재논의를 요청하면 대기열을 거치지 않고 현재 결정을 일시 중단 후 즉시 처리하며, 처리 후 "진행 중이던 [결정명]으로 돌아갑니다"로 복귀한다.
skills/workflow-orchestrator/decision-flow.md:86:- **일괄 응답** ("1번 A, 2번 B, 3번 스킵"): 명확한 답은 전부 잠정 확정하고 헤더 N/M에 즉시 반영한다. 이미 답한 항목을 재질문하지 않는다. 브리핑에 일괄 응답한 경우 '한꺼번에' 모드로 전환하며(§3), 남은 항목을 일괄 목록으로 제시한다
skills/workflow-orchestrator/decision-flow.md:89:- **위임 발화**: '알아서' 모드로 전환한다 (§3)
skills/workflow-orchestrator/decision-flow.md:90:- **무관한 새 주제**: 헤더 없이 응답하고(카운터·대기열 불변) 말미에 "진행 중이던 [결정명]으로 돌아갑니다"를 붙인다. 결정 재제시는 같은 응답에서 하지 않고, 다음 응답에서 §2 표시 시점 (c)에 따라 헤더와 함께 재제시한다. 새 발화에서 신규 결정이 파생되면 M에 합산하지 않고 "지금 다룰까요, 현재 결정 흐름 후에 다룰까요?"를 먼저 묻는다 (이 질문을 담은 응답에는 복귀 고지를 붙이지 않는다) — "지금"이면 현재 결정을 일시 중단하고 즉시 처리한 뒤 복귀하며(§1 충돌 처리의 사용자 명시 요청과 동일 경로), "후에"면 브리핑 목록 말미에 추가하고 M에 합산한다 (말미 고정 — 이후 배치 재조정은 '진행 중 목록 변경' 규칙을 따른다)
skills/workflow-orchestrator/decision-flow.md:101:- **항목 이름**: 결정 박스 없이 통과된 페르소나 합의 사항도 대기열·phase 파일 기록 시 식별 가능한 이름을 부여한다 (번복 시 참조용)
skills/workflow-orchestrator/decision-flow.md:102:- **자연 해소**: 후속 결정으로 충돌의 전제가 소멸하면 항목을 제거하고, 추가 고지와 동일한 패턴으로 본문에 1회 고지한다: "🔄 대기열 해소: [항목명] — [사유 한 줄]" (헤더는 §2 단일 형식을 유지하며 K만 감소)
skills/workflow-orchestrator/decision-flow.md:145:- "이 두 가지에 대해" 같은 대명사 참조를 사용하지 않는다 — 각 결정 항목은 명시적 이름으로 가리킨다
skills/workflow-orchestrator/decision-flow.md:155:- 결정이 2개 이상이면 사전 브리핑(F) + 의존성 루트부터 하나씩 요청한다 (사용자가 모드를 바꾸면 §3 진행 모드를 따른다)
skills/workflow-orchestrator/decision-flow.md:156:- 미결 결정 8개 이상이면 브리핑 푸터에 모드 권장 문구를 추가한다 (§2)
skills/workflow-orchestrator/decision-flow.md:162:- 결정 흐름이 활성이지 않은 순수 정보 제공/조사 출력에는 적용하지 않는다. 결정 흐름 활성 중의 조사·토론 응답에는 §2 표시 시점 규칙을 따른다
skills/workflow-orchestrator/decision-flow.md:173:> §8 적용 예외에 해당하는 스킬(예: document-consolidation)은 결정 흐름이 활성화되지 않으므로 본 표의 대상이 아니다.
```

### 파일 간 참조 목록 (요약)

| 참조 출발 파일 | 참조 대상 | 참조 문구 |
|---|---|---|
| brainstorming, design-doc-index, design-summary, document-consolidation(×3), merge-to-domain, plan-stage, workflow-orchestrator | development-principles "경로 해소 규칙" | `(상세: development-principles "경로 해소 규칙" 참조)` |
| brainstorming(×3), context-handling(×3) | decision-flow.md §6 | `(decision-flow.md §6)` |
| development-principles | rules-injection/SKILL.md | `자세한 메커니즘은 \`skills/rules-injection/SKILL.md\` 참조` |
| decision-flow.md 헤더 | workflow-orchestrator, brainstorming, plan-stage, document-consolidation, merge-to-domain | `> 적용 스킬: ...` |

### F3 필수 등재: decision-flow §8 ↔ brainstorming 템플릿명 3쌍

`workflow-orchestrator/decision-flow.md:158`의 정확 인용문:
> **로컬 템플릿 우선:** 스킬 본문에 구체 출력 템플릿이 있는 결정 지점(예: brainstorming 시드 확인·Simplifier 스코프 정리·국면 0 카테고리 선택, plan-stage 재협의 선택지, document-consolidation 단계 확인)은 해당 템플릿을 문서 그대로 출력한다 — 임의로 D 박스로 재조립하지 않는다. D 박스는 템플릿이 지정되지 않은 결정 요청에 적용한다.

이 문장이 이름으로 지목하는 brainstorming 소속 3개 지점과 실제 앵커:

| §8 명명 | brainstorming 실제 위치 | 앵커 |
|---|---|---|
| 시드 확인 | brainstorming/SKILL.md:393~407 | `── 시드 추출 결과 ────────────────────────────` ~ `1. Yes` / `2. 수정이 필요하다` |
| Simplifier 스코프 정리 | brainstorming/SKILL.md:485~501 | `✂️ 스코프 정리 제안 [Simplifier]:` ~ `1. 제안 수용 (선택적 항목 v2로 미룸)` |
| 국면 0 카테고리 선택 | brainstorming/SKILL.md:46~54 | `📂 기존 카테고리 목록:` ~ `어떤 카테고리에 속할까요?` |

**F3 기계 절차 결론:** 위 §8 참조 문구(라인 158) 자체와, 인용된 3개 이름 각각에 대응하는 brainstorming 본문 템플릿이 모두 현재 잔존을 확인함. 슬림화 후 이 3쌍의 이름-앵커 링크가 끊기지 않아야 한다 (§8 문구가 이름을 바꾸거나, brainstorming 쪽 템플릿이 삭제/개명되면 참조 무결성 위반).

---

## 3튜플 앵커 표 (A/D/E/F — phase2 A1~E3 대응, 정확 인용문 확정)

판정 방식 범례: `[존재grep]` = 해당 문자열이 파일에 존재하는지 grep, `[개수일치]` = 특정 패턴의 출현 횟수가 베이스라인과 동일한지, `[정규화해시]` = 지정 구간을 정규화(LF 등) 후 해시 비교.

### A. brainstorming

| ID | 파일 | 앵커(정확 인용문/정규식) | 판정 방식 |
|---|---|---|---|
| A1 | brainstorming/SKILL.md | `최대 3회 루프 제한. 초과 시 사용자에게 "추가 토론이 필요할까요?" 승인을 받는다` | [존재grep] |
| A1 | brainstorming/SKILL.md | `\[라운드 N/3\]` (정규식) — 실사용처: SKILL.md:120 `라운드 카운터를 포함한다: \`[라운드 N/3]\`` | [존재grep] |
| A2 | brainstorming/SKILL.md | `비판적 역할은 라운드마다 다른 페르소나가 맡는다 (라운드 로빈)` | [존재grep] |
| A2 | brainstorming/SKILL.md | `` `[비판: 🏛️ 페르소나명]` `` | [존재grep] |
| A3 | brainstorming/SKILL.md | 위 "디스패치 지점 O/X 표" 11개 O 셀 전체 (①7 + ②3 + ③1) | [개수일치 + grep] |
| A3 | brainstorming/SKILL.md:86 | `출력 제약: 사용자를 향한 결정 요청 문구를 포함하지 않는다 — 의견·비판·대안만 반환한다` | [존재grep] |
| A4 | brainstorming/SKILL.md:215 | `해결책, 구현 방법, 기술 선택을 제안하지 않는다` | [존재grep] |
| A4 | brainstorming/SKILL.md:216 | `최소 3회 Q&A 후에만 Step B 전환 가능` | [존재grep] |
| A4 | brainstorming/SKILL.md:113 | `Step A는 예외: 해결책 제안 차단을 위해 전원 서브에이전트` | [존재grep] |
| A5 | brainstorming/SKILL.md:353 | `시드 추출 후 반드시 사용자 확인을 받는다. 확인 없이 Step C로 넘어가지 않는다.` | [존재grep] |
| A5 | brainstorming/SKILL.md:411 | `**명확도 체크리스트 (시드 확인과 함께 표시):**` | [존재grep] |
| A6 | brainstorming/SKILL.md:108 | `Step C (확장 토론) \| Contrarian \| 비판 슬롯만 서브에이전트` (표 행) | [존재grep] |
| A6 | brainstorming/SKILL.md:435 | `대화가 교착 상태일 때 → Hacker 서브에이전트를 추가 투입하여 비정통적 대안 탐색` | [존재grep] |
| A7 | brainstorming/SKILL.md:447 | `` `docs/design/[카테고리]/[기능명]/phase1_exploration.md` 생성 — 이후 절대 수정하지 않는다.`` | [존재grep] |
| A7 | brainstorming/SKILL.md:546 | `` `docs/design/[카테고리]/[기능명]/phase2_discovery.md` 생성 — 이후 절대 수정하지 않는다.`` | [존재grep] |
| A7 | brainstorming/SKILL.md:589 | `` `docs/design/[카테고리]/[기능명]/phase3_validation.md` 생성 — 이후 절대 수정하지 않는다.`` | [존재grep] |
| A7 | brainstorming/SKILL.md:449~455, 548~551, 591~595 | 각 phase 파일 "포함 내용" 불릿 목록 3세트 (내용 상이, 구조 동일) | [개수일치] (3개 "포함 내용:" 헤딩) |
| A8 | brainstorming/SKILL.md:507 | `💡 **컨텍스트 관리:** \`phase1_exploration.md\`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.` | [존재grep] |
| A8 | brainstorming/SKILL.md:553 | `💡 **컨텍스트 관리:** \`phase2_discovery.md\`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.` | [존재grep] |
| A8 | brainstorming/SKILL.md:597 | `💡 **컨텍스트 관리:** \`phase3_validation.md\`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.` | [존재grep] |
| A8-부기 | — | ⚠️ phase2_discovery.md의 A8 서술("확정 문면: `💡 [phase파일명] 저장됨 — /compact 가능 (재논의 대기열은 먼저 처리...) · 새 세션: /clear → /dev-workflow:resume`")은 **paraphrase이며 파일 실제 문자열과 다르다.** 실제 문자열은 위 3개 인용문 + 아래 A8-보조 3항목의 조합이다. 3튜플 앵커는 실제 파일 문자열을 기준으로 확정함(과제 지시: "정확 인용문을 추출" 원칙 준수). | — |
| A8-보조 | brainstorming/SKILL.md:508,554,598 | `**계속 진행:** \`/compact\` — 대화 히스토리를 압축하고 현재 세션·페르소나·워크플로우 상태를 유지합니다 (권장: 컨텍스트 60~70%에서 선제적으로)` (3회 동일) | [개수일치=3] |
| A8-보조 | brainstorming/SKILL.md:509,555,599 | `**새 세션 시작:** \`/clear\` → \`/dev-workflow:resume\`` (3회 동일) | [개수일치=3] |
| A8-보조 | brainstorming/SKILL.md:510,556,600 | `재논의 대기열이 비어있지 않으면 먼저 일괄 처리하거나 HANDOFF에 저장 후 압축하세요 ... (decision-flow.md §6)` — line 510만 부연구("대기열 내용은... 유실될 수 있습니다") 포함, 556/600은 축약형 (3곳 모두 `(decision-flow.md §6)`로 종결) | [개수일치=3 + 존재grep] |
| A9 | brainstorming/SKILL.md:204~208 | `**미답변 질문 조사 (A-0 전용):**` 블록 전체, 특히 `단, 조사 완료 후 Step B가 아닌 Step A로 진행한다.` | [존재grep] |
| A9 | brainstorming/SKILL.md | `**처리 순서 (2-pass):**` (line 282) + `**Pass 1 — 직접 답변 반영:**`(284) + `**Pass 2 — 미답변 확인 + 조사:**`(290) | [존재grep] |
| A10 | brainstorming/SKILL.md:202 | `Standalone Mode에서는 Step A-0를 생략하고 Step A의 ESSENCE 질문 패턴으로 대체한다` | [존재grep] |
| A10 | brainstorming/SKILL.md:264~271 | `**Standalone Mode:**\n아래 4가지 소크라테스 질문 패턴을 적용하여 페르소나가 질문한다:` (WHY-CHAIN/COUNTERFACTUAL/BOUNDARY/ESSENCE 4패턴) + `질문 생성 후, Enhanced Mode와 동일한 **통합 정제** 규칙을 적용한다` | [존재grep] |
| A10 | brainstorming/SKILL.md:375~391 | `**Standalone Mode:**\n아래 시드 형식으로 대화 내용을 구조화한다 (templates/seed.yaml 참조):` + YAML 블록(goal/constraints/non_goals/success_criteria/assumptions/open_questions/context 7키) | [존재grep] |
| A10 | brainstorming/SKILL.md:618 | `Standalone Mode에서는 Step B에서 생성한 시드를 설계 문서에 인라인으로 포함하고, 별도 파일은 생성하지 않는다` | [존재grep] |
| A11 | brainstorming/SKILL.md:217 | `- TD는 발언하지 않는다` (Step A 규칙) | [개수일치] |
| A11 | brainstorming/SKILL.md:427 | `- TD는 발언하지 않는다` (Step C 규칙) | [개수일치] |
| A11-주의 | brainstorming/SKILL.md:521 | `- TD는 여전히 침묵한다` (국면 2 규칙) — ⚠️ phase2가 "3회"로 기술한 세 번째 사례는 리터럴 동일 문자열이 아니라 **의미 변형 표현**이다. 정확 문자열 `TD는 발언하지 않는다`는 grep 시 **2회만** 매치된다. 3회를 요구하려면 정규식을 `TD는 (발언하지 않는다\|여전히 침묵한다)`로 완화해야 한다. | [개수일치=2 (리터럴) 또는 =3 (완화 정규식, 실제 사용값)] |
| A11 | brainstorming/SKILL.md:430 | `한 번에 최대 2개 질문만 한다 (탐색적 질문 한정 — 답이 설계 결정으로 기록되는 질문은 decision-flow의 '한 번에 하나' 규칙을 따른다)` (Step C) | [개수일치] |
| A11 | brainstorming/SKILL.md:522 | `한 번에 최대 2개 질문만 한다 (탐색적 질문 한정 — 답이 설계 결정으로 기록되는 질문은 decision-flow의 '한 번에 하나' 규칙을 따른다)` (국면 2) — 정확히 2회, 두 곳 모두 완전 동일 문자열 | [개수일치=2] |

### B. decision-flow.md — 파일 해시 동일 (변경 없음 확정)

phase2 "구조 규칙" 및 브리핑 지시에 따라, decision-flow.md는 G4에서 무변경으로 확정되었으므로 B1~B7 개별 3튜플 대신 파일 해시 1항목으로 대체한다.

**Step 5 실행 커맨드:** `git hash-object skills/workflow-orchestrator/decision-flow.md skills/development-principles/SKILL.md`

**실제 출력:**
```
8bbd4cfd9db724110b62f862cd4d500b2ebc1182   (decision-flow.md)
8a3aca714b5b3b57bb47c9c54e18cdf5576bfc5f   (development-principles/SKILL.md)
```

| ID | 파일 | 앵커 | 판정 방식 |
|---|---|---|---|
| B(전체) | skills/workflow-orchestrator/decision-flow.md | git blob hash `8bbd4cfd9db724110b62f862cd4d500b2ebc1182` | [해시동일] |

### C. development-principles — 파일 해시 동일 (변경 없음 확정)

브리핑 지시에 따라 C1~C4도 동일하게 해시 1항목으로 대체.

| ID | 파일 | 앵커 | 판정 방식 |
|---|---|---|---|
| C(전체) | skills/development-principles/SKILL.md | git blob hash `8a3aca714b5b3b57bb47c9c54e18cdf5576bfc5f` | [해시동일] |

> 참고: git hash-object는 워킹 트리 파일 내용 기준 blob SHA1이므로, LF/CRLF 정규화 없이 바이트 그대로 비교된다. C1이 요구한 "정규화 해시"(LF 정규화)와는 별개 개념이나, 이 두 파일 자체가 무변경 확정이므로 전체 파일 해시 동일 여부만 확인하면 C1의 "경로 해소 규칙" 섹션 보존도 자동 충족된다.

### D. workflow-orchestrator (Evaluator/AC 관련)

| ID | 파일 | 앵커(정확 인용문/정규식) | 판정 방식 |
|---|---|---|---|
| D1 | workflow-orchestrator/SKILL.md:144~148 | ``` 아래 에이전트 역할 정의를 읽고 그 역할을 수행하라.\n\n--- 에이전트 역할 정의 ---\n[Ouroboros agents/evaluator.md 전문]\n\n--- 수락 기준 ---``` | [존재grep] |
| D1 | workflow-orchestrator/SKILL.md:153 | `--- 구현 결과물 ---` | [존재grep] |
| D1 | workflow-orchestrator/SKILL.md:156 | `각 수락 기준에 대해 PASS/FAIL/PARTIAL을 판정하라.` | [존재grep] |
| D1 | workflow-orchestrator/SKILL.md:157 | `FAIL 또는 PARTIAL 항목에는 구체적 근거와 수정 제안을 포함하라.` | [존재grep] |
| D1 | workflow-orchestrator/SKILL.md:142 | `미확보 시 \`find "$HOME/.claude/plugins" -path "*/ouroboros/agents/evaluator.md" -type f \| head -1\` 로 동적 탐색.` | [존재grep] |
| D2 | workflow-orchestrator/SKILL.md:162~165 | ``` ── 🎯 AC 검증 결과 [Evaluator] ───────────────────────\n  ✅ PASS: [N개]\n  ⚠️ PARTIAL: [N개]\n  ❌ FAIL: [N개]``` | [존재grep] |
| D2-제외 | — | phase2 D2 부기: "간소화 허용 범위를 이 필드 집합으로 확정 (F1 바이트 보존 대상에서 제외 선언)" — 이 4필드(PASS/PARTIAL/FAIL 카운트 + `[Evaluator]` 태그) 자체는 존재만 확인하면 되고, 박스 테두리 문자(`──`, `───`)의 바이트 보존은 요구하지 않음 | — |
| D3 | workflow-orchestrator/SKILL.md:171 | `- FAIL 항목이 있으면 → 수정 후 재검증을 제안한다` | [존재grep] |
| D3 | workflow-orchestrator/SKILL.md:172 | `- 모두 PASS → REVIEW 완료로 진행한다` | [존재grep] |
| D4 | workflow-orchestrator/SKILL.md:173 | `- Standalone Mode에서는 Evaluator를 생략하고 Superpowers 코드 리뷰 결과만으로 판단한다` | [존재grep] |
| D4 | workflow-orchestrator/SKILL.md:174 | `- 설계 문서에 수락 기준이 없으면 Evaluator를 스킵한다` | [존재grep] |
| D5 | workflow-orchestrator/SKILL.md:137 | `**순서:** Superpowers \`requesting-code-review\` 완료 후 → 위 \`post-review-validate\`(rules-injection)를 먼저 실행 → 그 다음 아래 \`Evaluator QA 게이트\`를 실행한다.` | [존재grep] |
| D5 | workflow-orchestrator/SKILL.md:137 | `Evaluator QA 게이트는 설계 문서의 Success Criteria만 검증한다 (중복 호출 회피)` | [존재grep] |

### E. design-doc-index / design-summary

| ID | 파일 | 앵커(정확 인용문) | 판정 방식 |
|---|---|---|---|
| E1+E2 | design-doc-index/SKILL.md:23~24 | `3. \`complete\` → 변경 없음\n4. \`completed\` → 해당 파일의 프론트매터를 \`complete\`로 수정한다` | [정확문자열] |
| E1+E2 | design-summary/SKILL.md:37~38 | `3. \`complete\` → 변경 없음\n4. \`completed\` → 해당 파일의 프론트매터를 \`complete\`로 수정한다` (design-doc-index와 완전 동일 문자열) | [정확문자열2회 — 두 파일에서 문자 동일] |
| E1+E2 | design-doc-index/SKILL.md:27, design-summary/SKILL.md:41 | `수정 시 사용자에게 별도 안내하지 않는다 (silent fix).` (두 파일 동일) | [정확문자열2회] |
| E3 | design-doc-index/SKILL.md:15 | `색인/로드 실행 전에 대상 문서의 상태값을 정규화한다. 이 전처리는 필터링보다 먼저 실행한다.` | [존재grep] |
| E3 | design-summary/SKILL.md:29 | `대상 문서 탐색 전에 상태값을 정규화한다. 이 전처리는 필터링보다 먼저 실행한다.` (표현은 유사하나 문자열 상이 — "실행 전에" vs "탐색 전에") | [존재grep] |
| E3 | design-doc-index/SKILL.md:21, design-summary/SKILL.md:35 | `1-1. domain.md(category 직속 .md)는 상태 정규화 대상에서 제외한다` (두 파일 완전 동일) | [정확문자열2회] |

### F. 공통

F1(화이트리스트), F2(게이트 인벤토리), F3(크로스레퍼런스)은 각각 별도 섹션(위 "게이트 인벤토리", "크로스레퍼런스 인벤토리")에 상세 기록했다. F1은 아직 슬림화 diff가 존재하지 않으므로(본 태스크는 슬림화 이전 베이스라인 캡처) 화이트리스트 자체는 이후 태스크(diff 작성 태스크)에서 승인 목록과 함께 확정한다 — 본 문서는 F1의 사전 조건인 "그 외 사용자 노출 템플릿"의 현재 상태(전체 5개 파일 원본 바이트, 위 "크기 스냅샷")를 해시 대체 앵커로 제공한다.

| ID | 파일 | 앵커 | 판정 방식 |
|---|---|---|---|
| F1 | brainstorming, merge-to-domain, workflow-orchestrator, design-doc-index, design-summary (5파일) | 위 "크기 스냅샷" 표의 바이트 수 (전체 파일 크기가 diff 범위의 상한 참조값) | [해시] — 파일별 `git hash-object` 필요 시 Task 6에서 개별 산출 |
| F2 | 위 5파일 | "게이트 인벤토리" 표 — 13개 실제 게이트, 0번 사용 1개 | [개수일치] |
| F3 | skills/*/SKILL.md + decision-flow.md | "크로스레퍼런스 인벤토리" grep 출력 전문(80줄 이내 전량) + §8↔brainstorming 3쌍 | [기계절차] |

---

## 파일 해시 (전체 5개 슬림화 대상 파일 — 참고용, F1 개별 앵커 보강)

Task 1 브리핑에는 5개 대상 파일 개별 해시가 명시적으로 요구되지 않았으나(브리핑은 B/C 두 무변경 파일만 해시 요구), F1 판정에 필요할 것으로 예상되어 참고용으로 함께 기록한다:

```
git hash-object skills/brainstorming/SKILL.md skills/merge-to-domain/SKILL.md skills/workflow-orchestrator/SKILL.md skills/design-doc-index/SKILL.md skills/design-summary/SKILL.md
```

**실제 실행 결과:**

| 파일 | blob hash |
|---|---|
| skills/brainstorming/SKILL.md | `34a111d69c55bbf9568b70bc803f6f72f516f510` |
| skills/merge-to-domain/SKILL.md | `792a3004952c20f79702b9af64abbb5d6b7a6f8f` |
| skills/workflow-orchestrator/SKILL.md | `abd2771c1f36da6c6d7864a97982216fd8fe2108` |
| skills/design-doc-index/SKILL.md | `b02ad5d895be2425935204765d178473aaaa21a9` |
| skills/design-summary/SKILL.md | `abac3a00951474d681f6315badecd1c3580991b5` |

> 이 5개 파일은 슬림화(삭제/이동/§참조 삽입) 대상이므로 해시가 **바뀌는 것이 정상**이다. 이 표는 "언제 바뀌었는지"를 추적하기 위한 시점 기록이며, F1 자체의 판정 기준(불변)은 위 3튜플 표의 인용문·게이트·크로스레퍼런스 항목이 담당한다.
