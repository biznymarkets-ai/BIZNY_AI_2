import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env.PORT;
const parsed = rawPort ? parseInt(rawPort, 10) : NaN;
const port = Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;

const server = app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, `Server listening on 0.0.0.0:${port}`);
});

server.on("error", (err: Error) => {
  logger.error({ err }, "Server encountered an error while listening");
  process.exit(1);
});


