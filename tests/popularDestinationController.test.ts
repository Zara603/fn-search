import * as chai from "chai"
import * as nock from "nock";
import * as  app from "../src/start"
import server from "../src/server"
import chaiHttp = require('chai-http');
import { adminUser, user } from "./fixtures/user"
import * as sinon from "sinon"
import * as auth from "../src/services/auth"
import redis from "../src/lib/redis"

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
    level: "sublocality",
    value: "Seminyak",
    geocode: {
      lng: 22.001,
      lat: 22.001
    }
  }
}

 
describe('test popularDestinationContoller Auth', () => {
  let authStub;

  before(async () => {
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 200, user}))
  });

  after(function() {
    authStub.restore();
  });

  it("create popular destination requires admin", async () => {
    const resp = await chai.request(app)
      .post("/api/search/popular-destination")
      .set("content-type", "application/json")
      .send(payload);
    expect(resp.status).to.equal(403);
  });

  it("delete popular destination requires admin", async () => {
    const resp = await chai.request(app)
      .delete("/api/search/popular-destination/1")
      .set("content-type", "application/json")
      .send(payload);
    expect(resp.status).to.equal(403);
  });
});

describe('test popularDestinationController', () => {
  let authStub;

  before(async () => {
    await redis.select(15)
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 200, user: adminUser}))
  });

  after(async () => {
    await redis.flushdb();
    await redis.select(0)
    authStub.restore();
  });

  it("create popular destination", async () => {
    const resp = await chai.request(app)
      .post("/api/search/popular-destination")
      .set("content-type", "application/json")
      .send(payload);
    expect(resp.status).to.equal(201);
    expect(resp.body.location_alert.value).to.equal(payload.location_alert.value)

    const respTwo = await chai.request(app)
      .get("/api/search/popular-destination")
    expect(respTwo.body[0].location_alert.value).to.equal(payload.location_alert.value)
  });

  it("delete popular location", async () => {
    const resp = await chai.request(app)
      .delete("/api/search/popular-destination/1")
    expect(resp.status).to.equal(204);
  });

});
