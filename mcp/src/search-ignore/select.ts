import { segmentMatches } from "./match";
import { PatternMatch } from "./scan";

export const ARTIFACT_NAMES: readonly string[] = [
  "intermediate", "deriveddatacache", "saved", "binaries", "node_modules", "__pycache__", ".gradle", ".venv", "venv",
];

export interface Row {
  no: number;
  line: string;
  matchCount: number;
  preselected: boolean;
  includedBy: string | null;
}

function lastSegment(rel: string): string {
  const parts = rel.split("/");
  return parts[parts.length - 1];
}

export function buildRows(matches: PatternMatch[], previousSystem: string[] | null): Row[] {
  const present = matches.filter((m) => m.paths.length > 0);
  const rows: Row[] = present.map((m, i) => ({
    no: i + 1,
    line: m.pattern.raw,
    matchCount: m.paths.length,
    preselected:
      previousSystem === null
        ? m.paths.some((p) => ARTIFACT_NAMES.includes(lastSegment(p).toLowerCase()))
        : previousSystem.includes(m.pattern.raw),
    includedBy: null,
  }));

  if (previousSystem === null) {
    // On first run: find covers (preselected, non-anchored, single-segment) and mark covered rows as not preselected
    const coveringRows = present
      .map((m, i) => ({ m, row: rows[i] }))
      .filter((x) => x.row.preselected && !x.m.pattern.anchored && x.m.pattern.segments.length === 1);
    present.forEach((m, i) => {
      // Skip rows that are themselves covers
      const isOwnCover = rows[i].preselected && !m.pattern.anchored && m.pattern.segments.length === 1;
      if (isOwnCover) return;
      const cover = coveringRows.find((c) =>
        m.paths.every((p) => p.split("/").some((seg) => segmentMatches(c.m.pattern.segments[0], seg, false))),
      );
      if (cover) {
        rows[i].includedBy = cover.row.line;
        rows[i].preselected = false;
      }
    });
  } else {
    // On rerun: only mark includedBy for non-preselected rows
    const coveringRows = present
      .map((m, i) => ({ m, row: rows[i] }))
      .filter((x) => x.row.preselected && !x.m.pattern.anchored && x.m.pattern.segments.length === 1);
    present.forEach((m, i) => {
      if (rows[i].preselected) return;
      const cover = coveringRows.find((c) =>
        m.paths.every((p) => p.split("/").some((seg) => segmentMatches(c.m.pattern.segments[0], seg, false))),
      );
      if (cover) rows[i].includedBy = cover.row.line;
    });
  }

  return rows;
}
