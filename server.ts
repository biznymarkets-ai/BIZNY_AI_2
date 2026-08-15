import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const distIndex = path.resolve(process.cwd(), "dist/index.mjs");
const artifactIndex = path.resolve(process.cwd(), "artifacts/artifacts/api-server/dist/index.mjs");

try {
  if (fs.existsSync(distIndex)) {
    await import(pathToFileURL(distIndex).href);
  } else if (fs.existsSync(artifactIndex)) {
    await import(pathToFileURL(artifactIndex).href);
  } else {
    console.error("[Server] Neither dist/index.mjs nor artifact index found!");
    process.exit(1);
  }
} catch (err) {
  console.error("[Server] Fatal error during startup:", err);
  process.exit(1);
}
