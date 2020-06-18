import redis from "../lib/redis";
import { logger } from "../lib/logger";
import { IUser, IAlertObject, IUserAlerts } from "../types";
import { flattenAlertObject, getAllAlerts } from "../lib/redisFunctions";
import {
  CREATE_USER_DESTINATION_SET,
  DELETE_USER_DESTINATION_SET,
  CREATE_DESTINATION_SET
} from "../config";

function getKey(value: any, keyType: string): string {
  return `${keyType}:${value}`;
}

export async function getUserDestinationAlerts(
  user: IUser
): Promise<void | IUserAlerts> {
  const key = getKey(user.herokuId, "destinationAlerts");
  const alertIds = await redis.smembers(key);
  if (!alertIds) {
    return;
  }
  return await getAllAlerts(alertIds);
}

export async function createUserDestinationAlert(
  locationAlert: IAlertObject,
  user: IUser
): Promise<IAlertObject> {
  const key = getKey(user.herokuId, "destinationAlerts");
  try {
    await redis.sadd(key, getKey(locationAlert.place_id, "alert"));
    await redis.sadd(
      CREATE_USER_DESTINATION_SET,
      `${user.herokuId}:${user.personContactId}:${locationAlert.place_id}`
    );
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
        flattenAlertObject(locationAlert)
      );
      await redis.sadd(
        CREATE_DESTINATION_SET,
        getKey(locationAlert.place_id, "alert")
      );
    }
  } catch (err) {
    logger("error", "Error setting user destination alerts list in redis", err);
    throw err;
  }
  return locationAlert;
}

export async function deleteUserDestinationAlert(
  place_id: string,
  user: IUser
): Promise<void> {
  try {
    const destinationKey = getKey(user.herokuId, "destinationAlerts");
    await redis.sadd(
      DELETE_USER_DESTINATION_SET,
      `${user.herokuId}:${user.personContactId}:${place_id}`
    );
    return await redis.srem(destinationKey, getKey(place_id, "alert"));
  } catch (err) {
    logger("error", "Error deleting destination alert in redis", err);
    throw err;
  }
}
