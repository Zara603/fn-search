import { Request, Response } from "express";
import redis from "../lib/redis";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  //const holidayType = (req.query.type || "").toLowerCase().replace(/\s+/g, "");
  const holidayType = req.query.type;
  const results = await redis.zrange(holidayType, 0, -1);
  let localData = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const id = result;
    const data = JSON.parse(await redis.get(id));
    data.distance_from_search = 0;
    localData = localData.concat(data);
  }
  return res.json(localData);
}
