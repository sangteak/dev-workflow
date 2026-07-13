import { test } from "node:test";
import assert from "node:assert";
import * as path from "node:path";
import { extractDigest } from "../src/digest";

// 번들 후 __dirname = mcp/test-dist → fixtures는 mcp/test/fixtures, 리포 루트는 mcp/../
const FIXTURES = path.resolve(__dirname, "..", "test", "fixtures");
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DOMAIN_DIR = path.join(REPO_ROOT, "docs", "design", "dev-workflow");

test("멱등 골든: 실제 도메인 문서 2건에 digest_extract 2회 실행 → 결과 완전 일치", () => {
  for (const name of ["document-management.md", "workflow-lifecycle.md"]) {
    const p = path.join(DOMAIN_DIR, name);
    const first = extractDigest(p, "domain");
    const second = extractDigest(p, "domain");
    assert.deepStrictEqual(second, first, `${name}: 2회 실행 결과 불일치`);

    // 실문서 구조 처리 확인 (핵심 결정 사항 표 존재)
    assert.ok(first.decisions.length > 0, `${name}: 결정 0건`);
    assert.ok(first.section_order.length > 0, `${name}: 섹션 0건`);
    assert.ok(first.line_count > 0, `${name}: line_count 0`);

    // ID 유일성
    const ids = [...first.policies, ...first.decisions].map((x) => x.id);
    assert.strictEqual(new Set(ids).size, ids.length, `${name}: ID 중복`);

    // 변경 이력 행이 정책/결정으로 새어들지 않았는지
    for (const item of [...first.policies, ...first.decisions]) {
      assert.notStrictEqual(item.source_section, "변경 이력", `${name}: 변경 이력 항목 유입`);
    }
  }
});

test("ID 부여 순서: 섹션 등장 순 → 항목 순으로 결정적 부여 (알파벳 순서 무관)", () => {
  const d = extractDigest(path.join(FIXTURES, "ordering.md"), "domain");

  assert.deepStrictEqual(
    d.policies.map((p) => [p.id, p.statement, p.source_section]),
    [
      ["POL-001", "첫 번째로 등장하는 섹션의 첫 불릿", "베타 규칙"],
      ["POL-002", "두 번째 불릿 — `코드 장식` 보존", "베타 규칙"],
      ["POL-003", "규칙 표 행 — 정책으로 수집", "베타 규칙"],
      ["POL-004", "문서상 뒤에 등장하므로 나중 번호를 받는다", "알파 규칙"],
    ]
  );

  assert.deepStrictEqual(
    d.decisions.map((x) => [x.id, x.statement]),
    [
      ["DEC-001", "저장 방식 — 파일 기반 — 단순"],
      ["DEC-002", "탐색 방식 — glob 스캔 — 인덱스 불필요"],
    ]
  );

  assert.deepStrictEqual(d.section_order, ["베타 규칙", "핵심 결정 사항", "알파 규칙", "변경 이력"]);
  assert.deepStrictEqual(d.requirement_ids, []);
});

test("feature 모드: F-POL-/F-DEC- 접두 부여", () => {
  const d = extractDigest(path.join(FIXTURES, "ordering.md"), "feature");
  assert.deepStrictEqual(
    d.policies.map((p) => p.id),
    ["F-POL-001", "F-POL-002", "F-POL-003", "F-POL-004"]
  );
  assert.deepStrictEqual(
    d.decisions.map((x) => x.id),
    ["F-DEC-001", "F-DEC-002"]
  );
});

test("명시 ID 보존: 재부여하지 않고 자동 번호는 점유 번호를 건너뜀, REQ는 등장 순 수집", () => {
  const d = extractDigest(path.join(FIXTURES, "explicit-ids.md"), "domain");

  assert.deepStrictEqual(
    d.policies.map((p) => p.id),
    ["POL-010", "POL-002", "POL-001", "POL-003"],
    "명시 POL-010/POL-001 보존 + 자동 번호가 POL-001을 건너뛰어야 함"
  );
  assert.deepStrictEqual(
    d.decisions.map((x) => x.id),
    ["DEC-005", "DEC-001"]
  );
  // REQ ID는 문서 등장 순서 보존 (REQ-003이 REQ-001보다 먼저 등장)
  assert.deepStrictEqual(d.requirement_ids, ["REQ-003", "REQ-001"]);
});
