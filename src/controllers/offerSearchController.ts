import { Request, Response } from "express";
import { searchRedis } from "../lib/redisFunctions";
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
