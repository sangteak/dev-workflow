/**
 * digest_extract — merge-to-domain (1)(2) 학습 단계의 structured digest 추출.
 *
 * 핵심 계약 (SKILL.md "Idempotent 의무", REQ-005):
 *   같은 입력이면 항상 같은 ID·순서를 산출한다.
 *   ID 부여 규칙: 섹션 등장 순서 → 섹션 내 항목 순서 → 자동 번호
 *   (domain: POL-001+/DEC-001+, feature: F-POL-001+/F-DEC-001+)
 *
 * 추출 휴리스틱 (보수적 — 구조 신호만 사용):
 *   - 항목 후보는 코드 펜스 밖의 불릿(-, *, +)과 표 데이터 행만 사용한다.
 *   - 헤딩(H2/H3)에 "결정"이 포함된 섹션의 항목 → decisions, 그 외 → policies.
 *   - "변경 이력"·"관련 파일" 섹션은 항목 수집에서 제외한다 (이력·파일 목록은
 *     정책/결정이 아니며 매 머지마다 자연 변동하는 영역).
 *   - 애매한 항목은 누락시키지 않고 statement로 포함한다 — 의미 필터링은 LLM 몫.
 *   - immutability_level·supersedes 등 의미 판단 필드는 추출하지 않는다 (LLM 몫).
 *
 * 명시 ID 보존:
 *   - 표 셀이 정확히 ID(POL-NNN/DEC-NNN, F- 접두 포함)인 경우,
 *     또는 불릿 텍스트가 ID로 시작하는 경우에만 명시 ID로 인정하고 보존한다.
 *     (본문 중간의 크로스레퍼런스는 명시 ID로 오인하지 않는다)
 *   - 자동 번호는 명시 ID가 이미 점유한 번호를 건너뛴다 (충돌 방지, 결정적).
 *   - REQ-NNN은 문서 전체에서 등장 순서대로 중복 없이 보존 수집한다 (재부여 없음).
 */
import * as fs from "node:fs";

export type DigestMode = "domain" | "feature";

export interface DigestItem {
  id: string;
  statement: string;
  source_section: string;
}

export interface Digest {
  policies: DigestItem[];
  decisions: DigestItem[];
  requirement_ids: string[];
  section_order: string[];
  line_count: number;
}

/** 라인 수 계산 — 마지막 개행 뒤의 빈 꼬리는 세지 않는다. digest와 verify가 동일 규칙을 공유한다. */
export function countLines(raw: string): number {
  const lines = raw.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") return lines.length - 1;
  return lines.length;
}

const DECISION_SECTION_KEYWORDS = ["결정", "decision"];
const EXCLUDED_SECTION_KEYWORDS = ["변경 이력", "관련 파일", "changelog"];

const PREAMBLE_SECTION = "(문서 서두)";

interface RawItem {
  kind: "policy" | "decision";
  statement: string;
  source_section: string;
  explicit_id: string | null;
}

function containsKeyword(heading: string, keywords: string[]): boolean {
  const lower = heading.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

/** "| a | b |" → ["a", "b"] */
function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

/** 표 구분 행 (|---|:---:|) 여부 */
export function isTableSeparatorRow(line: string): boolean {
  const cells = splitTableRow(line);
  if (cells.length === 0) return false;
  return cells.every((c) => /^:?-+:?$/.test(c));
}

/** 표 셀이 정확히 ID일 때만 명시 ID로 인정 (장식 문자는 무시) */
function cellExplicitId(cells: string[], kind: "policy" | "decision"): string | null {
  const pat = kind === "policy" ? /^(?:F-)?POL-\d+$/ : /^(?:F-)?DEC-\d+$/;
  for (const c of cells) {
    const stripped = c.replace(/[*_`~\s]/g, "");
    if (pat.test(stripped)) return stripped;
  }
  return null;
}

/** 불릿 텍스트가 ID로 시작할 때만 명시 ID로 인정 */
function leadingExplicitId(text: string, kind: "policy" | "decision"): string | null {
  const m = text.match(/^[*_`~]*\s*((?:F-)?(POL|DEC)-\d+)\b/);
  if (!m) return null;
  if (kind === "policy" && m[2] !== "POL") return null;
  if (kind === "decision" && m[2] !== "DEC") return null;
  return m[1];
}

export function extractDigestFromText(raw: string, mode: DigestMode): Digest {
  const lines = raw.split(/\r?\n/);
  const line_count = countLines(raw);

  // REQ ID: 문서 전체 스캔, 등장 순서 보존 + 중복 제거
  const requirement_ids: string[] = [];
  const seenReq = new Set<string>();
  for (const m of raw.matchAll(/\bREQ-\d+\b/g)) {
    if (!seenReq.has(m[0])) {
      seenReq.add(m[0]);
      requirement_ids.push(m[0]);
    }
  }

  // YAML frontmatter 스킵 (feature 문서: status/category 등)
  let start = 0;
  if (lines[0]?.trim() === "---") {
    for (let j = 1; j < lines.length; j++) {
      if (lines[j].trim() === "---") {
        start = j + 1;
        break;
      }
    }
  }

  const section_order: string[] = [];
  const items: RawItem[] = [];
  let currentH2 = PREAMBLE_SECTION;
  let currentH3 = "";
  let inFence = false;
  let fenceChar = "";

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 코드 펜스 토글 — 펜스 안은 전부 무시
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

    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      currentH2 = h2[1];
      currentH3 = "";
      section_order.push(h2[1]);
      continue;
    }
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      currentH3 = h3[1];
      continue;
    }

    const excluded =
      containsKeyword(currentH2, EXCLUDED_SECTION_KEYWORDS) ||
      (currentH3 !== "" && containsKeyword(currentH3, EXCLUDED_SECTION_KEYWORDS));
    if (excluded) continue;

    const kind: "policy" | "decision" =
      containsKeyword(currentH2, DECISION_SECTION_KEYWORDS) ||
      (currentH3 !== "" && containsKeyword(currentH3, DECISION_SECTION_KEYWORDS))
        ? "decision"
        : "policy";

    // 표 블록: 연속된 | 라인 — 헤더/구분 행은 건너뛰고 데이터 행만 항목화
    if (trimmed.startsWith("|")) {
      const block: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        block.push(lines[j].trim());
        j++;
      }
      i = j - 1;
      let dataRows = block;
      if (block.length >= 2 && isTableSeparatorRow(block[1])) dataRows = block.slice(2);
      for (const row of dataRows) {
        if (isTableSeparatorRow(row)) continue;
        const cells = splitTableRow(row);
        const nonEmpty = cells.filter((c) => c.length > 0);
        if (nonEmpty.length === 0) continue;
        items.push({
          kind,
          statement: nonEmpty.join(" — "),
          source_section: currentH2,
          explicit_id: cellExplicitId(cells, kind),
        });
      }
      continue;
    }

    // 불릿 항목
    const bullet = line.match(/^\s*[-*+]\s+(.+?)\s*$/);
    if (bullet) {
      const text = bullet[1];
      items.push({
        kind,
        statement: text,
        source_section: currentH2,
        explicit_id: leadingExplicitId(text, kind),
      });
    }
  }

  // ID 부여 — 등장 순서대로 자동 번호, 명시 ID가 점유한 번호는 건너뜀
  const polPrefix = mode === "feature" ? "F-POL" : "POL";
  const decPrefix = mode === "feature" ? "F-DEC" : "DEC";
  const usedIds = new Set(items.filter((x) => x.explicit_id !== null).map((x) => x.explicit_id as string));
  const fmt = (prefix: string, n: number) => `${prefix}-${String(n).padStart(3, "0")}`;

  let np = 1;
  let nd = 1;
  const policies: DigestItem[] = [];
  const decisions: DigestItem[] = [];
  for (const it of items) {
    let id: string;
    if (it.explicit_id !== null) {
      id = it.explicit_id;
    } else if (it.kind === "policy") {
      while (usedIds.has(fmt(polPrefix, np))) np++;
      id = fmt(polPrefix, np);
      np++;
    } else {
      while (usedIds.has(fmt(decPrefix, nd))) nd++;
      id = fmt(decPrefix, nd);
      nd++;
    }
    const entry: DigestItem = { id, statement: it.statement, source_section: it.source_section };
    if (it.kind === "policy") policies.push(entry);
    else decisions.push(entry);
  }

  return { policies, decisions, requirement_ids, section_order, line_count };
}

export function extractDigest(filePath: string, mode: DigestMode): Digest {
  const raw = fs.readFileSync(filePath, "utf8");
  return extractDigestFromText(raw, mode);
}
