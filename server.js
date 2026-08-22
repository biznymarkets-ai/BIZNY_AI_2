import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const candidatePaths = [
  path.resolve(process.cwd(), "dist/index.mjs"),
  path.resolve(currentDir, "dist/index.mjs"),
  path.resolve(process.cwd(), "artifacts/artifacts/api-server/dist/index.mjs"),
  path.resolve(currentDir, "artifacts/artifacts/api-server/dist/index.mjs"),
];

let targetPath = candidatePaths.find((p) => fs.existsSync(p));

if (!targetPath) {
  console.log("[Server] Bundle not found at candidate paths. Building project...");
  try {
    execSync("npm run build", { stdio: "inherit", cwd: process.cwd() });
    targetPath = candidatePaths.find((p) => fs.existsSync(p));
  } catch (buildErr) {
    console.error("[Server] Build failed on startup:", buildErr);
  }
}

if (targetPath) {
  try {
    console.log(`[Server] Starting application bundle from: ${targetPath}`);
    await import(pathToFileURL(targetPath).href);
  } catch (err) {
    console.error("[Server] Fatal error during startup:", err);
    process.exit(1);
  }
} else {
  console.error("[Server] No bundle found at any of candidate paths:", candidatePaths);
  process.exit(1);
}

