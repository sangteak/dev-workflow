---
name: document-consolidation
description: Use when development is complete (after REVIEW) or when an issue is resolved. Consolidates phase/plan files into the final design document and manages _archive/.
---

# Document Consolidation

개발 완료 후 중간 문서를 최종 설계 문서에 통합하고 정리한다.
두 가지 모드로 동작한다.

**모든 파일 경로 규칙:** `docs/design/[카테고리]/[기능명]/`

---

## 트리거

자동 실행하지 않는다. 아래 시점에 **제안**하고 사용자 승인 후 실행한다:
- REVIEW 완료 시: "문서 통합을 진행할까요?" (consolidate-main)
- issues/ 완료 시: "이슈 내용을 설계 문서에 통합할까요?" (consolidate-issue)

---

## Mode 1: consolidate-main

개발 완료 후 phase/plan/HANDOFF를 최종 design 문서에 통합한다.

### 실행 절차

1. **소스 파일 읽기**
   - `docs/design/[카테고리]/[기능명]/phase1_exploration.md`
   - `docs/design/[카테고리]/[기능명]/phase2_discovery.md`
   - `docs/design/[카테고리]/[기능명]/phase3_validation.md`
   - `docs/design/[카테고리]/[기능명]/plan.md`
   - `docs/design/[카테고리]/[기능명]/HANDOFF.md` (존재 시)

2. **섹션별 매핑 규칙에 따라 design 문서 업데이트**

   | 소스 | 대상 섹션 | 매핑 내용 |
   |------|-----------|-----------|
   | phase1 요구사항 | 섹션 3 확정된 요구사항 | 최종 상태 반영 (이미 반영된 경우 스킵) |
   | phase2 Q&A 결정 | 섹션 6 기술 결정 | 주요 결정 사항 추가 |
   | phase3 TD 검토 | 섹션 8 기술 가이드라인 | TD 가이드라인 보강 |
   | plan 구현 전략 | 섹션 4 설계 개요 | 실제 구현 아키텍처로 보강 |
   | plan 설계 변경 | 섹션 6 기술 결정 | 구현 중 변경된 결정 추가 |
   | 실제 구현 결과 | 섹션 9 구현 결과 | 설계 대비 일탈 사항 기록 |

3. **프론트매터 업데이트**
   - `status: ready-for-plan` → `status: complete`
   - `last-updated: [오늘 날짜]`

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

   확인 후 _archive/ 이동을 진행합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **사용자 승인 후 _archive/ 이동**
   ```
   mkdir -p docs/design/[카테고리]/[기능명]/_archive
   mv phase1_exploration.md → _archive/
   mv phase2_discovery.md → _archive/
   mv phase3_validation.md → _archive/
   mv plan.md → _archive/
   mv HANDOFF.md → _archive/ (존재 시)
   ```

### 최종 상태

```
docs/design/[카테고리]/[기능명]/
├── [기능명].md              ← 자기완결적 최종 문서
└── _archive/
    ├── phase1_exploration.md
    ├── phase2_discovery.md
    ├── phase3_validation.md
    ├── plan.md
    └── HANDOFF.md
```

---

## Mode 2: consolidate-issue

이슈(hotfix) 완료 후 이슈 내용을 부모 design 문서에 통합한다.

### 실행 절차

1. **이슈 설계 문서 읽기**
   - `docs/design/[카테고리]/[기능명]/issues/[문제명]/[문제명].md`

2. **부모 design 문서에 자연스럽게 통합**

   통합 원칙: **"원래 하나였던 것처럼"** — 참조 링크가 아닌 직접 병합

   | 이슈 내용 | 부모 대상 섹션 | 병합 방식 |
   |-----------|---------------|-----------|
   | 변경된 요구사항 | 섹션 3 | 기존 REQ 업데이트 또는 신규 REQ 추가 |
   | 새 기술 결정 | 섹션 6 | 행 추가 |
   | 변경된 설계 | 섹션 4 | 해당 부분 갱신 |
   | 새 가이드라인 | 섹션 8 | 항목 추가 |
   | 새 의존성 | 섹션 5 | 행 추가 |
   | 새 제약조건 | 섹션 7 | 항목 추가 |

3. **변경 이력(섹션 10) 추가**
   ```
   | [날짜] | [문제명] 이슈 해결 — 설계 통합 | [영향 범위] | 완료 |
   ```

4. **프론트매터 업데이트**
   - `last-updated: [오늘 날짜]`

5. **사용자 리뷰**
   ```
   📋 이슈 통합 결과:

   이슈: [문제명]
   업데이트된 섹션:
   - [변경된 섹션 목록]

   확인 후 issues/[문제명]/ 디렉토리를 삭제합니다. 수정할 부분이 있으면 알려주세요.
   ```

6. **사용자 승인 후 이슈 디렉토리 삭제**
   - `issues/[문제명]/` 디렉토리 전체 삭제
   - `issues/` 디렉토리가 비어있으면 `issues/` 디렉토리도 삭제

---

## 주의 사항

- 두 모드 모두 반자동이다 — 자동 병합 후 반드시 사용자 리뷰를 거친다
- 병합 결과가 부자연스러우면 사용자가 직접 수정할 수 있도록 안내한다
- 통합 실행 전 대상 파일이 존재하는지 확인한다
- _archive/ 이동 또는 issues/ 삭제는 사용자 승인 후에만 실행한다
- 변경된 섹션만 하이라이트하여 사용자 리뷰를 빠르게 한다
