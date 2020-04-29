import { Request, Response } from "express";
import { indexOffers } from "../scripts/indexOffers";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  let result: any;
  try {
    result = await indexOffers();
  } catch (err) {
    result = err.message;
  }
  return res.json(result);
}
