import * as express from "express";
import { json as bodyParserJson } from "body-parser";
import * as geoSearchController from "./controllers/geoSearchController";
import * as offerSearchController from "./controllers/offerSearchController";
import * as locationAlertController from "./controllers/locationAlertController";
import * as scriptController from "./controllers/scriptController";
import * as adminController from "./controllers/adminController";
import * as popularLocationController from "./controllers/popularLocationController";
import { authMiddleware, adminMiddleware } from "./middleware/auth";

export default function server(): any {
  const app: express.Application = express();
  app.use(bodyParserJson());

  app.get("/api/search/geo-search", geoSearchController.index);

  app.get("/api/search/offer-search", offerSearchController.index);

  app.get("/api/search/index-offers", adminMiddleware, scriptController.index);

  app.get("/api/search/popular-location", popularLocationController.index);

  app.post(
    "/api/search/popular-location",
    adminMiddleware,
    popularLocationController.create
  );

  app.put(
    "/api/search/popular-location",
    adminMiddleware,
    popularLocationController.update
  );

  app.post(
    "/api/search/popular-location/delete",
    adminMiddleware,
    popularLocationController.remove
  );

  app.post(
    "/api/search/popular-location",
    adminMiddleware,
    popularLocationController.create
  );

  app.delete(
    "/api/search/user-alert/:userId",
    adminMiddleware,
    adminController.deleteAlerts
  );

  app.get(
    "/api/search/location-alert",
    authMiddleware,
    locationAlertController.getAlerts
  );

  app.post(
    "/api/search/location-alert",
    authMiddleware,
    locationAlertController.createAlert
  );

  app.patch(
    "/api/search/location-alert/:id",
    authMiddleware,
    locationAlertController.updateAlert
  );

  app.delete(
    "/api/search/location-alert/:id",
    authMiddleware,
    locationAlertController.deleteAlert
  );

  return app;
}
