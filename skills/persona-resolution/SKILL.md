---
name: persona-resolution
description: Use when entering BRAINSTORM or PLAN stage to resolve personas. Applies saved project personas automatically; asks only when no saved personas exist.
---

# Persona Resolution

BRAINSTORM 또는 PLAN 단계 진입 시 실행한다 (단계 감지 이후 — 페르소나는 이 두 단계에서만 사용).
HANDOFF 복구 시에는 HANDOFF의 "확정된 페르소나"를 그대로 적용하고 본 스킬을 생략한다.

---

## Step 1: personas.md 확인

`.claude/personas.md` 존재 여부를 확인한다.

### [Case A] personas.md 존재 시 — 자동 적용 + 확정 선언

파일을 저장했다는 것 자체가 사용 의사 표명이므로 재확인하지 않는다.
현재 단계에 해당하는 페르소나를 추출해 자동 적용하고, 응답 대기 없이 선언 후 진행한다:

```
✅ 프로젝트 페르소나 적용([단계명]): [이모지] [이름] / [이모지] [이름] / [이모지] [이름]
   (변경하려면 말씀하세요)
```

사용자가 변경을 요청하면 즉시 반영한다 (응답 주권).

### [Case B] personas.md 없을 시

Step 2로 이동한다. 저장된 사용 의사가 없고 기본 페르소나는 도메인 추정치이므로,
이 경우에만 확인을 거친다 (저장 제안에 의해 프로젝트당 사실상 1회).

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

  1. Yes — 고르면: .claude/personas.md가 생성되어 다음 세션부터 확인 없이 자동 적용됩니다
  2. No — 고르면: 다음 세션에도 페르소나 확인을 거칩니다
```

- 1(Yes) → `.claude/personas.md` 파일을 직접 생성한다
- 2(No) → 다음 세션에서도 동일하게 페르소나 확인 프로세스를 거친다

**저장 제안 조건:**
- 세션 중 페르소나가 한 번이라도 확정된 경우에만 제안
- 이미 `.claude/personas.md` 존재하는 경우 제안하지 않음
- 사용자가 "저장 필요 없어" 류의 발언을 한 경우 제안하지 않음
