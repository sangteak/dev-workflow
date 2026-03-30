# Dependency Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/dev-workflow:setup` 커맨드를 추가하여 권장 플러그인(Superpowers, Ouroboros)을 한 번의 명령으로 설치·검증한다.

**Architecture:** `commands/setup.md` 파일 하나를 생성하고, CLAUDE.md와 README.md의 관련 섹션을 업데이트한다. 이 프로젝트는 코드 없는 문서 기반 플러그인이므로 모든 로직은 마크다운 지시문으로 작성된다.

**Tech Stack:** Markdown (SKILL.md 패턴), Claude Code Plugin System (`claude plugin` CLI)

---

## File Structure

| 파일 | 변경 유형 | 역할 |
|---|---|---|
| `commands/setup.md` | **신규** | setup 커맨드 — 의존성 진단·설치·검증 로직 |
| `CLAUDE.md` | **수정** | Commands 테이블에 setup 행 추가 |
| `README.md` | **수정** | Installation 섹션에 `/dev-workflow:setup` 안내 추가 |

---

### Task 1: commands/setup.md 커맨드 생성

**Files:**
- Create: `commands/setup.md`

- [ ] **Step 1: setup.md 커맨드 파일 작성**

기존 커맨드 패턴(save.md, resume.md)과 달리 스킬에 위임하지 않는 자체 로직형 커맨드를 작성한다.

```markdown
---
description: "권장 플러그인 의존성 설치 및 검증"
---

# dev-workflow 의존성 설정

## 의존성 목록

| 이름 | 마켓플레이스 소스 | 설치명 | 등록 명령 | 설치 명령 | 필수/권장 | 역할 |
|---|---|---|---|---|---|---|
| Superpowers | (공식 — 등록 불필요) | superpowers | — | `claude plugin install superpowers@claude-plugins-official` | 필수 | 개발/리뷰 자동화 |
| Ouroboros | Q00/ouroboros | ouroboros | `claude plugin marketplace add Q00/ouroboros` | `claude plugin install ouroboros@ouroboros` | 권장 | 페르소나 강화 브레인스토밍 |

## 실행 프로토콜

아래 순서를 정확히 따른다. 순서를 건너뛰지 않는다.

### Step 1: 상태 진단

Bash 도구로 아래 명령을 실행하여 현재 설치 상태를 확인한다:

\```bash
claude plugin list 2>&1
\```

출력에서 각 의존성의 설치 여부를 판별한다:
- 출력에 `superpowers` 포함 → 설치됨
- 출력에 `ouroboros` 포함 → 설치됨

### Step 2: 결과 표시 + 확인

**모든 의존성이 설치된 경우:**

\```
── 🔧 dev-workflow 의존성 설정 ──────────────────────
  ✅ Superpowers (설치됨)
  ✅ Ouroboros (설치됨)

  모든 의존성이 설치되어 있습니다!
──────────────────────────────────────────────────────
\```

여기서 종료한다.

**미설치 항목이 있는 경우:**

각 의존성의 상태를 ✅(설치됨) 또는 ☐(미설치)로 표시한다:

\```
── 🔧 dev-workflow 의존성 설정 ──────────────────────

현재 상태:
  [✅ 또는 ☐] Superpowers ([설치됨 또는 미설치]) — 개발/리뷰 자동화
  [✅ 또는 ☐] Ouroboros ([설치됨 또는 미설치]) — 페르소나 강화 브레인스토밍

설치할 항목이 있습니다.
  1. 전체 설치
  2. 취소

──────────────────────────────────────────────────────
\```

사용자가 "2" 또는 "취소"를 선택하면 아무것도 하지 않고 종료한다.

### Step 3: 설치 실행

사용자가 "1"을 선택하면, 미설치된 의존성만 위 테이블의 명령어 순서대로 실행한다:

1. 등록 명령이 있으면 먼저 실행 (Bash 도구)
2. 설치 명령을 실행 (Bash 도구)

각 명령 실행 전 진행 상황을 표시한다:
- `⏳ [플러그인명] 마켓플레이스 등록 중...` (등록 명령 실행 시)
- `⏳ [플러그인명] 설치 중...`

### Step 4: 검증

Bash 도구로 `claude plugin list 2>&1`를 재실행하여 설치 성공 여부를 확인한다.

**모든 설치 성공:**

\```
── ✅ 설치 완료 ─────────────────────────────────────
  ✅ Superpowers
  ✅ Ouroboros

  새 세션에서 모든 기능이 활성화됩니다.
  /clear 또는 새 세션을 시작해 주세요.
──────────────────────────────────────────────────────
\```

**일부 실패:**

\```
── ⚠️ 설치 결과 ────────────────────────────────────
  ✅ [성공한 플러그인]
  ❌ [실패한 플러그인] — 설치 실패

  수동으로 설치하려면:
    [해당 플러그인의 등록 명령 (있으면)]
    [해당 플러그인의 설치 명령]
──────────────────────────────────────────────────────
\```
```

- [ ] **Step 2: 파일 생성 확인**

`commands/setup.md`가 정상적으로 생성되었는지 확인한다:

```bash
ls -la commands/setup.md
```

Expected: 파일이 존재하고 내용이 비어있지 않음

---

### Task 2: CLAUDE.md Commands 테이블 업데이트

**Files:**
- Modify: `CLAUDE.md:94-108` (Commands 섹션)

- [ ] **Step 1: Commands 테이블에 setup 행 추가**

`CLAUDE.md`의 Commands 테이블(100~104행)에 setup 행을 추가한다:

```markdown
| 커맨드 | 대상 스킬 | ARGUMENTS | 설명 |
|--------|-----------|-----------|------|
| save | context-handling | save (하드코딩) | 세션 컨텍스트를 HANDOFF.md에 저장 |
| resume | context-handling | resume (하드코딩) | HANDOFF.md에서 작업 복구 |
| design-summary | design-summary | {{ARGUMENTS}} | 설계 문서 통합 요약 생성 |
| setup | — (자체 로직) | — | 권장 플러그인 의존성 설치 및 검증 |
```

- [ ] **Step 2: commands/ 설명 텍스트 업데이트**

`CLAUDE.md` 18행의 commands 설명을 업데이트한다:

변경 전:
```markdown
- **`commands/`** — 콘솔 자동완성용 독립 명령 파일 (save, resume, design-summary)
```

변경 후:
```markdown
- **`commands/`** — 콘솔 자동완성용 독립 명령 파일 (save, resume, design-summary, setup)
```

- [ ] **Step 3: 변경 확인**

CLAUDE.md의 Commands 섹션을 읽어 변경이 정확한지 확인한다.

---

### Task 3: README.md Installation 섹션 업데이트

**Files:**
- Modify: `README.md:84-133` (Installation 섹션)

- [ ] **Step 1: Quick Setup 안내 추가**

README.md의 Installation 섹션 상단(84행 `## Installation` 직후)에 Quick Setup 블록을 추가한다:

```markdown
## Installation

### Quick Setup (Recommended)

dev-workflow 설치 후, 권장 플러그인을 한 번에 설치할 수 있습니다:

```bash
/dev-workflow:setup
```

또는 아래 수동 설치 절차를 따르세요.
```

기존 Prerequisites / Install dev-workflow / Manual Installation 섹션은 그대로 유지한다.

- [ ] **Step 2: Ouroboros 권장 설치 안내 추가**

README.md의 기존 Prerequisites 섹션(86~92행) 뒤에 Ouroboros 권장 안내를 추가한다:

```markdown
### Optional: Ouroboros

[Ouroboros](https://github.com/Q00/ouroboros) 플러그인을 설치하면 브레인스토밍의 페르소나 사고 품질이 강화됩니다:

```bash
/plugin marketplace add Q00/ouroboros
/plugin install ouroboros@ouroboros
```
```

- [ ] **Step 3: 변경 확인**

README.md의 Installation 섹션을 읽어 변경이 정확한지 확인한다.

---

### Task 4: 통합 검증

- [ ] **Step 1: 파일 구조 확인**

```bash
ls -la commands/
```

Expected: save.md, resume.md, design-summary.md, setup.md (4개 파일)

- [ ] **Step 2: setup.md 내용 검증**

setup.md를 읽어 의존성 테이블과 실행 프로토콜이 완전한지 확인한다.

- [ ] **Step 3: CLAUDE.md 일관성 검증**

CLAUDE.md의 commands/ 설명과 Commands 테이블이 일치하는지 확인한다.
