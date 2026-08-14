import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { uploadsDir } from "./routes/upload";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health checks for Cloud Run container probes
app.get(["/healthz", "/health", "/api/healthz"], (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/uploads", express.static(uploadsDir));
app.use("/api", router);

// Serve frontend static assets and handle SPA routing
const baseDir = typeof import.meta !== "undefined" && import.meta.dirname
  ? import.meta.dirname
  : (typeof __dirname !== "undefined" ? __dirname : process.cwd());

const possibleBiznyDirs = [
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(process.cwd(), "artifacts/artifacts/bizny/dist/public"),
  path.resolve(process.cwd(), "../bizny/dist/public"),
  path.resolve(baseDir, "dist/public"),
  path.resolve(baseDir, "public"),
  path.resolve(baseDir, "../bizny/dist/public"),
  path.resolve(baseDir, "../../bizny/dist/public"),
  path.resolve(baseDir, "../../../bizny/dist/public"),
];
const biznyDist = possibleBiznyDirs.find((d) => fs.existsSync(d)) || possibleBiznyDirs[0];

logger.info({ biznyDist, exists: fs.existsSync(biznyDist) }, "Serving static frontend assets from");

app.use(express.static(biznyDist));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const indexPath = path.join(biznyDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (req.path === "/" || req.path === "") {
    res.status(200).send("<!DOCTYPE html><html><head><title>Bizny</title></head><body><div id=\"root\"></div></body></html>");
  } else {
    next();
  }
});

// Global error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled request error");
  if (res.headersSent) return;
  res.status(500).json({ error: err?.message || "Internal server error" });
});

export default app;
