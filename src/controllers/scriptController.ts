import { Request, Response } from "express";
import redis from "../lib/redis";
import { indexOffers } from "../scripts/indexOffers"

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  await indexOffers()
  res.json('done')
  return res.end();
}
