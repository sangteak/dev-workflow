#!/usr/bin/env bash
# completion-nudge 시나리오 테스트 (0번: 어휘 SSOT diff)
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
HOOK="${REPO_ROOT}/hooks/completion-nudge"
SKILL="${REPO_ROOT}/skills/workflow-orchestrator/SKILL.md"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi }
fire() { # $1=프로젝트루트 $2=프롬프트 → 발동 시 "FIRE", 침묵 시 "SILENT"
  out=$(printf '{"prompt": "%s", "cwd": "%s"}' "$2" "$1" | CLAUDE_PROJECT_DIR="$1" bash "$HOOK")
  [ -n "$out" ] && echo "FIRE" || echo "SILENT"
}

# 픽스처
mkdir -p "$TMP/projA/docs/design/cat/feat" "$TMP/projB/docs/design/cat/feat" "$TMP/projC/docs/design/cat/_archive/old"
echo p > "$TMP/projA/docs/design/cat/feat/plan.md"
echo h > "$TMP/projC/docs/design/cat/_archive/old/HANDOFF.md"
mkdir -p "$TMP/projD/docs/design/cat/feat"
printf -- '---\nfeature: feat\naction: defect\ncurrent-phase: "Phase 1 탐색"\n---\n' > "$TMP/projD/docs/design/cat/feat/HANDOFF.md"

echo "[completion-nudge]"
# 0. 어휘 SSOT diff: SKILL.md의 completion-vocab 라인과 훅의 FINISH_WORDS 일치
ssot=$(grep -o 'completion-vocab: .*' "$SKILL" | sed 's/completion-vocab: //' | tr -d '`')
mirror=$(grep -o "FINISH_WORDS='[^']*'" "$HOOK" | sed "s/FINISH_WORDS='//; s/'$//")
check "0.어휘 SSOT diff" "$ssot" "$mirror"
# 1. 잔존 O + 마무리 발화 → 발동
check "1.잔존+마무리" "FIRE" "$(fire "$TMP/projA" "이제 마무리하자")"
# 2. 잔존 O + 무관 발화 → 침묵
check "2.잔존+무관" "SILENT" "$(fire "$TMP/projA" "이 버그 고쳐줘")"
# 3. 잔존 X + 마무리 발화 → 침묵
check "3.무잔존+마무리" "SILENT" "$(fire "$TMP/projB" "마무리하자")"
# 4. 잔존 O + 영어 발화 → 발동
check "4.영어 wrap up" "FIRE" "$(fire "$TMP/projA" "lets wrap up this feature")"
# 5. 잔존 O + 어휘 밖 발화 → 침묵 (예상된 미탐 — 축2·4가 보완)
check "5.어휘 밖 미탐" "SILENT" "$(fire "$TMP/projA" "오늘은 여기까지 하고 넘어가자")"
# 6. _archive만 잔존 → 침묵
check "6.archive 제외" "SILENT" "$(fire "$TMP/projC" "마무리하자")"
# 7. 잔존 O + 에이전트 완료 알림(하네스 주입) → 침묵 (사용자 발화 아님 — 이슈 카드 001)
check "7.알림 오탐 차단" "SILENT" "$(fire "$TMP/projA" "<task-notification>Agent finished 완료</task-notification>")"
# 8. 브레인스토밍 진행 중(HANDOFF만 있고 plan.md 없음) + 마무리 발화 → 침묵
#    (intake-routing v1.22.0: HANDOFF가 국면 완료로 삭제되지 않게 바뀌어 상시 존재하므로,
#     HANDOFF 단독 잔존은 "마무리할 작업"의 근거가 되지 못한다)
check "8.HANDOFF 단독 침묵" "SILENT" "$(fire "$TMP/projD" "이제 마무리하자")"

echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
