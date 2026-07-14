#!/usr/bin/env bash
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SL="${REPO_ROOT}/hooks/statusline/dev-workflow-status"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi }

mkdir -p "$TMP/projA/docs/design/c/f1" "$TMP/projA/docs/design/c/f2" "$TMP/projB/docs/design/c/f"
echo p > "$TMP/projA/docs/design/c/f1/plan.md"; echo h > "$TMP/projA/docs/design/c/f2/HANDOFF.md"

echo "[statusline]"
out=$(printf '{"workspace": {"current_dir": "%s"}, "cwd": "%s"}' "$TMP/projA" "$TMP/projA" | bash "$SL")
check "미완료 2건 표시" "[dev-workflow] ⚠ 미완료 2건: c/f1 외" "$out"
out=$(printf '{"cwd": "%s"}' "$TMP/projB" | bash "$SL")
check "깨끗 시 표시" "[dev-workflow] ✓ 미완료 없음" "$out"
out=$(printf '{"cwd": "%s"}' "$TMP/nonexistent" | bash "$SL")
check "docs 부재 시" "[dev-workflow] ✓ 미완료 없음" "$out"
echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
