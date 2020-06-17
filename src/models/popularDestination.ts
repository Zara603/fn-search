import { IAlertObject } from "../types";
import {
  getUserDestinationAlertsRedis,
  createUserDestinationAlertRedis,
  deleteUserDestinationAlertRedis
} from "../models/redisDestinationAlert";

const POPULAR_DESTINATION_USER = {
  herokuId: "popularDestination"
};

export async function getPopularDestinations(): Promise<IAlertObject[]> {
  const popularDestinations = await getUserDestinationAlertsRedis(
    POPULAR_DESTINATION_USER
  );
  if (popularDestinations && popularDestinations.location_alerts) {
    return popularDestinations.location_alerts;
  } else {
    return [];
  }
}

export async function createPopularDestination(
  locationAlert: IAlertObject
): Promise<IAlertObject> {
  return createUserDestinationAlertRedis(
    locationAlert,
    POPULAR_DESTINATION_USER
  );
}

export async function deletePopularDestination(id: string): Promise<void> {
  return deleteUserDestinationAlertRedis(id, POPULAR_DESTINATION_USER);
}
