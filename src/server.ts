import * as express from "express";
import { json as bodyParserJson } from "body-parser";
import * as geoSearchController from "./controllers/geoSearchController";
import * as locationSearchController from "./controllers/locationSearchController";
import * as holidayTypeSearchController from "./controllers/holidayTypeSearchController";
import * as locationAlertController from "./controllers/locationAlertController";
import * as scriptController from "./controllers/scriptController";

export default function server(): any {
  const app: express.Application = express();
  app.use(bodyParserJson());

  app.get("/api/search/geo-search", geoSearchController.index);

  app.get("/api/search/location-search", locationSearchController.index);

  app.get("/api/search/holiday-type-search", holidayTypeSearchController.index);

  app.get("/api/search/index-offers", scriptController.index);

  app.get("/api/search/location-alert", locationAlertController.getAlerts);

  app.post("/api/search/location-alert", locationAlertController.createAlert);

  app.patch(
    "/api/search/location-alert/:id",
    locationAlertController.updateAlert
  );

  app.delete(
    "/api/search/location-alert/:id",
    locationAlertController.deleteAlert
  );

  return app;
}
