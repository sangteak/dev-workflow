import * as fs from "node:fs";
import * as path from "node:path";
import { FolderPattern, segmentMatches } from "./match";

export interface PatternMatch {
  pattern: FolderPattern;
  paths: string[];
  caseOnly: string[];
}

function subdirs(abs: string): string[] {
  try {
    return fs
      .readdirSync(abs, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.isSymbolicLink())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

function expandAnchored(root: string, p: FolderPattern): { paths: string[]; caseOnly: string[] } {
  let cur: string[] = [""];
  for (const seg of p.segments) {
    const next: string[] = [];
    for (const rel of cur) {
      for (const name of subdirs(path.join(root, rel))) {
        if (segmentMatches(seg, name, true)) next.push(rel === "" ? name : `${rel}/${name}`);
      }
    }
    cur = next;
  }
  const paths: string[] = [];
  const caseOnly: string[] = [];
  for (const rel of cur) {
    const names = rel.split("/");
    const exact = p.segments.every((seg, i) => segmentMatches(seg, names[i], false));
    (exact ? paths : caseOnly).push(rel);
  }
  return { paths: paths.sort(), caseOnly: caseOnly.sort() };
}

export function scanPatterns(root: string, patterns: FolderPattern[]): PatternMatch[] {
  const results = patterns.map((pattern) => ({ pattern, paths: [] as string[], caseOnly: [] as string[] }));
  const single = results.filter((r) => !r.pattern.anchored);
  for (const r of results) {
    if (r.pattern.anchored) Object.assign(r, expandAnchored(root, r.pattern));
  }
  if (single.length > 0) {
    const queue: string[] = [""];
    while (queue.length > 0) {
      const rel = queue.shift() as string;
      for (const name of subdirs(path.join(root, rel))) {
        if (name === ".git") continue;
        const child = rel === "" ? name : `${rel}/${name}`;
        let stop = false;
        for (const r of single) {
          const seg = r.pattern.segments[0];
          if (segmentMatches(seg, name, false)) {
            r.paths.push(child);
            stop = true;
          } else if (segmentMatches(seg, name, true)) {
            r.caseOnly.push(child);
            stop = true;
          }
        }
        if (!stop) queue.push(child);
      }
    }
    for (const r of single) {
      r.paths.sort();
      r.caseOnly.sort();
    }
  }
  return results;
}
