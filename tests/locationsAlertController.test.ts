import * as chai from "chai"
import * as nock from "nock";
import server from "../src/server"
import chaiHttp = require('chai-http');
import * as  app from "../src/start"
import {SinonTyped} from 'sinon-typed';
import * as sinon from "sinon"
import * as m from "../src/services/marketingCloud"
import * as r from "../src/models/redisDestinationAlert"
import * as auth from "../src/services/auth"
import { user } from "./fixtures/user"
import redis from "../src/lib/redis"
import * as snapshot from "snap-shot-it"
import { cleanAlertResponse } from "./lib"
import { indexOffers } from "../src/scripts/indexOffers"
import * as offerService from "../src/services/offer"
import { offers } from "./fixtures/offers"

const expect = chai.expect
chai.use(chaiHttp);


const payload = {
  brand: "luxuryescapes",
  place_id: "testing",
  google_result:{
    continent: "Oceania",
    country: "Australia",
    administrative_area_level_1: "New South Wales",
    locality: "",
    colloquial_area: "Sydney"
  },
  location_alert: {
    level: "colloquial_area",
    value: "Sydney",
    geocode: {
      lng: 151.2204,
      lat: -33.8685
    }
  }
}

describe('test locationAlertController Auth', () => {
  let authStub;

  before(async () => {
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 401, undefined}))
  });

  after(function() {
    authStub.restore();
  });

  it("get locations authentication", async () => {
    const resp = await chai.request(app).get('/api/search/location-alert')
    expect(resp.status).to.equal(401)
  })

  it("create location requires auth", async () => {
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .send(payload);
    expect(resp.status).to.equal(401);
  });

  it("index offers requires auth", async () => {
    const resp = await chai.request(app)
      .get("/api/search/index-offers")
    expect(resp.status).to.equal(401);
  });

});

describe('test locationAlertController', () => {
  let authStub;
  let soapStub;
  let getOffersStub; 

  before(async () => {
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 200, user}))
    getOffersStub = sinon.stub(offerService, 'getOffers')
    getOffersStub.returns(Promise.resolve(offers))
    await redis.select(15)
    await indexOffers()
  });

  after(async () => {
    await redis.flushdb();
    await redis.select(0)
    authStub.restore();
    getOffersStub.restore()
    try {
      soapStub.restore();
    } catch (err) {
      // sometimes this is not stubbed, dont error if it is not
    }
  });

  it("get locations returns locations alerts", async () => {
    soapStub = sinon.stub(m, 'getUserDestinationAlertsSFMC')
    soapStub.returns(Promise.resolve())
    const resp = await chai.request(app)
      .get('/api/search/location-alert')
    expect(resp.status).to.equal(200)
    snapshot(resp.body)
  })

  it("create location requires correct schema", async () => {
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .send({});
    expect(resp.status).to.equal(400);
  });


  it("creates locationAlert", async () => {
    soapStub = sinon.stub(m, 'createUserDestinationAlertSFMC')
    soapStub.returns(Promise.resolve())
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .set('Cookie', 'testing')
      .send(payload);
    expect(resp.status).to.equal(201);

    const respTwo = await chai.request(app)
      .get('/api/search/location-alert')
    expect(respTwo.status).to.equal(200)
    cleanAlertResponse(respTwo.body)
    snapshot(respTwo.body)
  });
});
