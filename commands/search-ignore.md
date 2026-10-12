---
description: "Perforce 저장소에서 .p4ignore 폴더 줄로 .ignore를 만들어 Claude Grep 검색에서 빌드 산출물을 뺀다"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/mcp/dist/search-ignore.js" *)
---

# /dev-workflow:search-ignore

세션 폴더의 `.p4ignore`(없으면 `p4ignore.txt`) 폴더 줄을 후보로 확인받아 `.claude/ignore.yaml`에 기록하고, 그 yaml에서 `.ignore`를 만든다. 계산과 파일 쓰기는 모두 스크립트가 한다. 이 문서의 모델 몫은 화면, 사용자 응답 받기, Grep 확인뿐이다.

## 규칙

- 스크립트는 **Bash 도구로만** 부른다. 경로는 아래 줄을 글자 그대로 쓴다(치환된 절대 경로). `<ROOT>`에는 이 세션의 작업 폴더(환경 정보의 Primary working directory) 절대 경로를 넣는다. Bash의 현재 폴더를 쓰지 않는다.
- 스크립트가 실패하면 모델이 `.ignore`나 yaml을 대신 쓰지 않는다.
- 스크립트 출력의 `message`와 `screen`은 고쳐 쓰지 않고 그대로 보인다.

## 1. 후보 계산

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/dist/search-ignore.js" plan --root "<ROOT>"
```

- 종료 코드 0: JSON의 `screen`을 코드 블록 없이 그대로 보이고, `notices`가 있으면 한 줄씩 덧붙인 뒤 2로 간다.
- 종료 코드 2(`status: "stop"`): `message`를 그대로 보이고 끝낸다.
- 그 밖의 실패: 아래 "Node 없음"으로 간다.

## 2. 사용자 확인

화면 아래에 이렇게 묻는다:

```
1. 이대로 진행 — [x] 행으로 .ignore를 만듭니다
2. 행 바꾸기 — 켜고 끌 번호를 적어 주세요 (예: 2, 5)
0. 그만두기 — 파일을 바꾸지 않습니다
```

- 2를 받으면 해당 번호의 체크를 뒤집은 목록을 다시 보이고 같은 질문을 한다.
- 최종 체크된 번호를 오름차순 쉼표로 이어 `ROWS`로 둔다(없으면 빈 문자열).

## 3. 생성

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/dist/search-ignore.js" apply --root "<ROOT>" --rows "ROWS" --digest "DIGEST"
```

`DIGEST`는 1단계 JSON의 `digest`. 종료 코드 2면 `message`를 그대로 보이고 끝낸다(`digest-mismatch`면 명령을 다시 부르라는 뜻).

## 4. Grep 확인

`probes`의 항목마다 순서대로 한다.

- `unverifiable: true`인 항목: "확인 못 함 — `<line>`: `<why>`"로 보고한다.
- 그 밖의 항목은 두 번 부른다.
  1. 양성 대조 — 이 호출만 `path`를 준다: Grep `pattern: <text>`, `path: <ROOT>/<folder>`, `output_mode: files_with_matches`, `head_limit: 0`. (`text`에는 정규식 특수문자가 없으므로 그대로 패턴으로 쓴다.) 결과에 `<file>`이 없으면 "확인 못 함 — `<line>`: 문자열을 찾지 못함"으로 보고하고 다음 항목으로 간다.
  2. 본 확인 — Grep `pattern: <text>`, `output_mode: files_with_matches`, `head_limit: 0`만 준다. `path`, `glob`, `type`은 비운다.
  - 본 확인 결과에 `<file>`이 **없으면** 통과, **있으면** 실패다. 결과 건수로 판단하지 않는다.
  - 시간 초과로 결과가 없으면 통과가 아니다: "시간 초과 — 제외가 먹는지 판단하지 못함"으로 보고한다.
- 실패면: "제외 실패 — `<line>`" 뒤에 원인 후보를 붙인다: `notices`의 `.rgignore` 알림, 하위 폴더에 따로 있는 `.ignore`나 `.rgignore`. 만든 파일은 그대로 둔다.

## 5. 끝 안내

아래를 그대로 보인다(`written`이 비었으면 첫 줄을 "바뀐 파일 없음 — 이미 최신입니다"로):

```
만든 파일: .ignore, .claude/ignore.yaml
- 잠깐 빠진 폴더를 보려면 Grep에 path로 그 폴더를 직접 주면 됩니다.
- 영구히 바꾸려면 .claude/ignore.yaml의 user 부분을 고친 뒤 이 명령을 다시 실행하세요.
- 그만 쓰려면 .ignore와 .claude/ignore.yaml을 지우세요.
- .ignore는 p4 reconcile에 새 파일로 잡힙니다.
- Glob 도구에도 적용하려면 .claude/settings.local.json의 env에 "CLAUDE_CODE_GLOB_NO_IGNORE": "false"를 넣고 세션을 다시 여세요.
```

## Node 없음

1단계 호출이 종료 코드 0이나 2가 아닌 값으로 끝나면 아래를 보이고 끝낸다. 종료 코드가 127이 아니면 원래 오류 출력을 그 아래에 덧붙인다.

```
Node.js 18+가 필요합니다. 파일은 바꾸지 않았습니다. /dev-workflow:setup으로 진단하세요.
```
