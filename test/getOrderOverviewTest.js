let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var OrderOverview = require("../model/orderOverview");
require("dotenv").config();

beforeEach(function (done) {
  setTimeout(function () {
    done();
  }, 500);
});
before(function (done) {
  mongoose.connect(process.env.DB_URL_TEST);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", function () {
    console.log("We are connected to test database!");
    done();
  });
});

describe("Test order overview API", () => {
    it("Step 0: Get order overview.", (done) => {
        chai
        .request(server)
        .get("/order/overview")
        .end((err, res) => {
          res.should.have.status(200);
          should.equal(res.body.lstPrc, 0);
          should.equal(res.body.lstVol, 0);
          should.equal(res.body.lstTime, '');
          should.equal(res.body.totalVol, 0);
          done();
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
      });

      it("Step 1: Create bid market Order.", (done) => {
        chai
          .request(server)
          .post("/order")
          .send({ action: "bid", type: "market", qty: 300})
          .end((err, res) => {
            askOrderId = res.text;
            res.should.have.status(200);
            done();
          });
      });

      it("Step 2: Get Order overview.", (done) => {
        chai
        .request(server)
        .get("/order/overview")
        .end((err, res) => {
            console.log(res.body);
          res.should.have.status(200);
          should.equal(res.body.lstPrc, 120);
          should.equal(res.body.lstVol, 300);
          should.not.equal(res.body.lstTime, '');
          should.equal(res.body.totalVol, 300);
          should.equal(res.body.high, 120);
          should.equal(res.body.low, 120);
          should.equal(res.body.open, 1);
          should.equal(res.body.close, 1);
          done();
      });
    });

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
      });

      it("Step 4: Get Order overview.", (done) => {
        chai
        .request(server)
        .get("/order/overview")
        .end((err, res) => {
            console.log(res.body);
          res.should.have.status(200);
          should.equal(res.body.lstPrc, 120);
          should.equal(res.body.lstVol, 100);
          should.not.equal(res.body.lstTime, '');
          should.equal(res.body.totalVol, 400);
          should.equal(res.body.high, 120);
          should.equal(res.body.low, 120);
          should.equal(res.body.open, 1);
          should.equal(res.body.close, 2);
          done();
      });
    });

    after(function (done) {
        Promise.all([OrderOverview.deleteMany({})]).then(
          (value) => {
            console.log("Cleared all collections");
            return Promise.resolve();
          }
        );
        mongoose.connection.db.dropDatabase(function () {
          mongoose.connection.close(done);
        });
      });
});
