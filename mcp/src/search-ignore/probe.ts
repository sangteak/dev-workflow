import * as fs from "node:fs";
import * as path from "node:path";

export interface ProbePick {
  file: string;
  text: string;
}

const MAX_FILES = 2000;
const SPECIAL = /[.*+?()[\]{}|\\^$]/;

function pickLine(abs: string): string | null {
  let buf: Buffer;
  try {
    const st = fs.statSync(abs);
    if (st.size > 1024 * 1024) return null;
    buf = fs.readFileSync(abs);
  } catch {
    return null;
  }
  if (buf.subarray(0, 65536).includes(0)) return null;
  for (const raw of buf.toString("utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length >= 24 && line.length <= 200 && !SPECIAL.test(line)) return line;
  }
  return null;
}

export function pickProbe(root: string, relFolder: string): ProbePick | null {
  const queue: string[] = [relFolder];
  let seen = 0;
  while (queue.length > 0 && seen < MAX_FILES) {
    const rel = queue.shift() as string;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    } catch {
      continue;
    }
    for (const e of entries) {
      const child = `${rel}/${e.name}`;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) queue.push(child);
      else if (e.isFile()) {
        seen++;
        const text = pickLine(path.join(root, child));
        if (text !== null) return { file: child, text };
        if (seen >= MAX_FILES) break;
      }
    }
  }
  return null;
}
