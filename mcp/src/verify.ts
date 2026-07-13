/**
 * merge_verify — merge-to-domain (5) 검증 단계의 기계 검사.
 *
 * 검증 체크리스트 대응 (SKILL.md (5) 검증):
 *   - 정책 보존: pre-merge digest의 각 statement가 머지된 문서에 존재하는지
 *     "정규화 문자열 매칭까지만" 검사한다. 공백 축약·마크다운 장식 제거·구두점 통일
 *     후 부분 문자열 포함 검사. 미매칭은 그대로 반환한다 — 패러프레이즈 등
 *     의미 판정은 LLM 몫이므로 도구가 추측하지 않는다.
 *   - 라인 수 변화율 ±50% 이내 (대량 손실 탐지)
 *   - 섹션 10 변경 이력: "## 10." 또는 "변경 이력" 헤딩 아래 표에
 *     오늘 날짜(로컬 YYYY-MM-DD) 행 존재 여부
 */
import * as fs from "node:fs";
import { countLines, isTableSeparatorRow } from "./digest";

export interface PreDigestItem {
  id: string;
  statement: string;
}

export interface PreDigest {
  policies?: PreDigestItem[];
  decisions?: PreDigestItem[];
}

export interface VerifyResult {
  matched: { id: string; matched_line?: number }[];
  unmatched: { id: string; statement: string }[];
  line_delta_pct: number;
  line_delta_ok: boolean;
  changelog_row_present: boolean;
}

/** 로컬 기준 오늘 날짜 YYYY-MM-DD */
export function todayLocalISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 매칭용 정규화 — 도구가 수행하는 유일한 변형:
 *   불릿/헤딩 접두 제거, 링크 → 텍스트, 마크다운 장식(굵게·코드·취소선·표 파이프) 제거,
 *   대시·구두점류 → 공백 통일, ASCII 소문자화, 연속 공백 축약.
 *   하이픈은 보존한다 (REQ-001 같은 ID 파괴 방지).
 *   인라인 장식(`*_~)은 공백이 아니라 빈 문자열로 제거한다 — 한국어처럼 장식이 어절
 *   중간에서 끝나는 경우("**파일 기반**을") 공백 치환은 어절을 갈라 매칭을 깨뜨린다.
 *   표 파이프(|)는 셀 경계이므로 공백으로 치환한다.
 */
export function normalizeForMatch(input: string): string {
  let s = input;
  s = s.replace(/^\s*(?:>\s*)*(?:[-*+]\s+|#{1,6}\s+)?/, " ");
  s = s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, " $1 ");
  s = s.replace(/[`*_~]/g, "");
  s = s.replace(/[|—–―·…]/g, " ");
  s = s.replace(/[,.;:!?()[\]{}<>"'“”‘’「」『』〈〉《》、。]/g, " ");
  s = s.toLowerCase();
  return s.replace(/\s+/g, " ").trim();
}

/** 문서 전체를 정규화한 단일 문자열 + 각 문자 → 원본 라인 번호(1-based) 맵 */
function buildNormalizedDoc(lines: string[]): { text: string; lineOf: number[] } {
  let text = "";
  const lineOf: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const norm = normalizeForMatch(lines[i]);
    if (norm.length === 0) continue;
    if (text.length > 0) {
      text += " ";
      lineOf.push(lineOf[lineOf.length - 1]);
    }
    for (let k = 0; k < norm.length; k++) lineOf.push(i + 1);
    text += norm;
  }
  return { text, lineOf };
}

/** 변경 이력 섹션("## 10." 또는 "변경 이력" 헤딩) 표에 지정 날짜 행이 있는지 */
export function hasChangelogRowForDate(lines: string[], date: string): boolean {
  let inFence = false;
  let fenceChar = "";
  let inSection = false;
  let sectionLevel = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    const fence = trimmed.match(/^(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence[1][0];
      } else if (fence[1][0] === fenceChar) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const h = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (h) {
      const level = h[1].length;
      if (inSection && level <= sectionLevel) inSection = false;
      const title = h[2];
      if (/변경\s*이력/.test(title) || /^10[.)]/.test(title)) {
        inSection = true;
        sectionLevel = level;
      }
      continue;
    }
    if (!inSection) continue;
    if (trimmed.startsWith("|") && !isTableSeparatorRow(trimmed) && trimmed.includes(date)) {
      return true;
    }
  }
  return false;
}

export function verifyMerge(
  preDigest: PreDigest,
  mergedFilePath: string,
  preLineCount: number
): VerifyResult {
  const raw = fs.readFileSync(mergedFilePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const mergedLineCount = countLines(raw);

  const { text, lineOf } = buildNormalizedDoc(lines);

  const matched: { id: string; matched_line?: number }[] = [];
  const unmatched: { id: string; statement: string }[] = [];
  const allItems = [...(preDigest.policies ?? []), ...(preDigest.decisions ?? [])];
  for (const item of allItems) {
    const needle = normalizeForMatch(item.statement ?? "");
    if (needle.length === 0) {
      matched.push({ id: item.id });
      continue;
    }
    const idx = text.indexOf(needle);
    if (idx >= 0) matched.push({ id: item.id, matched_line: lineOf[idx] });
    else unmatched.push({ id: item.id, statement: item.statement });
  }

  const deltaRaw = ((mergedLineCount - preLineCount) / preLineCount) * 100;
  return {
    matched,
    unmatched,
    line_delta_pct: Math.round(deltaRaw * 10) / 10,
    line_delta_ok: Math.abs(deltaRaw) <= 50,
    changelog_row_present: hasChangelogRowForDate(lines, todayLocalISO()),
  };
}
