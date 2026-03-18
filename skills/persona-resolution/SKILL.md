---
name: persona-resolution
description: Use at session start to confirm personas for the current workflow stage. Runs before any workflow stage begins.
---

# Persona Resolution

페르소나 확정은 매 세션 시작 시 반드시 실행한다.
사용자가 최종 페르소나를 인식하고 확정해야만 다음 단계로 넘어간다.

---

## Step 1: personas.md 확인

`.claude/personas.md` 존재 여부를 확인한다.

### [Case A] personas.md 존재 시

현재 단계에 해당하는 페르소나를 추출해서 제시하고 사용 여부를 묻는다:

```
📋 프로젝트 페르소나 파일이 있습니다. 현재 단계([단계명])의 페르소나:

  [이모지] [이름]: [역할 설명]
  [이모지] [이름]: [역할 설명]
  [이모지] [이름]: [역할 설명]

이 페르소나를 사용할까요?

1. Yes
2. No
```

- 1(Yes) → 해당 페르소나 확정, Step 2 생략
- 2(No) → Step 2로 이동

**예외: 동일 세션 내에서 personas.md를 방금 생성한 경우**
Yes/No 확인 없이 자동 적용하고 확정만 선언한다:

```
✅ 방금 저장한 페르소나를 [단계명] 단계에 적용합니다:
  [이모지] [이름] / [이모지] [이름] / [이모지] [이름]
```

### [Case B] personas.md 없을 시

Step 2로 바로 이동한다.

---

## Step 2: 기본 페르소나 제시 및 수정 기회 제공

현재 단계에 해당하는 기본 페르소나를 제시한다:

```
📋 기본 페르소나를 제시합니다. 현재 단계: [단계명]

  [이모지] [이름]: [역할 설명]
  [이모지] [이름]: [역할 설명]
  [이모지] [이름]: [역할 설명]

이대로 진행하거나, 수정할 페르소나를 알려주세요.
(예: "두 번째를 🎮 Combat Designer로 바꿔줘" / "그대로 진행해")
```

사용자 응답을 반영한 뒤 확정 선언:

```
✅ 페르소나 확정:
  [이모지] [이름] / [이모지] [이름] / [이모지] [이름]
```

---

## 기본 페르소나 정의 (Fallback)

페르소나는 BRAINSTORM과 PLAN 단계에서만 사용한다.
DEVELOP/REVIEW는 Superpowers 서브에이전트가 전담한다.

| 단계 | 페르소나 A | 페르소나 B | 페르소나 C |
|---|---|---|---|
| 브레인스토밍 (국면1~2) | 🎮 Game Designer | 👤 Player | 🔧 TD (국면3 활성화) |
| PLAN | 🏛️ Architect | 🔧 Tech Lead | 📋 PM |

---

## Session End: Persona Save Suggestion

`.claude/personas.md` 가 없는 상태에서 아래 시점에 도달하면 저장을 제안한다:
- 브레인스토밍 국면 4 완료 (설계 문서 확정 직후)
- 전체 워크플로우 완료 (REVIEW 완료 또는 태스크 완료)

```
💾 이번 세션에서 사용한 페르소나를 저장해두면 다음 세션 시작 시
   페르소나 확인 단계가 간소화됩니다.

  사용한 페르소나:
    BRAINSTORM: [목록]
    PLAN:       [목록]

  `.claude/personas.md` 로 저장할까요?

  1. Yes
  2. No
```

- 1(Yes) → `.claude/personas.md` 파일을 직접 생성한다
- 2(No) → 다음 세션에서도 동일하게 페르소나 확인 프로세스를 거친다

**저장 제안 조건:**
- 세션 중 페르소나가 한 번이라도 확정된 경우에만 제안
- 이미 `.claude/personas.md` 존재하는 경우 제안하지 않음
- 사용자가 "저장 필요 없어" 류의 발언을 한 경우 제안하지 않음
