import redis from "../lib/redis";
import { getKey } from "../lib/redisFunctions";
import {
  buildObjectsFromSoapResponse,
  getRequest
} from "../services/marketingCloud";

export async function getUserAlerts(): Promise<any> {
  const dataExtenstionExternalKey: string =
    process.env.USER_ALERT_DE_EXTERNAL_KEY || "";
  const response = await getRequest(dataExtenstionExternalKey, [
    "place_id",
    "person_contact_id",
    "heroku_id"
  ]);
  return response;
}

export async function getDestinations(): Promise<any> {
  const dataExtenstionExternalKey: string =
    process.env.DESTINATIONS_DE_EXTERNAL_KEY || "";
  const response = await getRequest(dataExtenstionExternalKey, [
    "level",
    "value",
    "lng",
    "lat",
    "continent",
    "country",
    "administrative_area_level_1",
    "locality",
    "colloquial_area",
    "id",
    "lat",
    "lng",
    "id",
    "place_id",
    "tag_type",
    "tag_value",
    "created_at"
  ]);
  return response;
}

export async function saveUserAlerts(userAlerts: any[]): Promise<void> {
  const pipeline = redis.pipeline();
  userAlerts.forEach(alt => {
    const key = getKey(alt.heroku_id, "destinationAlerts");
    pipeline.sadd(key, getKey(alt.place_id, "alert"));
  });
  return await pipeline.exec();
}

export async function saveDestinations(destinations: any[]): Promise<void> {
  const pipeline = redis.pipeline();
  destinations.forEach(dest => {
    const key = getKey(dest.place_id, "alert");
    pipeline.hmset(key, dest);
  });
  return await pipeline.exec();
}

export async function backUpFromSFMC(): Promise<void> {
  const userAlerts = await getUserAlerts();
  const alertObjects = buildObjectsFromSoapResponse(userAlerts);
  await saveUserAlerts(alertObjects);

  const destinations = await getDestinations();
  const destinationObjects = buildObjectsFromSoapResponse(destinations);
  await saveDestinations(destinationObjects);
  console.log(
    "the following keys have been added to your redis database: ",
    await redis.keys("*")
  );
}
