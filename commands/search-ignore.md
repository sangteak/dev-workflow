---
description: "Perforce 저장소에서 .p4ignore 폴더 줄로 .ignore를 만들어 Claude Grep 검색에서 빌드 산출물을 뺀다"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/mcp/dist/search-ignore.js" *)
---

# search-ignore (뼈대)

Bash 도구로 아래 명령을 그대로 실행하고, 나온 JSON 한 줄을 그대로 보여 준다.

```bash
node "${CLAUDE_PLUGIN_ROOT}/mcp/dist/search-ignore.js" --version
```
