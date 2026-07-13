import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { verifyMerge, todayLocalISO } from "../src/verify";
import { countLines } from "../src/digest";

const FIXTURES = path.resolve(__dirname, "..", "test", "fixtures");
const MERGED = path.join(FIXTURES, "merged-sample.md");

function mergedLineCount(): number {
  return countLines(fs.readFileSync(MERGED, "utf8"));
}

test("매칭: 마크다운 장식(굵게·코드·불릿·표 파이프) 차이를 넘어 statement 매칭", () => {
  const pre = {
    policies: [
      { id: "POL-001", statement: "정규화 매칭은 굵게 표시와 불릿 기호를 무시한다" },
      // 어절 중간에서 끝나는 굵게 표시("**파일 기반**을") 회귀 케이스
      { id: "POL-002", statement: "저장 방식은 파일 기반을 사용한다" },
    ],
    decisions: [{ id: "DEC-001", statement: "저장 방식 — 파일 기반" }],
  };
  const r = verifyMerge(pre, MERGED, mergedLineCount());
  assert.deepStrictEqual(r.unmatched, []);
  assert.strictEqual(r.matched.length, 3);
  const byId = Object.fromEntries(r.matched.map((m) => [m.id, m.matched_line]));
  assert.strictEqual(byId["POL-001"], 3, "불릿 라인 번호");
  assert.strictEqual(byId["POL-002"], 4, "어절 중간 굵게 종료 케이스 라인 번호");
  assert.strictEqual(byId["DEC-001"], 10, "표 데이터 행 라인 번호");
  assert.strictEqual(r.line_delta_pct, 0);
  assert.strictEqual(r.line_delta_ok, true);
});

test("미매칭: 패러프레이즈는 매칭하지 않고 그대로 반환 (의미 판정은 LLM 몫)", () => {
  const pre = {
    policies: [{ id: "POL-001", statement: "정규화 매칭은 별표 기호를 전부 제거한다" }],
    decisions: [],
  };
  const r = verifyMerge(pre, MERGED, mergedLineCount());
  assert.strictEqual(r.matched.length, 0);
  assert.deepStrictEqual(r.unmatched, [
    { id: "POL-001", statement: "정규화 매칭은 별표 기호를 전부 제거한다" },
  ]);
});

test("라인 델타: ±50% 초과 시 line_delta_ok=false", () => {
  const pre = { policies: [], decisions: [] };
  // pre 200라인 → merged-sample(15라인)로 대량 손실 시나리오
  const r = verifyMerge(pre, MERGED, 200);
  assert.ok(r.line_delta_pct < -50, `delta=${r.line_delta_pct}`);
  assert.strictEqual(r.line_delta_ok, false);
});

test("changelog: 오늘 날짜 행이 없으면 false, 있으면 true ('변경 이력'·'## 10.' 헤딩 모두)", () => {
  const pre = { policies: [], decisions: [] };

  // merged-sample.md의 변경 이력에는 과거 날짜만 존재
  const r0 = verifyMerge(pre, MERGED, mergedLineCount());
  assert.strictEqual(r0.changelog_row_present, false);

  const today = todayLocalISO();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devwf-verify-"));
  try {
    // '변경 이력' 헤딩 케이스
    const p1 = path.join(tmp, "with-today.md");
    fs.writeFileSync(
      p1,
      [
        "## 본문",
        "",
        "내용",
        "",
        "## 변경 이력",
        "",
        "| 날짜 | 변경 내용 | 영향 범위 | 상태 |",
        "|---|---|---|---|",
        `| ${today} | 오늘 머지 (작성자: tester) | 전체 | 완료 |`,
        "",
      ].join("\n"),
      "utf8"
    );
    const r1 = verifyMerge(pre, p1, 9);
    assert.strictEqual(r1.changelog_row_present, true);

    // '## 10.' 번호 헤딩 케이스
    const p2 = path.join(tmp, "with-ten.md");
    fs.writeFileSync(
      p2,
      ["## 10. Change Log", "", "| Date | Note |", "|---|---|", `| ${today} | merged |`, ""].join("\n"),
      "utf8"
    );
    const r2 = verifyMerge(pre, p2, 5);
    assert.strictEqual(r2.changelog_row_present, true);

    // 변경 이력 섹션 밖의 오늘 날짜는 인정하지 않음
    const p3 = path.join(tmp, "outside.md");
    fs.writeFileSync(p3, ["## 본문", "", `오늘은 ${today} 이다.`, ""].join("\n"), "utf8");
    const r3 = verifyMerge(pre, p3, 3);
    assert.strictEqual(r3.changelog_row_present, false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
