import { build } from "esbuild";
import { readdir, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir(".test-build", { recursive: true });
const requested = process.argv.slice(2);
const files = (await readdir("tests")).filter(
  (f) => f.endsWith(".test.ts") && (!requested.length || requested.includes(f)),
);
for (const f of files)
  await build({
    entryPoints: ["tests/" + f],
    outfile: ".test-build/" + f.replace(".ts", ".mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
  });
const result = spawnSync(
  process.execPath,
  ["--test", ...files.map((f) => ".test-build/" + f.replace(".ts", ".mjs"))],
  { stdio: "inherit" },
);
process.exit(result.status || 0);
