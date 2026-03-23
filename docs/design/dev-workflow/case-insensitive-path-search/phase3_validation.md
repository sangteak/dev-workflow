# Phase 3: 검증 (Validation)

> 기능: case-insensitive-path-search
> 카테고리: dev-workflow
> 생성일: 2026-03-20

---

## TD 기술 검토 결과

### 1. 영향 범위

`docs/design/` 참조 스킬: **7개 / 9개**

| 스킬 | 참조 유형 |
|------|----------|
| context-handling | 탐색(glob) + 생성 |
| brainstorming | 생성 + 카테고리 스캔 |
| design-doc-index | 탐색(glob) |
| design-summary | 탐색(glob) |
| document-consolidation | 생성 + 아카이브 |
| plan-stage | 읽기 + 생성 |
| workflow-orchestrator | 존재 확인 |

참조 없는 스킬: `development-principles`, `persona-resolution`

### 2. 경로 참조 유형 분리

| 유형 | 설명 | case-insensitive 필요 |
|------|------|:---:|
| 탐색/읽기 | glob, find, 존재 확인 | ✅ |
| 생성/템플릿 | mkdir, 파일 생성 | ❌ (표준 `docs/design/` 고정) |

### 3. 구현 전략: 경로 해소 스텝

```
탐색 전 실제 경로를 확인:
find . -maxdepth 2 -iname "docs" -type d
→ 발견된 실제 경로를 이후 탐색에 사용
→ 미발견 시 안내 메시지
```

- 실환경 테스트: `find . -maxdepth 2 -iname "docs" -type d` → `./docs` 반환 확인

### 4. 크로스 플랫폼 호환성

| 환경 | `find -iname` | 비고 |
|------|:---:|------|
| Git Bash (Windows) | ✅ | 현재 환경, 검증 완료 |
| WSL | ✅ | GNU find |
| macOS (zsh/bash) | ✅ | BSD find |
| Linux | ✅ | GNU find |
| Windows CMD/PowerShell | ❌ | 플러그인 shell=bash이므로 해당 없음 |

### 5. 적용 방식

| 방식 | 설명 | 판정 |
|------|------|------|
| A. 각 스킬 개별 삽입 | 7곳에 동일 내용 반복 | ❌ 유지보수 부담 |
| B. 공통 규칙 1곳 + 참조 | `development-principles`에 정의, 6곳 참조 | ✅ 권장 |
| C. CLAUDE.md 프로젝트 레벨 | 플러그인 배포 시 포함 불가 | ❌ 부적합 |

→ **방식 B 채택**: `development-principles`에 공통 경로 해소 규칙 추가

### 6. 리스크 평가

| 항목 | 리스크 |
|------|--------|
| `find -iname` 범용성 | 낮음 (shell=bash 전제) |
| 스킬 간 의존성 추가 | 낮음 (기존 구조 활용) |
| Claude 지시문 이행률 | 중간 → 구체적 명령 명시로 완화 |

---

## 페르소나 피드백 요약

| 주제 | 결과 |
|------|------|
| 탐색/생성 분리 전략 | 합의: 탐색은 case-insensitive, 생성은 표준 경로 |
| 구현 방식 (find -iname) | 합의: 크로스 플랫폼 호환, 현재 환경 검증 완료 |
| 적용 방식 (A/B/C) | 합의: B — development-principles 중심 공통화 |
| 차별화 가능성 | 합의: 다른 플러그인이 다루지 않는 견고성 확보 |
