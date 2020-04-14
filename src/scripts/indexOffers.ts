import { getOffers } from "../services/offer"
import redis from "../lib/redis";
import { logger } from "../lib/logger"

export async function indexOffers() {
  const offers = await getOffers()
  logger('info', `Indexing ${offers.length} offers`)
  for (let i = 0; i < offers.length; i++) {
    let offer = offers[i]
    if (offer.type === 'hotel') {
      try {
        let latitude = offer.lowest_price_package.property.latitude
        let longitude = offer.lowest_price_package.property.longitude
        let geoData = offer.lowest_price_package.property.geo_data

        let data = {
          locations: offer.locations,
          name: offer.name,
          slug: offer.slug,
          id_salesforce_external: offer.id_salesforce_external,
          url: `https://${process.env.WEBSITE_BASE_URL}/${offer.slug}/${offer.id_salesforce_external}`
        }
        await redis.geoadd('locations', longitude, latitude, offer.id_salesforce_external)
        await redis.geoadd(geoData.continent_code.toLowerCase().replace(/\s+/g, ''), longitude, latitude, offer.id_salesforce_external)
        await redis.geoadd(geoData.country.toLowerCase().replace(/\s+/g, ''), longitude, latitude, offer.id_salesforce_external)
        await redis.geoadd(geoData.administrative_area_level_1.toLowerCase().replace(/\s+/g, ''), longitude, latitude, offer.id_salesforce_external)
        await redis.set(offer.id_salesforce_external, JSON.stringify(data)) // TODO expire keys when offer ends
        for (let j =0; j < offer.locations.length; j++) {
          let location = offer.locations[j]
          await redis.geoadd(location.toLowerCase().replace(/\s+/g, ''), longitude, latitude, offer.id_salesforce_external)
        }
        for (let j =0; j < offer.holiday_types.length; j++) {
          let holidayType = offer.holiday_types[j]
          await redis.geoadd(holidayType.toLowerCase().replace(/\s+/g, ''), longitude, latitude, offer.id_salesforce_external)
        }
      } catch (err) { 
        console.log(offer.id_salesforce_external)
        logger('error', 'Indexing Error', {id_salesforce_external: offer.id_salesforce_external})
      }
    }
  }
}
