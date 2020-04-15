import { Request, Response } from "express";
import { indexOffers } from "../scripts/indexOffers";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  await indexOffers();
  return res.json("done");
}
