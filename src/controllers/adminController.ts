import { Request, Response } from "express";
import redis from "../lib/redis";

export async function deleteAlerts(
  req: Request,
  res: Response
): Promise<Response | void> {
  let result: any;
  try {
    const userKey = `destinationAlerts:${req.params.userId}`;
    const alerts = await redis.lrange(userKey, 0, -1);
    alerts.push(userKey);
    result = await redis.del(alerts);
  } catch (err) {
    result = err.message;
    res.json(result);
  }
  res.status(204);
  return res.json(result);
}

// TODO remove before going into production
export async function flushAll(
  req: Request,
  res: Response
): Promise<Response | void> {
  redis.flushall();
  res.status(200);
  return res.json("everything down the toilet");
}
