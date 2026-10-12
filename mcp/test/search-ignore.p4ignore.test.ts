import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseP4Ignore, stripBom } from "../src/search-ignore/p4ignore";
import { parseFolderPattern, segmentMatches } from "../src/search-ignore/match";

test("폴더 줄만 고르고 주석, 빈 줄, ! 줄, 파일 줄은 뺀다 (BOM, CRLF)", () => {
  const text = "﻿# c\r\n\r\nBinaries/\r\n*.pdb\r\n!GW/Binaries/**\r\nSaved/Autosaves/\r\nDocs/.pending/**\r\n  Intermediate/  \r\n";
  const r = parseP4Ignore(text);
  assert.deepStrictEqual(r.folders.map((f) => f.raw), ["Binaries/", "Saved/Autosaves/", "Docs/.pending/**", "Intermediate/"]);
  assert.deepStrictEqual(r.unsupported, []);
});

test("한 조각 줄은 앵커 없음, 가운데 / 또는 앞 / 줄은 앵커", () => {
  assert.deepStrictEqual(parseFolderPattern("Intermediate/"), { raw: "Intermediate/", segments: ["Intermediate"], anchored: false });
  assert.deepStrictEqual(parseFolderPattern("Plugins/*/Binaries/"), { raw: "Plugins/*/Binaries/", segments: ["Plugins", "*", "Binaries"], anchored: true });
  assert.deepStrictEqual(parseFolderPattern("/Temp/"), { raw: "/Temp/", segments: ["Temp"], anchored: true });
  assert.deepStrictEqual(parseFolderPattern("Docs/.pending/**"), { raw: "Docs/.pending/**", segments: ["Docs", ".pending"], anchored: true });
  assert.strictEqual(parseFolderPattern("*.pdb"), null);
});

test("가운데 **, ?, [] 가 든 폴더 줄은 unsupported", () => {
  assert.strictEqual(parseFolderPattern("a/**/b/"), "unsupported");
  assert.strictEqual(parseFolderPattern("**/Temp/"), "unsupported");
  assert.strictEqual(parseFolderPattern("Te?p/"), "unsupported");
  assert.strictEqual(parseFolderPattern("[Tt]emp/"), "unsupported");
  const r = parseP4Ignore("a/**/b/\nBinaries/\n");
  assert.deepStrictEqual(r.unsupported, ["a/**/b/"]);
});

test("같은 줄이 두 번 나오면 한 번만", () => {
  assert.deepStrictEqual(parseP4Ignore("Saved/\nSaved/\n").folders.map((f) => f.raw), ["Saved/"]);
});

test("조각 단위 * 대조", () => {
  assert.ok(segmentMatches("*venv", ".venv", false));
  assert.ok(segmentMatches("*venv", "venv", false));
  assert.ok(!segmentMatches("*venv", "venvx", false));
  assert.ok(segmentMatches("Intermediate", "intermediate", true));
  assert.ok(!segmentMatches("Intermediate", "intermediate", false));
  assert.ok(segmentMatches("a.b", "a.b", false));
  assert.ok(!segmentMatches("a.b", "axb", false));
});

test("stripBom", () => {
  assert.strictEqual(stripBom("﻿abc"), "abc");
  assert.strictEqual(stripBom("abc"), "abc");
});

test("Node 18에 없는 API를 소스에서 쓰지 않는다", () => {
  const dir = path.resolve(__dirname, "..", "src", "search-ignore");
  for (const f of fs.readdirSync(dir)) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    assert.ok(!/matchesGlob|globSync/.test(src), `${f}: Node 20+ 전용 API`);
  }
});
