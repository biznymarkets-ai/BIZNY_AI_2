import app from "./app";
import { logger } from "./lib/logger";
import { seedSyntheticUniverse } from "./lib/synthetic-universe";

const rawPort = process.env.PORT;
const parsed = rawPort ? parseInt(rawPort, 10) : NaN;
const port = Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, `Server listening on 0.0.0.0:${port}`);
  // Asynchronously seed the synthetic universe so it's ready immediately
  seedSyntheticUniverse().catch((err) => {
    logger.warn({ err }, "Initial synthetic universe seed encountered a non-fatal error");
  });
});

server.on("error", (err: Error) => {
  logger.error({ err }, "Server encountered an error while listening");
  process.exit(1);
});


