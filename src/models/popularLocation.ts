import {
  IPopularLocation,
  IUser,
  IAlertObject,
  IPopularLocationResponse
} from "../types";
import redis from "../lib/redis";
import { v4 as uuidv4 } from "uuid";
import {
  flattenAlertObject,
  getAllHashes,
  getAllAlerts,
  getKey,
  buildAlertObject
} from "../lib/redisFunctions";

const POPULAR_LOCATIONS_KEY = "popularLocations";
const POPULAR_LOCATION_TAG_TYPE =
  process.env.POPULAR_LOCATION_TAG_TYPE || "popularLocation";

function getPopularLocationKey(popularLocationTag: string): string {
  return `popularLocation:${popularLocationTag}`;
}

function cleanTag(tag: string): string {
  return tag.replace("popularLocation:", "");
}

async function getFullPopularLocation(
  popularLocationTag: string
): Promise<IPopularLocation> {
  const locationAlertKeys = await redis.smembers(popularLocationTag);
  const allHashes = await getAllHashes(locationAlertKeys);
  const imageId = await redis.get(`${popularLocationTag}:image`);
  const locationAlerts: IAlertObject[] = [];

  for (let i = 0; i < allHashes.length; i++) {
    const hash = allHashes[i];
    locationAlerts.push(buildAlertObject(hash));
  }

  return {
    tag: cleanTag(popularLocationTag),
    image_id: imageId,
    location_alerts: locationAlerts
  };
}

export async function getPopularLocation(
  popularLocationTag: string
): Promise<IPopularLocationResponse> {
  const locationAlertKeys = await redis.smembers(popularLocationTag);
  const allLocations = await getAllAlerts(locationAlertKeys);
  const imageId = await redis.get(`${popularLocationTag}:image`);
  const availableOfferSet = new Set();
  allLocations.location_alerts.forEach(alt => {
    if (alt.available_offers) {
      alt.available_offers.continent.reduce(
        (offerSet, offerId) => offerSet.add(offerId),
        availableOfferSet
      );
      alt.available_offers.country.reduce(
        (offerSet, offerId) => offerSet.add(offerId),
        availableOfferSet
      );
      alt.available_offers.administrative_area_level_1.reduce(
        (offerSet, offerId) => offerSet.add(offerId),
        availableOfferSet
      );
      alt.available_offers.local.reduce(
        (offerSet, offerId) => offerSet.add(offerId),
        availableOfferSet
      );
    }
  });

  return {
    tag: cleanTag(popularLocationTag),
    image_id: imageId,
    available_offers: Array.from(availableOfferSet)
  };
}

export async function getPopularLocations(): Promise<
  IPopularLocationResponse[]
> {
  const popularLocations: IPopularLocationResponse[] = [];
  const popularLocationKeys = await redis.smembers(POPULAR_LOCATIONS_KEY);
  for (let i = 0; i < popularLocationKeys.length; i++) {
    const key = popularLocationKeys[i];
    popularLocations.push(await getPopularLocation(key));
  }
  return popularLocations;
}

export async function createPopularLocation(
  popularLocation: IPopularLocation
): Promise<IPopularLocation> {
  await deletePopularLocation(popularLocation.tag);
  const locationAlertKeys: string[] = [];
  const pipeline = redis.pipeline();
  pipeline.set(
    `${getPopularLocationKey(popularLocation.tag)}:image`,
    popularLocation.image_id
  );
  popularLocation.location_alerts.forEach(locationAlert => {
    locationAlert.id = uuidv4();
    const key = `popularLocationAlert:${locationAlert.id}`;
    locationAlertKeys.push(key);
    pipeline.hmset(key, flattenAlertObject(locationAlert));
  });
  await pipeline.exec();
  redis.sadd(getPopularLocationKey(popularLocation.tag), locationAlertKeys);
  redis.sadd(POPULAR_LOCATIONS_KEY, getPopularLocationKey(popularLocation.tag));
  return popularLocation;
}

export async function updatePopularLocation(
  popularLocation: IPopularLocation
): Promise<IPopularLocation> {
  return await createPopularLocation(popularLocation);
}

export async function deletePopularLocation(
  popularLocationTag: string
): Promise<void> {
  const popularLocationKey = getPopularLocationKey(popularLocationTag);
  const keysToDelete = await redis.smembers(popularLocationKey);
  keysToDelete.push(popularLocationKey);
  const pipeline = redis.pipeline();
  keysToDelete.forEach(key => {
    pipeline.del(key);
  });
  pipeline.srem(POPULAR_LOCATIONS_KEY, popularLocationKey);
  await pipeline.exec();
}

export async function addPopularLocation(
  tag: string,
  user: IUser
): Promise<string> {
  const popularLocationsTag = getPopularLocationKey(tag);
  const popularLocationAlerts = await getFullPopularLocation(
    popularLocationsTag
  );
  const userAlertsSetKey = getKey(user.herokuId, "destinationAlerts");
  for (let i = 0; i < popularLocationAlerts.location_alerts.length; i++) {
    const newAlert = popularLocationAlerts.location_alerts[i];
    newAlert.tag_type = POPULAR_LOCATION_TAG_TYPE;
    newAlert.tag_value = tag;
    const newAlertKey = getKey(
      uuidv4(),
      "alert",
      POPULAR_LOCATION_TAG_TYPE,
      tag
    );
    newAlert.id = newAlertKey;
    await redis.hmset(newAlertKey, flattenAlertObject(newAlert));
    await redis.sadd(userAlertsSetKey, newAlertKey);
  }
  return tag;
}

export async function removePopularLocation(
  tag: string,
  user: IUser
): Promise<string> {
  const userAlertSetKey = getKey(user.herokuId, "destinationAlerts");
  const userAlertKeys = await redis.smembers(userAlertSetKey);
  const patten = `^alert:${POPULAR_LOCATION_TAG_TYPE}:${tag}:.*`;
  const regex = new RegExp(patten);
  const tagKeys = userAlertKeys.filter(key => key.match(regex));
  const pipeline = redis.pipeline();
  tagKeys.forEach(key => {
    pipeline.del(key);
    pipeline.srem(userAlertSetKey, key);
  });
  return await pipeline.exec(); // dont have to await
}
