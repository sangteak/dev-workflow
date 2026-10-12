import { FolderPattern, parseFolderPattern } from "./match";

export interface ParsedP4Ignore {
  folders: FolderPattern[];
  unsupported: string[];
}

export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** 주석, 빈 줄, ! 줄, 파일 줄을 빼고 폴더 줄만 등장 순서대로(중복 제거) 돌려준다. */
export function parseP4Ignore(text: string): ParsedP4Ignore {
  const folders: FolderPattern[] = [];
  const unsupported: string[] = [];
  const seen = new Set<string>();
  for (const rawLine of stripBom(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#") || line.startsWith("!")) continue;
    if (seen.has(line)) continue;
    const p = parseFolderPattern(line);
    if (p === null) continue;
    seen.add(line);
    if (p === "unsupported") unsupported.push(line);
    else folders.push(p);
  }
  return { folders, unsupported };
}
