---
name: context-handling
description: Use when HANDOFF.md is detected at session start, or when the user explicitly requests a handoff save during brainstorming.
---

# Context Limit Handling (HANDOFF.md)

국면이 완료되지 않은 상태에서 세션을 이어가야 할 때 사용한다.
멀티세션 환경을 지원하며, 여러 기능의 HANDOFF가 동시에 존재할 수 있다.

**모든 파일 경로 규칙:** `docs/design/[카테고리]/[기능명]/`

---

## 트리거 조건

자동 감지하지 않는다. 반드시 사용자의 명시적 요청으로만 실행한다.

아래 발언이 있을 때 즉시 HANDOFF.md를 생성한다:
- "핸드오프 저장해줘"
- "HANDOFF.md 만들어줘"
- "컨텍스트 부족할 것 같아, 저장하고 이어가자"
- "여기서 끊어야 할 것 같아"
- 또는 이와 유사한 세션 중단 의도가 명확한 발언

---

## HANDOFF.md 생성 규칙

현재 작업 위치에 따라 생성 경로가 결정된다:
- 메인 워크플로우: `docs/design/[카테고리]/[기능명]/HANDOFF.md`
- issues/ 서브 워크플로우: `docs/design/[카테고리]/[기능명]/issues/[문제명]/HANDOFF.md`

```markdown
---
feature: [기능명]
category: [카테고리명]
current-phase: "[Phase N 단계명]"
last-updated: [YYYY-MM-DD]
is-issue: false
parent-feature: ""
---

# Handoff: [기능명]

## 현재 상태
- 진행 중인 국면: [국면 번호 및 이름]
- 중단 시점: [구체적으로 어디까지 진행했는지]

## 확정된 페르소나
- 브레인스토밍: [목록]

## 완료된 국면
- [완료된 phase 파일 목록]

## 현재 국면 진행 내용

### 확정된 항목
- [목록]

### 미완료 항목 (다음 세션에서 이어서 진행)
- [목록]

## 다음 세션 시작 방법
1. 이 파일을 로드한다
2. [phase 파일들]을 로드한다
3. [국면명] [구체적 지점]부터 이어서 시작한다
```

**issues/ 내 HANDOFF 생성 시:**
- `is-issue: true` 로 설정
- `parent-feature: [부모 기능명]` 에 부모 기능명 기록

**issues/ 내 HANDOFF 생성·업데이트 시 부모 격리 규칙:**
- issues/ 내 HANDOFF 생성·업데이트 시 부모 Feature의 HANDOFF.md를 수정하거나 새로 생성하지 않는다
- 부모-이슈 관계는 이슈 측 메타데이터(`is-issue`, `parent-feature`)로 표현되므로 부모 HANDOFF에 이슈 정보를 중복 기록할 필요가 없다

---

## 새 세션에서 HANDOFF 탐색 및 복구

Session Start Protocol에서 호출 시:

1. `docs/design/**/HANDOFF.md` glob 탐색을 실행한다
2. 발견된 HANDOFF 파일들의 프론트매터(파일 상위 10줄)를 파싱한다
3. `last-updated` 역순으로 정렬한다
4. 아래 형식으로 목록을 제시한다:

```
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (현재 단계)
  2. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
```

5. `is-issue: true`인 HANDOFF는 `parent-feature` 하위에 들여쓰기로 표시한다
6. 사용자가 번호를 선택하면 해당 HANDOFF를 로드하고 복구 흐름을 진행한다
7. "새 작업 시작" 선택 시 일반 워크플로우 진입

**HANDOFF 미발견 시:**
`docs/design/` 구조를 분석한다:
- `phase*.md`만 존재 → 가장 최근 phase 감지, "HANDOFF를 생성하고 이어서 진행할까요?" 제안
- `plan.md` 존재 → "개발 단계 HANDOFF를 생성할까요?" 제안
- `[기능명].md`만 존재 → 완료된 기능, 미완료 작업 없음 안내

---

## HANDOFF 복구 흐름

사용자가 목록에서 작업을 선택하면:

```
⚠️ 이전 세션이 [국면명] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?
```

사용자 확인 후:
1. 완료된 phase 파일들을 로드한다
2. HANDOFF.md의 진행 내용을 기반으로 중단 지점부터 이어서 진행한다
3. 국면 완료 → 해당 `phase*.md` 생성 → `HANDOFF.md` 삭제 (역할 완료)

---

## 중간 결정 사항 업데이트

작업 진행 중 현재 작업 위치의 HANDOFF.md에 중간 결정 사항을 업데이트할 수 있다.
사용자가 명시적으로 요청하면 현재 진행 상태를 HANDOFF.md에 반영한다:
- `last-updated` 날짜 갱신
- `current-phase` 최신화
- 확정된 항목 / 미완료 항목 갱신

---

## 주의 사항

- HANDOFF.md는 임시 파일이다. 국면 완료 시 반드시 삭제한다 (또는 개발 완료 시 _archive/로 이동)
- 여러 기능의 HANDOFF.md가 동시에 존재할 수 있다 (멀티세션 지원)
- phase*.md가 생성된 국면은 HANDOFF.md 없이도 복구 가능하므로
  HANDOFF.md는 현재 진행 중인 국면 정보만 담는다
- issues/ 내 HANDOFF는 is-issue: true, parent-feature에 부모 기능명을 기록한다
