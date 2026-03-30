---
feature: dependency-setup
category: dev-workflow
status: draft
created: 2026-03-30
last-updated: 2026-03-30
dependencies: []
affects:
  - commands/ (신규 setup.md 추가)
  - CLAUDE.md (Commands 섹션 업데이트)
  - README.md (설치 섹션 업데이트)
---

# Dependency Setup 설계 문서

> 한 줄 요약: `/dev-workflow:setup` 커맨드를 통해 권장 플러그인(Superpowers, Ouroboros)을 한 번의 명령으로 설치·검증한다.

## 1. 배경과 동기

dev-workflow는 Superpowers(개발/리뷰 자동화)와 Ouroboros(페르소나 강화 브레인스토밍)에 의존하여 동작한다. 현재 이 의존성은 README.md에 산문으로만 문서화되어 있어, 사용자가:

1. README를 읽고 의존성 구조를 이해해야 하고
2. 각 플러그인을 수동으로 하나씩 설치해야 한다

Ouroboros의 `/ouroboros:setup` 경험에서 영감을 받아, 하나의 진입점으로 의존성 설치를 완료하는 메커니즘을 도입한다.

## 2. 목표와 비목표

### 목표
- GOAL-001: 단일 커맨드(`/dev-workflow:setup`)로 권장 플러그인 일괄 설치
- GOAL-002: 설치 전 현재 상태를 투명하게 표시하고 사용자 확인 후 진행
- GOAL-003: 설치 후 검증을 통해 성공/실패를 명확히 안내
- GOAL-004: 멱등 실행 보장 (반복 실행 시 안전)

### 비목표
- 플러그인 제거(uninstall) 기능을 제공하지 않는다 (기본 `/plugin uninstall` 사용)
- 버전 핀/호환성 검증은 v1에 포함하지 않는다
- 세션 시작 시 자동 감지/설치를 하지 않는다 (명시적 호출만)
- 플러그인 시스템의 내부 동작을 추상화하지 않는다

## 3. 확정된 요구사항

### REQ-001: 상태 진단
- `claude plugin list`를 실행하여 설치 여부를 판별한다
- 각 의존성을 ✅(설치됨) 또는 ☐(미설치)로 표시한다

### REQ-002: 투명한 확인
- 설치 대상 목록을 사용자에게 보여주고 확인을 받은 후 진행한다
- 모든 의존성이 이미 설치된 경우 즉시 완료 메시지를 표시한다

### REQ-003: 설치 실행
- Superpowers: `claude plugin install superpowers@claude-plugins-official`
- Ouroboros: `claude plugin marketplace add Q00/ouroboros` (미등록 시) → `claude plugin install ouroboros@ouroboros`
- 각 명령은 Bash 도구를 통해 실행한다

### REQ-004: 설치 검증
- 설치 후 `claude plugin list`를 재실행하여 성공 여부를 확인한다
- 실패 시 해당 플러그인의 수동 설치 명령어를 안내한다

### REQ-005: 세션 재시작 안내
- 설치 완료 후 "새 세션에서 모든 기능이 활성화됩니다. /clear 또는 새 세션을 시작해 주세요." 안내한다

### REQ-006: 멱등성
- `marketplace add`와 `plugin install` 모두 중복 실행에 안전함을 검증 완료
- 별도의 중복 방지 로직 없이 순차 실행한다

## 4. 기술 설계

### 4.1 파일 구조

```
commands/
├── save.md
├── resume.md
├── design-summary.md
└── setup.md              ← NEW
```

`commands/setup.md`는 별도의 스킬에 위임하지 않고 자체 로직을 포함한다.

### 4.2 의존성 테이블

setup.md 내부에 다음 테이블을 하드코딩한다:

| 이름 | 마켓플레이스 소스 | 설치명 | 필수/권장 | 역할 |
|---|---|---|---|---|
| Superpowers | (공식 — 등록 불필요) | `superpowers@claude-plugins-official` | 필수 | 개발/리뷰 자동화 |
| Ouroboros | `Q00/ouroboros` | `ouroboros@ouroboros` | 권장 | 페르소나 강화 브레인스토밍 |

### 4.3 실행 흐름

```
/dev-workflow:setup
│
├─ Step 1: 상태 진단
│  └─ claude plugin list → 각 플러그인 설치 여부 파싱
│
├─ Step 2: 결과 표시 + 확인
│  ├─ 모두 설치됨 → "모든 의존성이 설치되어 있습니다!" → 종료
│  └─ 미설치 있음 → 목록 표시 + 설치 확인 요청
│     ├─ 1. 전체 설치
│     ├─ 2. 취소
│     └─ (미설치가 1개면 선택지 불필요)
│
├─ Step 3: 설치 실행
│  ├─ Ouroboros → marketplace add (미등록 시) → plugin install
│  └─ Superpowers → plugin install
│
├─ Step 4: 검증
│  └─ claude plugin list → 설치 확인
│     ├─ 성공 → ✅ 표시
│     └─ 실패 → ❌ + 수동 명령어 안내
│
└─ Step 5: 완료 안내
   └─ 세션 재시작 안내
```

### 4.4 출력 형식

**미설치 항목 존재 시:**
```
── 🔧 dev-workflow 의존성 설정 ──────────────────────

현재 상태:
  ✅ Superpowers (설치됨) — 개발/리뷰 자동화
  ☐ Ouroboros (미설치) — 페르소나 강화 브레인스토밍

설치할 항목이 있습니다.
  1. 전체 설치
  2. 취소

──────────────────────────────────────────────────────
```

**설치 완료 시:**
```
── ✅ 설치 완료 ─────────────────────────────────────
  ✅ Superpowers
  ✅ Ouroboros

  새 세션에서 모든 기능이 활성화됩니다.
  /clear 또는 새 세션을 시작해 주세요.
──────────────────────────────────────────────────────
```

**모두 설치됨:**
```
── 🔧 dev-workflow 의존성 설정 ──────────────────────
  ✅ Superpowers (설치됨)
  ✅ Ouroboros (설치됨)

  모든 의존성이 설치되어 있습니다!
──────────────────────────────────────────────────────
```

**에러 발생 시:**
```
── ⚠️ 설치 결과 ────────────────────────────────────
  ✅ Superpowers
  ❌ Ouroboros — 설치 실패

  수동으로 설치하려면:
    claude plugin marketplace add Q00/ouroboros
    claude plugin install ouroboros@ouroboros
──────────────────────────────────────────────────────
```

## 5. 영향 범위

### 신규 파일
- `commands/setup.md`

### 수정 파일
- `CLAUDE.md` — Commands 테이블에 setup 추가
- `README.md` — 설치 섹션에 `/dev-workflow:setup` 안내 추가

### 변경 없는 파일
- `plugin.json`, `marketplace.json` — 의존성 메타데이터 추가하지 않음
- `hooks/` — 세션 시작 훅 변경 없음
- `skills/` — 기존 스킬 변경 없음

## 6. 향후 확장 (v2)

- **버전 호환성 검증**: Breaking Change 발생 시 `claude plugin list` 출력에서 버전 파싱 → 최소 버전 미달 시 업데이트 안내
- **plugin.json dependencies 필드**: 플러그인 시스템 표준이 확립되면 기계 판독 가능한 의존성 선언으로 전환
- **의존성 추가 시**: setup.md 내부 테이블에 행 추가

## 7. 수락 기준

- AC-001: `/dev-workflow:setup` 실행 시 Superpowers와 Ouroboros의 설치 상태가 정확히 표시된다
- AC-002: 미설치 플러그인 선택 설치 후 `claude plugin list`로 설치가 검증된다
- AC-003: 이미 모든 의존성이 설치된 상태에서 실행 시 "모든 의존성이 설치되어 있습니다" 메시지가 표시된다
- AC-004: 설치 실패 시 수동 설치 명령어가 안내된다
- AC-005: 설치 완료 후 세션 재시작 안내가 표시된다

## 8. 열린 질문

없음. 모든 설계 결정이 확정되었다.

## 9. 관련 문서

- [ouroboros-integration](../ouroboros-integration/ouroboros-integration.md) — Ouroboros 연동 설계
- [workflow-lifecycle](../workflow-lifecycle.md) — 워크플로우 생명주기

## 10. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|---|---|---|
| 2026-03-30 | draft | 초안 작성 |
