# design-doc-index 구현 계획

> 설계 문서: `docs/design/dev-workflow/design-doc-index/design-doc-index.md`
> 날짜: 2026-03-16

## 태스크 목록

### Task 1: design-doc-index 스킬 파일 생성

**파일:** `skills/design-doc-index/SKILL.md`

새 스킬의 핵심 로직을 Markdown으로 정의한다. 포함 내용:

- 스킬 메타데이터 (name, description)
- **색인 모드** 동작 규칙
  - `docs/design/**/*/*.md` glob 탐색
  - 프론트매터 `status: complete` 필터링
  - 메타데이터 목록 출력 포맷 (feature, 한줄요약, dependencies, affects)
- **전체 로드 모드** 동작 규칙
  - 키워드 → 디렉토리명 부분 매칭 (카테고리/기능 양쪽 레벨)
  - glob 패턴: `docs/design/*키워드*/*/[기능명].md` + `docs/design/*/*키워드*/[기능명].md`
  - 1~3건: 즉시 전체 로드 + 안내
  - 4건+: 목록 제시 → 사용자 다중 선택 → 전체 로드
- **모드 자동 판단** 규칙
  - 한국어/영어 트리거 패턴 열거
  - 확실한 패턴만 자동 판단, 나머지 사용자 확인
- **색인 → 전체 로드 전환** 규칙

**완료 기준:** 스킬 파일이 기존 7개 스킬과 동일한 구조로 작성됨

---

### Task 2: brainstorming 스킬에 트리거 규칙 추가

**파일:** `skills/brainstorming/SKILL.md`

brainstorming 스킬에 설계 문서 참조 트리거 규칙을 추가한다:

- 국면 1~3 진행 중 사용자가 기존 설계 문서를 참조하려 할 때 `design-doc-index` 스킬을 invoke
- 트리거 감지 패턴 명시
- invoke 후 로드된 컨텍스트를 현재 국면에서 활용하는 방법 명시

**삽입 위치:** 페르소나 피드백 루프 섹션 앞 또는 국면 공통 규칙으로 추가

**완료 기준:** brainstorming 중 설계 문서 참조 발화 시 자동 호출 규칙이 문서에 존재

---

### Task 3: plan-stage 스킬에 트리거 규칙 추가

**파일:** `skills/plan-stage/SKILL.md`

plan-stage 스킬에 설계 문서 참조 트리거 규칙을 추가한다:

- Step 2 (Feasibility Assessment) 또는 Step 4 (설계 방향 수립) 중 기존 설계 문서 참조 필요 시 `design-doc-index` 스킬을 invoke
- 트리거 감지 패턴 명시

**삽입 위치:** Step 1 이후 공통 규칙으로 추가

**완료 기준:** plan-stage 중 설계 문서 참조 발화 시 자동 호출 규칙이 문서에 존재

---

### Task 4: 버전 범프

**파일:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

새 스킬 추가이므로 minor 버전을 올린다:
- `1.2.1` → `1.3.0`
- 두 파일 동시 업데이트

**완료 기준:** 두 파일의 version이 `1.3.0`으로 동기화됨

---

## 의존 관계

```
Task 1 (스킬 생성) → Task 2, 3 (트리거 규칙 추가) → Task 4 (버전 범프)
```

Task 2와 Task 3은 병렬 가능. Task 1이 완료되어야 invoke 대상 스킬명이 확정됨.

## 구현 시 참고사항

- 모든 파일은 Markdown 수정만 — 코드 변경 없음
- CLAUDE.md의 스킬 테이블(Skills 7개 → 8개) 업데이트 필요
- 설계 문서 프론트매터의 `status` 값이 현재 `ready-for-plan` 외에 어떤 값을 거치는지는 document-consolidation 스킬의 규칙을 따름
