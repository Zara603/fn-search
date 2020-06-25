import * as chai from "chai"
import * as nock from "nock";
import server from "../src/server"
import chaiHttp = require('chai-http');
import * as  app from "../src/start"
import redis from "../src/lib/redis"
import { getKey } from "../src/lib/redisFunctions"
import { indexOffers } from "../src/scripts/indexOffers"
import * as sinon from "sinon"
import { offers } from "./fixtures/offers"
import * as offerService from "../src/services/offer"
import * as snapshot from "snap-shot-it"

const response = [
  {
    "administrative_area_level_1": "New South Wales",
    "continent": "Oceania",
    "country": "Australia",
    "holidayTypes": "",
    "id_salesforce_external": "sdfas1241",
    "lat": "-33.868897",
    "lng": "151.2092955",
    "locations": "Australia,New South Wales",
    "name": "test offer 1",
    "slug": "test-offer-1",
    "url": `https://${process.env.WEBSITE_BASE_URL}/test-offer-1/sdfas1241`,
  }
]

const expect = chai.expect
chai.use(chaiHttp);

describe('test offer location search', () => {
  let getOffersStub; 
  const place_id = 'testing'
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

  before(async () => {
    getOffersStub = sinon.stub(offerService, 'getOffers')
    getOffersStub.returns(Promise.resolve(offers))
    await redis.select(15)
    await indexOffers()
  });

  after(async () => {
    await redis.flushdb();
    await redis.select(0)
    getOffersStub.restore()
  });

  it("get offers by placeId 404 nothing found", async () => {
    const resp = await chai.request(app)
      .get("/api/search/destination/testing")
    expect(resp.status).to.equal(404);
    expect(resp.body).to.deep.equal({})
  })

  it("get offers by placeId", async () => {
    await redis.hmset(getKey(place_id, 'alert'), destination)
    const resp = await chai.request(app)
      .get("/api/search/destination/testing")
    expect(resp.status).to.equal(200);
    snapshot(resp.body)
  })

  it("get offers by continent", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/continent/oceania")
    expect(resp.status).to.equal(200);
    snapshot(resp.body)
  })

  it("get offers by country", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/country/australia")
    expect(resp.status).to.equal(200);
    snapshot(resp.body)
  })

  it("get offers by admin level one", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/administrative_area_level_1/New%20South%20Wales")
    expect(resp.status).to.equal(200);
    snapshot(resp.body)
  })

  it("get offers by lat and lng", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/geo?lat=-33.8688&lng=151.2092")
    expect(resp.status).to.equal(200);
    snapshot(resp.body)
  })

  it("404 offers not found", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/administrative_area_level_1/South%20Australia")
    expect(resp.status).to.equal(404);
    expect(resp.body).to.deep.equal([]);
  })

});

