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

describe('test locationAlertController Auth', () => {
  let authStub;

  beforeEach(async () => {
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 401, undefined}))
  });

  afterEach(function() {
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

  it("update location requires auth", async () => {
    const resp = await chai.request(app)
      .patch("/api/search/location-alert/1")
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
  let redisStub;

  beforeEach(async () => {
    authStub = sinon.stub(auth, 'getUser');
    authStub.returns(Promise.resolve({status: 200, user}))
  });

  afterEach(function() {
    authStub.restore();
    try {
      soapStub.restore();
      redisStub.restore();
    } catch (err) {
      // sometimes this is not stubbed, dont error if it is not
    }
  });

  it("get locations returns locations alerts", async () => {
    soapStub = sinon.stub(m, 'getUserDestinationAlertsSFMC')
    redisStub = sinon.stub(r, 'getUserDestinationAlertsRedis')
    soapStub.returns(Promise.resolve())
    const resp = await chai.request(app)
      .get('/api/search/location-alert')
    expect(resp.status).to.equal(200)
  })

  it("create location requires correct schema", async () => {
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .send({});
    expect(resp.status).to.equal(400);
  });

  it("update location requires correct schema", async () => {
    const resp = await chai.request(app)
      .patch("/api/search/location-alert/1")
      .set("content-type", "application/json")
      .send({});
    expect(resp.status).to.equal(400);
  });

  it("create location creates locationAlert", async () => {
    soapStub = sinon.stub(m, 'createUserDestinationAlertSFMC')
    redisStub = sinon.stub(r, 'createUserDestinationAlertRedis')
    soapStub.returns(Promise.resolve())
    const resp = await chai.request(app)
      .post("/api/search/location-alert")
      .set("content-type", "application/json")
      .set('Cookie', 'testing')
      .send(payload);
    expect(resp.status).to.equal(201);
    expect(authStub.calledOnce).to.equal(true);
    expect(soapStub.calledOnce).to.equal(true);
  });
});
