import { Request, Response } from "express";
import { getOffersWithRadis } from "../lib/redisFunctions";
import { logger } from "../lib/logger";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const radius = req.query.radius || 20;
  const count = req.query.count || 10;
  let results;
  try {
    results = await getOffersWithRadis(lng, lat, radius, count);
  } catch (err) {
    logger(
      "error",
      `Get offer with radius error called with args: ${lng} ${lat} ${radius} ${count}`,
      err
    );
    res.status(500);
    return res.json("something went wrong");
  }

  if (results.length === 0) {
    res.status(404);
    return res.json([]);
  }

  return res.json(results);
}
