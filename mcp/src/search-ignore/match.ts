/** 폴더 줄 패턴 — .ignore(gitignore) 규칙대로 한 조각 줄은 어느 깊이든, 가운데나 앞 / 줄은 세션 폴더 기준. */
export interface FolderPattern {
  raw: string;
  segments: string[];
  anchored: boolean;
}

/** 폴더 줄이 아니면 null, 이 명령이 다루지 않는 모양이면 "unsupported". */
export function parseFolderPattern(raw: string): FolderPattern | "unsupported" | null {
  let body: string;
  if (raw.endsWith("/**")) body = raw.slice(0, -3);
  else if (raw.endsWith("/")) body = raw.slice(0, -1);
  else return null;
  let anchored = false;
  if (body.startsWith("/")) {
    anchored = true;
    body = body.slice(1);
  }
  if (body === "" || /[?[\]]/.test(body) || body.includes("**")) return "unsupported";
  const segments = body.split("/");
  if (segments.some((s) => s === "")) return "unsupported";
  if (segments.length > 1) anchored = true;
  return { raw, segments, anchored };
}

export function segmentMatches(seg: string, name: string, caseInsensitive: boolean): boolean {
  const re = "^" + seg.split("*").map((p) => p.replace(/[.+^${}()|\\]/g, "\\$&")).join("[^/]*") + "$";
  return new RegExp(re, caseInsensitive ? "i" : "").test(name);
}
