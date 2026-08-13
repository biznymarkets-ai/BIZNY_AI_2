import app from "./app";
import { logger } from "./lib/logger";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(port, "0.0.0.0", (err?: Error | null) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening on 0.0.0.0");
});

