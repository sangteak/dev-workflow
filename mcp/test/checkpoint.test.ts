import { test } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createCheckpoint, listCheckpoints, restoreCheckpoint } from "../src/checkpoint";

function tmpDomain(): { dir: string; file: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devwf-ckpt-"));
  const file = path.join(dir, "matchmaking.md");
  fs.writeFileSync(file, "원본 내용 A\n", "utf8");
  return { dir, file };
}

test("checkpoint 라운드트립: create → 변조 → restore → 원본 일치", () => {
  const { dir, file } = tmpDomain();
  try {
    const { checkpoint_path } = createCheckpoint(file);
    assert.match(path.basename(checkpoint_path), /^matchmaking\.md\.premerge-\d{8}\.bak$/);
    assert.strictEqual(fs.readFileSync(checkpoint_path, "utf8"), "원본 내용 A\n");

    fs.writeFileSync(file, "머지 도중 깨진 내용\n", "utf8");
    const { restored_from } = restoreCheckpoint(file);
    assert.strictEqual(restored_from, checkpoint_path);
    assert.strictEqual(fs.readFileSync(file, "utf8"), "원본 내용 A\n");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("같은 날 중복 create: -2, -3 순번 부여 + restore는 가장 최근 순번 선택", () => {
  const { dir, file } = tmpDomain();
  try {
    const cp1 = createCheckpoint(file).checkpoint_path;
    assert.match(path.basename(cp1), /^matchmaking\.md\.premerge-\d{8}\.bak$/);

    fs.writeFileSync(file, "내용 B\n", "utf8");
    const cp2 = createCheckpoint(file).checkpoint_path;
    assert.match(path.basename(cp2), /^matchmaking\.md\.premerge-\d{8}-2\.bak$/);

    fs.writeFileSync(file, "내용 C\n", "utf8");
    const cp3 = createCheckpoint(file).checkpoint_path;
    assert.match(path.basename(cp3), /^matchmaking\.md\.premerge-\d{8}-3\.bak$/);

    // list: 순번 오름차순
    const list = listCheckpoints(file);
    assert.deepStrictEqual(
      list.map((c) => c.path),
      [cp1, cp2, cp3]
    );
    assert.deepStrictEqual(
      list.map((c) => c.sequence),
      [1, 2, 3]
    );

    // restore: 가장 최근(-3, 내용 C)에서 복원
    fs.writeFileSync(file, "깨진 내용\n", "utf8");
    const { restored_from } = restoreCheckpoint(file);
    assert.strictEqual(restored_from, cp3);
    assert.strictEqual(fs.readFileSync(file, "utf8"), "내용 C\n");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("restore: 체크포인트가 없으면 명시 오류", () => {
  const { dir, file } = tmpDomain();
  try {
    assert.throws(() => restoreCheckpoint(file), /복원할 체크포인트가 없습니다/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("create: 대상 파일이 없으면 명시 오류, list: 빈 디렉토리는 빈 목록", () => {
  const { dir, file } = tmpDomain();
  try {
    assert.throws(
      () => createCheckpoint(path.join(dir, "없는파일.md")),
      /체크포인트 대상 파일이 존재하지 않습니다/
    );
    assert.deepStrictEqual(listCheckpoints(file), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
