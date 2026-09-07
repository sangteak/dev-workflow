#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/../.." || exit 1
rc=0

echo "== 재서술 지점 목록 검사 =="
scripts/check-restatements || rc=1

# 도착 검사는 목록 열둘 전부가 아니라 그 문면을 담아야 하는 자리에만 건다 —
# 담지 않는 자리의 정당한 0건을 실패로 세지 않기 위해 대상을 직접 지정한다.
arrival() {
  pattern="$1"; shift
  echo "== 도착 검사: $pattern =="
  for p in "$@"; do
    n=$(grep -c "$pattern" "$p" 2>/dev/null || true)
    if [ "${n:-0}" -ge 1 ]; then
      echo "   $p: ${n}건"
    else
      echo "   $p: 0건 — 문면이 도착하지 않았다"
      rc=1
    fi
  done
}

# 질문 규칙 — 답의 후보를 세는 갈림 (원본 + 재서술 사본 넷)
arrival '답의 후보를 적어' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md \
  skills/workflow-orchestrator/bootstrap.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

# 언어 규범의 식별자 조항 — 언어 요약을 담는 재서술 사본 넷
arrival '식별자는 즉석 풀이' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

exit "$rc"
