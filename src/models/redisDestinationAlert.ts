import redis from "../lib/redis";
import { logger } from "../lib/logger";
import { IUser, IAlertObject } from "../types";
import { flattenAlertObject, getAllAlerts } from "../lib/redisFunctions";

function getKey(value: any, keyType: string): string {
  return `${keyType}:${value}`;
}

export async function getUserDestinationAlertsRedis(
  user: IUser
): Promise<void | IAlertObject[]> {
  const key = getKey(user.herokuId, "destinationAlerts");
  const alertIds = await redis.lrange(key, 0, -1);
  if (!alertIds) {
    return;
  }
  const alerts = alertIds.map(al => `alert:${al}`);
  return await getAllAlerts(alerts);
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
      flattenAlertObject(locationAlert, user)
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
      flattenAlertObject(locationAlert, user)
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
