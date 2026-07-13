/**
 * dev-workflow MCP 서버 (stdio) — merge-to-domain 머지군 3도구 MVP.
 *
 * 코드화 경계 (docs/reviews/modularization-review.md §3 T1-1):
 *   Stage 1·2(digest 추출)와 Stage 5(사후 검증)만 코드화한다.
 *   Stage 3(충돌 분류·Architect 라운드)과 Stage 4의 dry-run·승인 게이트·문서 편집은
 *   자연어(LLM)에 남고, 도구는 백업/복원(merge_checkpoint)만 관여한다.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { extractDigest } from "./digest";
import { verifyMerge } from "./verify";
import { createCheckpoint, listCheckpoints, restoreCheckpoint } from "./checkpoint";

const server = new McpServer({ name: "dev-workflow", version: "0.1.0" });

function ok(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { isError: true, content: [{ type: "text" as const, text: `오류: ${message}` }] };
}

server.registerTool(
  "digest_extract",
  {
    title: "structured digest 추출",
    description:
      "merge-to-domain 5단계 알고리즘의 (1) domain.md / (2) feature.md 학습 단계용 structured digest를 결정적으로 추출한다. " +
      "같은 입력이면 항상 같은 ID·순서를 보장한다 (멱등 의무, REQ-005). " +
      "ID 부여: 섹션 등장 순 → 섹션 내 항목 순 → 자동 번호 (domain: POL-001+/DEC-001+, feature: F-POL-001+/F-DEC-001+). " +
      "문서에 이미 명시된 ID(REQ-001, 표의 ID 컬럼 등)는 보존하고 재부여하지 않는다. " +
      "구조 신호(불릿·표·헤딩)만 사용하며, immutability_level·supersedes 같은 의미 판단 필드는 추출하지 않는다 — LLM이 후처리한다.",
    inputSchema: {
      file_path: z.string().describe("digest를 추출할 마크다운 문서의 경로 (절대 경로 권장)"),
      mode: z
        .enum(["domain", "feature"])
        .describe("domain: POL-/DEC- 접두 (domain.md 학습), feature: F-POL-/F-DEC- 접두 (feature.md 학습)"),
    },
  },
  async ({ file_path, mode }) => {
    try {
      return ok(extractDigest(file_path, mode));
    } catch (e) {
      return fail(e);
    }
  }
);

const preDigestItemSchema = z
  .object({
    id: z.string(),
    statement: z.string(),
  })
  .passthrough();

server.registerTool(
  "merge_verify",
  {
    title: "머지 사후 검증",
    description:
      "merge-to-domain (5) 검증 단계의 기계 검사. pre-merge digest의 각 정책/결정 statement가 머지된 문서에 " +
      "존재하는지 정규화 문자열 매칭(공백 축약·마크다운 장식 제거·구두점 통일 후 부분 문자열 포함)으로 검사하고, " +
      "라인 수 변화율(±50% 이내)과 변경 이력 섹션('## 10.' 또는 '변경 이력' 헤딩 아래 표)의 오늘 날짜 행 존재를 확인한다. " +
      "미매칭 항목은 그대로 반환한다 — 패러프레이즈 등 의미 판정은 LLM 몫이다.",
    inputSchema: {
      pre_digest: z
        .object({
          policies: z.array(preDigestItemSchema).default([]),
          decisions: z.array(preDigestItemSchema).default([]),
        })
        .passthrough()
        .describe("digest_extract 출력 형태의 pre-merge 기준선 (policies/decisions의 id·statement 사용)"),
      merged_file_path: z.string().describe("머지가 적용된 도메인 문서 경로"),
      pre_line_count: z
        .number()
        .int()
        .positive()
        .describe("pre-merge 시점 라인 수 (digest_extract 출력의 line_count)"),
    },
  },
  async ({ pre_digest, merged_file_path, pre_line_count }) => {
    try {
      return ok(verifyMerge(pre_digest, merged_file_path, pre_line_count));
    } catch (e) {
      return fail(e);
    }
  }
);

server.registerTool(
  "merge_checkpoint",
  {
    title: "no-git-mode 체크포인트",
    description:
      "merge-to-domain no-git-mode 체크포인트 관리. create: domain.md 수정 직전 같은 디렉토리에 " +
      "'[파일명].premerge-YYYYMMDD.bak' 백업 생성 (같은 날 중복 시 -2, -3 순번). " +
      "restore: 가장 최근 체크포인트에서 복원 (없으면 명시 오류). list: 해당 파일의 체크포인트 목록.",
    inputSchema: {
      file_path: z.string().describe("체크포인트 대상 파일 경로 (도메인 문서)"),
      action: z.enum(["create", "restore", "list"]).describe("create | restore | list"),
    },
  },
  async ({ file_path, action }) => {
    try {
      if (action === "create") return ok(createCheckpoint(file_path));
      if (action === "restore") return ok(restoreCheckpoint(file_path));
      return ok({ checkpoints: listCheckpoints(file_path) });
    } catch (e) {
      return fail(e);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
