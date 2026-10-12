# 국면 1 탐색 — perforce-search-ignore

> 불변 스냅샷 (2026-09-30). 이후 수정하지 않는다.

## 작업 방향

- `action: new-feature` — 명령 파일 일곱과 스킬, 훅, MCP 서버 어디에도 `.p4ignore`, `ignore.yaml`, `.ignore` 생성을 다루는 자리가 없어 새로 만드는 일이다(요구 사항 변경 아님). 새 명령이 새 동작을 만든다(리팩터링 아님). 멈춘 것을 고치는 일이 아니다(결함 아님)

## 종료 조건 충족 내역

- new-feature 블록: 기본값 그대로 (달라지는 단계 없음)

## 확정된 페르소나

- 브레인스토밍: 🛠️ Claude Code Expert, 🎯 Workflow Designer, 🔍 Ecosystem Analyst(국면 3 활성화)

## 탐색된 요구사항

인터뷰 전 확정:
- 코드 검색 범위용 `.ignore` 기능을 dev-workflow에 추가한다
- 기본 설치나 자동 생성이 아니라 `commands/` 명령으로 두어 사용자가 명시적으로 호출한다
- 기성 검색 도구를 추천하거나 안내하지 않는다

인터뷰 (7문항):
1. 출처는 Perforce 무시 목록. Perforce 저장소 전용 (git 저장소는 ripgrep이 `.gitignore`를 이미 지킴)
2. 폴더 줄을 후보로 보여 주고 알려진 산출물은 미리 골라 둔 채 사용자가 확인하거나 고친다 — 해로운 줄은 저장소마다 달라 명령이 혼자 정하지 않는다 (GW-Server 대조: 언리얼 이름 규칙 0줄, 목록에 `examples/`, `tasks/lessons.md`)
3. `ignore.yaml`에 system 부분과 user 부분을 두고 yaml에서 `.ignore`를 생성한다. Perforce 무시 목록이 바뀌면 system만 다시 쓴다. 명령이 고침과 생성을 한 번에 한다. 사람과 Claude는 yaml만 본다 (사용자 이유: ripgrep 문법 학습이 필요 없음)
4. 생성 뒤 제외 폴더 안 파일 하나를 Grep으로 찾아 안 나오는지 확인한다 (제외 전후 비교는 큰 저장소에서 20초 제한에 걸려 쓰지 않음)
5. 되돌리기 전용 동작 없음. 잠깐 보기는 `path` 직접 지정, 영구 변경은 yaml 수정 뒤 재생성, 그만 쓰기는 두 파일 삭제 — 명령 끝에 한 줄 안내
6. 전역 `~/.claude/CLAUDE.md`의 「코드 검색 범위」 규칙은 지웠다(2026-09-29). 이 문제는 dev-workflow에서만 다룬다
7. 명령 목록과 README에 두고, 세션 시작 훅이 조건이 맞으면 명령 이름 한 줄 알림

확장 토론 결정 (사용자 확정 6):
1. 생성 코드를 둘 자리 — 플러그인 안의 Node 스크립트, 명령이 Bash로 `node`를 한 번 실행 (근거: 코드가 생성해야 하는 이유는 스크립트로 충족되고, MCP는 세션 서버 연결에 기댐 — 이 대화 중 dev-workflow MCP 서버가 두 번 연결 실패로 뜸, 직접 띄우면 정상 응답). 이 명령은 Node.js가 필요하다 (머지 기능과 같은 선택 조건)
2. 원본 형식 — yaml. 키는 `exclude`와 `keep`. 개발 쪽에서 yaml 읽기 라이브러리를 스크립트 파일에 합쳐 배포 (사용자 설치 없음). 다시 쓸 때는 system 구획의 텍스트만 갈아 끼워 user 부분 주석 보존
3. 후보 화면에 보일 줄 — 디스크에 있는 폴더만 행으로, 없는 줄 중 알려진 산출물 이름에 맞는 것은 요약 한 줄로 알리고 `.ignore`에 함께 넣음
4. 알려진 산출물 이름 목록 — 좁게: `Intermediate`, `DerivedDataCache`, `Saved`, `Binaries`, `node_modules`, `__pycache__`, `.gradle`, `.venv`, `venv` (시드의 "Unreal, Unity, Go, Node 등"을 이것으로 고침)
5. 인정할 Perforce 무시 목록 파일 — 공식 기본 둘: `.p4ignore`, 없으면 `p4ignore.txt`. 둘 다 없으면 멈추고 이유를 알림
6. 명령 이름 — `search-ignore` (`/dev-workflow:search-ignore`)

## 사용자가 제외한 항목과 이유

- git 저장소 지원 — ripgrep이 `.gitignore`를 이미 지킨다
- 모델이 `.ignore`를 직접 생성 — 같은 원본에서 매번 같은 결과가 나온다는 보장이 없다
- MCP 도구로 생성 — 세션의 서버 연결에 기대고, 코드가 생성한다는 이유에 보태는 것이 없다
- 셸 스크립트로 생성 — 원본 읽기와 경로 문자열 처리를 bash로 짜야 한다
- JSON 원본, 한 줄 한 경로 텍스트 원본 — 메모 달기와 손으로 고치기가 불편하거나 새 문법을 익혀야 한다
- `.ignore` 안의 주석 구간 두 개, `.ignore` + `.rgignore` 두 파일 — 사용자가 ripgrep 문법(우선순위, `!`, `/*`)을 알아야 한다
- 엔진별로 넓은 산출물 이름 목록 — `Temp`, `Logs`, `bin` 같은 흔한 이름이 소스 폴더를 잘못 뺄 수 있다
- 명령 인자로 출처 경로 받기, `p4 set P4IGNORE` 읽기 — 인터페이스가 늘거나 `p4` 설치에 기댄다

## 페르소나 피드백 결과 (주제별)

- 생성 주체 (블라인드 라운드) — 합의: 모델이 아니라 코드가 생성, 도구를 쓸 수 없으면 대신 쓰지 않고 멈춤. 이후 사용자 질문으로 "코드를 둘 자리"를 다시 열어 Node 스크립트로 확정
- `ignore.yaml` 자리와 제출 — 합의: `ignore.yaml`은 Perforce 무시 목록이 있는 폴더의 `.claude/ignore.yaml`(세션을 연 폴더 기준 아님 — GW에는 루트와 안쪽 `GW/` 두 곳에 `.claude/`가 있음). 제출은 명령 범위 밖. 명령 끝에 알릴 것: `.ignore`는 `.p4ignore`에 없어 `p4 reconcile`에 새 파일로 잡힘, 제출하면 팀원은 원본 yaml 없이 `.ignore`만 받음, reconcile에서 빼려면 `P4IGNORE`에 개인 무시 파일을 세미콜론으로 더할 수 있음(공식 문서 확인), `.ignore`는 사용자 터미널의 rg에도 적용됨
- 키 구조와 형식 — 합의: 키를 뜻으로 나눔(`exclude`, `keep`에 `!` 없이 경로만). 미합의였던 형식은 사용자가 yaml로 확정
- 후보 화면 줄 — 합의: `!` 줄은 후보와 `keep`에 옮기지 않고 "제출 예외 N줄은 검색 제외와 무관" 한 줄 알림 / `/**` 줄은 끝을 떼어 폴더 줄로 합침 / 다른 줄에 덮이는 줄은 겹침으로 묶음 / 도구 폴더(`.claude/`, `.vs/`)는 미리 고르지 않고 "빼면 Claude가 자기 설정을 검색으로 못 찾음" 안내
- 산출물 이름 목록 — 합의: Node 스크립트 안 상수(명령 문서나 별도 데이터 파일에 두지 않음) / 줄의 마지막 경로 조각을 대소문자 무시로 맞춤 / 와일드카드 섞인 줄은 이름 맞춤에서 빼고 후보 행으로만 / `Build`는 넣지 않음 / 미리 고른 행에 이유 한 조각
- 손으로 쓴 `.ignore` — 합의: 명령이 만든 것이 아니거나(머리 주석 없음) 만든 뒤 고친 흔적이 있으면(머리 주석의 본문 해시와 다름) 건드리지 않고 멈추고, 지우거나 남길 줄을 yaml user 부분에 옮긴 뒤 다시 실행하라고 알림. 자동 가져오기와 `.rgignore`로 비켜 두기는 하지 않음
- 출처 없음과 git 저장소 — 합의: git 전용 검사 없음. 진입 조건은 "루트에 Perforce 무시 목록이 있다" 하나. 하위 폴더의 무시 파일은 범위 밖이라고 안내
- 알림 끄기 — 합의: 명령에 "이 저장소에서는 쓰지 않음" 선택지(`.claude/ignore.yaml`에 사용 안 함 표시만). 훅 알림 조건은 "Perforce 무시 목록이 있고, `.ignore`도 `.claude/ignore.yaml`도 없음". `/compact` 뒤 재주입 때 억제. 훅과 명령은 세션을 연 폴더에서 위로 올라가며 Perforce 무시 목록을 찾고 그 폴더를 루트로 씀
- 명령 이름 — 합의: 새 이름을 둠(`setup`에 넣지 않음). `p4-ignore`와 `sync-ignore`는 약함. 사용자가 `search-ignore`로 확정

## 다시 볼 것 처리

- `yaml 원본 구조` (원본과 생성물 자리가 달라 팀원 수정이 덮어써질 수 있음) — 자연 해소: 손으로 고친 `.ignore`는 해시로 알아보고 멈추므로 조용히 사라지지 않음
- `후보 화면을 둔다` (알려진 이름이 대부분을 덮으면 확인 화면은 단계만 늘린다) — 사용자가 다시 열어 토론. 결과: 화면 유지, 기본 수락 모양으로(미리 체크된 행은 그대로 두고 확인 한 번으로 통과, 사용자는 미체크 행만 손댐). 없애지 않은 이유: 좁은 목록은 화면을 전제로 고른 것이라 화면을 없애면 목록 밖 큰 산출물(Unity의 `Library/` 등)이 조용히 남음. 조건부 건너뛰기는 `.claude/`가 늘 미체크 행으로 떠서 발동하지 않아 넣지 않음

## 실측 사실 (이 대화에서 확인)

- Claude Code Grep 도구는 git 밖에서도 `.ignore`와 `.rgignore`를 지키고 `.rgignore`가 앞선다. `RIPGREP_CONFIG_PATH`와 `.ignore.user`는 무시한다
- 맨몸 `[system]` 줄은 문자 클래스 규칙이 되어 한 글자 파일을 뺀다
- `Intermediate/` 폴더째 제외는 안쪽 되살리기를 막는다. 가운데에 `/`가 있는 줄은 그 파일 폴더 기준으로 고정되어, 루트의 `Intermediate/*`는 `GW/Intermediate`를 못 잡는다. `**/Intermediate/*`가 어느 깊이든 빼고 `!**/Intermediate/Keep/` 되살리기도 먹는다. `Intermediate/*` 아래 깊은 폴더는 단계마다 풀어 써야 되살아난다
- 제외 폴더도 Grep의 `path`로 직접 가리키면 검색된다
- Grep의 `glob` 인자는 `.ignore`의 되살리기를 무력화한다
- GW: C++ 파일 56,745개 중 86%가 `Intermediate/`. 제외 없는 루트 검색은 20초 제한 실패나 결과 흔들림(6파일, 8파일). 산출물 제외 glob으로 소스 5파일 즉시 완료. `.p4ignore` 규칙 86줄(폴더 40, `/**` 2, `!` 9, 파일 패턴 35), 폴더 줄 42개 중 디스크에 14개
- Perforce 공식: `P4IGNORE`가 없으면 `.p4ignore` 다음 `p4ignore.txt`, 설정값은 세미콜론으로 여러 파일. 이 PC는 `p4 set`으로 `P4IGNORE=.p4ignore`

## 시드 (Step B 확인 버전 + 이후 정정)

- goal: Perforce 저장소에서 사용자가 직접 호출하는 dev-workflow 명령 하나로 Perforce 무시 목록의 폴더 줄을 후보로 확인받아 `ignore.yaml`(system 부분과 user 부분)에 기록하고, 그 yaml에서 `.ignore`를 생성해 Claude Code Grep 검색에서 빌드 산출물 폴더를 뺀다
- 정정 1: 폴더 제외 모양은 `이름/*`가 아니라 `**/이름/*` (가운데 `/` 고정 규칙, 실측)
- 정정 2: `ignore.yaml`은 루트에 둘 필요 없음 → `.claude/ignore.yaml`로 확정
- 정정 3: 알려진 산출물 이름의 범위는 좁은 목록으로 확정
- 정정 4: 생성은 Node 스크립트, 원본 yaml, 무시 목록 파일은 `.p4ignore`와 `p4ignore.txt`
- 나머지 constraints, non_goals, success_criteria, assumptions는 Step B 확인 버전 그대로

## 명확도 체크 (전환 시점)

- ✅ Goal Clarity: 무엇을, 어디서, 어떻게 시작하는지 모두 정해짐
- ✅ Constraint Clarity: 생성 주체(Node 스크립트)가 정해져 "한 번에 끝남"과 "문법 함정 처리"를 무엇이 보장하는지 채워짐
- ✅ Success Criteria: 파일이나 Grep 결과로 확인 가능
- 국면 3 확인 항목: `.p4ignore`의 고정 규칙이 gitignore와 같은지, `.ignore` 방식으로 GW 루트 검색 속도를 실측
