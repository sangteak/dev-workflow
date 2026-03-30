# Phase 3: 검증 (Validation)

## 날짜: 2026-03-30

## 엣지 케이스 검증

| # | 시나리오 | 예상 동작 | 검증 결과 |
|---|---|---|---|
| 1 | 네트워크 없음 | `plugin install` 실패 → 에러 + 수동 안내 | 이론적 (환경 제약으로 미검증) |
| 2 | 이미 전부 설치됨 | "모든 의존성이 설치되어 있습니다" → 즉시 종료 | ✅ 검증 완료 |
| 3 | 부분 설치 (Superpowers만) | 미설치 항목만 ☐ 표시 → 선택 설치 | 로직 수준 검증 |
| 4 | 마켓플레이스 중복 등록 | "already on disk" → 에러 없음 | ✅ 실제 검증 완료 |
| 5 | `claude` CLI PATH 없음 | Bash 실패 → 안내 | 이론적 |
| 6 | 마켓플레이스에서 플러그인 제거됨 | 설치 실패 → 에러 + 수동 안내 | 이론적 |
| 7 | 사용자 취소 | 아무것도 하지 않고 종료 | 로직 수준 검증 |

## 멱등성 실제 검증

### marketplace add 중복 실행
```
$ claude plugin marketplace add Q00/ouroboros
✔ Marketplace 'ouroboros' already on disk — declared in user settings
```
→ 안전, 에러 없음

### plugin install 중복 실행
```
$ claude plugin install superpowers@claude-plugins-official
✔ Successfully installed plugin: superpowers@claude-plugins-official (scope: user)
```
→ 안전, 재설치 처리됨

## 결론

- 모든 핵심 시나리오에서 안전한 동작 확인
- 별도의 "이미 설치됨" 분기 없이도 무조건 실행 가능하나, UX 관점에서 상태 표시 유지
- 네트워크/환경 에러는 수동 안내로 대응
