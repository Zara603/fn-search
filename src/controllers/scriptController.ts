import { Request, Response } from "express";
import { indexOffers } from "../scripts/indexOffers";
import updateSFMC from "../scripts/updateSFMC";

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

export async function sendDataToSFMC(
  req: Request,
  res: Response
): Promise<Response | void> {
  await updateSFMC();
  return res.json("update triggered");
}
