import { logger } from "./lib/logger";

import server from "./server";

const appEnv = process.env.APP_ENV || "developement";

if (appEnv !== "production") {
  require("dotenv-safe").config({
    path: ".env"
  });
}

const port = process.env.PORT || 8080;

const app = server().listen(port, () => {
  logger("info", `Starting ${appEnv} server on port ${port}`);
});

module.exports = app;
