import { Request, Response } from "express";
import {
  searchRedis,
  stringsToKeys,
  getAllOffersFromKeys,
  getOffersWithRadis
} from "../lib/redisFunctions";
import { logger } from "../lib/logger";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  const searchTerm: any = req.query.search || "";
  let results;
  try {
    results = await searchRedis(searchTerm);
  } catch (err) {
    logger("error", `Error when searching for: ${searchTerm}`, err);
    res.status(500);
    res.end();
  }
  return res.json(results);
}

export async function getOffers(
  req: Request,
  res: Response
): Promise<Response | void> {
  let results;
  const level = req.params.level;
  const value = req.params.value;
  const lng = req.query.lng;
  const lat = req.query.lat;
  if (lng && lat) {
    results = await getOffersWithRadis(lng, lat);
  } else {
    const key = `locations:${stringsToKeys(level)}:${stringsToKeys(value)}`;
    results = await getAllOffersFromKeys([key]);
  }
  if (results.length === 0) {
    res.status(404);
    return res.json([]);
  }
  return res.json(results);
}
