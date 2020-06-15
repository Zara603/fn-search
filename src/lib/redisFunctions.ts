import redis from "../lib/redis";
import { IPopularLocation, IAlertObject, IUser, IUserAlerts } from "../types";

const KEY_LIMIT = process.env.KEY_LIMIT || 100;
const POPULAR_LOCATION_TAG_TYPE =
  process.env.POPULAR_LOCATION_TAG_TYPE || "popularLocation";

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
  let availableOffers: string[] = [];
  const flatObjects = await getAllHashes(keys);
  for (let i = 0; i < flatObjects.length; i++) {
    const flatObject = flatObjects[i];
    availableOffers = availableOffers.concat(
      await getAvailableOffersForLevel(flatObject)
    );
  }
  const uniqueAvailableOffers = Array.from(new Set(availableOffers));
  return uniqueAvailableOffers;
}

export async function getAvailableOffers(alerts: any): Promise<void> {
  const RADIUS = process.env.RADIUS || 100;
  const COUNT = process.env.COUNT || 100;
  const pipeline = redis.pipeline();
  alerts.forEach(alt => {
    alt.available_offers = [];
    pipeline.zrange(
      `locations:continent:${stringsToKeys(alt.continent)}`,
      0,
      -1,
      function(err, response) {
        alt.available_offers.continent = response;
      }
    );
    if (alt.country) {
      pipeline.zrange(
        `locations:country:${stringsToKeys(alt.country)}`,
        0,
        -1,
        function(err, response) {
          alt.available_offers.country = response;
        }
      );
    }
    if (alt.administrative_area_level_1) {
      pipeline.zrange(
        `locations:administrative_area_level_1:${stringsToKeys(
          alt.administrative_area_level_1
        )}`,
        0,
        -1,
        function(err, response) {
          alt.available_offers.administrative_area_level_1 = response;
        }
      );
    }
    if (alt.lat && alt.lng) {
      pipeline.georadius(
        "locations:world",
        alt.lng,
        alt.lat,
        RADIUS,
        "km",
        "COUNT",
        COUNT,
        function(err, response) {
          alt.available_offers.local = response;
        }
      );
    }
  });
  await pipeline.exec();
}

export function buildAlertObject(flatAlert: any): IAlertObject {
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
    available_offers: flatAlert.availableOffers
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
  // trip two to redis
  const allAlerts = await getAllHashes(keys);
  // trip three to redis
  await getAvailableOffers(allAlerts);
  const flatDestinationAlerts = allAlerts.filter(
    alt => alt.tag_type === "alert"
  );
  const location_alerts = flatDestinationAlerts.map(alt =>
    buildAlertObject(alt)
  );

  const flatPopularDestinationAlert = allAlerts.filter(
    alt => alt.tag_type === POPULAR_LOCATION_TAG_TYPE
  );
  const popular_locations: any[] = [];
  const popularLocationsKeys = new Set();
  flatPopularDestinationAlert.forEach(alt => {
    if (!popularLocationsKeys.has(alt.tag_value)) {
      popular_locations.push({
        tag: alt.tag_value,
        available_offer: alt.available_offers
      });
      popularLocationsKeys.add(alt.tag_value);
    }
  });
  return {
    location_alerts,
    popular_locations
  };
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
  const cleanedSearchTerm = stringsToKeys(searchTerm) || "";
  const keys = await redis.scan(
    0,
    "MATCH",
    `locations:*:*${stringsToKeys(cleanedSearchTerm)}*`,
    "COUNT",
    KEY_LIMIT
  );
  return await getAllOffersFromKeys(keys[1]);
}

export async function getOffersWithRadis(
  lng: any,
  lat: any,
  radius: any = 20,
  count: any = 10
): Promise<any> {
  const results = await redis.georadius(
    "locations:world",
    lng,
    lat,
    radius,
    "km",
    "WITHDIST",
    "COUNT",
    count
  );
  let localData = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const id = result[0];
    const data = await redis.hgetall(`offer:${id}`);
    data.distance_from_search = result[1];
    localData = localData.concat(data);
  }
  return localData;
}
