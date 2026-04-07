# Phase 3: 검증 — Context Lifecycle Optimization

> 생성일: 2026-04-07 | 불변 스냅샷

---

## TD 기술 검토

### 1. resume hook 제거 (SessionStart에서 resume 트리거 제거)

```
판단: 기술적으로 단순하고 안전
가이드라인: hooks/hooks.json matcher에서 "resume" 키워드 제거.
           /dev-workflow:resume 커맨드(commands/resume)가 context-handling을 직접 호출.
           orchestrator는 실제 워크플로우 단계 진입 시에만 로드됨.
리스크: 낮음
```

영향 범위:
- `hooks/hooks.json` — matcher 수정 1줄
- `commands/resume` — 현행 동작 유지 (context-handling resume 모드 호출)
- 기존 BRAINSTORM/PLAN/DEVELOP/REVIEW 워크플로우 영향 없음

### 2. Phase 완료 시 /compact 또는 /clear 안내

```
판단: 기술적으로 단순. brainstorming 스킬 각 Phase 전환부에 안내 문구 추가.
가이드라인: phase*.md 생성 직후, 다음 내용을 항상 출력한다:
  "💡 컨텍스트 관리: `/compact`로 계속하거나, `/dev-workflow:save` → `/clear` →
   `/dev-workflow:resume`으로 새 세션을 시작할 수 있습니다."
리스크: 낮음 (출력 추가이므로 동작 변경 없음)
```

### /compact 적합성 검증

| Phase 상황 | /compact 적합성 | 근거 |
|---|---|---|
| Phase 파일 생성 완료 후 | ✅ 매우 적합 | 내용이 파일에 저장됨. 대화 압축해도 손실 없음 |
| Phase 진행 중 | ⚠️ 주의 | 미저장 논의 내용이 요약으로 대체될 수 있음 |
| DEVELOP 중 | ✅ 매우 적합 | 코드가 파일에 있으므로 대화 압축 안전 |
| PLAN 완료 후 | ✅ 적합 | plan.md에 결정사항 저장됨 |

### /compact vs /clear 역할 분담 검증

```
/compact: 작업 흐름 유지, 세션 연장 (60~70%에서 사용)
/clear:   완전 초기화, 새 출발 (Phase 완료 후, 새 주제 시작 시)
```

차이:
- /compact 후: 페르소나, VCS/Ouroboros 감지, 현재 단계 상태 유지됨
- /clear 후: 모든 상태 소실 → save → resume → Session Start Protocol 재실행 필요

### 검증되지 않은 항목 (구현 후 확인 필요)

- resume hook 제거 후 실제 컨텍스트% 측정 (예상: 21% → 17~19%)
- /compact 후 context-handling이 현재 작업 상태를 얼마나 잘 요약하는가
