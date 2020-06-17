import redis from "../lib/redis";
import { logger } from "../lib/logger";
import { IUser, IAlertObject, IUserAlerts } from "../types";
import { flattenAlertObject, getAllAlerts } from "../lib/redisFunctions";

function getKey(value: any, keyType: string): string {
  return `${keyType}:${value}`;
}

export async function getUserDestinationAlertsRedis(
  user: IUser
): Promise<void | IUserAlerts> {
  const key = getKey(user.herokuId, "destinationAlerts");
  const alertIds = await redis.smembers(key);
  if (!alertIds) {
    return;
  }
  return await getAllAlerts(alertIds);
}

export async function createUserDestinationAlertRedis(
  locationAlert: IAlertObject,
  user: IUser
): Promise<IAlertObject> {
  const key = getKey(user.herokuId, "destinationAlerts");
  try {
    await redis.sadd(key, getKey(locationAlert.place_id, "alert"));
  } catch (err) {
    logger(
      "error",
      "Error adding to user destination alerts list in redis",
      err
    );
    throw err;
  }
  try {
    if (!(await redis.exists(locationAlert.place_id))) {
      await redis.hmset(
        getKey(locationAlert.place_id, "alert"),
        flattenAlertObject(locationAlert, user)
      );
    }
  } catch (err) {
    logger("error", "Error setting user destination alerts list in redis", err);
    throw err;
  }
  return locationAlert;
}

export async function deleteUserDestinationAlertRedis(
  id: string,
  user: IUser
): Promise<void> {
  try {
    const alertKey = getKey(id, "alert");
    await redis.del(alertKey);
    const destinationKey = getKey(user.herokuId, "destinationAlerts");
    return await redis.srem(destinationKey, id);
  } catch (err) {
    logger("error", "Error deleting destination alert in redis", err);
    throw err;
  }
}
