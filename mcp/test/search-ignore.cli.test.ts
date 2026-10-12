import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runPlan, runApply } from "../src/search-ignore/cli";
import { StopError } from "../src/search-ignore/yamlSource";

function fixture(p4: string | null, dirs: string[], files: Record<string, string> = {}): string {
  const root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "si-cli-")), "작업 폴더 A");
  fs.mkdirSync(root, { recursive: true });
  if (p4 !== null) fs.writeFileSync(path.join(root, ".p4ignore"), p4);
  for (const d of dirs) fs.mkdirSync(path.join(root, d), { recursive: true });
  for (const [f, c] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), c);
  }
  return root;
}
const read = (root: string, f: string) => fs.readFileSync(path.join(root, f), "utf8");
const stopReason = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    if (e instanceof StopError) return e.reason;
    throw e;
  }
  return "no-stop";
};
const LONG = "UCLASS generated body for GWItemCoreRuntime module";

test("처음 실행: 미리 체크대로 apply → yaml과 .ignore 생성, probe 출력", () => {
  const root = fixture("\uFEFFBinaries/\r\nSaved/\r\nSaved/Autosaves/\r\n.claude/\r\n", ["GW/Binaries", "Saved/Autosaves", ".claude"], { "GW/Binaries/a.h": LONG + "\n" });
  const plan = runPlan(root);
  assert.deepStrictEqual(plan.rows.map((r) => [r.line, r.preselected, r.includedBy]), [
    ["Binaries/", true, null], ["Saved/", true, null], ["Saved/Autosaves/", false, "Saved/"], [".claude/", false, null],
  ]);
  assert.ok(plan.screen.includes("(체크된 `Saved/`에 포함)"));
  const res = runApply(root, [1, 2], plan.digest);
  assert.deepStrictEqual(res.written, [".claude/ignore.yaml", ".ignore"]);
  assert.strictEqual(read(root, ".ignore").split("\n").slice(3).join("\n"), "Binaries/\nSaved/\n");
  assert.deepStrictEqual(res.probes, [{ kind: "system", line: "Binaries/", folder: "GW/Binaries", file: "GW/Binaries/a.h", text: LONG }]);
});

test("같은 입력으로 두 번 실행하면 바이트가 같고 두 번째는 쓰지 않는다", () => {
  const root = fixture("Binaries/\n", ["Binaries"]);
  runApply(root, [1], runPlan(root).digest);
  const a = [read(root, ".ignore"), read(root, ".claude/ignore.yaml")];
  const res = runApply(root, [1], runPlan(root).digest);
  assert.deepStrictEqual(res.written, []);
  assert.deepStrictEqual([read(root, ".ignore"), read(root, ".claude/ignore.yaml")], a);
});

test("user 줄을 더하고 다시 실행: system만 다시 쓰고 user 줄은 .ignore 뒤에", () => {
  const root = fixture("Binaries/\n", ["Binaries", "Docs/Temp"], { "Docs/Temp/n.txt": LONG + "\n" });
  runApply(root, [1], runPlan(root).digest);
  const y = read(root, ".claude/ignore.yaml").replace("  exclude: []", '  exclude:\n    - "Temp/" # 메모');
  fs.writeFileSync(path.join(root, ".claude/ignore.yaml"), y);
  const plan = runPlan(root);
  assert.strictEqual(plan.rows[0].preselected, true);
  const res = runApply(root, [1], plan.digest);
  assert.ok(read(root, ".claude/ignore.yaml").includes("# 메모"));
  assert.ok(read(root, ".ignore").endsWith("Binaries/\nTemp/\n"));
  assert.deepStrictEqual(res.probes[1], { kind: "user", line: "Temp/", folder: "Docs/Temp", file: "Docs/Temp/n.txt", text: LONG });
});

test("user 줄이 디스크에 없으면 unverifiable", () => {
  const root = fixture("Binaries/\n", ["Binaries"]);
  runApply(root, [1], runPlan(root).digest);
  fs.writeFileSync(path.join(root, ".claude/ignore.yaml"), read(root, ".claude/ignore.yaml").replace("  exclude: []", '  exclude:\n    - "Tmep/"'));
  const res = runApply(root, [1], runPlan(root).digest);
  assert.strictEqual((res.probes.find((p) => p.kind === "user") as { unverifiable: boolean }).unverifiable, true);
});

test("원본 없음 → no-source, 파일 안 만듦", () => {
  const root = fixture(null, ["Binaries"]);
  assert.strictEqual(stopReason(() => runPlan(root)), "no-source");
  assert.ok(!fs.existsSync(path.join(root, ".claude")));
});

test("p4ignore.txt도 원본으로 인정하고 source 줄에 그 이름", () => {
  const root = fixture(null, ["Binaries"], { "p4ignore.txt": "Binaries/\n" });
  const plan = runPlan(root);
  assert.strictEqual(plan.source, "p4ignore.txt");
  runApply(root, [1], plan.digest);
  assert.ok(read(root, ".ignore").includes("# source: p4ignore.txt"));
});

test("손으로 쓴 .ignore → foreign-ignore, 건드리지 않음", () => {
  const root = fixture("Binaries/\n", ["Binaries"], { ".ignore": "Temp/\n" });
  assert.strictEqual(stopReason(() => runPlan(root)), "foreign-ignore");
  assert.strictEqual(read(root, ".ignore"), "Temp/\n");
});

test("user에 따옴표 없는 *venv/ → yaml-error, 두 파일 모두 그대로", () => {
  const root = fixture("Binaries/\n", ["Binaries"]);
  runApply(root, [1], runPlan(root).digest);
  const bad = read(root, ".claude/ignore.yaml").replace("  exclude: []", "  exclude:\n    - *venv/");
  fs.writeFileSync(path.join(root, ".claude/ignore.yaml"), bad);
  const before = read(root, ".ignore");
  assert.strictEqual(stopReason(() => runPlan(root)), "yaml-error");
  assert.strictEqual(read(root, ".ignore"), before);
  assert.strictEqual(read(root, ".claude/ignore.yaml"), bad);
});

test("plan 뒤 폴더가 바뀌면 digest-mismatch", () => {
  const root = fixture("Binaries/\nSaved/\n", ["Binaries"]);
  const plan = runPlan(root);
  fs.mkdirSync(path.join(root, "Saved"));
  assert.strictEqual(stopReason(() => runApply(root, [1], plan.digest)), "digest-mismatch");
  assert.ok(!fs.existsSync(path.join(root, ".ignore")));
});

test("범위 밖 행 번호 → bad-rows", () => {
  const root = fixture("Binaries/\n", ["Binaries"]);
  assert.strictEqual(stopReason(() => runApply(root, [5], runPlan(root).digest)), "bad-rows");
});

test(".rgignore가 있으면 알림", () => {
  const root = fixture("Binaries/\n", ["Binaries"], { ".rgignore": "x\n" });
  assert.ok(runPlan(root).notices.some((n) => n.includes(".rgignore")));
});
