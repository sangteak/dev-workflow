---
type: semantic | quantitative | structural   # 필수 — 검증자 라우팅 결정
applies-to: [develop, review, completion, plan, all]   # 선택, 기본 [all] — 단계 라우팅
auto-fix: true | false | confirm   # 선택, 기본 confirm — 자동 수정 정책
---

# [규칙 이름]

## Rule (필수)
[규칙을 한 문장으로 명확히 작성. 무엇을 강제할지.]

## Examples (강력 권장)
✅ Good:
```
[Good 예시 코드/형식]
```

❌ Bad:
```
[Bad 예시 코드/형식]
```

## Rationale (선택)
[이 규칙이 필요한 이유. 통증/원칙/근거.]

## Anti-patterns (선택)
- [피해야 할 패턴 1]
- [피해야 할 패턴 2]

---

## frontmatter 필드 설명

### type (필수)
- `semantic` — 자연어 평가 (코드 스타일, 함수 작성 원칙). REVIEW 시 Superpowers code-reviewer가 판단
- `quantitative` — 정량 검증 (커밋 메시지 형식, 명명 규칙). Ouroboros Evaluator가 PASS/FAIL
- `structural` — 구조 규칙 (디렉토리 배치, 의존성 방향). Ouroboros Evaluator가 PASS/FAIL

### applies-to (선택, 기본 [all])
- `develop` — 코드 작성 시 Implementer에 주입
- `review` — 코드 리뷰 시 code-reviewer/Evaluator에 주입
- `completion` — 커밋 시 (커밋 메시지 형식 등)
- `plan` — 설계 시 Architect 페르소나에 주입
- `all` — 모든 단계 SessionStart 전역에 주입 (단계별 2차 주입에서는 중복 방지로 제외됨)

### auto-fix (선택, 기본 confirm)
- `true` — 위반 시 자동 수정 + 별도 커밋 + 테스트 재실행 + 실패 시 자동 롤백
- `confirm` — 위반 시 사용자에게 확인 질문 후 결정 (기본값, 안전)
- `false` — 위반 보고만, 사용자가 수동 처리

## 작성 팁

- **Rule 한 문장**: 추상적이지 않게. "함수는 20줄 이하" > "함수를 작게 유지"
- **Examples 필수에 가까움**: code-reviewer/Evaluator의 판정 정밀도가 Examples 유무로 크게 갈림
- **헤더로 세분화 가능**: 한 파일 내 `## Functions`, `## Naming`, `## Comments` 같이 헤더로 여러 규칙 묶기 가능
- **파일명 prefix 권장**: `coding_*`, `commit_*`, `review_*` 등으로 도메인 그룹화
- **examples/ 서브디렉토리**: 학습용 샘플은 `.claude/rules/examples/` 에 둔다. 글로브에서 자동 제외되어 활성화되지 않음.
