# Context Lifecycle Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 완료 시 컨텍스트 관리 안내를 자동 출력하고, /compact·HANDOFF·phase 파일의 역할 분담 전략을 README에 문서화한다.

**Architecture:** `skills/brainstorming/SKILL.md`의 세 Phase 전환 완료 지점에 안내 블록을 삽입하고, `README.md`의 기존 "세션이 끊겨도 이어집니다" 절을 올바른 전략으로 업데이트한다. 코드 변경 없음 — Markdown 문서 수정만.

**Tech Stack:** Markdown (Claude Code plugin 스킬 파일)

---

## 변경 대상 파일 맵

| 파일 | 변경 유형 | 위치 |
|---|---|---|
| `skills/brainstorming/SKILL.md` | 삽입 3곳 | L531 이후, L572 이후, L610 이후 |
| `README.md` | 수정 1곳 | L38~42 ("왜 /compact가 아닌 HANDOFF인가" 절) |
| `.claude-plugin/marketplace.json` | 수정 | `plugins[].version` 값 |
| `.claude-plugin/plugin.json` | 수정 | `version` 값 |

---

## Task 1: brainstorming — Phase 1→2 전환 안내 블록 삽입

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (L531 이후)

**맥락:** Phase 1 완료 시 Simplifier(Optional) 섹션이 실행된 후, `---` 구분선 이전에 안내 블록을 삽입한다.

현재 L530~532:
```
- Standalone Mode에서는 동일한 출력 형식으로 Claude가 직접 분석한다

---
```

- [ ] **Step 1: 현재 내용 확인**

`skills/brainstorming/SKILL.md` L525~535 범위를 읽어 정확한 위치를 확인한다.

```bash
sed -n '525,535p' skills/brainstorming/SKILL.md
```

Expected: L530이 `- Standalone Mode에서는...`, L531이 빈 줄, L532가 `---`

- [ ] **Step 2: 안내 블록 삽입**

L531(빈 줄)과 L532(`---`) 사이에 다음 내용을 삽입한다:

```
💡 **컨텍스트 관리:** `phase1_exploration.md`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.
- **계속 진행:** `/compact` — 대화 히스토리를 압축하고 현재 세션·페르소나·워크플로우 상태를 유지합니다 (권장: 컨텍스트 60~70%에서 선제적으로)
- **새 세션 시작:** `/dev-workflow:save` → `/clear` → `/dev-workflow:resume`
```

Edit 도구로 다음 old_string → new_string 교체:

old_string:
```
- Standalone Mode에서는 동일한 출력 형식으로 Claude가 직접 분석한다

---

## 국면 2: 발견 (Discovery)
```

new_string:
```
- Standalone Mode에서는 동일한 출력 형식으로 Claude가 직접 분석한다

💡 **컨텍스트 관리:** `phase1_exploration.md`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.
- **계속 진행:** `/compact` — 대화 히스토리를 압축하고 현재 세션·페르소나·워크플로우 상태를 유지합니다 (권장: 컨텍스트 60~70%에서 선제적으로)
- **새 세션 시작:** `/dev-workflow:save` → `/clear` → `/dev-workflow:resume`

---

## 국면 2: 발견 (Discovery)
```

- [ ] **Step 3: 삽입 결과 확인**

```bash
grep -n "컨텍스트 관리\|phase1_exploration\|Simplifier\|국면 2" skills/brainstorming/SKILL.md | head -10
```

Expected: `컨텍스트 관리` 줄이 Simplifier 섹션 끝과 `국면 2` 헤더 사이에 위치함

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add context management hint after Phase 1 transition"
```

---

## Task 2: brainstorming — Phase 2→3 전환 안내 블록 삽입

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (L572 이후)

**맥락:** Phase 2 완료 시 포함 내용 목록 직후, `---` 구분선 이전에 안내 블록을 삽입한다.

현재 해당 구간:
```
- 페르소나 피드백 결과 (주제별 합의/미합의 요약)

---

## 국면 3: 검증 (Validation)
```

- [ ] **Step 1: 현재 내용 확인**

```bash
grep -n "페르소나 피드백 결과\|국면 3" skills/brainstorming/SKILL.md | head -5
```

Expected: `페르소나 피드백 결과` 줄과 `국면 3` 헤더 줄 번호 확인

- [ ] **Step 2: 안내 블록 삽입**

Edit 도구로 다음 old_string → new_string 교체 (국면 2 포함 내용 끝 부분):

old_string:
```
- 각 항목에 대한 Q&A 결정 사항
- 페르소나 피드백 결과 (주제별 합의/미합의 요약)

---

## 국면 3: 검증 (Validation)
```

new_string:
```
- 각 항목에 대한 Q&A 결정 사항
- 페르소나 피드백 결과 (주제별 합의/미합의 요약)

💡 **컨텍스트 관리:** `phase2_discovery.md`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.
- **계속 진행:** `/compact` — 대화 히스토리를 압축하고 현재 세션·페르소나·워크플로우 상태를 유지합니다 (권장: 컨텍스트 60~70%에서 선제적으로)
- **새 세션 시작:** `/dev-workflow:save` → `/clear` → `/dev-workflow:resume`

---

## 국면 3: 검증 (Validation)
```

- [ ] **Step 3: 삽입 결과 확인**

```bash
grep -n "컨텍스트 관리\|phase2_discovery\|국면 3" skills/brainstorming/SKILL.md | head -10
```

Expected: `컨텍스트 관리` + `phase2_discovery` 줄이 `국면 3` 헤더 바로 위에 위치함

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add context management hint after Phase 2 transition"
```

---

## Task 3: brainstorming — Phase 3→4 전환 안내 블록 삽입

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (L610 이후)

**맥락:** Phase 3 완료 시 포함 내용 목록 직후, `---` 구분선 이전에 안내 블록을 삽입한다.

현재 해당 구간:
```
- TD가 제시한 기술 가이드라인
- 페르소나 피드백 결과 (주제별 합의/미합의 요약)

---

## 국면 4: 정리 (Consolidation)
```

- [ ] **Step 1: 현재 내용 확인**

```bash
grep -n "TD가 제시한\|국면 4" skills/brainstorming/SKILL.md | head -5
```

Expected: `TD가 제시한` 줄과 `국면 4` 헤더 줄 번호 확인

- [ ] **Step 2: 안내 블록 삽입**

Edit 도구로 다음 old_string → new_string 교체:

old_string:
```
- TD가 제시한 기술 가이드라인
- 페르소나 피드백 결과 (주제별 합의/미합의 요약)

---

## 국면 4: 정리 (Consolidation)
```

new_string:
```
- TD가 제시한 기술 가이드라인
- 페르소나 피드백 결과 (주제별 합의/미합의 요약)

💡 **컨텍스트 관리:** `phase3_validation.md`가 저장되었습니다. Phase 파일이 외부 메모리 역할을 하므로 안전하게 세션을 조절할 수 있습니다.
- **계속 진행:** `/compact` — 대화 히스토리를 압축하고 현재 세션·페르소나·워크플로우 상태를 유지합니다 (권장: 컨텍스트 60~70%에서 선제적으로)
- **새 세션 시작:** `/dev-workflow:save` → `/clear` → `/dev-workflow:resume`

---

## 국면 4: 정리 (Consolidation)
```

- [ ] **Step 3: 삽입 결과 확인**

```bash
grep -n "컨텍스트 관리" skills/brainstorming/SKILL.md
```

Expected: 3개의 `컨텍스트 관리` 줄이 각각 국면 2, 3, 4 헤더 바로 위에 위치함

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add context management hint after Phase 3 transition"
```

---

## Task 4: README.md 컨텍스트 관리 전략 업데이트

**Files:**
- Modify: `README.md` (L38~42)

**맥락:** 기존 "왜 `/compact`가 아닌 HANDOFF인가" 절은 /compact를 대안으로 폄하하는 오해를 유발한다. 세 도구(/compact·phase 파일·HANDOFF)의 올바른 역할 분담으로 교체한다.

- [ ] **Step 1: 현재 내용 확인**

```bash
sed -n '36,63p' README.md
```

Expected: L38이 "긴 브레인스토밍 세션은...", L40이 "왜 `/compact`가 아닌 HANDOFF인가:"

- [ ] **Step 2: 절 교체**

Edit 도구로 다음 old_string → new_string 교체:

old_string:
```
긴 브레인스토밍 세션은 Claude Code의 컨텍스트 창을 소진합니다. `/compact`로 요약할 수도 있지만, dev-workflow는 **HANDOFF 방식**을 선택했습니다.

**왜 `/compact`가 아닌 HANDOFF인가:**
- `/compact`는 대화를 요약하지만, 현재 Phase / 확정된 결정 / 미해소 OPEN_QUESTIONS 같은 구조적 상태를 보존하지 못합니다
- HANDOFF는 작업 상태를 마크다운 파일로 저장하므로, 세션을 완전히 닫거나 며칠 후 다시 열어도 정확히 중단된 지점부터 이어갈 수 있습니다
```

new_string:
```
긴 브레인스토밍 세션은 Claude Code의 컨텍스트 창을 소진합니다. dev-workflow는 세 가지 도구를 상황에 따라 전략적으로 사용합니다.

**컨텍스트 관리 전략:**

| 도구 | 언제 | 효과 |
|---|---|---|
| `/compact` | Phase 진행 중 컨텍스트 60~70% 도달 시 | 대화 압축, 세션·페르소나·상태 유지 (세션 내 연장) |
| Phase 파일 (`phase*.md`) | Phase 완료 시 자동 저장 | 외부 메모리 역할 — `/clear` 후에도 복구 가능 |
| HANDOFF.md (`/dev-workflow:save`) | Phase 진행 중 어쩔 수 없이 `/clear`해야 할 때 | 미완료 Phase의 중간 상태를 파일로 보존 |

**Phase 경계가 최적의 `/clear` 타이밍:**
각 Phase 파일이 생성된 직후, 중요한 내용이 모두 파일에 저장된 상태입니다. 이 시점에 `/compact`로 세션을 연장하거나, `/clear`로 완전히 초기화해도 안전합니다. brainstorming 스킬이 각 Phase 완료 시 이 안내를 자동으로 제공합니다.
```

- [ ] **Step 3: 변경 결과 확인**

```bash
sed -n '36,68p' README.md
```

Expected: 테이블이 포함된 새 절이 L38 위치에 올바르게 삽입됨

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update context management strategy — compact/phase files/HANDOFF roles"
```

---

## Task 5: 버전 bump (1.7.6 → 1.7.7)

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Modify: `.claude-plugin/plugin.json`

**맥락:** 하위 호환 기능 추가 (출력 변경, 문서 추가) → PATCH bump (1.7.6 → 1.7.7)

- [ ] **Step 1: 현재 버전 확인**

```bash
grep "version" .claude-plugin/marketplace.json .claude-plugin/plugin.json
```

Expected: 두 파일 모두 `"version": "1.7.6"`

- [ ] **Step 2: marketplace.json 버전 업데이트**

Edit 도구로 `.claude-plugin/marketplace.json`에서:

old_string: `"version": "1.7.6"`
new_string: `"version": "1.7.7"`

- [ ] **Step 3: plugin.json 버전 업데이트**

Edit 도구로 `.claude-plugin/plugin.json`에서:

old_string: `"version": "1.7.6"`
new_string: `"version": "1.7.7"`

- [ ] **Step 4: 버전 동기화 확인**

```bash
grep "version" .claude-plugin/marketplace.json .claude-plugin/plugin.json
```

Expected: 두 파일 모두 `"version": "1.7.7"`

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/marketplace.json .claude-plugin/plugin.json
git commit -m "chore: bump version 1.7.6 → 1.7.7"
```

---

## Self-Review

**Spec coverage:**
- REQ-003 (Phase 완료 시 안내 출력): Task 1·2·3 ✅
- REQ-004 (/compact·HANDOFF·phase 파일 역할 분담 문서화): Task 4 ✅
- 버전 동기화 (CLAUDE.md 규칙): Task 5 ✅

**Placeholder scan:** 없음 — 모든 스텝에 실제 편집 내용 포함

**일관성 확인:**
- 세 Phase 안내 블록의 포맷이 동일함 (`💡 **컨텍스트 관리:**` 접두사, 동일 선택지 구조)
- README 테이블의 도구 설명이 안내 블록 내용과 일치함
- 버전이 두 파일에서 동일하게 업데이트됨
