/**
 * Global test setup: builds a dedicated SQLite test database (prisma/test.db)
 * before any test file runs, so tests never touch the dev database.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const testDb = path.resolve(dirname, "..", "prisma", "test.db");

export default function setup() {
  // Fresh database every run
  for (const suffix of ["", "-journal", "-shm", "-wal"]) {
    const f = `${testDb}${suffix}`;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: path.resolve(dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
