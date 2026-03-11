---
feature: document-management-policy
created: 2026-03-11
personas: Architect, Plugin Developer, End User, Claude Code Expert
---

# Phase 1: Exploration - Document Management Policy

## 탐색된 요구사항

### 1. 카테고리 기반 디렉토리 구조
- 도메인/시스템 단위로 카테고리화 (예: behavior-tree > peek, cover)
- `docs/design/[카테고리]/[기능명]/` 구조
- `docs/plans/`도 동일 카테고리 구조 적용
- `archive/`도 동일 카테고리 구조 적용
- 파일/디렉토리 누적으로 인한 플랫 구조 한계 해결

### 2. 문서 생명주기 관리
- **Phase 파일 (phase1~3)**: 브레인스토밍 중 독립 유지 → 개발 완료 후 최종 design 문서에 통합 → archive 이동
- **Plan 파일**: 개발 중 카테고리 내 유지(멀티세션 참조용) → 개발 완료 후 핵심을 design에 흡수 → archive 이동
- **Design 최종 문서**: 자기완결적(self-contained) — 향후 요구사항 변경에 충분한 정보 포함

### 3. 최종 Design 문서 템플릿 (10개 섹션)
- YAML 프론트매터: feature, category, status, created, last-updated, dependencies, affects
- 1. 배경과 동기
- 2. 목표와 비목표
- 3. 확정된 요구사항 (REQ-ID 부여)
- 4. 설계 개요
- 5. 의존성 맵
- 6. 기술 결정 및 대안 검토
- 7. 제약조건과 가정
- 8. 기술 가이드라인
- 9. 구현 결과 및 일탈 사항 (구현 완료 후 작성)
- 10. 변경 이력

### 4. HANDOFF.md 멀티세션 지원
- 위치: `docs/design/[카테고리]/[기능명]/HANDOFF.md` (기능 디렉토리 내)
- 존재 = 미완료, 완료 시 archive 이동
- 인덱스 파일 없음 — glob 스캔으로 탐색 (`docs/design/**/HANDOFF.md`)
- 세션 시작 시: glob → last-updated 역순 정렬 → 목록 제시
- 목록 최상단에 "새 작업 시작" 옵션 제공
- 하나의 세션 = 하나의 HANDOFF (세션 간 오염 방지)
- 새 HANDOFF 작업 시 새 세션 필요

### 5. Archive 정책
- 통합 완료된 phase/plan/HANDOFF 파일 → `archive/[카테고리]/[기능명]/`으로 이동
- 동일 카테고리 구조 유지

## 명시적으로 제외된 항목
- 운영 고려사항 (배포/모니터링/롤백) — 게임 개발 맥락에서 불필요
- 마이그레이션 계획 — 해당 없음
- 횡단 관심사 (보안/접근성) — 해당 없음
- HANDOFF 상태 머신 (active/paused) — 복잡도 대비 가치 부족, 존재 여부로 판단
- 루트 인덱스 파일 — 멀티세션 경쟁 조건 유발, glob 스캔으로 대체

## 확정된 페르소나
- 🏛️ Architect / 🔧 Plugin Developer / 👤 End User / 🏆 Claude Code Expert
