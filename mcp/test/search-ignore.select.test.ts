import { test } from "node:test";
import assert from "node:assert";
import { buildRows } from "../src/search-ignore/select";
import { parseFolderPattern, FolderPattern } from "../src/search-ignore/match";

const pm = (raw: string, paths: string[]) => ({ pattern: parseFolderPattern(raw) as FolderPattern, paths, caseOnly: [] });

test("처음 실행: 산출물 이름은 미리 체크, 디스크에 없는 줄은 행이 아니다", () => {
  const rows = buildRows([pm("Binaries/", ["GW/Binaries"]), pm(".claude/", [".claude"]), pm("node_modules/", []), pm("*venv/", ["tools/.venv"])], null);
  assert.deepStrictEqual(rows.map((r) => [r.no, r.line, r.preselected]), [[1, "Binaries/", true], [2, ".claude/", false], [3, "*venv/", true]]);
  assert.strictEqual(rows[0].matchCount, 1);
});

test("Build는 미리 체크하지 않는다", () => {
  const rows = buildRows([pm("Build/", ["GW/Build"])], null);
  assert.strictEqual(rows[0].preselected, false);
});

test("다시 실행: 지난 system 목록만 미리 체크", () => {
  const rows = buildRows([pm("Binaries/", ["GW/Binaries"]), pm("Saved/", ["GW/Saved"])], ["Saved/"]);
  assert.deepStrictEqual(rows.map((r) => r.preselected), [false, true]);
});

test("포함 표시: 체크된 한 조각 줄에 모든 경로가 걸리면", () => {
  const rows = buildRows([pm("Saved/", ["GW/Saved"]), pm("Saved/Autosaves/", ["Saved/Autosaves"]), pm("Plugins/*/Binaries/", ["Plugins/A/Binaries"]), pm("Binaries/", ["GW/Binaries"]), pm(".vs/", [".vs"])], null);
  assert.strictEqual(rows[1].includedBy, "Saved/");
  assert.strictEqual(rows[2].includedBy, "Binaries/");
  assert.strictEqual(rows[4].includedBy, null);
  assert.strictEqual(rows[0].includedBy, null);
});

test("여러 조각 산출물 줄: 덮개가 없으면 미리 체크, includedBy는 null", () => {
  const rows = buildRows([pm("Plugins/*/Binaries/", ["Plugins/A/Binaries"])], null);
  assert.strictEqual(rows[0].preselected, true);
  assert.strictEqual(rows[0].includedBy, null);
});
