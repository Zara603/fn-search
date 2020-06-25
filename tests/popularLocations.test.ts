import * as chai from "chai"
import server from "../src/server"
import chaiHttp = require('chai-http');
import * as  app from "../src/start"
import redis from "../src/lib/redis"
import * as auth from "../src/services/auth"
import * as sinon from "sinon"
import { adminUser } from "./fixtures/user"
import * as snapshot from "snap-shot-it"
import { indexOffers } from "../src/scripts/indexOffers"

const expect = chai.expect
chai.use(chaiHttp);

const payload = {
  tag: "NZ & The Pacific",
  image_id: "testing",
  location_alerts: [
  {
    brand: "luxuryescapes",
    place_id: "baa baa",
    google_result:{
      continent: "Oceania",
      country: "Australia",
      administrative_area_level_1: "",
      locality: "",
      colloquial_area: ""
    },
    location_alert: {
      level: "country",
      value: "Australia",
      geocode: {
        lng: 22.001,
        lat: 22.001
      }
    }
  },
  {
    brand: "luxuryescapes",
    place_id: "the islands",
    google_result:{
      continent: "Oceania",
      country: "New Zealand",
      administrative_area_level_1: "",
      locality: "",
      colloquial_area: ""
    },
    location_alert: {
      level: "country",
      value: "New Zealand",
      geocode: {
        lng: 23.001,
        lat: 23.001
      }
    }
  },
 ]
}

const newLocationAlert = {
  brand: "luxuryescapes",
  place_id: "more islands",
  google_result:{
    continent: "Oceania",
    country: "New Calidonia",
    administrative_area_level_1: "",
    locality: "",
    colloquial_area: ""
  },
  location_alert: {
    level: "country",
    value: "New Calidonia",
    geocode: {
      lng: 24.001,
      lat: 24.001
    }
  }
}


describe('test e2e Popular Locations', () => {
  let authStub;

  before(async () => {
    // using database 15 as test database
    await redis.select(15)
    // intension of these tests is not to test auth
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 200, user: adminUser}))
    await indexOffers()
  });

  after(async() => {
    // switch back to database 0 after tests
    await redis.flushdb();
    await redis.select(0)
    authStub.restore();
  });

  it("get popular locations should be empty", async () => {
    const resp = await chai.request(app)
      .get("/api/search/popular-location")
    expect(resp.status).to.equal(200);
    expect(resp.body).to.deep.equal([]);
  });

  it("create popular locations", async () => {
    const respOne = await chai.request(app)
      .post("/api/search/popular-location")
      .set("content-type", "application/json")
      .send(payload);
    expect(respOne.status).to.equal(201);

    const respTwo = await chai.request(app)
      .get("/api/search/popular-location")
    expect(respTwo.status).to.equal(200);
    snapshot(respTwo.body)
  });

  it("update popular location", async () => {

    payload.location_alerts.push(newLocationAlert)

    const respOne = await chai.request(app)
      .put("/api/search/popular-location/")
      .set("content-type", "application/json")
      .send(payload);
    expect(respOne.status).to.equal(202);

    const respTwo = await chai.request(app)
      .get("/api/search/popular-location")
    expect(respTwo.status).to.equal(200);
    snapshot(respTwo.body)
  });

  it("add popular location", async () => {
    const respOne = await chai.request(app)
      .post("/api/search/popular-location/tag")
      .set("content-type", "application/json")
      .send({tag: payload.tag});
    expect(respOne.status).to.equal(201);
    snapshot(respOne.body)
  })

  it("delete popular location", async () => {

    payload.location_alerts.push(newLocationAlert)

    const respOne = await chai.request(app)
      .delete("/api/search/popular-location/tag")
      .set("content-type", "application/json")
      .send({tag: payload.tag});
    expect(respOne.status).to.equal(204);


    const respTwo = await chai.request(app)
      .get("/api/search/location-alert")
    expect(respTwo.status).to.equal(200);
    snapshot(respTwo.body)
  });

});

