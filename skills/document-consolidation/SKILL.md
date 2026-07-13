---
name: document-consolidation
description: Use when development is complete (after REVIEW). Consolidates phase/plan files into the final design document for the current feature. Domain consolidation is now handled by separate `merge-to-domain` skill.
---

# Document Consolidation

개발 완료 후 중간 문서를 최종 설계 문서에 통합하고 정리한다.
consolidate-main 단일 모드로 동작한다.

**모든 파일 경로 규칙:** `docs/design/[카테고리]/[기능명]/`

> 본 스킬의 단계 확인은 이미 순차 구조(한 시점에 확인 1건)로 고정되어 있으므로 decision-flow.md의 헤더(B)·사전 브리핑(F)·재논의 대기열을 적용하지 않는다 (SSOT '적용 예외' 해당). 각 단계의 인라인 템플릿(번호 목록·확인문·열린 입력)을 문서 그대로 사용한다.

---

## 트리거

자동 실행하지 않는다. 아래 시점에 **제안**하고 사용자 승인 후 실행한다:
- REVIEW 완료 시: "문서 통합을 진행할까요?" (consolidate-main)

**예외:** `workflow-orchestrator` Completion Protocol에서 invoke된 경우, 이 규칙을 적용하지 않는다. **즉시 실행한다.**

> ℹ️ 이슈 반영은 workflow-orchestrator 「Issue Lifecycle」이 사이클 내에서 즉시 수행한다 — **반영은 이슈 사이클 전속, 통합(consolidation)은 Completion 시점 전속**. 구 Mode 2(consolidate-issue)·Mode 3(consolidate-domain)은 v1.18.0에서 제거됨 (도메인 통합: merge-to-domain / 크로스 도메인 pending 소비: merge-to-domain으로 이관 완료).

---

## Mode 1: consolidate-main

개발 완료 후 phase/plan/HANDOFF를 최종 design 문서에 통합한다.

### 실행 절차

0. **경로 해소:** `find . -maxdepth 2 -iname "docs" -type d` 실행 후 design 하위 확인
   (상세: development-principles "경로 해소 규칙" 참조)

1. **소스 파일 읽기**
   - `[해소된 경로]/[카테고리]/[기능명]/phase1_exploration.md`
   - `[해소된 경로]/[카테고리]/[기능명]/phase2_discovery.md`
   - `[해소된 경로]/[카테고리]/[기능명]/phase3_validation.md`
   - `[해소된 경로]/[카테고리]/[기능명]/plan.md`
   - `[해소된 경로]/[카테고리]/[기능명]/seed.yaml` (존재 시 — v1.16.0부터 항상 생성, 구버전 산출물은 부재 가능)
   - `[해소된 경로]/[카테고리]/[기능명]/HANDOFF.md` (존재 시)

2. **섹션별 매핑 규칙에 따라 design 문서 업데이트**

   | 소스 | 대상 섹션 | 매핑 내용 |
   |------|-----------|-----------|
   | phase1 요구사항 | 섹션 3 확정된 요구사항 | 최종 상태 반영 (이미 반영된 경우 스킵) |
   | phase2 Q&A 결정 | 섹션 6 기술 결정 | 주요 결정 사항 추가 |
   | phase3 TD 검토 | 섹션 8 기술 가이드라인 | TD 가이드라인 보강 |
   | plan 구현 전략 | 섹션 4 설계 개요 | 실제 구현 아키텍처로 보강 |
   | plan 설계 변경 | 섹션 6 기술 결정 | 구현 중 변경된 결정 추가 |
   | seed.yaml 제약/가정 | 섹션 7 제약조건과 가정 | seed의 constraints/assumptions 보강 |
   | 실제 구현 결과 | 섹션 9 구현 결과 | 설계 대비 일탈 사항 기록 |

3. **프론트매터 업데이트**
   - `status: ready-for-plan` → `status: complete`
   - `last-updated: [오늘 날짜]`
   - **⚠️ 정규값 우선순위 규칙:** plan.md 등 다른 소스에 명시된 상태값에 관계없이, 프론트매터 `status`는 반드시 정규값 `complete`를 사용한다. 정규 상태값은 `ready-for-plan`과 `complete` 2개만 존재한다.

4. **변경 이력(섹션 10) 추가**
   ```
   | [날짜] | 개발 완료 — 문서 통합 | 전체 | 완료 |
   ```

5. **사용자 리뷰**
   ```
   📋 문서 통합 결과:

   업데이트된 섹션:
   - 섹션 3: 요구사항 [N]건 최종 확인
   - 섹션 4: 구현 아키텍처 반영
   - 섹션 6: 기술 결정 [N]건 추가
   - 섹션 8: 가이드라인 보강
   - 섹션 9: 구현 결과 및 일탈 사항 작성
   - 섹션 10: 변경 이력 추가

   확인 후 다음 단계를 진행합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **중간 산출물 정리**

   git-mode: 확인 없이 정리하고 1줄로 고지한다: `🧹 중간 산출물을 정리했습니다: phase1~3.md, plan.md, seed.yaml[, HANDOFF.md] — [기능명].md는 complete로 보존 (기록은 git 이력에 남음 · 되돌리려면 말씀하세요)` (안전망: development-principles "자동 결정 안전망" 참조)
   no-git-mode: 삭제가 복구 불가능하므로 기존 확인을 유지한다 — "중간 산출물을 삭제합니다 … 진행할까요? 1. Yes — 고르면: 삭제 (기록 없음 주의) 2. No — 고르면: 유지"
   (VCS 모드가 미확보면 세션 환경 컨텍스트의 "Is directory a git repo" 값으로 즉시 판정한다)

7. **종료 안내**

   ```
   ✅ feature 문서 통합 완료: docs/design/[카테고리]/[기능명]/[기능명].md

   [기능명].md는 status: complete로 보존되며, 도메인 통합과 디렉토리 삭제는
   merge-to-domain이 머지 검증 통과 후 수행합니다.
   (관리자: /dev-workflow:merge-to-domain [카테고리] 호출)
   ```

### 최종 상태

```
docs/design/[카테고리]/
└── [기능명]/
    └── [기능명].md              ← status: complete, 도메인 머지 대기
```

중간 산출물은 삭제됨. 도메인 통합과 feature 디렉토리 삭제는 별도 스킬(`merge-to-domain`)이 담당한다.

---

## 주의 사항

- consolidate-main은 반자동이다 — 자동 병합 후 반드시 사용자 리뷰를 거친다
- 병합 결과가 부자연스러우면 사용자가 직접 수정할 수 있도록 안내한다
- 통합 실행 전 대상 파일이 존재하는지 확인한다
- feature 디렉토리 삭제는 사용자 승인 후에만 실행한다
- 변경된 섹션만 하이라이트하여 사용자 리뷰를 빠르게 한다
- domain.md 통합 시 기존 domain.md의 구조와 톤을 유지한다
- pending 파일은 merge 키워드만 기록하고, 상세 내용은 코드베이스 참조로 보완한다
- feature 디렉토리 삭제는 domain.md 통합이 확인된 후에만 실행한다
