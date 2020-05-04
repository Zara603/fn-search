import { IUser, IAlertObject } from "../types";
import { logger } from "../lib/logger";
import {
  getUserDestinationAlertsSFMC,
  createUserDestinationAlertSFMC,
  updateUserDestinationAlertSFMC,
  deleteUserDestinationAlertSFMC
} from "../services/marketingCloud";

import {
  getUserDestinationAlertsRedis,
  createUserDestinationAlertRedis,
  updateUserDestinationAlertRedis,
  deleteUserDestinationAlertRedis
} from "./redisDestinationAlert";

export async function getUserDestinationAlerts(
  user: IUser
): Promise<IAlertObject[]> {
  let results;
  results = await getUserDestinationAlertsRedis(user);
  if (!results) {
    results = await getUserDestinationAlertsSFMC(user);
  }
  return results;
}

export async function createUserDestinationAlert(
  locationAlert: IAlertObject,
  user: IUser
): Promise<IAlertObject> {
  try {
    createUserDestinationAlertSFMC(locationAlert, user);
  } catch (err) {
    logger("error", "Error creating SFMC destination alert", {
      locationAlert,
      message: err.message,
      user
    });
  }
  return await createUserDestinationAlertRedis(locationAlert, user);
}

export async function updateUserDestinationAlert(
  locationAlert: IAlertObject,
  user: IUser
): Promise<IAlertObject> {
  try {
    updateUserDestinationAlertSFMC(locationAlert, user);
  } catch (err) {
    logger("error", "Error updating SFMC destination alert", {
      locationAlert,
      message: err.message,
      user
    });
  }
  return await updateUserDestinationAlertRedis(locationAlert, user);
}

export async function deleteUserDestinationAlert(
  id: string,
  user: IUser
): Promise<void> {
  try {
    deleteUserDestinationAlertSFMC(id, user);
  } catch (err) {
    logger("error", "Error deleting SFMC destination alert", {
      alertId: id,
      message: err.message,
      user
    });
  }
  return await deleteUserDestinationAlertRedis(id);
}
