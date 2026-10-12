"use strict";

// src/search-ignore/cli.ts
function main(argv) {
  if (argv[0] === "--version") {
    process.stdout.write(JSON.stringify({ status: "ok", version: "1" }) + "\n");
    return 0;
  }
  process.stdout.write(JSON.stringify({ status: "error", message: "usage: plan|apply --root <dir>" }) + "\n");
  return 1;
}

// src/search-ignore.ts
process.exitCode = main(process.argv.slice(2));
