import { Request, Response } from "express";
import redis from "../lib/redis";

export async function index(
  req: Request,
  res: Response
): Promise<Response | void> {
  console.log(req.query)
  const latitude = req.query.latitude
  const longitude = req.query.longitude
  const radius = req.query.radius || 20
  const count = req.query.count || 10
  const results = await redis.georadius(
    'locations', 
    longitude, 
    latitude, 
    radius, 
    'km', 
    'WITHDIST', 
    'COUNT', 
    count
  )
  let localData = []
  for (let i = 0; i < results.length; i++) {
    let result = results[i]
    console.log(result)
    const id = result[0]
    console.log(id)
    let data = JSON.parse(await redis.get(id))
    data.distance_from_search = result[1]
    console.log(data)
    localData = localData.concat(data)
  }
  res.json(localData)
  return res.end();
}
