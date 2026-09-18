#!/usr/bin/env bash
# 재서술 지점의 도착과 잔존 검사.
#   arrival() — 새 문면이 도착했는가. 경로마다 1건 이상이어야 통과
#   residue() — 옛 문면이 남았는가. 경로마다 0건이어야 통과
# 둘은 판정 방향이 반대다. 헬퍼 이름과 출력 머리말을 갈라 두어 방향을 반대로 읽지 않게 한다.
set -u
export LC_ALL=C   # 4바이트 이모지(예: 📎)를 UTF-8 로케일 grep이 못 잡는 환경 대응 — 리터럴 패턴은 영향 없음, check-restatements의 한글 범위 패턴은 바이트 범위로 같은 결과(12건 실측)
cd "$(dirname "$0")/../.." || exit 1
rc=0

echo "== 재서술 지점 목록 검사 =="
scripts/check-restatements || rc=1

# 도착 검사는 목록 열둘 전부가 아니라 그 문면을 담아야 하는 자리에만 건다 —
# 담지 않는 자리의 정당한 0건을 실패로 세지 않기 위해 대상을 직접 지정한다.
arrival_min() {
  local min="$1"; shift
  local pattern="$1"; shift
  echo "== 도착 검사(${min}건 이상): $pattern =="
  local p n
  for p in "$@"; do
    n=$(grep -c -- "$pattern" "$p" 2>/dev/null || true)
    if [ "${n:-0}" -ge "$min" ]; then
      echo "   $p: ${n}건"
    else
      echo "   $p: ${n:-0}건 — ${min}건 미만, 문면이 도착하지 않았다"
      rc=1
    fi
  done
}
arrival() { arrival_min 1 "$@"; }

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

# 가운뎃점 잔존 — 포함 목록 아홉과 제외 경로 셋. 이름 문구 "가운뎃점(...)"을 지운 뒤 남는 것을 센다.
# 패턴은 바이트로 조립해 이 스크립트 자신이 0건을 유지한다. DOT_GATE=off면 건수만 보고하고 rc를 올리지 않는다.
dot=$'\xc2\xb7'
dot_residue() {
  echo "== 가운뎃점 잔존 검사 (이름 문구 제외) =="
  local hits n
  hits=$(git grep -nI --untracked -e "$dot" -- \
      skills commands hooks README.md CLAUDE.md tasks/lessons.md tests scripts docs/design \
      ':(exclude)**/phase[0-9]_*.md' ':(exclude)**/_archive/**' ':(exclude)**/evidence/**' 2>/dev/null \
    | sed "s/가운뎃점(${dot})//g" | grep -a -e "$dot" || true)
  n=$(printf '%s' "$hits" | grep -a -c . || true)
  if [ "${n:-0}" -eq 0 ]; then
    echo "   0건"
  else
    printf '%s\n' "$hits" | cut -c1-120 | head -40
    echo "   ${n}건 — 가운뎃점이 남아 있다"
    [ "${DOT_GATE:-on}" = off ] || rc=1
  fi
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

# 같은 모양 — 「배경」과 「배경/힌트」
residue '^\*\*배경(/힌트)?:\*\* *.' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

# README의 인용 부호 안 배경 이름표
residue '^> \*\*배경(/힌트)?:\*\* *.' \
  README.md

# ── reask-reassembly (1.27.0) ──────────────────────────────────────
# 되묻기 조항 통일 — 옛 조항 셋의 문면이 정본에서 사라졌는가
residue '역질문' \
  skills/workflow-orchestrator/decision-flow.md
residue '배경→비유→선택지별 의미→추천' \
  skills/workflow-orchestrator/decision-flow.md
residue '재설명 경로' \
  skills/workflow-orchestrator/decision-flow.md

# 재조립 접미 문구가 정본에 도착했는가 (사본은 Task 3에서 더한다)
arrival '다시 씀: ' \
  skills/workflow-orchestrator/decision-flow.md

# 검사 1번의 옛 술어("안 나오고 풀이도")가 정본에서 사라졌는가 — 사본은 Task 3에서 더한다
residue '안 나오고 풀이도' \
  skills/workflow-orchestrator/decision-flow.md

# 세는 문장과 적용 범위 예외가 정본에 도착했는가
arrival '풀이 없는 것' \
  skills/workflow-orchestrator/decision-flow.md
arrival '번호 선택지를 낸 화면' \
  skills/workflow-orchestrator/decision-flow.md

# 사본 — 언어 요약 넷과 이슈 언어 줄이 세는 조각을 받았는가
arrival '풀이 없는 것' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

# 사본 — 되물음 재조립 접미가 bootstrap 불변식과 SKILL 폴백에 도착했는가
arrival '다시 씀: ' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md

# 사본 — 적용 범위 문구가 bootstrap과 merge-to-domain에 도착했는가
arrival '번호 선택지를 낸 화면' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/merge-to-domain/SKILL.md

# 사본 — 옛 검사 ① 문면이 사라졌는가
residue '안 나오고 풀이도' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md

# 되물음 상태 — 원본(상태 보존 절)과 사본(HANDOFF 템플릿)에 밟은 갈래가 도착했는가
arrival '밟은 갈래' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/context-handling/SKILL.md

# 0번 탈출구 — 옛 모양(목록에 이어 붙은 `0.`)이 아홉 자리에서 사라졌는가
residue '^0\. 이 중에 없음' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md \
  skills/brainstorming/references/templates.md
residue '^0\. \[탈출' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md
residue '^> 0\. 이 중에' \
  README.md

# 새 모양 도착 — `0\.` (BRE: `\\`=백슬래시, `.`=아무 글자). 경로마다 1건 이상. 총 9건은 §9 검증 표에 손으로 적는다
arrival '^0\\. ' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md \
  skills/brainstorming/references/templates.md
arrival '^> 0\\. ' \
  README.md

# ── code-name-lookup (1.27.1) ──────────────────────────────────────
# 코드 이름 추출 표 — 파일 존재와 proto 패턴 도착
if [ -f skills/workflow-orchestrator/references/code-name-patterns.md ]; then
  echo "== 존재 검사: code-name-patterns.md: 있음"
else
  echo "== 존재 검사: code-name-patterns.md: 없음"; rc=1
fi
arrival '\^message' \
  skills/workflow-orchestrator/references/code-name-patterns.md

# 정본 — 대조 항목 도착, 옛 "풀이 유무 하나다" 잔존 0, 목록과 구획 문구 도착
arrival '코드 자리에서 1건 이상' \
  skills/workflow-orchestrator/decision-flow.md
residue '세는 것은 풀이 유무 하나다' \
  skills/workflow-orchestrator/decision-flow.md
arrival '코드 이름 목록' \
  skills/workflow-orchestrator/decision-flow.md

# 사본 — 언어 요약 다섯과 폴백 ① 둘. bootstrap과 orchestrator SKILL은 두 줄(요약+폴백)이라 2건
arrival_min 2 '코드 자리에서 1건 이상' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md
arrival '코드 자리에서 1건 이상' \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md

# brainstorming — 국면 0 목록 단계, 고지 본문과 B-1 절 옮기기
arrival_min 2 '코드 이름 목록' \
  skills/brainstorming/SKILL.md
arrival '개를 이 세션에 두었습니다' \
  skills/brainstorming/SKILL.md

# HANDOFF 절, 복구와 문서 통합 대조
arrival_min 2 '코드 이름 목록' \
  skills/context-handling/SKILL.md
arrival '코드 이름 목록' \
  skills/document-consolidation/SKILL.md

# 워커 프롬프트 — 구획 도착 (templates 여덟 + 조립 규칙, plan-stage 둘)
arrival_min 8 '--- 코드 이름 목록 ---' \
  skills/brainstorming/references/templates.md
arrival_min 3 '--- 코드 이름 목록 ---' \
  skills/plan-stage/SKILL.md

# 가운뎃점 — 잔존 0건과 도착 여섯 (middle-dot-removal 1.27.2)
dot_residue
arrival "가운뎃점(${dot})을 쓰지 않는다" \
  skills/workflow-orchestrator/decision-flow.md
arrival "가운뎃점(${dot}) 금지" \
  skills/workflow-orchestrator/bootstrap.md
arrival_min 2 '가운뎃점(' \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md
arrival '확정 N/M, 진행 중:' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md
arrival '확정 \[N\]/\[M\], 진행 중:' \
  skills/context-handling/SKILL.md
arrival '확정 N/M,' \
  skills/workflow-orchestrator/bootstrap.md
arrival '결정과 질문 구조 규범' \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/SKILL.md
arrival '공통 형식과 언어' \
  skills/workflow-orchestrator/decision-flow.md
arrival '다시 씀: 왜 문제인지와 고르면 어떻게 되는지' \
  skills/workflow-orchestrator/decision-flow.md

# grounded-output-display (REQ-013, REQ-014)
# grounded-output-display 도착 검사 — 규범 정본
chk=$'\xe2\x9c\x94\xef\xb8\x8f'   # ✔️
clip=$'\xf0\x9f\x93\x8e'          # 📎
arrival "${chk} 확인된 사실:" skills/workflow-orchestrator/decision-flow.md
arrival "확인 아이콘(${chk})이 한 줄도 없으면" skills/workflow-orchestrator/decision-flow.md
arrival '\*\*근거 펼치기:\*\*' skills/workflow-orchestrator/decision-flow.md
arrival '출처 신호가 있으면 되물음이 아니다' skills/workflow-orchestrator/decision-flow.md
arrival_min 2 '--- 증거 ---' skills/workflow-orchestrator/decision-flow.md
arrival "${clip} 근거 — " skills/workflow-orchestrator/decision-flow.md

# grounded-output-display 도착 검사 — 실물 문구와 주입본
arrival "${clip} 근거 — " skills/workflow-orchestrator/references/grounding.md
arrival '근거는 "출처 보여줘"로 펼칩니다' skills/workflow-orchestrator/references/grounding.md
arrival '--- 화면 ---' skills/workflow-orchestrator/references/grounding.md
arrival '출처 요청은 되물음이 아니다' skills/workflow-orchestrator/bootstrap.md
arrival '확인 아이콘 근거' skills/workflow-orchestrator/bootstrap.md

# grounded-output-display 잔존 검사 — 옛 대괄호 태그 모양 ([✔ …], [⚠️ 확인 불가], [추측], [✘ …)
oldchk=$'\\[\xe2\x9c\x94'
# 제외: phase 파일, _archive, evidence, complete feature 문서의 정당한 인용, 도메인 문서 변경 이력, 이 스크립트와 tests/fixtures
residue "${oldchk}|\\[추측\\]|\\[⚠️ 확인 불가\\]|\\[✘" \
  skills/workflow-orchestrator/decision-flow.md \
  skills/workflow-orchestrator/bootstrap.md \
  skills/workflow-orchestrator/SKILL.md \
  skills/workflow-orchestrator/references/grounding.md \
  skills/brainstorming/SKILL.md \
  skills/brainstorming/references/templates.md \
  skills/plan-stage/SKILL.md \
  skills/context-handling/SKILL.md \
  skills/document-consolidation/SKILL.md \
  README.md \
  CLAUDE.md
arrival_min 2 '--- 증거 ---' skills/plan-stage/SKILL.md
arrival "${chk}(높음)" skills/brainstorming/references/templates.md

exit "$rc"
