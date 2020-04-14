import * as chai from "chai"
import * as nock from "nock";
import server from "../src/server"
import chaiHttp = require('chai-http');
import * as  app from "../src/start"

const expect = chai.expect
chai.use(chaiHttp);

const payload = {
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
      lng: 22.001,
      lat: 22.001
    }
  }
}

describe('test locationAlertController', () => {

  beforeEach(async () => {
  });

  it("get locations authentication", async () => {
    const resp = await chai.request(app).get('/api/search/location-alert')
    expect(resp.status).to.equal(401)
  })

  it("get locations returns locations alerts", async () => {
    const resp = await chai.request(app).get('/api/search/location-alert')
    expect(resp.status).to.equal(200)
  })

  it("create location requires auth", async () => {
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .send(payload);
    expect(resp.status).to.equal(401);
  });

  it("create location requires correct schema", async () => {
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .send({});
    expect(resp.status).to.equal(401);
  });

  it.only("create location creates locationAlert", async () => {
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .set('Cookie', 'testing')
      .send(payload);
    console.log(resp.body)
    expect(resp.status).to.equal(201);

  });
});
