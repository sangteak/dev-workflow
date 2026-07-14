#!/usr/bin/env bash
# detect-remnants 회귀 테스트 — 픽스처를 런타임 생성해 검증
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DETECT="${REPO_ROOT}/hooks/lib/detect-remnants"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { # $1=케이스명 $2=기대값 $3=실제값
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi
}

# 픽스처 A: 미완료 잔존 (plan.md + HANDOFF.md + phase1)
mkdir -p "$TMP/projA/docs/design/cat/feat" "$TMP/projA/docs/design/cat/_archive/old"
echo p > "$TMP/projA/docs/design/cat/feat/plan.md"
echo h > "$TMP/projA/docs/design/cat/feat/HANDOFF.md"
echo 1 > "$TMP/projA/docs/design/cat/feat/phase1_exploration.md"
echo x > "$TMP/projA/docs/design/cat/_archive/old/HANDOFF.md"
# 픽스처 B: 깨끗
mkdir -p "$TMP/projB/docs/design/cat/feat"

echo "[detect-remnants]"
# 1. session-start 집합(3종): 3건 검출
out=$("$DETECT" "$TMP/projA" HANDOFF.md plan.md phase1_exploration.md | wc -l | tr -d ' ')
check "3종 집합 검출 수" "3" "$out"
# 2. nudge 집합(2종): phase1 제외 2건
out=$("$DETECT" "$TMP/projA" HANDOFF.md plan.md | wc -l | tr -d ' ')
check "2종 집합 검출 수(phase1 제외)" "2" "$out"
# 3. _archive 제외
out=$("$DETECT" "$TMP/projA" HANDOFF.md plan.md | grep -c "_archive" || true)
check "_archive 제외" "0" "$out"
# 4. 깨끗한 프로젝트: 빈 출력
out=$("$DETECT" "$TMP/projB" HANDOFF.md plan.md)
check "깨끗 시 빈 출력" "" "$out"
# 5. docs 디렉토리 부재: 빈 출력 + exit 0
out=$("$DETECT" "$TMP/nonexistent" HANDOFF.md plan.md); rc=$?
check "docs 부재 시 빈 출력" "" "$out"
check "docs 부재 시 exit 0" "0" "$rc"

echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
