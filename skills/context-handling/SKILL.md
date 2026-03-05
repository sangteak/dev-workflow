---
name: context-handling
description: Use when HANDOFF.md is detected at session start, or when the user explicitly requests a handoff save during brainstorming.
---

# Context Limit Handling (HANDOFF.md)

국면이 완료되지 않은 상태에서 세션을 이어가야 할 때 사용한다.

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

`docs/design/[기능명]/HANDOFF.md` 를 즉시 생성한다.

```markdown
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

---

## 새 세션에서 HANDOFF.md 복구 흐름

Session Start Protocol에서 HANDOFF.md가 감지되면:

```
⚠️ 이전 세션이 국면 [N] 진행 중에 종료되었습니다.
HANDOFF.md를 기반으로 [국면명]을 이어서 진행합니다.
계속할까요?
```

사용자 확인 후:
1. 완료된 phase 파일들을 로드한다
2. HANDOFF.md의 진행 내용을 기반으로 중단 지점부터 이어서 진행한다
3. 국면 완료 → 해당 `phase*.md` 생성 → `HANDOFF.md` 삭제 (역할 완료)

---

## 주의 사항

- HANDOFF.md는 임시 파일이다. 국면 완료 시 반드시 삭제한다
- 동시에 여러 HANDOFF.md가 존재해서는 안 된다
- phase*.md가 생성된 국면은 HANDOFF.md 없이도 복구 가능하므로
  HANDOFF.md는 현재 진행 중인 국면 정보만 담는다
