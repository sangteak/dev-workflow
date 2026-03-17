---
feature: design-doc-index
category: dev-workflow
status: complete
created: 2026-03-16
last-updated: 2026-03-17
dependencies:
  - document-consolidation
affects:
  - brainstorming
  - plan-stage
---

# design-doc-index 설계 문서

> 한 줄 요약: 브레인스토밍/플랜 중 기존 설계 문서를 자연어로 참조하여 컨텍스트에 로드하는 스킬

## 1. 배경과 동기

- 기능을 설계할 때 기존에 구현 완료된 관련 시스템의 설계를 참고해야 하는 경우가 빈번하다
- 예: 상점 시스템 설계 시 재화 관리, 인벤토리, 메일 시스템의 설계를 이해해야 함
- 현재는 사용자가 수동으로 파일 경로를 찾아 읽어야 하며, 어떤 설계 문서가 존재하는지 파악하기 어렵다
- 자연어 키워드 하나로 관련 문서를 자동 탐색/로드할 수 있으면 워크플로우 효율이 크게 향상된다

## 2. 목표와 비목표

### 목표
- GOAL-001: 사용자가 자연어 키워드로 기존 설계 문서를 참조할 수 있다
- GOAL-002: 구현 완료된 설계 문서만 색인 대상으로 하여 신뢰성 확보
- GOAL-003: 컨텍스트 비용을 사용자가 제어할 수 있도록 두 가지 로드 모드 제공

### 비목표
- 별도 인덱스 파일 생성/관리 — 실시간 스캔으로 대체
- 카테고리 레벨 문서 통합 — 별도 피처로 분리
- DEVELOP/REVIEW 단계 지원 — 1차 범위는 BRAINSTORM/PLAN만
- 프론트매터 별칭(aliases)/태그(tags) 기반 검색 — 향후 확장 고려사항

## 3. 확정된 요구사항

- REQ-001: 독립 스킬(`design-doc-index`)로 구현한다 — 우선순위: HIGH
- REQ-002: brainstorming/plan-stage에서 사용자 발화 감지 시 자동 호출한다 — 우선순위: HIGH
- REQ-003: `status: complete` 프론트매터 값을 가진 설계 문서만 색인 대상으로 한다 — 우선순위: HIGH
- REQ-004: 색인 모드(메타데이터 목록)를 제공한다 — 우선순위: HIGH
- REQ-005: 전체 로드 모드(깊은 참조)를 제공한다 — 우선순위: HIGH
- REQ-006: 사용자 발화 패턴으로 모드를 자동 판단한다 — 우선순위: MEDIUM
- REQ-007: 디렉토리명 기반 부분 매칭(substring)으로 카테고리/기능 양쪽 레벨을 검색한다 — 우선순위: HIGH
- REQ-008: 다중 문서 동시 로드를 지원한다 — 우선순위: HIGH
- REQ-009: 단계적 로드 전략을 적용한다 (1~3건: 즉시 로드 / 4건+: 목록 후 선택) — 우선순위: MEDIUM
- REQ-010: 별도 인덱스 파일을 생성하지 않고 실시간 스캔한다 — 우선순위: HIGH

## 4. 설계 개요

### 스킬 구조
- `skills/design-doc-index/SKILL.md` 파일로 구현 (Markdown 스킬)
- `plugin.json` skills 배열에 등록

### 동작 흐름

```
사용자 발화 (brainstorming/plan-stage 중)
  │
  ├─ 탐색적 발화 ("어떤 기능 있어?", "목록 보여줘")
  │   └─ 색인 모드 실행
  │       1. docs/design/**/*/*.md glob 탐색
  │       2. 각 파일 프론트매터 status: complete 필터링
  │       3. 메타데이터 목록 제시 (feature, 한줄요약, dependencies, affects)
  │       4. 사용자가 목록에서 참조 요청 시 → 전체 로드로 전환
  │
  └─ 참조 발화 ("aggro 참고해서", "peek 기반으로")
      └─ 전체 로드 모드 실행
          1. 키워드로 카테고리/기능 디렉토리 부분 매칭
          2. 매칭된 문서의 status: complete 필터링
          3-a. 1~3건: 즉시 전체 로드 + "N건의 설계 문서를 로드합니다" 안내
          3-b. 4건+: 매칭 목록 제시 → 사용자 선택(다중 선택 가능) → 전체 로드
          4. 로드된 문서 컨텍스트를 현재 세션에 주입
```

### 상세 시나리오

**시나리오 1: 색인 모드 — 기존 문서 탐색**
```
사용자: "상점 시스템을 설계하려는데, 참고할 만한 기존 시스템이 뭐가 있어?"

Claude: 📚 구현 완료된 설계 문서 (5건)
  1. game-system/currency — "재화 획득/소비 관리 시스템"
  2. game-system/inventory — "아이템 보관 및 슬롯 관리"
  3. game-system/mail — "우편함 첨부 아이템/재화 수령"
  ...

사용자: "1번이랑 2번 참고해서 진행하자"  ← 전체 로드로 전환
Claude: 📖 2건 로드합니다.
```

**시나리오 2: 전체 로드 — 1~3건 즉시 로드**
```
사용자: "currency랑 inventory 참고해서 상점 설계하자"

Claude: 📖 2건의 설계 문서를 로드합니다.
  - game-system/currency
  - game-system/inventory
[페르소나들이 두 시스템의 설계 내용을 이해한 상태로 토론 진행]
```

**시나리오 3: 전체 로드 — 4건+ 목록 후 다중 선택**
```
사용자: "peek 관련 시스템 전부 참고해서 설계하자"

Claude: 📖 "peek" 관련 설계 문서가 6건 매칭되었습니다.
  1. peek-system/peek-core — "Peek 기본 진입/종료 루프"
  2. peek-system/peek-ui — "Peek UI 레이아웃 및 전환"
  3. peek-system/peek-networking — "Peek 멀티플레이 동기화"
  4. peek-system/peek-combat — "Peek 전투 특수 룰"
  5. peek-system/peek-reward — "Peek 보상 정산"
  6. peek-system/peek-matchmaking — "Peek 매칭 큐 시스템"

전부 로드할까요, 아니면 필요한 문서를 선택하시겠습니까?

사용자 선택지:
  - "전부 로드해" → 6건 모두 로드
  - "1, 2, 3번만" → 다중 선택 로드
  - "core랑 combat만" → 키워드로 선택
```

**4건 이상에서 목록을 먼저 보여주는 이유:**
- 사용자가 실제로 전부 필요한지 판단할 기회 제공
- 부분 매칭 특성상 의도하지 않은 문서가 포함될 수 있음
- 다중 선택 가능 (번호, 키워드, "전부" 모두 허용)

### 모드 자동 판단

| 사용자 발화 패턴 | 모드 |
|---|---|
| "~~ 참고해서", "~~ 기반으로", "~~ 고려해서" | 전체 로드 |
| "어떤 기능 있어?", "목록 보여줘", "관련된 거 뭐 있어?" | 색인 모드 |
| 모호한 경우 | "전체 문서를 로드할까요, 목록만 볼까요?" 확인 |

### 매칭 전략

```
키워드: "peek"

카테고리 레벨: docs/design/*peek*/ 매칭
기능 레벨:     docs/design/*/*peek*/ 매칭

결과: peek-system/peek-core, peek-system/peek-ui, peek-system/peek-networking 등
```

### 워크플로우 통합

- brainstorming SKILL.md에 트리거 규칙 추가
- plan-stage SKILL.md에 트리거 규칙 추가
- workflow-orchestrator 수정 불필요
- 사용자 요청 시에만 동작 (세션 시작 자동 안내 없음)

## 5. 의존성 맵

| 컴포넌트 | 의존 대상 | 영향받는 컴포넌트 |
|----------|-----------|------------------|
| design-doc-index | document-consolidation (`status: complete` 규칙) | brainstorming, plan-stage (트리거 규칙 추가) |
| design-doc-index | 설계 문서 표준 포맷 (프론트매터) | — |

## 6. 기술 결정 및 대안 검토

| 결정 사항 | 선택 | 근거 | 검토한 대안 | 기각 사유 |
|-----------|------|------|-------------|-----------|
| 색인 방식 | 실시간 스캔 | 동기화 문제 없음, 관리 비용 제로 | 별도 인덱스 파일 | 깨짐/복구 로직 필요, 동기화 문제 |
| 매칭 방식 | 디렉토리명 부분 매칭 | 단순, 기존 네이밍 규칙 활용 | 프론트매터 aliases/tags | 오버엔지니어링, 1차 버전에선 불필요 |
| 완료 판단 | `status: complete` | document-consolidation 기존 규칙 활용 | `_archive/` 존재 여부 | 간접적 신호, 명시적 상태값이 명확 |
| 스킬 형태 | 독립 스킬 | 로직 중복 방지, 확장 용이 | brainstorming/plan-stage 내장 | 두 스킬에 동일 로직 중복 |
| 다중 로드 상한 | 없음 (단계적 로드) | 사용자 판단 존중, 자연스러운 UX | 고정 상한(3건) | 영향도 파악 제한 |

## 7. 제약조건과 가정

- 설계 문서는 표준 포맷(프론트매터 포함)을 따른다고 가정
- `status: complete`는 document-consolidation 스킬이 설정한다고 가정
- 기능명 = 디렉토리명 = 파일명 규칙이 유지된다고 가정
- 프로젝트당 설계 문서 수는 수십~수백 건 수준이라고 가정 (실시간 스캔 성능 충분)

## 8. 기술 가이드라인

- glob 탐색: `docs/design/*키워드*/*/*.md` + `docs/design/*/*키워드*/*.md` 패턴
- 프론트매터 파싱: 파일 상단 `---` 블록만 읽어 YAML 파싱
- 색인 모드 출력: feature, 한 줄 요약(첫 blockquote), dependencies, affects
- 전체 로드: 문서 전체를 컨텍스트에 주입
- brainstorming/plan-stage 스킬에 invoke 규칙 텍스트 추가

## 9. 구현 결과 및 일탈 사항

모든 요구사항(REQ-001~010)이 설계대로 구현되었다. 일탈 사항 없음.

### 구현 산출물
- `skills/design-doc-index/SKILL.md` — 색인/전체 로드 모드, 트리거 패턴(한국어/영어), 매칭 전략, 단계적 로드 전략 포함
- `skills/brainstorming/SKILL.md` — "설계 문서 크로스레퍼런스" 섹션 추가 (국면 1~3 공통)
- `skills/plan-stage/SKILL.md` — "설계 문서 크로스레퍼런스" 섹션 추가 (Step 1 이후 공통)
- `CLAUDE.md` — Skills 테이블 7개 → 8개 업데이트
- `.claude-plugin/plugin.json`, `marketplace.json` — 1.2.1 → 1.3.0

### 검증 결과
- 구조 검증 5/5 PASS (스킬 파일 구조, 크로스레퍼런스, CLAUDE.md, 버전 동기화)
- 동작 시뮬레이션: glob 탐색, `status: complete` 필터링, 부분 매칭 모두 정상 동작 확인

## 10. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 | 상태 |
|------|-----------|-----------|------|
| 2026-03-16 | 초안 작성 (브레인스토밍 완료) | — | ready-for-plan |
| 2026-03-17 | 개발 완료 — 문서 통합 | 전체 | complete |
