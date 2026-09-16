#!/usr/bin/env node
// 세션 transcript(assistant 텍스트)에서 가운뎃점(·)을 센다 (middle-dot-removal REQ-021).
// 사용: node scripts/transcript-dots.mjs <session.jsonl>
// 메인 파일과 같은 이름 폴더의 subagents/agent-*.jsonl을 함께 읽고, 출처(main/worker)를 앞에 붙인다.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const DOT = "·";
const NAME = /가운뎃점\(·\)/g;
const file = process.argv[2];
if (!file) { console.error("usage: transcript-dots.mjs <session.jsonl>"); process.exit(2); }

function* texts(path) {
  for (const raw of readFileSync(path, "utf8").split("\n")) {
    if (!raw.trim()) continue;
    let j; try { j = JSON.parse(raw); } catch { continue; }
    if (j.type !== "assistant") continue;
    const content = j.message && j.message.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) if (c.type === "text" && typeof c.text === "string") yield c.text;
  }
}
const sources = [["main", file]];
const sub = join(dirname(file), basename(file, ".jsonl"), "subagents");
if (existsSync(sub)) for (const f of readdirSync(sub)) if (/^agent-.*\.jsonl$/.test(f)) sources.push(["worker", join(sub, f)]);

let bad = 0, total = 0, listy = 0;
for (const [src, path] of sources) {
  for (const t of texts(path)) {
    for (const line of t.split("\n")) {
      total++;
      if (/, |^\s*- /.test(line)) listy++;                       // 쉼표나 불릿 나열이 있는 줄(도착 조건의 분모)
      const cleaned = line.replace(NAME, "");
      if (cleaned.includes(DOT)) { bad++; console.log(`${src}\t${line.slice(0, 160)}`); }
    }
  }
}
console.log(`--- assistant 줄 ${total}, 나열 줄 ${listy}, 가운뎃점 줄 ${bad}, 출처 ${sources.length}개 파일`);
process.exit(bad ? 1 : 0);
