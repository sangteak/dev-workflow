---
name: context-handling
description: "Context handoff management. Subcommands: 'save' (create HANDOFF.md for session transfer), 'resume' (find and restore from HANDOFF.md). Also invoked automatically at session start to detect in-progress work."
---

# Context Limit Handling (HANDOFF.md)

국면이 완료되지 않은 상태에서 세션을 이어가야 할 때 사용한다.
멀티세션 환경을 지원하며, 여러 기능의 HANDOFF가 동시에 존재할 수 있다.

**모든 파일 경로 규칙:** `docs/design/[카테고리]/[기능명]/`

---

## 모드 라우팅

args에 따라 분기한다:

| args | 동작 | 참조 섹션 |
|------|------|-----------|
| `save` | HANDOFF.md 생성 후 안내 메시지 출력 | → "Mode: save" 섹션 |
| `resume` | HANDOFF 탐색, 목록 제시, 작업 복구 | → "Mode: resume" 섹션 |
| (없음) | 세션 시작 시 자동 탐색/목록 제시 (기존 동작) | → "트리거 조건 A" 이하 기존 로직 |

---

## 트리거 조건

### A. 세션 시작 시 (orchestrator에서 invoke)
workflow-orchestrator의 Session Start Protocol Step 2에서 자동 invoke된다.
진행 중인 작업 탐색 및 목록 제시를 담당한다.

### B. HANDOFF 저장 요청 시

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

## 새 세션에서 작업 탐색 및 목록 제시

Session Start Protocol에서 invoke 시, 아래 절차를 실행한다.
탐색부터 목록 제시까지의 과정을 사용자에게 출력하지 않는다.
결과만 통합 목록 템플릿으로 제시한다.

### 탐색 절차

docs/design/ 하위를 탐색하여 진행 중인 작업을 수집한 뒤, 아래 통합 목록 템플릿으로만 출력한다.

1. `docs/design/` 존재 여부를 확인한다
   - 존재하지 않으면 → "작업 없음" 템플릿을 출력하고 종료한다
2. 아래 파일을 수집한다 (`_archive/` 경로 포함 항목은 즉시 제외):
   - `docs/design/**/HANDOFF.md`
   - `docs/design/**/phase*.md`
   - 각 기능 디렉토리의 `[기능명].md`, `plan.md`
3. 디렉토리별로 그룹핑한 뒤, 아래 우선순위로 상태를 판정한다:
   1) `status: complete` → 완료, 목록에서 제외. HANDOFF.md가 잔존하면 잔존 목록에 추가한다
   2) HANDOFF.md 있음 → `current-phase` 값을 라벨로 사용
   3) `plan.md` 존재 + `status` ≠ `complete` → 라벨: `DEVELOP 진행 중`
   4) `[기능명].md` 존재 + `status: ready-for-plan` → 라벨: `PLAN 대기`
   5) `phase*.md`만 존재 → 가장 높은 phase 번호 + `완료` (예: `Phase 2 완료`)
   6) 위 어디에도 해당하지 않음 → 목록에서 제외
4. HANDOFF 없는 항목에는 `⚠️ HANDOFF 없음` 태그를 부착한다
5. `is-issue: true`인 HANDOFF 또는 `issues/` 하위 항목은 `parent-feature` 하위에 들여쓰기로 표시한다
6. `last-updated` (HANDOFF) 또는 가장 최근 파일 수정일 역순으로 정렬한다
7. 통합 목록 템플릿으로 출력한다
8. 잔존 HANDOFF가 있으면 목록 하단에 정리 제안을 출력한다

### 잔존 HANDOFF 정리

탐색 중 `status: complete`인데 HANDOFF.md가 남아있는 항목이 발견되면,
통합 목록 출력 후 아래 메시지를 추가한다:

```
🧹 완료된 작업에 HANDOFF.md가 남아있습니다:
  - [카테고리]/[기능명]/HANDOFF.md
  - [카테고리]/[기능명]/issues/[문제명]/HANDOFF.md

삭제할까요?

1. Yes — 모두 삭제
2. No — 유지
```

- 사용자가 Yes → 해당 HANDOFF.md 파일을 삭제한다
- 사용자가 No → 삭제하지 않고 진행한다
- 이 제안은 통합 목록 제시 후에만 출력한다 (탐색 과정 중 출력 금지)

### ⛔ 금지 출력

탐색부터 목록 제시 사이에 다음을 출력하지 않는다:
- "탐색합니다", "검색 중", "파일을 찾고 있습니다"
- glob 실행 결과 (파일 수, 경로 목록)
- "HANDOFF.md가 없습니다", "다른 위치에서 찾겠습니다"
- sequential-thinking 등 내부 추론 과정
- 탐색 성공/실패 중간 보고

### 통합 목록 템플릿

**진행 중인 작업이 있는 경우:**

````
📋 진행 중인 작업:

  0. ✨ 새 작업 시작
  1. [카테고리] 기능명 (현재 단계) — 최근: YYYY-MM-DD
       └─ 🔧 이슈: 문제명 (현재 단계)
  2. [카테고리] 기능명 (Phase 1 완료 · ⚠️ HANDOFF 없음) — 최근: YYYY-MM-DD

이어서 진행할 작업을 선택하거나, 새 작업을 시작하세요.
````

**진행 중인 작업이 없는 경우:**

````
📋 진행 중인 작업이 없습니다.

  0. ✨ 새 작업 시작

새 작업을 시작하세요.
````

---

## 작업 복구 흐름

사용자가 목록에서 작업을 선택하면, HANDOFF 유무에 따라 다른 안내를 제시한다.

### HANDOFF 있는 경우

````
⚠️ 이전 세션이 [국면명] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?
````

사용자 확인 후:
1. 완료된 phase 파일들을 로드한다
2. HANDOFF.md의 진행 내용을 기반으로 중단 지점부터 이어서 진행한다
3. 국면 완료 → 해당 `phase*.md` 생성 → `HANDOFF.md` 삭제 (역할 완료)

### HANDOFF 없는 경우

````
⚠️ 이 작업에는 HANDOFF.md가 없습니다.
마지막으로 완료된 단계는 [Phase N / PLAN 대기 / DEVELOP]입니다.
[다음 단계명]부터 새로 시작합니다. 계속할까요?
````

사용자 확인 후:

| 라벨 | 복구 동작 |
|------|----------|
| Phase N 완료 | phase 파일 로드 → Phase N+1부터 시작 |
| PLAN 대기 | [기능명].md 로드 → PLAN 단계 진입 |
| DEVELOP 진행 중 | plan.md 로드 → 태스크 체크리스트 확인 후 재개 |

### "새 작업 시작" 선택 시

일반 워크플로우 진입 (orchestrator의 Stage Detection으로 이동)

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

---

## Mode: save

`/context-handling save`로 호출 시 실행한다.

### 실행 절차

1. 현재 세션의 작업 컨텍스트(카테고리/기능명, 진행 중인 국면)를 파악한다
   - 세션 내에 작업 컨텍스트가 없으면: "현재 진행 중인 작업을 식별할 수 없습니다. 저장할 작업을 지정해주세요." 안내 후 종료
2. "HANDOFF.md 생성 규칙" 섹션의 템플릿에 따라 HANDOFF.md를 생성한다
3. 생성 완료 후 아래 안내 메시지를 출력한다:

````
✅ HANDOFF 저장 완료: docs/design/[카테고리]/[기능명]/HANDOFF.md

/clear 후 아무 메시지를 입력하면 자동으로 작업 목록이 표시됩니다.
(또는 /context-handling resume 으로 직접 복구할 수 있습니다.)
````

### 기존 자연어 트리거와의 관계

"트리거 조건 B"의 자연어 트리거("핸드오프 저장해줘" 등)는 기존과 동일하게 동작한다.
`/context-handling save`는 동일한 HANDOFF 생성 로직의 명시적 진입점이다.

---

## Mode: resume

`/context-handling resume`으로 호출 시 실행한다.

### 실행 절차

"새 세션에서 작업 탐색 및 목록 제시" 섹션의 탐색 절차를 그대로 실행한다:

1. docs/design/ 하위를 탐색하여 진행 중인 작업을 수집한다
2. 통합 목록 템플릿으로 제시한다
3. 사용자가 작업을 선택하면 "작업 복구 흐름"에 따라 복구한다

### orchestrator invoke와의 관계

세션 시작 시 orchestrator가 args 없이 invoke하는 것과 동일한 로직을 실행한다.
`/context-handling resume`은 사용자가 명시적으로 복구를 요청하는 진입점이다.
