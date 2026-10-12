import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { scanPatterns } from "../src/search-ignore/scan";
import { parseP4Ignore } from "../src/search-ignore/p4ignore";

function tree(dirs: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "si-scan-"));
  for (const d of dirs) fs.mkdirSync(path.join(root, d), { recursive: true });
  return root;
}

test("한 조각 줄은 어느 깊이든 찾고, 맞은 폴더 안으로는 내려가지 않는다", () => {
  const root = tree(["GW/Intermediate/Build/Intermediate", "Intermediate", "GW/Source/Game", ".git/Intermediate"]);
  const [m] = scanPatterns(root, parseP4Ignore("Intermediate/\n").folders);
  assert.deepStrictEqual(m.paths, ["GW/Intermediate", "Intermediate"]);
});

test("앵커 줄은 세션 폴더 기준 조각 수가 같을 때만", () => {
  const root = tree(["Saved/Autosaves", "GW/Saved/Autosaves", "GW/Plugins/A/Binaries", "Plugins/B/Binaries", "Plugins/C/D/Binaries"]);
  const ms = scanPatterns(root, parseP4Ignore("Saved/Autosaves/\nPlugins/*/Binaries/\n").folders);
  assert.deepStrictEqual(ms[0].paths, ["Saved/Autosaves"]);
  assert.deepStrictEqual(ms[1].paths, ["Plugins/B/Binaries"]);
});

test("대소문자만 다른 폴더는 caseOnly", () => {
  const root = tree(["GW/intermediate", "Docs/Local"]);
  const ms = scanPatterns(root, parseP4Ignore("Intermediate/\nDocs/local/\n").folders);
  assert.deepStrictEqual(ms[0].paths, []);
  assert.deepStrictEqual(ms[0].caseOnly, ["GW/intermediate"]);
  assert.deepStrictEqual(ms[1].caseOnly, ["Docs/Local"]);
});

test("디스크에 없으면 빈 목록", () => {
  const root = tree(["Source"]);
  const [m] = scanPatterns(root, parseP4Ignore("node_modules/\n").folders);
  assert.deepStrictEqual(m.paths, []);
  assert.deepStrictEqual(m.caseOnly, []);
});
