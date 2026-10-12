/**
 * search-ignore — /dev-workflow:search-ignore 명령의 생성 스크립트.
 * stdout에 JSON 한 줄을 쓰고 종료 코드(0 정상, 2 멈춤, 1 내부 오류)를 돌려준다.
 */
export function main(argv: string[]): number {
  if (argv[0] === "--version") {
    process.stdout.write(JSON.stringify({ status: "ok", version: "1" }) + "\n");
    return 0;
  }
  process.stdout.write(JSON.stringify({ status: "error", message: "usage: plan|apply --root <dir>" }) + "\n");
  return 1;
}
