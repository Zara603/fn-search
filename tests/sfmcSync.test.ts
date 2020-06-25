import {
  updateDestinationsToSFMC,
  sendUserAlertsToSFMC,
  deactivateUserAlertsInSFMC
} from "../src/scripts/updateSFMC"
import * as nock from "nock"
import redis from "../src/lib/redis"
import {
  CREATE_USER_DESTINATION_SET,
  DELETE_USER_DESTINATION_SET,
  CREATE_DESTINATION_SET,
  USER_ALERT_DE_EXTERNAL_KEY,
  DESTINATIONS_DE_EXTERNAL_KEY
} from "../src/config"

describe('test sync data to sfmc', () => {
  // nock will cause test to fail if a post request
  // is not made to the given location with the given body

  const place_id = 'testing'
  const userKey = `heroku_id:person_contact_id:${place_id}`
  const userHash = {
    heroku_id: "heroku_id",
    person_contact_id: "person_contact_id",
    place_id: "testing"
  }
  const destination = {
    place_id,
    id: place_id,
    tag_type: 'alert',
    tag_value: 'alert',
    brand: 'luxuryescapes',
    level: 'colloquial_area',
    value: 'Sydney',
    lng: 151.2204,
    lat: -33.8685,
    continent: 'Oceania',
    country: 'Australia',
    administrative_area_level_1: 'New South Wales',
    colloquial_area: 'Sydney',
    locality: '',
    created_at: ''
  }
  let scope
  let authScope

  function setUpScope(externalKey:string, body:any) {
    scope = nock("https://mckkfx4222l3xk300nzdmzdg55cq.rest.marketingcloudapis.com")
      .put(`/data/v1/async/dataextensions/key:${externalKey}/rows`, body)
      .reply(202, { requestId: '14106e92-2659-418a-898a-4cf79479f1cd', resultMessages: [] })
  }


  before(async () => {
    const authBody = {
      clientId: process.env.MARKETING_CLOUD_API_CLIENT_ID,
      clientSecret: process.env.MARKETING_CLOUD_API_CLIENT_SECRET 
    }
    const authResponse = {
      "accessToken":"Zfd8Nho3Z0SfDk2Tje5haAvR",
      "expiresIn":3458
    }
    const authUrl = 'https://auth.exacttargetapis.com'
    authScope = nock(authUrl)
      .post('/v1/requestToken', authBody)
      .reply(200, authResponse)
    await redis.select(15)
    await redis.sadd(CREATE_USER_DESTINATION_SET, userKey)
    await redis.sadd(DELETE_USER_DESTINATION_SET, userKey)
    await redis.sadd(CREATE_DESTINATION_SET, place_id)
    await redis.hmset(place_id, destination)
  })
  
  after(async () => {
    await redis.flushdb()
    await redis.select(0)
  })

  it('send user alert to SFMC', async () => {
    setUpScope(USER_ALERT_DE_EXTERNAL_KEY, {items: [userHash]})
    const response = await sendUserAlertsToSFMC()
    const userAlerts = await redis.smembers(CREATE_USER_DESTINATION_SET)
    if(userAlerts.length !== 0) {
      throw new Error(`create alert set not empty`)
    }
  })

  it('deactivate alert in SFMC', async () => {
    const deactivatedUserHash = {
      ...userHash,
      active: false
    }
    setUpScope(USER_ALERT_DE_EXTERNAL_KEY, {items: [deactivatedUserHash]})
    const response = await deactivateUserAlertsInSFMC()
    const userAlerts = await redis.smembers(DELETE_USER_DESTINATION_SET)
    if(userAlerts.length !== 0) {
      throw new Error(`delete alert set not empty`)
    }
  })

  it('send destination to SFMC', async () => {
    setUpScope(DESTINATIONS_DE_EXTERNAL_KEY, {items: [destination]})
    const response = await updateDestinationsToSFMC()
    const userAlerts = await redis.smembers(CREATE_DESTINATION_SET)
    if(userAlerts.length !== 0) {
      throw new Error(`delete destination set not empty`)
    }
  })
})
