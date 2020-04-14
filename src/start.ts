const appEnv = process.env.APP_ENV || "developement";
import { logger } from "./lib/logger";

if (appEnv !== "production") {
  require("dotenv-safe").config({
    path: ".env"
  });
}

import server from "./server";

const port = process.env.PORT || 8080;

const app = server().listen(port, () => {
  logger("info", `Starting ${appEnv} server on port ${port}`);
});

module.exports = app;
