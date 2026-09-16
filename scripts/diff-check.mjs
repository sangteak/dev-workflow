#!/usr/bin/env node
// 스윕 diff의 hunk마다 뜻 보존을 기계로 본다 (middle-dot-removal REQ-017).
// 사용: node scripts/diff-check.mjs <base-ref> [-- <경로>...]
// 출력: 한 줄에 하나 — OK | READ | FAIL | DOMAIN-BULLET, 파일, 새 줄 번호, 사유
import { execFileSync } from "node:child_process";

const DOT = "·";
const [base, ...rest] = process.argv.slice(2);
if (!base) { console.error("usage: diff-check.mjs <base-ref> [-- paths]"); process.exit(2); }
const diff = execFileSync("git", ["diff", "-U0", "--no-color", base, "--", ...rest.filter(p => p !== "--")], { encoding: "utf8", maxBuffer: 1 << 28 });

const DOMAIN = /^docs\/design\/[^/]+\/[^/]+\.md$/;            // 도메인 문서 최상위
const FEATURE = /^docs\/design\/[^/]+\/(code-name-lookup|reask-reassembly|question-numbering|decision-label-linebreak)\//;
const ALLOW_NEW = new Set([",", " ", "\n", "-", "와", "과", "나"]);
const strip = s => s.replace(/\r/g, "");

function jongseong(ch) { const c = ch.codePointAt(0); if (c < 0xac00 || c > 0xd7a3) return null; return (c - 0xac00) % 28; }
function particleErrors(text) {
  const errs = [];
  for (const m of text.matchAll(/(\S)(와|과)(?=\s|$)/g)) {
    const j = jongseong(m[1]); if (j === null) continue;
    if ((j === 0 && m[2] === "과") || (j !== 0 && m[2] === "와")) errs.push(m[1] + m[2]);
  }
  return errs;
}
function normalizeIna(s) {
  // "이나"는 받침 있는 글자 뒤에서만 "나"의 등가형이다 — 그 자리의 "이"를 세는 대상에서 뺀다.
  return s.replace(/([가-힣])이나/g, (m, ch) => {
    const j = jongseong(ch);
    return j !== null && j !== 0 ? ch + "나" : m;
  });
}
function counts(s) { const m = new Map(); for (const ch of s) m.set(ch, (m.get(ch) || 0) + 1); return m; }

let file = null, out = [];
const lines = diff.split("\n");
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  if (L.startsWith("+++ b/")) { file = L.slice(6); continue; }
  const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(L);
  if (!h) continue;
  const newLine = Number(h[1]);
  let old = [], neu = [];
  for (i++; i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff "); i++) {
    if (lines[i].startsWith("-")) old.push(strip(lines[i].slice(1)));
    else if (lines[i].startsWith("+")) neu.push(strip(lines[i].slice(1)));
  }
  i--;
  const o = old.join("\n"), n = neu.join("\n");
  const oc = counts(o), nc = counts(normalizeIna(n));
  const onlyOld = [], onlyNew = [];
  for (const [ch, k] of oc) { const d = k - (nc.get(ch) || 0); if (d > 0) onlyOld.push([ch, d]); }
  for (const [ch, k] of nc) { const d = k - (oc.get(ch) || 0); if (d > 0) onlyNew.push([ch, d]); }
  const dots = oc.get(DOT) || 0;
  const reasons = [];
  if (onlyOld.some(([ch]) => ch !== DOT)) reasons.push("옛 쪽에만 남는 글자: " + onlyOld.filter(([c]) => c !== DOT).map(([c, d]) => `${JSON.stringify(c)}x${d}`).join(" "));
  if (onlyNew.some(([ch]) => !ALLOW_NEW.has(ch))) reasons.push("새 쪽에만 남는 글자: " + onlyNew.filter(([c]) => !ALLOW_NEW.has(c)).map(([c, d]) => `${JSON.stringify(c)}x${d}`).join(" "));
  const newParticles = onlyNew.filter(([c]) => c === "와" || c === "과" || c === "나").reduce((a, [, d]) => a + d, 0);
  if (newParticles > dots) reasons.push(`새 조사 ${newParticles} > 지운 점 ${dots}`);
  const pe = particleErrors(n); if (pe.length) reasons.push("받침: " + pe.join(" "));
  const newBullet = neu.some(l => /^\s*- /.test(l)) && !old.some(l => /^\s*- /.test(l));
  const isDoc = DOMAIN.test(file) || FEATURE.test(file);
  // 분류: 도메인 문서의 새 불릿 → DOMAIN-BULLET. 글자 차이 사유가 있으면 층 나누기(줄이 늘고 점이 있었음)는 READ, 아니면 FAIL.
  // 사유가 없어도 줄 수가 달라졌거나(층 나누기) 구분자를 뺀 글자 순서가 달라졌으면(어순 재배치) READ. 그 밖은 OK.
  const core = t => [...t].filter(c => c !== DOT && !ALLOW_NEW.has(c)).join("");
  const reordered = core(o) !== core(n);
  let tag;
  if (isDoc && newBullet) tag = "DOMAIN-BULLET";
  else if (reasons.length) tag = (neu.length > old.length && dots > 0) ? "READ" : "FAIL";
  else if (neu.length !== old.length || reordered) tag = "READ";
  else tag = "OK";
  out.push(`${tag}\t${file}\t${newLine}\t${reasons.join("; ")}`);
}
const tally = {};
for (const l of out) { const t = l.split("\t")[0]; tally[t] = (tally[t] || 0) + 1; }
console.log(out.join("\n"));
console.log("--- " + Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(", "));
process.exit(tally.FAIL || tally["DOMAIN-BULLET"] ? 1 : 0);
