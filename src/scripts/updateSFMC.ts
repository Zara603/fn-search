import redis from "../lib/redis";
import { getAllHashes } from "../lib/redisFunctions";
import { logger } from "../lib/logger";
import {
  CREATE_USER_DESTINATION_SET,
  DELETE_USER_DESTINATION_SET,
  CREATE_DESTINATION_SET,
  USER_ALERT_DE_EXTERNAL_KEY,
  DESTINATIONS_DE_EXTERNAL_KEY
} from "../config";
import { upsertDataExtensionAsyncByKey } from "../services/marketingCloud";

export async function updateDestinationsToSFMC(): Promise<void> {
  const destinationKeys = await redis.smembers(CREATE_DESTINATION_SET);
  if (destinationKeys.length > 0) {
    const items = await getAllHashes(destinationKeys);
    items.map(item => {
      item.lat = Number(item.lat);
      item.lng = Number(item.lng);
    });
    try {
      await upsertDataExtensionAsyncByKey(DESTINATIONS_DE_EXTERNAL_KEY, items);
    } catch (err) {
      logger("error", "Error updating destinations to sfmc", err);
      throw err;
    }
    return await redis.srem(CREATE_DESTINATION_SET, destinationKeys);
  }
}

export async function sendUserAlertsToSFMC(): Promise<void> {
  const userAlertKeys = await redis.smembers(CREATE_USER_DESTINATION_SET);
  if (userAlertKeys.length > 0) {
    const items: any[] = [];
    userAlertKeys.forEach(key => {
      const values = key.split(":");
      items.push({
        heroku_id: values[0] || "",
        person_contact_id: values[1] || "",
        place_id: values[2] || ""
      });
    });
    try {
      await upsertDataExtensionAsyncByKey(USER_ALERT_DE_EXTERNAL_KEY, items);
    } catch (err) {
      logger("error", "Error updating user alerts to sfmc", err);
      throw err;
    }

    return await redis.srem(CREATE_USER_DESTINATION_SET, userAlertKeys);
  }
}

export async function deactivateUserAlertsInSFMC(): Promise<void> {
  const userAlertKeys = await redis.smembers(DELETE_USER_DESTINATION_SET);
  if (userAlertKeys.length > 0) {
    const items: any[] = [];
    userAlertKeys.forEach(key => {
      const values = key.split(":");
      items.push({
        heroku_id: values[0] || "",
        person_contact_id: values[1] || "",
        place_id: values[2] || "",
        active: false
      });
    });
    try {
      await upsertDataExtensionAsyncByKey(USER_ALERT_DE_EXTERNAL_KEY, items);
    } catch (err) {
      logger("error", "Error updating deleted user alerts to sfmc", err);
      throw err;
    }
    return await redis.srem(DELETE_USER_DESTINATION_SET, userAlertKeys);
  }
}

export default async function updateSFMC(): Promise<void> {
  await sendUserAlertsToSFMC();
  await updateDestinationsToSFMC();
  await deactivateUserAlertsInSFMC();
}
