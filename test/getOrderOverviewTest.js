let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var sessionInformation = require("../model/sessionInformation");
require("dotenv").config();

before(function (done) {
  mongoose.connect(process.env.DB_URL_TEST);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", function () {
    console.log("We are connected to test database!");
    done();
  });
  Promise.all([sessionInformation.deleteMany({})]).then((value) => {
    console.log("Cleared all collections");
    return Promise.resolve();
  });
});

describe("getOrderOverviewTest", () => {
  it("Step 0: Get order overview..", () => {
    chai
      .request(server)
      .get("/order/overview")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.lstPrc.should.equal(0);
        res.body.lstVol.should.equal(0);
        res.body.lstTime.should.equal("");
        res.body.totalVol.should.equal(0);
      });
  });

  it("Step 1: Create ask limit Order.", (done) => {
    chai
      .request(server)
      .post("/order")
      .send({ action: "ask", type: "limit", qty: 500, price: 120 })
      .end((err, res) => {
        askOrderId = res.text;
        res.should.have.status(200);
        done();
      });
  }).timeout(5000);

  it("Step 1: Create bid market Order.", (done) => {
    chai
      .request(server)
      .post("/order")
      .send({ action: "bid", type: "market", qty: 300 })
      .end((err, res) => {
        askOrderId = res.text;
        res.should.have.status(200);
        done();
      });
  }).timeout(5000);

  it("Step 2: Get Order overview.", () => {
    chai
      .request(server)
      .get("/order/overview")
      .end((err, res) => {
        console.log(res.body);
        res.should.have.status(200);
        // should.be.equal(res.body.lstPrc, 120);
        res.body.lstPrc.should.equal(120);
        res.body.lstVol.should.equal(300);
        res.body.totalVol.should.equal(300);
        res.body.high.should.equal(120);
        res.body.low.should.equal(120);
        res.body.open.should.equal(1);
        res.body.close.should.equal(1);
        // done();
      });
  }).timeout(5000);

  it("Step 3: Create bid market Order.", (done) => {
    chai
      .request(server)
      .post("/order")
      .send({ action: "bid", type: "limit", qty: 100, price: 120 })
      .end((err, res) => {
        askOrderId = res.text;
        res.should.have.status(200);
        done();
      });
  }).timeout(5000);

  it("Step 4: Get Order overview.", () => {

    chai
      .request(server)
      .get("/order/overview")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.lstPrc.should.equal(120);
        res.body.lstVol.should.equal(100);
        res.body.totalVol.should.equal(400);
        res.body.high.should.equal(120);
        res.body.low.should.equal(120);
        res.body.open.should.equal(1);
        res.body.close.should.equal(2);
        // done();
      });
  }).timeout(5000);

  after(function (done) {
    Promise.all([sessionInformation.deleteMany({})]).then((value) => {
      console.log("Cleared all collections");
      return Promise.resolve();
    });
    mongoose.connection.db.dropDatabase(function () {
      mongoose.connection.close(done);
    });
  });
});
