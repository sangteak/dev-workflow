# Phase 2: 발견 (Discovery)

## 날짜: 2026-03-30

## 페르소나 피드백 라운드

### Round 1/3

**🛠️ Claude Code Expert:**
- `claude plugin install`이 비대화형으로 동작하므로 기술적으로 실현 가능
- 멱등성 고려: 이미 설치된 플러그인 재설치 시 동작 확인 필요
- 마켓플레이스 등록 순서: Ouroboros는 `marketplace add` 선행 필요
- 스킬 내 Bash 실행 권한 필요

**🎯 Workflow Designer:**
- "README를 읽고 두 줄 실행" vs "한 명령으로 끝" — 명확한 가치 차이
- 선택적 설치 옵션 필요 여부
- 실패 복구 안내 필요
- 세션 재시작 안내 필요

### Round 2/3

**🛠️ Claude Code Expert — 심화:**
- `claude plugin install`은 별도 프로세스로 실행 → 현재 세션에 즉시 반영 안 됨
- 현실적 흐름: 상태 확인 → 설치 → 검증 → "세션 재시작" 안내
- uninstall 미제공 권장 (마크다운 플러그인은 `plugin uninstall`이면 충분)

**🎯 Workflow Designer — 심화:**
- 투명성 유지: 설치 대상 명시 + 사용자 확인 후 진행
- 이미 설치된 항목은 ✅로 표시
- "원클릭" = 하나의 진입점, 동의 없는 자동 실행이 아님

**🔍 Contrarian:**
- setup은 일회성 작업 → 스킬(skills/) 대신 커맨드(commands/)로 제공
- 스킬 목록 오염 방지, Ouroboros와 동일 패턴

### Round 3/3

**🛠️ Claude Code Expert — 구현 세부:**
- 5단계 흐름 확정: 상태 진단 → 표시+확인 → 설치 → 검증 → 완료 안내
- 멱등성: 이미 설치된 항목은 ✅ 표시 후 스킵
- 에러 처리: 실패 시 수동 명령어 안내

**🎯 Workflow Designer — 파일 구조:**
- `commands/setup.md`로 생성 (자체 로직, 스킬 위임 없음)
- 의존성 정의: setup.md 내부 구조화 테이블 (하드코딩)
- Option A(하드코딩) 채택: 의존성 2개, 자주 변하지 않음

**🔍 Ecosystem Analyst — 확장성:**
- 향후 의존성 추가 대비 구조화된 블록으로 정리
- 버전 관리: v1은 없음, Breaking Change 시 최소 버전 검증 추가

## 합의 사항

| 결정 | 합의 |
|---|---|
| 형태 | `commands/setup.md` (커맨드) |
| 호출 | `/dev-workflow:setup` |
| UX | 상태 진단 → 목록(✅/☐) → 확인 → 설치 → 검증 → 완료 안내 |
| 투명성 | 설치 대상 명시, 사용자 확인 후 진행 |
| 의존성 정의 | setup.md 내부 구조화 테이블 |
| 멱등성 | 반복 실행 안전 |
| 버전 관리 | v1: 없음 |
| uninstall | 미제공 |
| 에러 처리 | 실패 시 수동 명령어 안내 |
| 세션 재시작 | 설치 후 안내 |
