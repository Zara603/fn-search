import { Request, Response } from "express";
import redis from "../lib/redis";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  const holidayType = (req.query.type || "").toLowerCase().replace(/\s+/g, "");
  const results = await redis.zrange(holidayType, 0, -1);
  let localData = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log(result);
    const id = result;
    console.log(id);
    const data = JSON.parse(await redis.get(id));
    data.distance_from_search = 0;
    console.log(data);
    localData = localData.concat(data);
  }
  res.json(localData);
  return res.end();
}
