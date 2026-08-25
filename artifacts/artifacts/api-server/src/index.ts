import app from "./app";
import { logger } from "./lib/logger";
import { seedSyntheticUniverse } from "./lib/synthetic-universe";

const rawPort = process.env.PORT;
const parsed = rawPort ? parseInt(rawPort, 10) : NaN;
const port = Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;

process.on("unhandledRejection", (reason: any) => {
  logger.warn({ err: reason }, "Unhandled promise rejection captured safely");
});

process.on("uncaughtException", (err: Error) => {
  logger.error({ err }, "Uncaught exception captured safely");
});

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, `Server listening on 0.0.0.0:${port}`);
  // Asynchronously seed the synthetic universe so it is ready immediately
  seedSyntheticUniverse().catch((err) => {
    logger.warn({ err }, "Initial synthetic universe seed encountered a non-fatal error");
  });
});

server.on("error", (err: Error) => {
  logger.error({ err }, "Server encountered an error while listening");
  process.exit(1);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "Received termination signal, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed cleanly");
    process.exit(0);
  });
  // Force exit after 10s if connections fail to close
  setTimeout(() => {
    logger.error("Forced exit due to lingering connections");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));



