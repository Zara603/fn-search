import redis from "../lib/redis";
import { logger } from "../lib/logger";
import { IUser, IAlertObject, IAvailableOffers } from "../types";
import { getAllHashes, stringsToKeys } from "../lib/redisFunctions";

function getKey(value: any, keyType: string): string {
  return `${keyType}:${value}`;
}

function flattenAlertObject(user: IUser, locationAlert: IAlertObject): object {
  return {
    place_id: locationAlert.place_id,
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
    locality: locationAlert.google_result.locality,
    created_at: locationAlert.created_at
  };
}

function buildAlertObject(flatAlert: any, availableOffers: any): IAlertObject {
  return {
    place_id: flatAlert.place_id,
    created_at: flatAlert.created_at,
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
    },
    available_offers: availableOffers
  };
}

async function getAvailableOffers(
  destinationAlert: any
): Promise<IAvailableOffers> {
  const RADIUS = process.env.RADIUS || 100;
  const COUNT = process.env.COUNT || 100;
  return {
    continent: await redis.zrange(
      `locations:continent:${stringsToKeys(destinationAlert.continent)}`,
      0,
      -1
    ),
    country: await redis.zrange(
      `locations:country:${stringsToKeys(destinationAlert.country)}`,
      0,
      -1
    ),
    administrative_area_level_1: await redis.zrange(
      `locations:administrative_area_level_1:${stringsToKeys(
        destinationAlert.administrative_area_level_1
      )}`,
      0,
      -1
    ),
    local: await redis.georadius(
      "locations:world",
      destinationAlert.lng,
      destinationAlert.lat,
      RADIUS,
      "km",
      "COUNT",
      COUNT
    )
  };
}

export async function getUserDestinationAlertsRedis(
  user: IUser
): Promise<void | IAlertObject[]> {
  const key = getKey(user.herokuId, "destinationAlerts");
  const destinationAlerts: IAlertObject[] = [];
  const alertIds = await redis.lrange(key, 0, -1);
  if (!alertIds) {
    return;
  }
  const alerts = alertIds.map(al => `alert:${al}`);
  try {
    const flatObjects = await getAllHashes(alerts);
    for (let i = 0; i < flatObjects.length; i++) {
      const destinationAlert = flatObjects[i];
      const availableOffers = await getAvailableOffers(destinationAlert);
      destinationAlerts.push(
        buildAlertObject(destinationAlert, availableOffers)
      );
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
  const key = getKey(user.herokuId, "destinationAlerts");
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
      getKey(locationAlert.id, "alert"),
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
      getKey(locationAlert.id, "alert"),
      flattenAlertObject(user, locationAlert)
    );
    return locationAlert;
  } catch (err) {
    logger("error", "Error updating destination alert in redis", err);
    throw err;
  }
}

export async function deleteUserDestinationAlertRedis(
  id: string,
  user: IUser
): Promise<void> {
  try {
    const alertKey = getKey(id, "alert");
    await redis.del(alertKey);
    const destinationKey = getKey(user.herokuId, "destinationAlerts");
    return await redis.lrem(destinationKey, 1, id);
  } catch (err) {
    logger("error", "Error deleting destination alert in redis", err);
    throw err;
  }
}
