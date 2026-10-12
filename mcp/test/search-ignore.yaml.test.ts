import { test } from "node:test";
import assert from "node:assert";
import { readYamlSource, renderInitialYaml, replaceSystem, StopError } from "../src/search-ignore/yamlSource";

test("처음 파일을 만들고 다시 읽으면 같은 목록 (따옴표로 * 줄 안전)", () => {
  const text = renderInitialYaml(["Intermediate/", "*venv/", 'we"ird\\/']);
  assert.deepStrictEqual(readYamlSource(text), { system: ["Intermediate/", "*venv/", 'we"ird\\/'], user: [] });
  assert.ok(text.includes("# * 나 ! 로 시작하는 줄은 따옴표로 감쌉니다."));
});

test("빈 system은 exclude: []", () => {
  assert.deepStrictEqual(readYamlSource(renderInitialYaml([])).system, []);
});

test("system 구획만 갈아 끼우고 user 부분과 주석은 그대로 (CRLF, BOM 보존)", () => {
  const base = renderInitialYaml(["Saved/"]).replace('exclude: []', 'exclude:\n    - "Temp/" # 내 메모').replace(/\n/g, "\r\n");
  const withBom = "﻿" + base;
  const out = replaceSystem(withBom, ["Binaries/"]);
  assert.ok(out.startsWith("﻿"));
  assert.ok(!/[^\r]\n/.test(out), "LF만 남은 줄이 있으면 안 됨");
  assert.ok(out.includes("# 내 메모"));
  assert.deepStrictEqual(readYamlSource(out), { system: ["Binaries/"], user: ["Temp/"] });
});

test("user에 따옴표 없는 *venv/ → yaml-error (toJS 예외)", () => {
  const bad = renderInitialYaml(["X/"]).replace("exclude: []\n", "exclude:\n    - *venv/\n");
  assert.throws(() => readYamlSource(bad), (e: unknown) => e instanceof StopError && e.reason === "yaml-error" && /user|줄/.test(e.message));
});

test("문법 오류 → yaml-error", () => {
  assert.throws(() => readYamlSource("user:\n  exclude: [\n"), (e: unknown) => e instanceof StopError && e.reason === "yaml-error");
});

test("user.exclude가 문자열 목록이 아니면 yaml-error", () => {
  const bad = renderInitialYaml(["X/"]).replace("exclude: []", "exclude: 3");
  assert.throws(() => readYamlSource(bad), (e: unknown) => e instanceof StopError && e.reason === "yaml-error");
});

test("표지가 정확히 한 쌍이 아니면 marker-error", () => {
  const noEnd = renderInitialYaml(["Saved/"]).replace("# <<< search-ignore system\n", "");
  assert.throws(() => replaceSystem(noEnd, []), (e: unknown) => e instanceof StopError && e.reason === "marker-error");
  const twice = renderInitialYaml(["Saved/"]) + "# >>> search-ignore system (명령이 다시 씀 — 직접 고치지 마세요)\n";
  assert.throws(() => replaceSystem(twice, []), (e: unknown) => e instanceof StopError && e.reason === "marker-error");
});
