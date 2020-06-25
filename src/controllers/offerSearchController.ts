import { Request, Response } from "express";
import {
  stringsToKeys,
  getAllOffersFromKeys,
  getKey,
  getDestinations
} from "../lib/redisFunctions";

export async function getOffers(
  req: Request,
  res: Response
): Promise<Response | void> {
  const level = req.params.level;
  const value = req.params.value;
  const key = `locations:${stringsToKeys(level)}:${stringsToKeys(value)}`;
  const results = await getAllOffersFromKeys([key]);
  if (results.length === 0) {
    res.status(404);
    return res.json([]);
  }
  return res.json(results);
}

export async function getOffersByPlaceId(
  req: Request,
  res: Response
): Promise<Response | void> {
  const placeId: any = req.params.placeId;
  const key = getKey(placeId, "destination");
  const results = await getDestinations([key]);
  if (!results || results.location_alerts.length !== 1) {
    res.status(404);
    return res.json({});
  }
  return res.json(results.location_alerts[0]);
}
