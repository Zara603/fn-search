import * as chai from "chai"
import server from "../../src/server"
import chaiHttp = require('chai-http');
import * as  app from "../../src/start"
import redis from "../../src/lib/redis"
import * as auth from "../../src/services/auth"
import * as sinon from "sinon"
import { user } from "../fixtures/user"

const expect = chai.expect
chai.use(chaiHttp);

const payload = {
    place_id: "baa baa",
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
        lng: -22.001,
        lat: 22.001
      }
    }
}


describe('test e2e Location Alert', () => {
  let authStub;

  before(async () => {
    // using database 15 as test database
    await redis.select(15)
    // intension of these tests is not to test auth
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 200, user}))
  });

  after(async() => {
    // switch back to database 0 after tests
    await redis.flushall();
    await redis.select(0)
    authStub.restore();
  });

  it("get locations location Alerts should be empty", async () => {
    const resp = await chai.request(app)
      .get("/api/search/location-alert")
    expect(resp.status).to.equal(200);
    expect(resp.body).to.deep.equal([]);
  });

  it("create location alert", async () => {
    const respOne = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .send(payload);
    expect(respOne.status).to.equal(201);

    const respTwo = await chai.request(app)
      .get("/api/search/location-alert")
    expect(respTwo.status).to.equal(200);
    expect(respTwo.body.length).to.equal(1);
    expect(respTwo.body[0].place_id).to.equal(payload.place_id);
  });

  it("update location alert", async () => {

    const respOne = await chai.request(app)
      .get("/api/search/location-alert")
    let respPayload = respOne.body[0]
    let id = respPayload.id
    delete respPayload.id
    delete respPayload.created_at
    delete respPayload.available_offers
    respPayload.google_result.country = 'Congo'

    const respTwo = await chai.request(app)
      .patch(`/api/search/location-alert/${id}`)
      .set("content-type", "application/json")
      .send(respPayload);
    expect(respTwo.status).to.equal(201);


    const respThree = await chai.request(app)
      .get("/api/search/location-alert")
    expect(respThree.status).to.equal(200);
    expect(respThree.body[0].google_result.country).to.equal(respPayload.google_result.country);
  });

  it("delete location alert", async () => {

    const respOne = await chai.request(app)
      .get("/api/search/location-alert")

    const id = respOne.body[0].id

    const respTwo = await chai.request(app)
      .delete(`/api/search/location-alert/${id}`)
    expect(respTwo.status).to.equal(204);

    const respThree = await chai.request(app)
      .get("/api/search/location-alert")
    expect(respThree.body).to.deep.equal([])
  });

});

