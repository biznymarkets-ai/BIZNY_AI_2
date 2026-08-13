import fs from "node:fs";
import path from "node:path";

if (fs.existsSync(path.resolve(process.cwd(), "dist/index.mjs"))) {
  await import("./dist/index.mjs");
} else {
  await import("./artifacts/artifacts/api-server/dist/index.mjs");
}
