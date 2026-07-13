> merge-to-domain SKILL.md의 참조 자료 (verbatim). 본문 디스패치 지점의 Read 지시로 로드된다.

## 「digest 필드 정의와 LLM 후처리」

digest의 원본은 dev-workflow MCP 서버 `digest_extract` 도구의 출력(JSON)이다 — LLM이 직접 추출하거나 재작성하지 않는다.

**도구 출력 필드 (결정적 — 값 수정 금지):**

| 필드 | 내용 |
|---|---|
| `policies[]` | `{id, statement, source_section}` — domain은 `POL-NNN`, feature는 `F-POL-NNN`. 문서에 명시된 ID는 보존 (재부여 없음) |
| `decisions[]` | `{id, statement, source_section}` — domain은 `DEC-NNN`, feature는 `F-DEC-NNN`. "결정" 헤딩 아래 항목이 여기로 분류된다 |
| `requirement_ids[]` | 문서 등장 순 `REQ-NNN` (중복 제거, 재부여 없음 — feature의 REQ는 domain과 충돌 가능) |
| `section_order[]` | H2 섹션 등장 순서 |
| `line_count` | 라인 수 — merge_verify의 `pre_line_count` 입력으로 사용 |

**LLM 후처리 필드 (도구 출력에 부여 — 의미 판단):**

| 필드 | 부여 규칙 |
|---|---|
| `immutability_level` | domain 정책별 `high`/`medium`/`low` — 문서가 명시적으로 불변·강제·금지를 선언한 정책은 high, 권장·기본값은 medium, 예시·참고는 low. (3) 머지 계획의 충돌 분류에서 변형 허용 수준 판단에 사용 |
| `decisions[].supersedes` | 이전 결정을 명시적으로 대체하는 경우 해당 결정 ID, 기본 null |
| 항목 재분류 | 도구는 헤딩 신호만으로 policy/decision을 나눈다 — 문맥상 재분류가 필요하면 LLM이 조정하되 id·statement는 유지한다 |

후처리는 도구 출력 JSON에 필드를 덧붙이는 방식으로만 수행한다 — id·statement·순서 변경 금지.

## 「domain digest 사후 고지 출력」

```
📄 digest 추출 완료 — 정책 [N]건·결정 [M]건 (오추출은 dry-run 원문 대조와 검증 단계가 잡습니다 · 상세를 보려면 "digest 보여줘")
```

## 「feature digest 사후 고지 출력」

```
📄 digest 추출 완료 — 정책 [N]건·결정 [M]건 (오추출은 dry-run 원문 대조와 검증 단계가 잡습니다 · 상세를 보려면 "digest 보여줘")
```

## 「dry-run plan 예시」

```
── 머지 계획 (dry-run) ────────────────────────────

대상: matchmaking.md (도메인)
머지 후보: rating-system, br-mode-system

[자동 수정 항목 — 회계 형식]
- feature.REQ-001 → domain.REQ-008 (renumbering)
  참조 갱신: feature.md 섹션 4 (2건), 섹션 6 (1건)
- 표 형식 통일: 의존성 맵 컬럼 순서

[사용자 결정 항목]
1. 의미 충돌: domain의 "MMR 기준" vs feature의 "latency 기준"
2. 새 섹션 "보안 고려사항" 신설 위치

승인 후 검증을 통과하면 feature 디렉토리(docs/design/[카테고리]/[기능명]/)가 삭제됩니다.
커밋 미리보기: docs(merge): [카테고리] ← [기능명]

이대로 진행할까요?
1. Yes
2. No (abort)
```

## 「인터랙티브 fallback 메뉴」

```
── merge-to-domain 옵션 ────────────────────

머지 진행 방식을 선택하세요:

1. 기본 (Architect 자동 발동, 자동 수정 확인 요구)
2. 자동 모드 (자동 수정 사후 확인 생략)
3. 리뷰 차단 (Architect 차단, 긴급용)
4. 커스텀 (개별 옵션 선택)

선택: _
```

## 「자동 모드 키워드 표 + 진입 고지 출력」

| 한국어 | 영어 |
|---|---|
| "다 자동으로", "자동으로 진행" | "auto mode", "yolo" |
| "이번엔 그냥 진행", "알아서 해" | "all auto", "skip confirms" |
| "yolo", "자동 모드" | "yes to all", "go go" |

```
🔁 자동 모드로 진행합니다 (감지 키워드: [키워드]) — 사용자 결정 필요 항목(의미 충돌 등)은 여전히 개별로 여쭙습니다. (수동 진행을 원하시면 말씀하세요)
```

## 「호환성 첫 머지 체크리스트 표」

| 항목 | 부재 시 처리 |
|---|---|
| 섹션 10 변경 이력 | 시작점 행만 자동 추가 (`\| YYYY-MM-DD \| 기존 문서 — 신규 머지 시작 이전 \| - \| - \|`). **소급 기록 금지**. 신설 위치: 기존 도메인의 **마지막 H2 섹션 다음**. "섹션 10"은 권장 번호이며, 실제 위치는 문서의 H2 섹션 수에 맞춰 자연 배치한다 (도메인이 9개 섹션 이하일 경우 마지막 섹션 다음에 추가). |
| 정책 ID | 첫 머지에서 사용자 결정 (자동 부여 vs 보존). 자동 부여 선택 시 → 머지 적용 단계에서 **표에 ID 명시 컬럼을 추가**하여 후속 idempotency를 영구 보장한다. |
| 결정 ID | 정책 ID와 동일 규칙 (자동 부여 vs 보존). "핵심 결정 사항" 표가 ID 없이 존재하는 경우, 자동 부여 시 DEC-NNN 컬럼 신설로 영구화. |
| 요구사항 ID | 첫 머지에서 사용자 결정 (자동 부여 vs 보존). 부재 시 feature의 REQ는 도메인 산문으로 흡수하거나 도메인이 REQ 체계 신설. 정책 ID와 동일 규칙. |
| 의존성 맵 | 머지에 필요한 경우에만 사용자에게 질문 |
| frontmatter | 없어도 진행 (위치로 domain 판별) |

```
ℹ️ '{category}.md'는 신규 머지 흐름에 처음 진입합니다.
   호환성 체크리스트를 적용합니다.
```

## 「resolution 4지 출력」

```
머지 실패: [실패 단계 + 사유]

어떻게 처리할까요?

1. 🔧 Tech Lead 추가 투입 (재시도)
2. 사용자 직접 수정 (어느 부분을 수정?)
3. 이 feature만 skip (디렉토리 보존, 다음 세션 후보)
4. abort (전체 중단, 사용자 명시 확인 시에만)
```

## 「머지 세션 종료 요약 출력」

```
머지 세션 완료
  완료: N개 (rating-system, br-mode-system)
  skip: M개 (queue-system — 사유는 사용자 메모)
  abort: K개
```
