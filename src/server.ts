import * as express from "express";
import { json as bodyParserJson } from "body-parser";
import * as offerSearchController from "./controllers/offerSearchController";
import * as locationAlertController from "./controllers/locationAlertController";
import * as scriptController from "./controllers/scriptController";
import * as adminController from "./controllers/adminController";
import * as geoSearchController from "./controllers/geoSearchController";
import * as popularLocationController from "./controllers/popularLocationController";
import * as popularDestinationController from "./controllers/popularDestinationController";
import { authMiddleware, adminMiddleware } from "./middleware/auth";

export default function server(): any {
  const app: express.Application = express();
  app.use(bodyParserJson());

  app.get(
    "/api/search/destination/:placeId",
    offerSearchController.getOffersByPlaceId
  );

  app.get(
    "/api/search/offer-search/:level/:value",
    offerSearchController.getOffers
  );

  app.get("/api/search/offer-search/geo", geoSearchController.index);

  app.get("/api/search/index-offers", adminMiddleware, scriptController.index);

  app.get("/api/search/update-sfmc", adminMiddleware, scriptController.sendDataToSFMC);

  // TODO remove this route before going into production.
  app.get("/api/search/flush-all", adminMiddleware, adminController.flushAll);

  app.get(
    "/api/search/popular-destination",
    popularDestinationController.index
  );

  app.post(
    "/api/search/popular-destination",
    adminMiddleware,
    popularDestinationController.create
  );

  app.delete(
    "/api/search/popular-destination/:id",
    adminMiddleware,
    popularDestinationController.remove
  );

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

  app.delete(
    "/api/search/popular-location",
    adminMiddleware,
    popularLocationController.remove
  );

  app.post(
    "/api/search/popular-location",
    adminMiddleware,
    popularLocationController.create
  );

  app.post(
    "/api/search/popular-location/tag",
    authMiddleware,
    popularLocationController.addPopularTag
  );

  app.delete(
    "/api/search/popular-location/tag",
    authMiddleware,
    popularLocationController.removePopularTag
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

  app.delete(
    "/api/search/location-alert/:id",
    authMiddleware,
    locationAlertController.deleteAlert
  );

  return app;
}
