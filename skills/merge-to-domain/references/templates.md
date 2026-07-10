> merge-to-domain SKILL.md의 참조 자료 (verbatim). 본문 디스패치 지점의 Read 지시로 로드된다.

## 「domain_digest YAML 형식」

```yaml
domain_digest:
  policies:
    - id: POL-001
      statement: "..."
      source_section: "..."
      immutability_level: high | medium | low
  decisions:
    - id: DEC-001
      statement: "..."
      supersedes: null  # 또는 이전 결정 ID
  requirement_ids: [REQ-001, REQ-002, ...]
  section_index:
    "1. 배경": [1, 15]
    "4. 설계 개요": [50, 120]
```

## 「domain digest 사후 고지 출력」

```
📄 digest 추출 완료 — 정책 [N]건·결정 [M]건 (오추출은 dry-run 원문 대조와 검증 단계가 잡습니다 · 상세를 보려면 "digest 보여줘")
```

## 「feature_digest YAML 형식」

```yaml
feature_digest:
  policies:
    - id: F-POL-001
      statement: "..."
      source_section: "..."
  decisions:
    - id: F-DEC-001
      statement: "..."
  requirement_ids: [REQ-001, ...]  # feature가 사용하는 REQ ID (domain과 충돌 가능)
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
