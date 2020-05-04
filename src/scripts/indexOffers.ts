import { getOffers } from "../services/offer";
import redis from "../lib/redis";
import { logger } from "../lib/logger";
import { getAllHashes, stringsToKeys } from "../lib/redisFunctions";

async function cleanUpOldOffers(newOfferIds: string[]): Promise<string[]> {
  const allOfferKeys = await redis.keys(`offer:*`);
  const allOffers = await getAllHashes(allOfferKeys);

  const oldOffers = allOffers.filter(
    offer => !newOfferIds.includes(offer.id_salesforce_external)
  );
  for (let i; i < oldOffers.length; i++) {
    const offerId = oldOffers[i];
    await removeOfferFromRedis(offerId.id_salesforce_external);
  }
  return oldOffers.map(offer => offer.id_salesforce_external);
}

async function removeOfferFromRedis(offerId: string): Promise<void> {
  const offer = redis.hgetall(`offer:${offerId}`);
  if (offer) {
    await redis.zrem(`locations:world`, offerId);
    await redis.zrem(
      `locations:continent:${stringsToKeys(offer.continent)}`,
      offerId
    );
    await redis.zrem(
      `locations:country:${stringsToKeys(offer.country)}`,
      offerId
    );
    await redis.zrem(
      `locations:admin-level1:${stringsToKeys(
        offer.administrative_area_level_1
      )}`,
      offerId
    );
    for (let j = 0; j < offer.holiday_types.length; j++) {
      const holidayType = offer.holiday_types[j];
      await redis.zrem(
        `locations:holidayType:${stringsToKeys(holidayType)}`,
        offerId
      );
    }
    for (let j = 0; j < offer.locations.length; j++) {
      const location = offer.locations[j];
      await redis.zrem(
        `locations:holidayType:${stringsToKeys(location)}`,
        offerId
      );
    }
  }
}

export async function indexOffers(): Promise<any> {
  const offers = await getOffers();
  const newOfferIds = offers.map(offer => offer.id_salesforce_external);
  let cleanedUpOffers: any;
  const offersUnableToIndex: string[] = [];
  const indexedOffers: string[] = [];
  try {
    cleanedUpOffers = await cleanUpOldOffers(newOfferIds);
  } catch (err) {
    logger("error", "error cleaning up offers from redis", err);
    err.message = `Error cleaning up old offers from redis ${err.message}`;
    throw err;
  }
  logger("info", `Indexing ${offers.length} offers`);
  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    if (offer.type === "hotel") {
      try {
        const { latitude } = offer.lowest_price_package.property;
        const { longitude } = offer.lowest_price_package.property;
        const geoData = offer.lowest_price_package.property.geo_data;

        const data = {
          locations: offer.locations,
          holidayTypes: offer.holidayTypes,
          name: offer.name,
          slug: offer.slug,
          id_salesforce_external: offer.id_salesforce_external,
          lat: latitude,
          lng: longitude,
          continent: geoData.continent_code,
          country: geoData.country,
          administrative_area_level_1: geoData.administrative_area_level_1,
          url: `https://${process.env.WEBSITE_BASE_URL}/${offer.slug}/${offer.id_salesforce_external}`
        };
        await redis.geoadd(
          "locations:world",
          longitude,
          latitude,
          offer.id_salesforce_external
        );
        await redis.geoadd(
          `locations:continent:${stringsToKeys(geoData.continent_code)}`,
          longitude,
          latitude,
          offer.id_salesforce_external
        );
        await redis.geoadd(
          `locations:country:${stringsToKeys(geoData.country)}`,
          longitude,
          latitude,
          offer.id_salesforce_external
        );
        await redis.geoadd(
          `locations:administrative_area_level_1:${stringsToKeys(
            geoData.administrative_area_level_1
          )}`,
          longitude,
          latitude,
          offer.id_salesforce_external
        );
        await redis.hmset(`offer:${offer.id_salesforce_external}`, data);
        for (let j = 0; j < offer.locations.length; j++) {
          const location = offer.locations[j];
          await redis.geoadd(
            `locations:name:${stringsToKeys(location)}`,
            longitude,
            latitude,
            offer.id_salesforce_external
          );
        }
        for (let j = 0; j < offer.holiday_types.length; j++) {
          const holidayType = offer.holiday_types[j];
          await redis.geoadd(
            `locations:holidayType:${stringsToKeys(holidayType)}`,
            longitude,
            latitude,
            offer.id_salesforce_external
          );
        }
        indexedOffers.push(offer.id_salesforce_external);
      } catch (err) {
        offersUnableToIndex.push(offer.id_salesforce_external);
        logger("error", "Indexing Error", {
          id_salesforce_external: offer.id_salesforce_external
        });
      }
    }
  }
  return {
    indexedOffers,
    indexedOffersCount: indexedOffers.length,
    offersUnableToIndex,
    offersUnableToIndexCount: offersUnableToIndex.length,
    cleanedUpOffers,
    cleanedUpOffersCount: cleanedUpOffers.length
  };
}
