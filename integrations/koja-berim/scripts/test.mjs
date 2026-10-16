import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const dir = await mkdtemp(join(process.cwd(), ".test-run-"));
try {
  const outfile = join(dir, "tests.mjs");
  await build({
    entryPoints: ["tests/core.ts"],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    define: {
      "import.meta.env": JSON.stringify({
        BASE_URL: "./",
        VITE_NESHAN_API: "false",
      }),
    },
    external: ["*.css"],
  });
  const r = spawnSync(process.execPath, ["--test", outfile], {
    stdio: "inherit",
    env: { ...process.env, NODE_PATH: join(process.cwd(), "node_modules") },
  });
  if (r.status !== 0) process.exitCode = r.status || 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
