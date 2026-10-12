/**
 * search-ignore — /dev-workflow:search-ignore 명령의 생성 스크립트.
 * stdout에 JSON 한 줄을 쓰고 종료 코드(0 정상, 2 멈춤, 1 내부 오류)를 돌려준다.
 */
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseP4Ignore } from "./p4ignore";
import { parseFolderPattern, FolderPattern } from "./match";
import { scanPatterns } from "./scan";
import { buildRows, Row } from "./select";
import { readYamlSource, renderInitialYaml, replaceSystem, StopError, YamlSource } from "./yamlSource";
import { isOwned, renderIgnore } from "./ignoreFile";
import { pickProbe } from "./probe";

export type Probe =
  | { kind: "system" | "user"; line: string; folder: string; file: string; text: string }
  | { kind: "system" | "user"; line: string; unverifiable: true; why: string };

export interface PlanResult {
  status: "ok";
  source: string;
  digest: string;
  rows: Row[];
  caseOnly: { line: string; paths: string[] }[];
  unsupported: string[];
  notices: string[];
  screen: string;
}

export interface ApplyResult {
  status: "ok";
  written: string[];
  system: string[];
  user: string[];
  probes: Probe[];
  notices: string[];
}

interface Prepared {
  source: string;
  srcText: string;
  yamlText: string | null;
  yaml: YamlSource | null;
  rows: Row[];
  firstPaths: Map<string, string[]>;
  caseOnly: { line: string; paths: string[] }[];
  unsupported: string[];
  notices: string[];
  digest: string;
}

const YAML_REL = ".claude/ignore.yaml";

function readIf(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

function prepare(root: string): Prepared {
  let source = ".p4ignore";
  let srcText = readIf(path.join(root, source));
  if (srcText === null) {
    source = "p4ignore.txt";
    srcText = readIf(path.join(root, source));
  }
  if (srcText === null) {
    throw new StopError("no-source", "세션 폴더에 .p4ignore(또는 p4ignore.txt)가 없습니다. .p4ignore가 있는 폴더에서 세션을 여세요.");
  }
  const existingIgnore = readIf(path.join(root, ".ignore"));
  if (existingIgnore !== null && !isOwned(existingIgnore)) {
    throw new StopError(
      "foreign-ignore",
      "이 폴더에는 이 명령이 만들지 않은 .ignore가 있습니다. 기존 .ignore를 지우거나 이름을 바꾼 뒤 다시 실행하세요. 남길 줄은 그 전에 적어 두었다가 .claude/ignore.yaml의 user 부분에 옮기세요.",
    );
  }
  const yamlText = readIf(path.join(root, YAML_REL));
  const yaml = yamlText === null ? null : readYamlSource(yamlText);
  const parsed = parseP4Ignore(srcText);
  const matches = scanPatterns(root, parsed.folders);
  const rows = buildRows(matches, yaml ? yaml.system : null);
  const firstPaths = new Map(matches.map((m) => [m.pattern.raw, m.paths]));
  const caseOnly = matches.filter((m) => m.caseOnly.length > 0).map((m) => ({ line: m.pattern.raw, paths: m.caseOnly }));
  const notices: string[] = [];
  if (fs.existsSync(path.join(root, ".rgignore"))) {
    notices.push("세션 폴더에 .rgignore가 있어 .ignore보다 앞섭니다. 제외가 먹지 않으면 먼저 확인하세요.");
  }
  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify({ src: srcText, yaml: yamlText ?? "", rows: rows.map((r) => [r.line, r.matchCount]) }))
    .digest("hex")
    .slice(0, 16);
  return { source, srcText, yamlText, yaml, rows, firstPaths, caseOnly, unsupported: parsed.unsupported, notices, digest };
}

function renderScreen(p: Prepared): string {
  const out: string[] = [];
  if (p.rows.length === 0) out.push(`${p.source} 폴더 줄 가운데 디스크에 있는 것이 없습니다.`);
  else {
    out.push(`${p.source} 폴더 줄 가운데 디스크에 있는 것 (${p.rows.length}행)`, "");
    for (const r of p.rows) {
      const tail = r.includedBy ? `(체크된 \`${r.includedBy}\`에 포함)` : `(폴더 ${r.matchCount}곳)`;
      out.push(`  [${r.preselected ? "x" : " "}] ${r.no}. ${r.line}  ${tail}`);
    }
  }
  out.push("");
  for (const c of p.caseOnly) {
    out.push(`대소문자만 다른 폴더: \`${c.line}\` ↔ ${c.paths.join(", ")} — .ignore는 대소문자를 가려서 이 줄은 먹지 않습니다.`);
  }
  if (p.unsupported.length > 0) out.push(`이 명령이 다루지 않는 모양이라 뺀 줄: ${p.unsupported.map((u) => `\`${u}\``).join(", ")}`);
  out.push(`${p.source}에 없는 폴더는 .claude/ignore.yaml의 user 부분에 적고 다시 실행하세요.`);
  return out.join("\n");
}

export function runPlan(root: string): PlanResult {
  const p = prepare(root);
  return {
    status: "ok",
    source: p.source,
    digest: p.digest,
    rows: p.rows,
    caseOnly: p.caseOnly,
    unsupported: p.unsupported,
    notices: p.notices,
    screen: renderScreen(p),
  };
}

function writeAtomic(root: string, rel: string, text: string, written: string[]): void {
  const abs = path.join(root, rel);
  if (readIf(abs) === text) return;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.tmp-${process.pid}`;
  try {
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, abs);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }
  written.push(rel);
}

function probeFor(root: string, kind: "system" | "user", line: string, folders: string[]): Probe {
  if (folders.length === 0) return { kind, line, unverifiable: true, why: "맞는 폴더가 디스크에 없음" };
  for (const folder of folders) {
    const pick = pickProbe(root, folder);
    if (pick) return { kind, line, folder, file: pick.file, text: pick.text };
  }
  return { kind, line, unverifiable: true, why: "고를 텍스트 파일이 없음" };
}

export function runApply(root: string, rowNos: number[], digest: string): ApplyResult {
  const p = prepare(root);
  if (p.digest !== digest) {
    throw new StopError(
      "digest-mismatch",
      "후보를 계산한 뒤 .p4ignore, .claude/ignore.yaml이나 폴더가 바뀌었습니다. 명령을 다시 실행하세요. 파일은 바꾸지 않았습니다.",
    );
  }
  for (const n of rowNos) {
    if (!p.rows.some((r) => r.no === n)) {
      throw new StopError("bad-rows", `행 번호 ${n}은 후보에 없습니다. 파일은 바꾸지 않았습니다.`);
    }
  }
  const chosen = p.rows.filter((r) => rowNos.includes(r.no));
  const system = chosen.map((r) => r.line);
  const user = p.yaml ? p.yaml.user : [];
  const yamlOut = p.yamlText === null ? renderInitialYaml(system) : replaceSystem(p.yamlText, system);
  const ignoreOut = renderIgnore(p.source, system, user);
  const blocked = [YAML_REL, ".ignore"].filter((rel, i) => {
    const abs = path.join(root, rel);
    const current = readIf(abs);
    if (current === null || current === (i === 0 ? yamlOut : ignoreOut)) return false;
    try {
      fs.accessSync(abs, fs.constants.W_OK);
      return false;
    } catch {
      return true;
    }
  });
  if (blocked.length > 0) {
    const names = blocked.join(", ");
    const args = blocked.join(" ");
    throw new StopError(
      "read-only",
      `${names} 파일이 읽기 전용이라 바꿀 수 없습니다. 파일은 바꾸지 않았습니다.\n\nPerforce로 받은 파일이라면:\n- p4 edit ${args} (또는 P4V에서 Check Out) 뒤 이 명령을 다시 실행하세요\n- 작업공간 옵션 allwrite를 켜 두면 받은 파일이 읽기 전용이 되지 않습니다`,
    );
  }
  const written: string[] = [];
  writeAtomic(root, YAML_REL, yamlOut, written);
  writeAtomic(root, ".ignore", ignoreOut, written);

  const probes: Probe[] = [];
  if (chosen.length > 0) {
    let sys: Probe | null = null;
    for (const r of chosen) {
      const pr = probeFor(root, "system", r.line, p.firstPaths.get(r.line) ?? []);
      if (!("unverifiable" in pr)) {
        sys = pr;
        break;
      }
      sys = sys ?? pr;
    }
    if (sys) probes.push(sys);
  }
  const userPatterns = user
    .filter((u) => !system.includes(u))
    .map((u) => parseFolderPattern(u))
    .filter((x): x is FolderPattern => x !== null && x !== "unsupported");
  if (user.length > 0) {
    const matches = scanPatterns(root, userPatterns);
    const hit = matches.find((m) => m.paths.length > 0);
    probes.push(hit ? probeFor(root, "user", hit.pattern.raw, hit.paths) : { kind: "user", line: user[0], unverifiable: true, why: "맞는 폴더가 디스크에 없음" });
  }
  return { status: "ok", written, system, user, probes, notices: p.notices };
}

function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function main(argv: string[]): number {
  const out = (o: unknown) => process.stdout.write(JSON.stringify(o) + "\n");
  try {
    if (argv[0] === "--version") {
      out({ status: "ok", version: "1" });
      return 0;
    }
    const root = arg(argv, "--root");
    if (!root || (argv[0] !== "plan" && argv[0] !== "apply")) {
      out({ status: "error", message: "usage: plan --root <dir> | apply --root <dir> --rows <1,2> --digest <hex>" });
      return 1;
    }
    if (argv[0] === "plan") out(runPlan(root));
    else {
      const rowsArg = arg(argv, "--rows") ?? "";
      const rows = rowsArg.trim() === "" ? [] : rowsArg.split(",").map((s) => Number(s.trim()));
      out(runApply(root, rows, arg(argv, "--digest") ?? ""));
    }
    return 0;
  } catch (e) {
    if (e instanceof StopError) {
      out({ status: "stop", reason: e.reason, message: e.message });
      return 2;
    }
    out({ status: "error", message: (e as Error).message });
    return 1;
  }
}
