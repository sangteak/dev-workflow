#!/usr/bin/env bash
# transcript-sources.mjs 고정 표본 검사 — 옛 모양은 걸리고(종료 1) 새 모양은 통과(종료 0)해야 한다.
set -u
cd "$(dirname "$0")/../.."
rc=0
run() { node scripts/transcript-sources.mjs "$1" >"$2" 2>&1; echo $?; }
out=$(mktemp)
echo "== old-shape: 위반이 있어야 한다 =="
code=$(run tests/fixtures/transcript-sources/old-shape.jsonl "$out")
tail -1 "$out"
if [ "$code" -ne 1 ]; then echo "   FAIL: 종료 코드 $code (1 기대)"; rc=1; fi
if ! grep -q "옛 태그 3" "$out"; then echo "   FAIL: 옛 태그 3건이어야 한다(이중집계 표본 줄은 체인 순서상 옛 태그로만 세어져야 한다)"; rc=1; fi
if ! grep -q "경로:행 2" "$out"; then echo "   FAIL: 경로:행 2건(349행, 245번째 줄)이어야 한다"; rc=1; fi
if ! grep -q "인용 1" "$out"; then echo "   FAIL: 인용 1건(grpc.io 공식 문서)이어야 한다"; rc=1; fi
if ! grep -q "홀로 선 아이콘 1" "$out"; then echo "   FAIL: 홀로 선 아이콘 1건이어야 한다(옛 태그와 같은 줄에 있는 🚫는 옛 태그로만 세어지고 여기 안 들어가야 한다)"; rc=1; fi
if ! grep -q "assistant 줄 9" "$out"; then echo "   FAIL: tool_result는 분모에 들어가면 안 된다(assistant 줄 9이어야 한다)"; rc=1; fi
echo "== new-shape: 위반이 없어야 한다 =="
code=$(run tests/fixtures/transcript-sources/new-shape.jsonl "$out")
tail -1 "$out"
if [ "$code" -ne 0 ]; then echo "   FAIL: 종료 코드 $code (0 기대)"; cat "$out"; rc=1; fi
if ! grep -q "제외 줄 [1-9]" "$out"; then echo "   FAIL: 코드 펜스, 인용 줄, 📎 이후 줄이 제외되어야 한다"; rc=1; fi
if ! grep -qE "worker 위반 [1-9]" "$out"; then echo "   FAIL: 워커 표본의 경로:행이 worker 위반으로 세어져야 한다"; rc=1; fi
if ! grep -q "이름표 되풀이 0" "$out"; then echo "   FAIL: 이름표 되풀이 0건이어야 한다"; rc=1; fi
rm -f "$out"
[ $rc -eq 0 ] && echo "PASS" || echo "FAIL"
exit $rc
