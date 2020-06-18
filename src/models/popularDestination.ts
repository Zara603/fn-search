import { IAlertObject } from "../types";
import {
  getUserDestinationAlerts,
  createUserDestinationAlert,
  deleteUserDestinationAlert
} from "../models/destinationAlert";

const POPULAR_DESTINATION_USER = {
  herokuId: "popularDestination"
};

export async function getPopularDestinations(): Promise<IAlertObject[]> {
  const popularDestinations = await getUserDestinationAlerts(
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
  return createUserDestinationAlert(locationAlert, POPULAR_DESTINATION_USER);
}

export async function deletePopularDestination(id: string): Promise<void> {
  return deleteUserDestinationAlert(id, POPULAR_DESTINATION_USER);
}
