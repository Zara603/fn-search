import { IPopularLocation } from "../types";
import redis from "../lib/redis";
import { v4 as uuidv4 } from "uuid";
import { flattenAlertObject, getAllAlerts } from "../lib/redisFunctions";

const POPULAR_LOCATIONS_KEY = "popularLocations";

function getPopularLocationKey(popularLocationTag: string): string {
  return `popularLocation:${popularLocationTag}`;
}

function cleanTag(tag: string): string {
  return tag.replace("popularLocation:", "");
}

async function getPopularLocation(
  popularLocationTag: string
): Promise<IPopularLocation> {
  const locationAlertKeys = await redis.smembers(popularLocationTag);
  const location_alerts = await getAllAlerts(locationAlertKeys);
  return {
    tag: cleanTag(popularLocationTag),
    location_alerts
  };
}

export async function getPopularLocations(): Promise<IPopularLocation[]> {
  const popularLocations: IPopularLocation[] = [];
  const popularLocationKeys = await redis.smembers(POPULAR_LOCATIONS_KEY);
  for (let i = 0; i < popularLocationKeys.length; i++) {
    const key = popularLocationKeys[i];
    popularLocations.push(await getPopularLocation(key));
  }
  return popularLocations;
}

export async function createPopularLocation(
  popularLocation: IPopularLocation
): Promise<IPopularLocation> {
  await deletePopularLocation(popularLocation.tag);
  const locationAlertKeys: string[] = [];
  const pipeline = redis.pipeline();
  popularLocation.location_alerts.forEach(locationAlert => {
    locationAlert.id = uuidv4();
    const key = `popularLocationAlert:${locationAlert.id}`;
    locationAlertKeys.push(key);
    pipeline.hmset(key, flattenAlertObject(locationAlert));
  });
  await pipeline.exec();
  redis.sadd(getPopularLocationKey(popularLocation.tag), locationAlertKeys);
  redis.sadd(POPULAR_LOCATIONS_KEY, getPopularLocationKey(popularLocation.tag));
  return popularLocation;
}

export async function updatePopularLocation(
  popularLocation: IPopularLocation
): Promise<IPopularLocation> {
  return await createPopularLocation(popularLocation);
}

export async function deletePopularLocation(
  popularLocationTag: string
): Promise<void> {
  const popularLocationKey = getPopularLocationKey(popularLocationTag);
  const keysToDelete = await redis.smembers(popularLocationKey);
  keysToDelete.push(popularLocationKey);
  const pipeline = redis.pipeline();
  keysToDelete.forEach(key => {
    pipeline.del(key);
  });
  pipeline.srem(POPULAR_LOCATIONS_KEY, popularLocationKey);
  await pipeline.exec();
}
