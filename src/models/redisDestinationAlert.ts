import redis from "../lib/redis";
import { logger } from "../lib/logger";
import { IUser, IAlertObject } from "../types";

function getKey(user: IUser): string {
  return `destinationAlert:${user.herokuId}`;
}

async function getAllHashs(keys: string[]): Promise<object[]> {
  const pipeline = redis.pipeline();
  keys.forEach(key => {
    pipeline.hgetall(key);
  });
  return await pipeline.exec();
}

function flattenAlertObject(user: IUser, locationAlert: IAlertObject): object {
  return {
    id: locationAlert.id,
    personContactId: user.personContactId,
    herokuId: user.herokuId,
    level: locationAlert.location_alert.level,
    value: locationAlert.location_alert.value,
    lng: locationAlert.location_alert.geocode.lng,
    lat: locationAlert.location_alert.geocode.lat,
    continent: locationAlert.google_result.continent,
    country: locationAlert.google_result.country,
    administrative_area_level_1:
      locationAlert.google_result.administrative_area_level_1,
    colloquial_area: locationAlert.google_result.colloquial_area,
    locality: locationAlert.google_result.locality
  };
}

function buildAlertObject(flatAlert: any): IAlertObject {
  return {
    id: flatAlert.id,
    google_result: {
      administrative_area_level_1: flatAlert.administrative_area_level_1,
      colloquial_area: flatAlert.colloquial_area,
      locality: flatAlert.locality,
      continent: flatAlert.continent,
      country: flatAlert.country
    },
    location_alert: {
      geocode: {
        lat: flatAlert.lat,
        lng: flatAlert.lng
      },
      level: flatAlert.level,
      value: flatAlert.value
    }
  };
}

export async function getUserDestinationAlertsRedis(
  user: IUser
): Promise<void | IAlertObject[]> {
  const key = getKey(user);
  const destinationAlerts: IAlertObject[] = [];
  const alertIds = await redis.lrange(key, 0, -1);
  if (!alertIds) {
    return;
  }
  try {
    const flatObjects = await getAllHashs(alertIds);
    for (let i = 0; i < flatObjects.length; i++) {
      const destinationAlert = flatObjects[i][1];
      destinationAlerts.push(buildAlertObject(destinationAlert));
    }
  } catch (err) {
    logger("error", "Error getting destination alerts in redis", err);
    throw err;
  }
  return destinationAlerts;
}

export async function createUserDestinationAlertRedis(
  locationAlert: IAlertObject,
  user: IUser
): Promise<IAlertObject> {
  const key = getKey(user);
  try {
    await redis.rpush(key, locationAlert.id);
  } catch (err) {
    logger(
      "error",
      "Error adding to user destination alerts list in redis",
      err
    );
    throw err;
  }
  try {
    await redis.hmset(
      locationAlert.id,
      flattenAlertObject(user, locationAlert)
    );
  } catch (err) {
    logger("error", "Error setting user destination alerts list in redis", err);
    throw err;
  }
  return locationAlert;
}

export async function updateUserDestinationAlertRedis(
  locationAlert: IAlertObject,
  user: IUser
): Promise<IAlertObject> {
  try {
    await redis.hmset(
      locationAlert.id,
      flattenAlertObject(user, locationAlert)
    );
    return locationAlert;
  } catch (err) {
    logger("error", "Error updating destination alert in redis", err);
    throw err;
  }
}

export async function deleteUserDestinationAlertRedis(
  id: string
): Promise<void> {
  try {
    await redis.del(id);
  } catch (err) {
    logger("error", "Error deleting destination alert in redis", err);
    throw err;
  }
}
