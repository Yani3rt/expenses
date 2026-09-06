import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";
import { createExpenseFixture } from "../test-support/fixture-factory.js";

const port = process.env.EXPENSE_BROWSER_PORT || "43117";
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distPath = mkdtempSync(join(projectRoot, ".next-browser-"));
const distDir = basename(distPath);
let fixture;
try {
  fixture = createExpenseFixture();
} catch (error) {
  rmSync(distPath, { recursive: true, force: true });
  throw error;
}
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", port],
  {
    cwd: projectRoot,
    env: { ...process.env, EXPENSE_DB_PATH: fixture.path, EXPENSE_NEXT_DIST_DIR: distDir },
    stdio: "inherit",
  },
);

let stopping = false;
function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  child.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => stop(signal));
}

child.on("error", (error) => {
  console.error(error);
  fixture.cleanup();
  rmSync(distPath, { recursive: true, force: true });
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  fixture.cleanup();
  rmSync(distPath, { recursive: true, force: true });
  if (!stopping && code !== 0) process.exitCode = code ?? 1;
  if (signal && !stopping) console.error(`Fixture server stopped by ${signal}`);
});
