/**
 * merge_checkpoint — no-git-mode 체크포인트 (SKILL.md (4) 적용 1단계).
 *
 * domain.md 수정 직전 같은 디렉토리에 `[파일명].premerge-YYYYMMDD.bak`을 생성하고,
 * 실패 시 가장 최근 체크포인트에서 복원한다. 같은 날 중복 생성은 -2, -3 순번.
 * 셸 호출 없이 Node fs/path API만 사용한다 (Windows 지원).
 */
import * as fs from "node:fs";
import * as path from "node:path";

export interface CheckpointInfo {
  path: string;
  date: string;
  sequence: number;
}

function todayCompact(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 해당 파일의 체크포인트 목록 (날짜 → 순번 오름차순) */
export function listCheckpoints(filePath: string): CheckpointInfo[] {
  const abs = path.resolve(filePath);
  const dir = path.dirname(abs);
  const base = path.basename(abs);
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp(`^${escapeRegExp(base)}\\.premerge-(\\d{8})(?:-(\\d+))?\\.bak$`);
  const found: CheckpointInfo[] = [];
  for (const name of fs.readdirSync(dir)) {
    const m = name.match(re);
    if (m) {
      found.push({
        path: path.join(dir, name),
        date: m[1],
        sequence: m[2] ? parseInt(m[2], 10) : 1,
      });
    }
  }
  found.sort((a, b) => (a.date === b.date ? a.sequence - b.sequence : a.date < b.date ? -1 : 1));
  return found;
}

/** 체크포인트 생성 — 같은 날 중복 시 -2, -3 … 순번 부여 */
export function createCheckpoint(filePath: string): { checkpoint_path: string } {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`체크포인트 대상 파일이 존재하지 않습니다: ${abs}`);
  }
  const dir = path.dirname(abs);
  const base = path.basename(abs);
  const date = todayCompact();
  let candidate = path.join(dir, `${base}.premerge-${date}.bak`);
  for (let seq = 2; fs.existsSync(candidate); seq++) {
    if (seq > 999) {
      throw new Error(`체크포인트 순번이 한도(999)를 초과했습니다: ${base}.premerge-${date}-*.bak`);
    }
    candidate = path.join(dir, `${base}.premerge-${date}-${seq}.bak`);
  }
  fs.copyFileSync(abs, candidate);
  return { checkpoint_path: candidate };
}

/** 가장 최근 체크포인트(최신 날짜 → 최대 순번)에서 복원. 없으면 명시 오류 */
export function restoreCheckpoint(filePath: string): { restored_from: string } {
  const abs = path.resolve(filePath);
  const list = listCheckpoints(abs);
  if (list.length === 0) {
    const base = path.basename(abs);
    throw new Error(
      `복원할 체크포인트가 없습니다: ${path.dirname(abs)} 에 ${base}.premerge-*.bak 패턴의 파일이 없습니다.`
    );
  }
  const latest = list[list.length - 1];
  fs.copyFileSync(latest.path, abs);
  return { restored_from: latest.path };
}
