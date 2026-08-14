import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const distIndex = path.resolve(process.cwd(), "dist/index.mjs");
const artifactIndex = path.resolve(process.cwd(), "artifacts/artifacts/api-server/dist/index.mjs");

if (fs.existsSync(distIndex)) {
  await import(pathToFileURL(distIndex).href);
} else {
  await import(pathToFileURL(artifactIndex).href);
}
