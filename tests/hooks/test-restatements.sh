#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../.." || exit 1
echo "== 재서술 지점 목록 검사 =="
scripts/check-restatements
