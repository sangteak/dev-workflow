#!/usr/bin/env bash
# intake-nudge 시나리오 테스트 (0번: 어휘 SSOT diff)
# 이 훅은 파일을 읽지 않는다 — 저장소 상태와 무관하게 어휘만으로 판정한다 (intake-routing 확정 6)
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
HOOK="${REPO_ROOT}/hooks/intake-nudge"
SKILL="${REPO_ROOT}/skills/workflow-orchestrator/SKILL.md"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
PASS=0; FAIL=0
check() { if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  ✅ $1";
  else FAIL=$((FAIL+1)); echo "  ❌ $1 — 기대: [$2] 실제: [$3]"; fi }
fire() { # $1=프로젝트루트 $2=프롬프트 → 발동 시 "FIRE", 침묵 시 "SILENT"
  out=$(printf '{"prompt": "%s", "cwd": "%s"}' "$2" "$1" | CLAUDE_PROJECT_DIR="$1" bash "$HOOK")
  [ -n "$out" ] && echo "FIRE" || echo "SILENT"
}

# 픽스처: 빈 프로젝트 하나, 진행 중 산출물이 있는 프로젝트 하나
mkdir -p "$TMP/empty" "$TMP/busy/docs/design/cat/feat"
echo p > "$TMP/busy/docs/design/cat/feat/plan.md"

echo "[intake-nudge]"
# 0. 어휘 SSOT diff: SKILL.md의 intake-vocab 라인과 훅의 INTAKE_WORDS 일치
ssot=$(grep -o 'intake-vocab: .*' "$SKILL" | sed 's/intake-vocab: //' | tr -d '`')
mirror=$(grep -o "INTAKE_WORDS='[^']*'" "$HOOK" | sed "s/INTAKE_WORDS='//; s/'$//")
check "0.어휘 SSOT diff" "$ssot" "$mirror"
# 1. 빈 저장소 + 결함 발화 → 발동 (파일을 안 보므로 저장소가 비어도 울린다)
check "1.빈 저장소+결함" "FIRE" "$(fire "$TMP/empty" "랭킹에 닉네임이 안 나와")"
# 2. 진행 중 산출물 있음 + 결함 발화 → 발동 (잔존이 훅을 죽이지 않는다 — 확정 6의 핵심)
check "2.진행중+결함" "FIRE" "$(fire "$TMP/busy" "이 버그 고쳐줘")"
# 3. 리팩터링 발화 → 발동
check "3.리팩터링" "FIRE" "$(fire "$TMP/empty" "이 부분 리팩터링하자")"
# 4. 무관 발화 → 침묵
check "4.무관 발화" "SILENT" "$(fire "$TMP/empty" "오늘 날씨 어때")"
# 5. '안 돼'는 어휘에서 제외됨 → 침묵 (의도된 미탐 — 오탐 1순위라 뺐다)
check "5.안돼 제외" "SILENT" "$(fire "$TMP/empty" "그건 안 돼")"
# 6. 하네스 주입 블록 → 침묵 (사용자 발화가 아니다)
check "6.알림 오탐 차단" "SILENT" "$(fire "$TMP/empty" "<task-notification>버그 수정 완료</task-notification>")"
# 7. 주입문에 두 갈래 경계선이 모두 들어 있다
out=$(printf '{"prompt": "이 버그 고쳐줘", "cwd": "%s"}' "$TMP/empty" | CLAUDE_PROJECT_DIR="$TMP/empty" bash "$HOOK")
printf '%s' "$out" | grep -q "이슈 카드" && a=YES || a=NO
printf '%s' "$out" | grep -q "workflow-orchestrator" && b=YES || b=NO
check "7.경계선 두 갈래" "YES:YES" "$a:$b"

echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
