import redis from "../lib/redis";
import {
  IPopularLocation,
  IAvailableOffers,
  IAlertObject,
  IUser,
  IUserAlerts,
  ITagAlert
} from "../types";

const KEY_LIMIT = process.env.KEY_LIMIT || 100;

export function getKey(
  value: any,
  keyType: string,
  tagType?: string,
  tagValue?: string
): string {
  if (tagType && tagValue) {
    return `${keyType}:${tagType}:${tagValue}:${value}`;
  } else {
    return `${keyType}:${value}`;
  }
}

export async function getAvailableOffersForLevel(
  destinationAlert: any
): Promise<string[]> {
  if (destinationAlert.level === "continent") {
    return await redis.zrange(
      `locations:continent:${stringsToKeys(destinationAlert.continent)}`,
      0,
      -1
    );
  }
  if (destinationAlert.level === "country") {
    return await redis.zrange(
      `locations:country:${stringsToKeys(destinationAlert.country)}`,
      0,
      -1
    );
  }
  if (destinationAlert.level === "administrative_area_level_1") {
    return await redis.zrange(
      `locations:administrative_area_level_1:${stringsToKeys(
        destinationAlert.administrative_area_level_1
      )}`,
      0,
      -1
    );
  } else {
    const RADIUS = process.env.RADIUS || 100;
    const COUNT = process.env.COUNT || 100;
    return await redis.georadius(
      "locations:world",
      destinationAlert.lng,
      destinationAlert.lat,
      RADIUS,
      "km",
      "COUNT",
      COUNT
    );
  }
}

export async function getAvailableOffersForPopularDestination(
  keys: string[]
): Promise<string[]> {
  const availableOffers: string[] = [];
  const flatObjects = await getAllHashes(keys);
  for (let i = 0; i < flatObjects.length; i++) {
    const flatObject = flatObjects[i];
    const availableOffers = await getAvailableOffersForLevel(flatObject);
  }
  return availableOffers;
}

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

function groupBy(items: any, key: string): any {
  return items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [...(result[item[key]] || []), item]
    }),
    {}
  );
}

export function buildAlertObject(
  flatAlert: any,
  availableOffers?: any
): IAlertObject {
  return {
    id: flatAlert.id,
    tag_type: flatAlert.tag_type,
    tag_value: flatAlert.tag_value,
    place_id: flatAlert.place_id,
    created_at: flatAlert.created_at,
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
        lat: parseFloat(flatAlert.lat),
        lng: parseFloat(flatAlert.lng)
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
    id: locationAlert.id,
    tag_type: locationAlert.tag_type || "alert",
    tag_value: locationAlert.tag_value || "alert",
    place_id: locationAlert.place_id,
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

export async function getAllAlerts(keys: string[]): Promise<IUserAlerts> {
  const userAlert: IUserAlerts = {
    location_alerts: [],
    popular_locations: []
  };


  const allAlerts = await getAllHashes(keys);
  const tagGroups = groupBy(allAlerts, "tag_type");

  const baseAlerts = tagGroups["alert"] || [];
  for (let i = 0; i < baseAlerts.length; i++) {
    const flatObject = baseAlerts[i];
    const availableOffers = await getAvailableOffers(flatObject);
<<<<<<< HEAD
    userAlert.location_alerts.push(
      buildAlertObject(flatObject, availableOffers)
    );
  }

  const popularLocationAlerts = tagGroups["popularLocation"] || [];
  const popularLocationGroups =
    groupBy(popularLocationAlerts, "tag_value") || [];
  const popularLocationKeys = Object.keys(popularLocationGroups);
  // TODO can this be done without going O(n^2)?
  // Maybe if we change the alerts keys structure then we can get away from this
  // Something like `alert:uuid:tag_type:tag_value` that way we can filter the keys
  // before a get is made.
  for (let i = 0; i < popularLocationKeys.length; i++) {
    const tag = popularLocationKeys[i];
    let availableOffers: string[] = [];
    for (let j = 0; j < popularLocationGroups[tag].length; j++) {
      const flatObject = popularLocationGroups[tag][j];
      availableOffers = availableOffers.concat(
        await getAvailableOffersForLevel(flatObject)
      );
    }
    userAlert.popular_locations.push({
      tag,
      available_offers: Array.from(new Set(availableOffers)) // ensure unique offer ids
    });
  }
  return userAlert;
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
