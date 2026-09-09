#!/usr/bin/env bash
# 재서술 지점의 도착·잔존 검사.
#   arrival() — 새 문면이 도착했는가. 경로마다 1건 이상이어야 통과
#   residue() — 옛 문면이 남았는가. 경로마다 0건이어야 통과
# 둘은 판정 방향이 반대다. 헬퍼 이름과 출력 머리말을 갈라 두어 방향을 반대로 읽지 않게 한다.
set -u
cd "$(dirname "$0")/../.." || exit 1
rc=0

echo "== 재서술 지점 목록 검사 =="
scripts/check-restatements || rc=1

# 도착 검사는 목록 열둘 전부가 아니라 그 문면을 담아야 하는 자리에만 건다 —
# 담지 않는 자리의 정당한 0건을 실패로 세지 않기 위해 대상을 직접 지정한다.
arrival() {
  local pattern="$1"; shift
  echo "== 도착 검사: $pattern =="
  local p n
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

# 잔존 검사는 대상 경로를 직접 지정한다 — 저장소 전체를 훑으면 설계 문서나 phase 파일의
# 정당한 인용이 실패를 내고, phase 파일은 수정 불가라 되돌릴 수단이 없다.
residue() {
  local pat="$1"; shift
  echo "== 잔존 검사: $pat =="
  local p n
  for p in "$@"; do
    [ -f "$p" ] || { echo "   $p: 경로 없음"; rc=1; continue; }
    n=$(grep -cE "$pat" "$p" 2>/dev/null || true)
    if [ "${n:-0}" -eq 0 ]; then
      echo "   $p: 0건"
    else
      echo "   $p: ${n}건 — 옛 인라인 모양이 남아 있다"
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

# 새 모양 도착 — 이름표가 제 줄을 쓴다 (잔존 0건만으로는 칸을 통째로 지워도 통과한다)
arrival '^이 결정이 다루는 문제:$' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md

arrival '^\*\*배경\(/힌트\)\?:\*\*$' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

arrival '^> \*\*배경\(/힌트\)\?:\*\*$' \
  README.md

# 이름표와 본문이 같은 줄인 자리 — 「이 결정이 다루는 문제」
residue '^이 결정이 다루는 문제: *.' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md

# 같은 모양 — 「배경」·「배경/힌트」
residue '^\*\*배경(/힌트)?:\*\* *.' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

# README의 인용 부호 안 배경 이름표
residue '^> \*\*배경(/힌트)?:\*\* *.' \
  README.md

exit "$rc"
