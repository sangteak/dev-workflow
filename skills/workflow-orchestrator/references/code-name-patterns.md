# 코드 이름 추출 표 — 세션 코드 이름 목록의 원본 규칙

> brainstorming 국면 0이 이 파일을 Read해 순회한다 (원본 규정: `skills/brainstorming/SKILL.md` 국면 0 「코드 이름 목록」). 규범 본문은 "외부로 드러난 타입 선언"이라고만 적고 언어별 패턴은 여기에만 둔다 — 언어가 늘면 이 표에 한 줄 더한다. 이 파일은 `decision-flow.md`의 재서술이 아니라 별도 원본이다.

## 1. 언어별 선언 패턴 (ERE)

| 언어 | 파일 | 외부로 드러난 타입 선언 |
|---|---|---|
| Go | `*.go` | `^type [A-Z][A-Za-z0-9]*` |
| TypeScript | `*.ts` `*.tsx` | `^export (class\|interface\|type\|enum) [A-Z][A-Za-z0-9]*` |
| C# | `*.cs` | `^[[:space:]]*public (class\|interface\|record\|struct\|enum) [A-Z][A-Za-z0-9]*` |
| Python | `*.py` | `^class [A-Z][A-Za-z0-9]*` |
| Rust | `*.rs` | `^pub (struct\|enum\|trait) [A-Z][A-Za-z0-9]*` |
| proto | `*.proto` | `^message [A-Z][A-Za-z0-9]*` |

셀 안의 `\|`는 마크다운 표 이스케이프다 — 실행할 때는 `|`로 쓴다.

표에 없는 언어는 목록을 두지 않고 확인 절차의 검색만으로 간다 — 고지 한 줄에 그 이유를 적는다.

## 2. 어간 자르기 규칙

- 카멜 표기: 대문자 경계에서 자른 **첫 조각**이 어간이다 (`BackfillRecruiter` → `Backfill`)
- 스네이크 표기: `_` 앞 조각이 어간이다 (`backfill_recruiter` → `backfill`)
- 예외 둘 — 첫 조각이 두 글자 이하이거나 다음 조각이 대문자로 이어지면 둘째 조각까지 어간이다 (`OMClient` → `OMClient`, `PreDigest` → `PreDigest`)
- 버리는 접두: `Mock` · `Noop` · `Fake` 로 시작하는 선언은 목록에 넣지 않는다 — 시험 대역이라 화면에 나올 이름이 아니다
- 목록 한 줄의 모양: `` `어간` — 어간의 뜻 (구체 타입 몇 개) `` — 뜻은 어간의 뜻만 적는다. 구체 타입의 풀이는 확인 절차가 그 이름을 화면에 쓸 때 붙인다

## 3. 자리 추정 (bash 실물 — 본체가 이 순서로 도구 호출을 한다)

검색은 `git grep`(gitignore를 존중) 또는 gitignore를 존중하는 검색으로, 지금 열린 워크트리 안에서만 한다. 셈 단위는 **걸린 파일 경로들의 가장 긴 공통 접두 디렉토리**다 — 절반 문턱은 없다.

```bash
# ① 발화의 코드 이름·경로 조각으로 걸린 파일 (예: Assignment, Backfill)
hits=$(git grep -l -E 'Assignment|Backfill' | sort)
# ② 가장 긴 공통 접두 → 디렉토리로 자른다
first=$(printf '%s\n' "$hits" | head -1); last=$(printf '%s\n' "$hits" | tail -1)
lcp=$(printf '%s\n%s\n' "$first" "$last" | sed -e 'N;s/^\(.*\).*\n\1.*$/\1/')
place=${lcp%/*}
# ③ 그 자리의 타입 선언 (Go 예) — 60개를 넘으면 걸린 파일이 가장 많은 하위 디렉토리 둘로 내린다
git grep -h -E '^type [A-Z][A-Za-z0-9]*' -- "$place" | sed -E 's/^type ([A-Za-z0-9]+).*/\1/' | grep -vE '^(Mock|Noop|Fake)' | sort -u
# ④ 어간 묶기 — 위 2절 규칙으로 본체가 정리해 스무 줄 안팎으로 만든다
```

- 발화에 코드 이름·경로가 없으면 자리를 잡지 않고 첫 검색 때로 미룬다
- 자리 문자열이 달라졌을 때만 다시 훑는다 (시드·작업 방향으로 좁혀진 경우)
- Grep 도구(ripgrep) 출력이 백슬래시 경로면 `tr '\\' '/'`를 끼운다 — git grep 출력은 이미 슬래시다
