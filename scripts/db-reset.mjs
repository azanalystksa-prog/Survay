// Wipes and re-seeds the SQLite database. Used by `npm run db:reset`.
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = join(root, "prisma", "dev.db");

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root });
}

try {
  for (const f of [dbPath, `${dbPath}-journal`]) {
    if (existsSync(f)) {
      rmSync(f);
      console.log(`Removed ${f}`);
    }
  }
  run("npx prisma db push --skip-generate --accept-data-loss");
  run("npx tsx prisma/seed.ts");
  console.log("\n✅ Database reset and seeded. Run `npm run dev`.");
} catch (err) {
  console.error("\n❌ db:reset failed:", err?.message ?? err);
  process.exit(1);
}
