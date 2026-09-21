#!/usr/bin/env node
// 세션 transcript(assistant 텍스트)에서 화면 본문 줄의 출처 표기 모양을 센다 (grounded-output-display REQ-012).
// 모양만 센다 — 사실 여부는 검사하지 않는다. 개발 세션(이 저장소를 고치는 세션)에 돌리면 파일 언급이
// 정당하므로 실패가 정상이고, 통과 기준은 소비 프로젝트의 브레인스토밍 한 바퀴(세션 하나)다.
// 사용: node scripts/transcript-sources.mjs <session.jsonl>
// 메인 파일과 같은 이름 폴더의 subagents/agent-*.jsonl은 worker 출처로 세되 종료 코드에는 넣지 않는다
// (워커 반환물의 증거 구획에 경로가 있는 것은 정상).
// KO_LINE은 표의 행 참조('표 3행')도 잡는다 — 실사용 판정 때 사람이 가른다.
// 홀로 선 아이콘은 종료 코드에 들어가고, 이름표 되풀이는 항목 경계를 빈 줄로 잡는 근사치라 숫자만 보고한다.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const OLD_TAG = /\[✔[^\]]+\]/;                                      // [✔ 출처 …] — 확인 기호 뒤에 낱말이 붙은 대괄호
const PATH_LINE = /[\w.\/-]+\.(md|mjs|js|ts|cs|go|json|ya?ml|py|sh):\d+/;  // 경로:행 (규범 문장과 같은 정규식)
const KO_LINE = /\d+행|\d+번째 줄/;                                      // 한국어 행 표기
const QUOTE = /["“][^"”]{12,}["”]/;                         // 열두 자 이상 따옴표 인용
const QUOTE_CTX = /https?:\/\/|↳|[\w.\/-]+\.(md|mjs|js|ts|cs|go|json|ya?ml|py|sh)/; // 인용은 같은 줄에 주소, ↳, 파일 이름이 있을 때만 출처 인용으로 센다
const UNFOLD_HEAD = "📎 근거 — ";                  // "📎 근거 — " 고정 머리줄
const BARE_ICON = /(?<![(`（])[✔✅⚠❌🚫]️?(?=[를을가이는은로으와과의도만에])/;  // 홀로 선 아이콘 — 낱말 병기와 백틱은 뺀다
const LABEL_LINE = /^\s*([✔⚠]️?)\s+\S.*:\s*$/;                                  // 이름표 줄 (콜론으로 끝남)
const SUB_BULLET = /^\s*(?:-|\d+\.)\s*([✔⚠]️?)/;                                 // 이름표 아래 불릿에 아이콘이 다시 붙음
const stripVS = (s) => s.replace(/️$/, "");

const file = process.argv[2];
if (!file) { console.error("usage: transcript-sources.mjs <session.jsonl>"); process.exit(2); }

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

let total = 0, excluded = 0, workerBad = 0, repeat = 0;
const bad = { tag: 0, path: 0, quote: 0, icon: 0 };
for (const [src, path] of sources) {
  for (const t of texts(path)) {
    let inFence = false, afterUnfold = false, labelIcon = null;
    for (const line of t.split("\n")) {
      total++;
      if (/^\s*```/.test(line)) { inFence = !inFence; excluded++; continue; }
      if (inFence || /^\s*>/.test(line)) { excluded++; continue; }
      if (line.startsWith(UNFOLD_HEAD)) afterUnfold = true;
      if (afterUnfold) { excluded++; continue; }

      const label = LABEL_LINE.exec(line);
      if (label) {
        labelIcon = stripVS(label[1]);
      } else if (!line.trim()) {
        labelIcon = null;
      } else {
        const subBullet = SUB_BULLET.exec(line);
        if (subBullet && labelIcon !== null && stripVS(subBullet[1]) === labelIcon) repeat++;
      }
      if (BARE_ICON.test(line)) {
        if (src === "main") { bad.icon++; console.log(`main\ticon\t${line.slice(0, 160)}`); }
        else workerBad++;
      }

      let kind = null;
      if (OLD_TAG.test(line)) kind = "tag";
      else if (PATH_LINE.test(line) || KO_LINE.test(line)) kind = "path";
      else if (QUOTE.test(line) && QUOTE_CTX.test(line)) kind = "quote";
      if (!kind) continue;
      if (src === "main") { bad[kind]++; console.log(`main\t${kind}\t${line.slice(0, 160)}`); }
      else workerBad++;
    }
  }
}
const mainBad = bad.tag + bad.path + bad.quote + bad.icon;
console.log(`--- assistant 줄 ${total}, main 위반 ${mainBad} (옛 태그 ${bad.tag}, 경로:행 ${bad.path}, 인용 ${bad.quote}, 홀로 선 아이콘 ${bad.icon}), 이름표 되풀이 ${repeat}(보고만), worker 위반 ${workerBad}(보고만), 제외 줄 ${excluded}, 출처 ${sources.length}개 파일`);
process.exit(mainBad ? 1 : 0);
