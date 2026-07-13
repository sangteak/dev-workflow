# dev-workflow 기능 분리 통합 리뷰 (MCP · 에이전트 · 스크립트)

> **문서 성격**: 유지보수자용 리뷰 산출물 (설계 문서 아님 — 워크플로우 스캐너 간섭을 피해 `docs/design/` 밖에 배치)
> **작성일**: 2026-07-10 · **브랜치**: `worktree-modularization-review`
> **기준**: 리뷰 실측은 origin/main `9d23576` 기준으로 수행. 같은 날 v1.16.0(verification-realignment, `b4da9c7`)이 배송되어 본 문서를 현행화함 — 이행 완료된 권고는 본문에 ✅로 표기
> **결정 상태**: 분리 후보 확정 완료. 도입 여부·기술 스택은 미결 (§8 미해결 질문 참조)

---

## 1. 배경과 방법

dev-workflow는 코드 없는 문서 기반 플러그인으로, 모든 로직이 Markdown 스킬 지시문으로 작성되어 LLM이 세션 중 직접 실행한다. 이 구조의 약점 세 가지가 리뷰의 출발점이다:

1. **실행 신뢰성이 LLM 준수율에 의존** — "읽기 실패 폴백이 실제로 지켜지지 않는 경우가 많다"는 사용자 실사용 증언이 있다 (verification-realignment 설계 문서에 기록 — 저장소에 관측 기록이 0건이던 가정에 대한 첫 반증 증언이며, 저장소 내 실측 로그는 아직 없다)
2. **긴 지시문의 반복 토큰 비용** — 매 세션/단계마다 수백 줄 재로드
3. **파일 부작용 조작에 코드 수준 안전 게이트 부재** — 복구 불가능한 삭제·SSOT 변형이 LLM 재량으로 실행됨

**조사 방법**: 3단계 리뷰를 순차 수행했다.
- **MCP 리뷰**: Explore 에이전트 3방향 병렬 인벤토리(24개 컴포넌트, 판정 5축: 결정적 절차/상태 관리/다단계 알고리즘/파일 부작용/반복 토큰 비용) + 커버리지 갭 점검 → Plan 에이전트 종합
- **에이전트 리뷰**: 서브에이전트 사용/위임 지점 전수 스캔 + 구조 기회 평가(ouroboros `agents/` 형식 실물 관찰 포함) → 종합. 탐색 오탐 2건은 파일 실측으로 정정했고, 1건(agents/ 디렉토리 신설 제안)은 확정 설계와의 충돌로 방향을 수정했다
- **스크립트 리뷰**: 스킬 내 셸 명령 지시 전수 조사(26건) + hook 확장 기회 평가 → 종합

세 리뷰 모두 진행 중이던 설계 **verification-realignment**와의 정합성을 교차 검증했다 (리뷰 수행 시점에는 plan.md까지 작성된 DEVELOP 직전 상태 — **이후 같은 날 v1.16.0으로 배송 완료**, `b4da9c7`).

**표기 규칙**
- 판정 어휘: `strong/weak/no`·`high` 등은 **탐색 단계 원판정**(에이전트별 어휘)이고, 최종 판정은 본 문서의 **Tier 1(강권고)/Tier 2(조건부·유보)/Tier 3(유지·기각)** 이다. 원판정과 최종 판정이 다른 경우 본문에 그 이유를 적었다.
- REQ 번호: 두 네임스페이스가 존재한다 — verification-realignment의 REQ(예: 역할 내장 REQ-005)와 각 스킬 파일 자체의 REQ(예: merge-to-domain의 "Idempotent 의무 REQ-005"). **동일 번호가 서로 다른 요구사항을 가리키므로 본문에 소속을 병기**한다.

---

## 2. 총괄 결론

| 리뷰 | 결론 | 확정 후보 |
|---|---|---|
| **MCP** | **분리 필요** — 인벤토리 strong 판정 영역을 3개 도구군으로 좁히고, weak 1건(삭제 게이트)을 상향해 4개 도구군으로 확정 | 단일 서버 · 도구 8개 (§3) |
| **에이전트** | **대규모 분리 불필요** — 위임 구조는 성숙 단계, 국소 보수 3건만 | agents/ 신설 기각, 계약 보수 3건 (§4) |
| **스크립트** | **신규 3건으로 수렴** — deny형 hook(무조건 차단) 전면 배제 | repo 스크립트 2 + 동봉 스크립트 1 (§5) |

핵심 판단 프레임: **같은 "결정적 로직"이라도 최적 분리 계층이 다르다.**

| 계층 | 성격 | 이번 리뷰의 확정 후보 |
|---|---|---|
| **hook** | 모델 협조 없이 결정적 실행 — 세션 수명주기 지점 전용 | 현행 2개(session-start, inject-rules) 유지. 신규는 ask-승격형(차단하지 않고 사용자 확인 질문으로 올리는 방식)만 조건부 (§5 Tier 2) |
| **MCP 도구** | 호출 시 정확성 보장 — 구조화 I/O·검증·스키마 | 8개 도구 (§3 Tier 1) |
| **플러그인 동봉 스크립트** | 결정적 원라이너의 중앙화 — 호출은 모델 의존 | 경로 해소 1건 (MCP 미가용 폴백 지위) |
| **repo 개발 스크립트** | 이 저장소의 릴리스 절차 — 배포 대상 아님 | 버전 범프, 규범 스윕 |
| **자연어 유지** | 창의·판단·대화 | 페르소나 루프, 브레인스토밍 코어, Feasibility 판단 등 |

MCP 도구의 한계를 명시해 둔다: **도구는 모델이 호출해야 작동하므로 "규칙 미준수" 문제 자체는 풀지 못하고, 호출됐을 때의 정확성만 보장한다.** 호출 누락은 (a) 스킬 지시문을 "긴 절차 서술 → 도구 1회 호출"로 축약해 준수 난이도를 낮추고, (b) verification-realignment의 자연어 개선(호출 누락 감소)과 이중 구조로 보완한다.

---

## 3. MCP 분리 리뷰

### Tier 1 — 분리 확정 후보 (우선순위순)

| # | 도구군 | 도구 | 핵심 근거 (요약) |
|---|---|---|---|
| T1-1 | **merge-to-domain digest·검증** | `digest_extract`, `merge_verify`, `merge_checkpoint` | 멱등 ID 부여("같은 입력 → 같은 ID/순서")는 LLM이 구조적으로 보장 불가한 하드 요구사항. SSOT(domain.md)를 비가역 변형하는 유일한 경로 |
| T1-2 | **워크스페이스 상태 스캔 + HANDOFF I/O** | `workspace_scan`, `handoff_read`, `handoff_write` | 탐색 에이전트 3개가 독립적으로 지목한 유일 영역(최강 합의). 매 세션 반복 I/O·YAML 침묵 실패를 스키마 직렬화로 차단 |
| T1-3 | **중간 산출물 삭제 안전 게이트** | `cleanup_intermediates` | 복구 불가능한 삭제가 LLM 재량으로 실행되는 경로 봉쇄. 원판정 weak였으나 "삭제 시퀀싱만" 분리해 상향 |
| T1-4 | **규칙 선택·파싱** | `rules_select` | 현행 "frontmatter 파싱 실패 → 침묵 스킵"은 규칙 미적용을 감지 불가능하게 함. 코드 파서는 오류를 명시 반환 |

**설계 경계 (도구별 상세)**

- **T1-1**: 멱등 의무의 근거는 merge-to-domain **자체 REQ-005** "Idempotent 의무" (`skills/merge-to-domain/SKILL.md` 68·101행). 5단계 중 **Stage 1·2(digest 추출)와 Stage 5(사후 검증)만 코드화**한다. Stage 3(충돌 분류 + Architect 피드백 라운드 — 둘 다 3단계 소속)는 의미 판단이라 코드화 금지. Stage 4(적용)의 dry-run 생성·사용자 승인 게이트·문서 편집도 자연어에 남고, 도구는 백업/복원(`merge_checkpoint`)만 관여한다
- **`merge_verify` 매칭 수준**: statement 매칭은 패러프레이즈 때문에 완전 문자열 매칭 불가 — 정규화 문자열 매칭까지만 코드가 수행하고 미매칭분은 LLM 의미 판정으로 넘기는 하이브리드
- **T1-2**: 이슈 HANDOFF 격리(이슈 컨텍스트에서 부모 HANDOFF 쓰기 거부)를 코드로 강제. 6단계 상태 판정 우선순위 내장
- **T1-3**: 선행 조건(design doc status=complete, git-mode면 커밋 존재) 미충족 시 삭제 거부. 대상: no-git-mode phase/plan/HANDOFF 삭제 + 머지 후 feature 디렉토리 삭제
- **T1-4**: 정밀 파싱은 `rules_select` 전용. inject-rules hook은 "grep 기반 단순 추출만, 정밀 YAML 파싱 금지"가 명시적 설계 결정이므로(§5 Tier 3) **코드 공유가 아니라 역할 분리**로 정합성을 확보한다 — MCP 리뷰 원안의 "hook과 파서 코드 공유" 제안은 이 설계 결정과 충돌해 조정됨

### Tier 2 — 다른 메커니즘으로 재분류

- **버전 SSOT 동기화** → repo 스크립트 (§5 T1-1). 플러그인 런타임 기능이 아니라 이 저장소의 개발 절차
- **grep 스윕 (verification-realignment REQ-009)** → repo 스크립트 (§5 T1-2)
- **Stage Detection·Completion Protocol** → weak 조정. 키워드 기반 단계 추론은 언어 판단(LLM 몫)이고, 위험 조작은 사용자 확인 게이트 3개(README/커밋/푸시)가 이미 보호. 파일 상태 검사만 `workspace_scan`에 흡수
- **decision-flow ledger (N/M/K 카운터·재논의 대기열)** → **유보**. 매 턴 도구 호출에 의존하는 구조라 준수 문제가 재발할 위험이 후보 중 최대. 손실이 실제 발생하는 지점(세션 경계)만 `handoff_read/write`로 커버하고 관측 후 재평가
- **병렬 머지 2-pass 오케스트레이션** → 호스트 런타임(Claude Code 서브에이전트 기능) 위임 유지. 플러그인 코드로 재구현 금지

### Tier 3 — 자연어 유지

- brainstorming 창의 코어 (페르소나 인터뷰·시드 추출)
- plan-stage Feasibility (verification-realignment REQ-010/011이 커버 — §7 범례 참조)
- Ouroboros 경로 탐색 — verification-realignment REQ-005로 **문제 자체가 소멸** (✅ v1.16.0 배송으로 확정), MCP 중복 해결 금지
- VCS 감지 — 환경 컨텍스트 필드("Is directory a git repo")로 충분
- design-summary 서술 재구성, persona-resolution, add-rule/setup, commands(thin router), hooks 2종(이미 bash)

### 서버 구성 (잠정 — 도입 결정 시)

- **서버 1개** (`dev-workflow`), 도구 8개: 머지군 3 + 상태군 3 + 안전군 1 + 규칙군 1
- Node 18+ / TypeScript / 공식 `@modelcontextprotocol/sdk` / stdio. esbuild **단일 파일 번들을 저장소에 커밋**(`mcp/dist/index.js`) — 로컬 마켓플레이스 캐시 스냅샷 배포와 호환(사용자 측 빌드 불필요). 경로 처리는 전부 Node `path` API(셸 무관 — Windows 필수)
- `plugin.json`에 `mcpServers` 필드 추가: `{"dev-workflow": {"command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/dist/index.js"]}}` (ouroboros 플러그인 실증 패턴)
- **폴백 정책**: 머지군은 도구 부재 시 **명시적 중단**(SSOT 변형이라 저하 실행 금지), 상태군은 고지 후 현행 자연어 절차로 저하 동작. 폴백 텍스트는 1줄 분기만 — 상세 절차 병존은 이중 유지보수 + "폴백 미준수" 재생산이라 금지

---

## 4. 에이전트 분리 리뷰

### 총평

위임 구조는 **성숙 단계**: 단계별 담당 표(orchestrator), 에이전트 매칭 규칙 표(brainstorming), decision-flow SSOT, Enhanced/Standalone 이원화, Superpowers 경계 선언이 모두 명시돼 있고 계약 품질 문제는 국소적. **신규 `agents/` 디렉토리 계층 신설은 기각** — verification-realignment의 확정 기술 결정("스킬별 `references/agent-roles.md` 채택, 공용 단일 파일은 크로스 스킬 경로 해소 실패 위험으로 기각", verification-realignment.md §6)과 충돌한다.

### Tier 1 — 강권고 (3건, 모두 계약 보수)

1. **T1-1. Ouroboros 역할 9종 내장 이행 (verification-realignment REQ-005~008 강행 확인)** — ✅ **v1.16.0에서 이행 완료** (`128575a`·`a2f0ee0`·`06a6268`: 스킬별 `references/agent-roles.md` 3개 신설, 2-Path 재편). 리뷰 권고 내용: brainstorming 6종·plan-stage 2종·orchestrator Evaluator 1종의 외부 플러그인 동적 탐색(`find "$HOME/.claude/plugins" ...`) 의존을 verbatim 내장으로 교체해 find 탐색·경로 미확보·폴백 미준수 3문제 구조 제거, Path C 분기(Ouroboros 부재 시 내부 패턴으로 대체하는 Standalone 경로) 소멸. **추가 발견이었던 orchestrator Evaluator 완충 문구 부재도 배송분에 반영 확인** (SKILL.md 146행). **잔여**: Standalone 잔존 문면 후속 철거. **리스크**: 원본 드리프트 1건뿐 — 확정 설계가 "메이저 업데이트 인지 시 수동 1회 대조"로 처리
2. **T1-2. Contrarian/Hacker 프롬프트 템플릿 신설 + Hacker 트리거 정의** (신규 발견) — ✅ **본 브랜치에서 이행** — `skills/brainstorming/references/templates.md` 전수 확인 결과 Ontologist·Socratic·Seed-Architect·Simplifier·미답변조사 5개 블록은 실재하나 **Contrarian/Hacker 블록만 부재** (v1.16.0 배송 후 재실측으로도 부재 확인 — v1.16.0 미편입 확정, 후속 배송 대상). Step C가 "비판 담당은 Contrarian 서브에이전트"라고 지시하는데 프롬프트 계약이 미명세. 기존 템플릿 패턴 복제 + Hacker 발동 조건 1문장 정형화
3. **T1-3. design-summary 서브에이전트 계약 명세** — ✅ **본 브랜치에서 이행** — 4개 이상 문서 병렬 추출 시 (a) 에이전트 정체(범용, 역할 파일 불필요) 명시, (b) 병렬 풀 크기(merge-to-domain 검증 상수 3~5 재사용), (c) 반환 형식(8항목 고정 헤더 markdown 펜스 강제), (d) 대형 문서 게이트 부재를 보수. PATCH성 — 독립 배송 가능

### Tier 2 — 조건부/유보

- **digest 추출의 서브에이전트 위임(순차 모드)**: MCP `digest_extract` 착지 시 도구 호출로 대체 — MCP 결정 이후 재평가
- **병렬 2-pass 상태 전이 포맷 명세**: MCP `merge_checkpoint` 스키마가 정의하게 됨 — 지금 문서화하면 이중 작업
- **에이전트 매칭 규칙 메타데이터화 / rules-injection 테스트 추론 상세화**: 관측 데이터 축적 후

### Tier 3 — 현행 유지 (탐색 오탐 정정 포함)

- ~~plan-stage/merge-to-domain "Architect 라운드 등급 통일"~~ — **오탐**: plan-stage Step 2는 라운드 등급 없는 1회 사전 분석, 등급은 merge-to-domain에만 존재
- ~~templates.md에 Seed-Architect/Simplifier 부재~~ — **오탐**: 실재 확인
- merge-to-domain 차단성 우려 판별문 형식화 — 판별문("dry-run 승인을 진행할 수 없는가")은 v1.15.0 게이트 실효성 정비의 산출물이고, 자동 승급·PASS 차단 규칙(merge-to-domain 자체 REQ-007)이 결정 트리를 이미 구성 — 추가 형식화 불요
- Ouroboros Detection 경로 캐싱 명세 — REQ-005 이행(v1.16.0)으로 대상 자체가 소멸
- decision-flow 화이트리스트 정형화 — 기본값이 이미 보수적("의도가 명확해 보여도 선택지를 출력")
- design-doc-index/design-summary 중복 정리 — 트리거 메커니즘(자동 감지 vs 명령 호출 전용)으로 이미 분리
- BRAINSTORM 위임 구조 전반 — 계약이 이미 잘 명세됨

---

## 5. 스크립트 분리 리뷰

### 총평

탐색 26건(중복 포함)을 실측 재심사한 결과 **신규 강권고 3건으로 수렴**. 상당수는 MCP Tier 1이 선점(5건 흡수)했거나 verification-realignment이 코드 경로 자체를 제거(Ouroboros find 탐색 — ✅ v1.16.0에서 제거 완료). **deny형 hook(무조건 차단)은 전부 배제** — 오탐 시 사용자 우회 수단이 없어 "안전망 동반 자동화" 독트린(development-principles §자동 결정 안전망)과 충돌. ask-승격형 최소 개입만 조건부로 남긴다.

### Tier 1 — 강권고 (3건)

1. **T1-1. 릴리스 버전 범프+동기 검증 스크립트** (`scripts/bump-version <ver>`, repo 개발용) — ✅ **본 브랜치에서 이행** — plugin.json + marketplace.json 이중 버전의 결정적 치환+검증. git log 실측상 릴리스마다 2파일 수동 편집 반복(8165ae0, a6a2ec4, df1a2fe — v1.16.0 범프 `6430033`도 수동 편집으로 반복 확인). pre-commit 인프라가 없으므로 강제 게이트가 아닌 **릴리스 태스크 호출형**으로 시작, CI 도입 시 게이트로 승격
2. **T1-2. 규범 스윕 범위 고정 래퍼** (`scripts/sweep <grep-패턴>`, repo 개발용) — ✅ **본 브랜치에서 이행** — 실측된 실수 2건이 모두 패턴 오류가 아닌 **범위 사각**(lessons.md 2026-07-09 두 건: 무변경 줄 사각, `skills/` 한정으로 README 2곳 사각). 패턴은 매번 다르지만 범위는 불변 — 정확히 스크립트가 잘하는 부분만 고정. verification-realignment REQ-009 규범은 v1.16.0에서 자연어 절차로 배송됨(`d74e1e8`, development-principles) — 이 스크립트는 그 규범의 실행 문면을 `Run: scripts/sweep '<패턴>'`으로 표준화하는 후속. 같은 설계가 기각한 것은 "훅 자동화"이고 이것은 plan 태스크 호출형 도구라 확정 규범과 양립
3. **T1-3. docs/design 경로 해소 공용 스크립트** (`scripts/resolve-docs-dir`, 플러그인 동봉) — 동일 find 원라이너가 **9개 스킬 11곳 + session-start hook에 복제**돼 있음을 실측(탐색 규칙 변경 시 11곳 스윕 필요 = lessons의 실수 패턴 그 자체). 단 **MCP `workspace_scan`이 경로 해소를 내장할 것이므로 "MCP 미가용 폴백 + hook 공용 구현" 지위로 설계**하고, MCP 서버가 같은 로직을 내부 재사용해 이중 소스를 금지. 배송 여부는 §8 질문 5에 연동

### Tier 2 — 조건부/유보 (hook 후보 포함)

- **merge-to-domain 소형 git 명령 4건**(pre-flight status, git log FIFO 정렬, author 추출, 토큰 추정 bytes/3.5): 개별 스크립트화는 과분해 — MCP 머지 도구의 입력 수집/전처리로 흡수. 도구 스펙에 포함 여부를 명시적으로 결정할 것
- **Phase 파일 불변성 PreToolUse hook** (ask-승격형): 정당 예외(사용자 명시 오타 수정)가 실재해 절대 차단 부적합. 실측 위반 0건 — lessons.md에 위반 1회 이상 기록되면 도입
- **PreCompact HANDOFF 리마인더**: hook은 세션 의미 컨텍스트가 없어 HANDOFF 내용 생성 불가(신호 주입만 가능). 3플랫폼(Claude Code/Cursor/Copilot CLI) 실측 후 + `handoff_write` 도입으로 저장 비용이 낮아진 뒤가 효과 시점
- **git push ask-승격 PreToolUse**: hook은 "사용자가 요청했는지"를 알 수 없음. 동일 효과를 사용자 settings 권한 정책으로 달성 가능하고 플러그인의 월권 소지 — push 권한 경계 명문화 후 opt-in 형태로만

### Tier 3 — 현행 유지/기각

| 항목 | 근거 |
|---|---|
| Ouroboros 경로 탐색 스크립트화 (탐색 원판정 high) | **기각** — verification-realignment REQ-005/006이 v1.16.0에서 find 탐색 자체를 제거 (✅ 배송 완료로 기각 사유 확정) |
| inject-rules hook 확장 (frontmatter 사전 검증) | 기각 — "grep 기반 단순 추출만, 정밀 YAML 파싱 금지"가 명시적 설계 결정이고, 정밀 파싱은 MCP `rules_select` 영역이라 이중화 |
| session-start의 HANDOFF/phase 감지 | 이미 bash 구현. 상태 판정·정렬은 `workspace_scan` 영역 |
| setup.md 설치 프로토콜 전체 스크립트화 | 호출 빈도 극저(설치 1회), 에러 규칙이 이미 리스크 통제. Step 3-C JSON 항목 제거만 향후 jq 원라이너 검토 여지 |
| decision-flow ledger / 커버리지 갭 감사(verification-realignment REQ-012) | 자연어 유지 — 도메인 해석·전체 시야 검토가 본질 |

---

## 6. 크로스 리뷰 정합성

세 리뷰가 서로를 참조하며 확정·조정한 접점:

| 접점 | 관계 |
|---|---|
| digest 서브에이전트 위임(에이전트 Tier 2) ↔ `digest_extract`(MCP T1-1) | 동일 문제의 두 해법 — **MCP 우선** (멱등을 결정적으로 보장). 에이전트 리뷰가 위임을 유보로 내린 근거 |
| 역할 내장(에이전트 T1-1) ↔ `workspace_scan`(MCP T1-2) | 시너지 — Detection이 "MCP 유무" 판정으로 단순화되면 스캔 책임 경감 |
| `rules_select`(MCP T1-4) ↔ inject-rules hook(스크립트 Tier 3) | **역할 분리로 조정** — 정밀 파싱·필터는 도구 전용, hook은 명시적 설계 결정대로 grep 단순 추출 유지, 프롬프트 첨부·자동 수정 라운드는 스킬 잔존. MCP 리뷰 원안의 "파서 코드 공유"는 이 설계 결정과 충돌해 채택하지 않음 |
| decision-flow 재논의 대기열 ↔ `handoff_write` 스키마 | HANDOFF 스키마 설계 시 **재논의 대기열을 1급 필드로 정의** 권고 (현행 자연어 서술 의존 → 복구 신뢰성 상승) |
| 경로 해소 스크립트(스크립트 T1-3) ↔ `workspace_scan` | 스크립트는 MCP 미가용 폴백 + hook 공용 구현. MCP 서버가 동일 로직 내부 재사용 — 이중 소스 금지 |
| Evaluator QA 상시화(verification-realignment REQ-006) ↔ MCP 원칙 | 주의 — Evaluator도 모델 협조 의존 서브에이전트. 호출률을 MCP 관측 루프와 같은 관측 대상으로 묶을 것 |

---

## 7. verification-realignment(v1.16.0)와의 관계

**보완 관계이며 대체하지 않는다** — 자연어 개선(REQ-005~011)이 "호출 누락"을 줄이고, MCP가 "호출 시 정확성"을 보장하는 이중 구조.

**배송 순서 제약**: v1.16.0이 이 리뷰의 후속 작업들과 같은 스킬 파일(plan-stage, brainstorming, orchestrator)을 수정하므로 **v1.16.0 선행 배송이 전제 조건**이었다 — ✅ **2026-07-10 배송 완료**(`b4da9c7`, 기능 문서 취합까지 완료)로 전제 충족. REQ-005(역할 내장)는 본 리뷰의 판정 2건(Ouroboros 경로 탐색 관련 MCP·스크립트화 기각)의 성립 근거였고, 배송으로 확정됐다. 잔여 후속: Standalone 잔존 문면 철거, verification-realignment 도메인 머지, 관측 루프(REQ-013) 가동.

**REQ 범례 (verification-realignment 소속 — 본문 인용분 1줄 요약)**

| REQ | 내용 |
|---|---|
| REQ-005~008 | 역할·위임 계약 정비 묶음: Ouroboros 역할 9종을 스킬별 `references/agent-roles.md`에 verbatim 내장(005), Evaluator QA 상시화(006) 등 — find 탐색·읽기 폴백 의존 제거 |
| REQ-009 | 규범의 의미를 바꿀 때 구 문면 grep 스윕 태스크를 plan에 포함할 의무 |
| REQ-010/011 | plan-stage Researcher 트리거 확장(미검증 수치 가정 시에도 발동) / 조기 합의 시 근거 1줄 의무 |
| REQ-012 | 커버리지 갭 1회 감사 |
| REQ-013 | 배송 후 관측 루프 (lessons.md 기록 기반 재평가) |

※ 스킬 파일 자체의 REQ 번호(merge-to-domain REQ-005 "Idempotent 의무", REQ-007 "Architect 라운드 자동 승급" 등)는 위와 별개 체계다.

---

## 8. 미해결 질문 (통합·중복 제거)

### A. 사용자 결정 필요 — 도입 전제

1. **Node.js 의존 수용**: 플러그인 사용자에게 Node 18+ 설치를 요구할 수 있는가? (현행 "코드 제로"가 셀링 포인트 — MCP 도입의 성립 전제)
2. **dist 번들 커밋 정책**: `mcp/dist/` 저장소 커밋(스냅샷 배포 호환) vs 릴리스 태그별 빌드 파이프라인
3. **도구 부재 시 머지 중단**: MCP 서버 미기동 환경에서 merge-to-domain을 거부하는 정책 수용 여부 (기존 워크플로우를 깨는 변경)

### B. 사용자 결정 필요 — 배송·범위

4. ~~v1.16.0 편입 범위~~ → **해소됨**: v1.16.0이 배송 완료되어 에이전트 T1-2·스크립트 T1-1/T1-2 모두 미편입으로 확정. 남은 결정은 이 3건의 **후속 배송 묶음·시점** (§9 로드맵 1·2단계 참조)
5. **경로 해소 스크립트 vs MCP 직행**: MCP 도입이 1~2릴리스 내라면 폴백 스크립트(스크립트 T1-3)를 건너뛰고 `workspace_scan`으로 직행하는 것이 더 싼가?
6. **push 게이트 방식**: 자연어 확인(현행) vs 사용자 settings 권한 정책 안내 vs opt-in PreToolUse hook
7. **CI 최소 도입**: 버전 동기 검증 1잡(GitHub Actions)이 "코드 없는 플러그인" 성격과 상충하는가?

### C. 설계 단계에서 결정

8. **merge_verify 매칭 수준**: 정규화 문자열 매칭 + 미매칭분 LLM 위임(권고) vs 더 강한 매칭
9. **decision ledger 투자 시점**: HANDOFF 직렬화로 세션 경계만 커버 후 관측(권고) vs 즉시
10. **digest_extract 착지 시 병렬 Pass 1 축소 범위**: 충돌 분류(Stage 3)를 서브에이전트에 유지할지
11. **Hacker 교착 판정 주체**: 자동 감지 vs 모델 제안+사용자 승인(유력) vs 사용자 발화
12. **design-summary 풀 크기 상수 소유권**: merge-to-domain 상수(3~5) 재사용 시 중복 보유 문제

### D. 실측 필요 (결정 전 실험)

13. **PreCompact 주입의 3플랫폼 동작**: 주입 컨텍스트가 compact 산출물에 반영되는지
14. **동봉 스크립트의 크로스 플랫폼 실행**: bash 전제가 3플랫폼×Windows에서 성립하는지

---

## 9. 권장 로드맵

| 단계 | 내용 | 전제 |
|---|---|---|
| **0** | ✅ **완료** — verification-realignment v1.16.0 배송(`b4da9c7`). 에이전트 T1-2·스크립트 T1-1/T1-2는 미편입 → 1·2단계로 이관 | — |
| **1** | repo 스크립트 2종 배송: bump-version, sweep — 배포 대상이 아니라 "코드 제로" 원칙 비저촉, 즉시 가능 | 없음 |
| **2** | 스킬 계약 보수: 에이전트 T1-2(Contrarian/Hacker 템플릿) + T1-3(design-summary 계약 명세) — PATCH성 독립 배송 | 없음 |
| **3** | MCP MVP: 서버 스캐폴드 + 머지군 3도구. 검증: 골든 테스트(digest 2회 실행 ID 완전 일치) + 도구 유/무 A/B 머지 + Windows 스냅샷 설치 확인 | 질문 1~3 결정 완료 (질문 1 승인 필수) |
| **4** | MCP 2차: 상태군 3도구 + `cleanup_intermediates`. context-handling·design-doc-index 스킬을 도구 호출 중심으로 축약. 경로 해소: 질문 5 결정에 따라 resolve-docs-dir 폴백 스크립트(스크립트 T1-3)를 함께 배송하거나 스킵 | 3단계 안착 + 질문 5 결정 |
| **5** | `rules_select` + 관측 기반 재평가(decision ledger, phase 불변성 hook, PreCompact) | 4단계 + lessons.md 관측 축적 |

※ MCP를 도입하지 않기로 결정(질문 1 부결)하면 3~5단계가 소거되고, 스크립트 T1-3(경로 해소)이 폴백이 아닌 정식 배송으로 승격되며, Tier 2로 유보한 hook 후보들의 재평가 시점이 앞당겨진다.

---

## 10. 부록 — 조사 원본

- MCP 인벤토리(24개 컴포넌트, 판정 근거 전문): 워크플로우 `mcp-separation-inventory` (run wf_b7efd647-fe8) 출력
- 에이전트·스크립트 리뷰 전문: 워크플로우 `agent-script-separation-review` (run wf_4275b932-9bc) 출력
- 계획·결정 이력: `~/.claude/plans/mcp-cuddly-seal.md`
- ⚠️ 위 참조는 **세션·머신 로컬의 휘발성 저장소**라 시간이 지나면 소실될 수 있다. 재검증에 필요한 실측 근거(파일·행·커밋)는 본문에 인라인으로 남겼다
- 에이전트 리뷰의 탐색 오탐 정정 2건은 §4 Tier 3(취소선), 방향 수정 1건(agents/ 신설 기각)은 §4 총평에 기록. 스크립트 리뷰 기각 근거는 §5 Tier 3에 기록
