import * as chai from "chai"
import * as nock from "nock";
import server from "../src/server"
import chaiHttp = require('chai-http');
import * as  app from "../src/start"
import redis from "../src/lib/redis"
import { indexOffers } from "../src/scripts/indexOffers"
import * as sinon from "sinon"
import { offers } from "./fixtures/offers"
import * as offerService from "../src/services/offer"

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
    "url": "https://luxuryescapes.com/test-offer-1/sdfas1241",
  }
]

const expect = chai.expect
chai.use(chaiHttp);

describe('test offer location search', () => {
  let getOffersStub; 

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

  it("get offers by continent", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/continent/oceania")
    expect(resp.status).to.equal(200);
    expect(resp.body).to.deep.equal(response);
  })

  it("get offers by country", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/country/australia")
    expect(resp.status).to.equal(200);
    expect(resp.body).to.deep.equal(response);
  })

  it("get offers by admin level one", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/administrative_area_level_1/New%20South%20Wales")
    expect(resp.status).to.equal(200);
    expect(resp.body).to.deep.equal(response);
  })

  it("get offers by lat and lng", async () => {
    const geoResponse = {
      distance_from_search: "0.0139",
      ...response[0]
    }
    const resp = await chai.request(app)
      .get("/api/search/offer-search/locality/Sydney?lat=-33.8688&lng=151.2092")
    expect(resp.status).to.equal(200);
    expect(resp.body).to.deep.equal([geoResponse]);
  })

  it("404 offers not found", async () => {
    const resp = await chai.request(app)
      .get("/api/search/offer-search/administrative_area_level_1/Queensland")
    expect(resp.status).to.equal(404);
    expect(resp.body).to.deep.equal([]);
  })

});

