import { parseDocument } from "yaml";
import { stripBom } from "./p4ignore";

export const SYS_START = "# >>> search-ignore system (명령이 다시 씀 — 직접 고치지 마세요)";
export const SYS_END = "# <<< search-ignore system";

export class StopError extends Error {
  constructor(public reason: string, message: string) {
    super(message);
  }
}

export interface YamlSource {
  system: string[];
  user: string[];
}

function stringList(v: unknown, where: string): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    throw new StopError("yaml-error", `.claude/ignore.yaml의 ${where}.exclude는 문자열 목록이어야 합니다. 파일은 바꾸지 않았습니다.`);
  }
  return v as string[];
}

export function readYamlSource(text: string): YamlSource {
  const doc = parseDocument(stripBom(text));
  if (doc.errors.length > 0) {
    throw new StopError("yaml-error", `.claude/ignore.yaml을 읽지 못했습니다: ${doc.errors[0].message.split("\n")[0]}. 파일은 바꾸지 않았습니다.`);
  }
  let js: unknown;
  try {
    js = doc.toJS();
  } catch (e) {
    throw new StopError(
      "yaml-error",
      `.claude/ignore.yaml을 읽지 못했습니다: ${(e as Error).message}. user 부분에서 * 나 ! 로 시작하는 줄은 따옴표로 감싸세요. 파일은 바꾸지 않았습니다.`,
    );
  }
  const obj = (js ?? {}) as { system?: { exclude?: unknown }; user?: { exclude?: unknown } };
  return { system: stringList(obj.system?.exclude, "system"), user: stringList(obj.user?.exclude, "user") };
}

function systemBlock(system: string[], eol: string): string {
  const lines = [SYS_START, "system:"];
  if (system.length === 0) lines.push("  exclude: []");
  else {
    lines.push("  exclude:");
    for (const s of system) lines.push(`    - ${JSON.stringify(s)}`);
  }
  lines.push(SYS_END);
  return lines.join(eol);
}

export function renderInitialYaml(system: string[]): string {
  return [
    "# /dev-workflow:search-ignore 원본 — .ignore는 이 파일에서 만들어집니다",
    systemBlock(system, "\n"),
    "user:",
    '  # 검색에서 더 뺄 폴더를 적고 /dev-workflow:search-ignore 를 다시 실행하세요. 예: - "Temp/"',
    "  # 적는 모양은 .p4ignore 줄과 같습니다. 가운데 / 가 든 줄은 이 폴더 기준이고, 어느 깊이든 빼려면 앞에 **/ 를 붙입니다.",
    "  # * 나 ! 로 시작하는 줄은 따옴표로 감쌉니다.",
    "  # 그만 쓰려면 이 파일과 .ignore를 지웁니다.",
    "  exclude: []",
    "",
  ].join("\n");
}

export function replaceSystem(text: string, system: string[]): string {
  const bom = text.charCodeAt(0) === 0xfeff ? "\uFEFF" : "";
  const body = stripBom(text);
  const eol = body.includes("\r\n") ? "\r\n" : "\n";
  const lines = body.split(/\r?\n/);
  const starts = lines.flatMap((l, i) => (l.trimEnd() === SYS_START ? [i] : []));
  const ends = lines.flatMap((l, i) => (l.trimEnd() === SYS_END ? [i] : []));
  if (starts.length !== 1 || ends.length !== 1 || starts[0] > ends[0]) {
    throw new StopError(
      "marker-error",
      ".claude/ignore.yaml의 system 구획 표지가 한 쌍이 아닙니다. 표지 줄을 되돌리거나 파일을 지운 뒤 다시 실행하세요. 파일은 바꾸지 않았습니다.",
    );
  }
  const out = [...lines.slice(0, starts[0]), systemBlock(system, eol), ...lines.slice(ends[0] + 1)].join(eol);
  const check = readYamlSource(out);
  if (JSON.stringify(check.system) !== JSON.stringify(system)) {
    throw new StopError("marker-error", ".claude/ignore.yaml system 구획을 다시 쓴 결과가 맞지 않습니다. 파일은 바꾸지 않았습니다.");
  }
  return bom + out;
}
