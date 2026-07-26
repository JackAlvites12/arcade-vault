#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const LINTABLE = /\.(jsx?|tsx?|mjs|cjs)$/;

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path;
if (!filePath || !LINTABLE.test(filePath)) process.exit(0);

const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const steps = [
  ["npx", ["eslint", "--fix", filePath]],
  ["npx", ["prettier", "--write", filePath]],
];

let output = "";
let failed = false;

for (const [cmd, args] of steps) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  output += result.stdout ?? "";
  output += result.stderr ?? "";
  if (result.status !== 0) failed = true;
}

if (failed) {
  process.stderr.write(output);
  process.exit(2);
}

process.exit(0);
