import redis from "../lib/redis";
import {
  IPopularLocation,
  IAvailableOffers,
  IAlertObject,
  IUser
} from "../types";

const KEY_LIMIT = process.env.KEY_LIMIT || 100;

export async function getAvailableOffers(
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

export function buildAlertObject(
  flatAlert: any,
  availableOffers: any
): IAlertObject {
  return {
    place_id: flatAlert.place_id,
    created_at: flatAlert.created_at,
    id: flatAlert.id,
    brand: flatAlert.brand,
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

export function flattenAlertObject(
  locationAlert: IAlertObject,
  user?: IUser
): object {
  return {
    place_id: locationAlert.place_id,
    id: locationAlert.id,
    brand: locationAlert.brand,
    personContactId: user ? user.personContactId : "",
    herokuId: user ? user.herokuId : "",
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

export async function getAllHashes(keys: string[]): Promise<any[]> {
  const pipeline = redis.pipeline();
  keys.forEach(key => {
    pipeline.hgetall(key);
  });
  const results = await pipeline.exec();
  return results.map(result => result[1]);
}

export async function getAllAlerts(keys: string[]): Promise<any[]> {
  const alertObjects: any[] = [];
  const flatObjects = await getAllHashes(keys);
  for (let i = 0; i < flatObjects.length; i++) {
    const flatObject = flatObjects[i];
    const availableOffers = await getAvailableOffers(flatObject);
    console.log(buildAlertObject(flatObject, availableOffers));
    alertObjects.push(buildAlertObject(flatObject, availableOffers));
    console.log(alertObjects);
  }
  return alertObjects;
}

export async function getAllOffersFromKeys(
  keys: string[]
): Promise<any[] | IPopularLocation[]> {
  const pipeline = redis.pipeline();
  keys.forEach(key => {
    pipeline.zrange(key, 0, -1);
  });
  const results = await pipeline.exec();
  const nestedResults = results.map(result => result[1]);
  const flatResults = nestedResults.flat();
  const offerKeys = flatResults.map(result => `offer:${result}`);
  const offerIds: any = new Set(offerKeys);
  return await getAllHashes(offerIds);
}

export function stringsToKeys(value: string): string | void {
  if (value) {
    return value.toLowerCase().replace(/\s+/g, "");
  }
}

export async function searchRedis(searchTerm: string): Promise<any[]> {
  const cleanedSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, "");
  const keys = await redis.scan(
    0,
    "MATCH",
    `locations:*:*${stringsToKeys(cleanedSearchTerm)}*`,
    "COUNT",
    KEY_LIMIT
  );
  return await getAllOffersFromKeys(keys[1]);
}
