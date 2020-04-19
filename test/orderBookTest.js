let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var Order = require("../model/order");
require("dotenv").config();

beforeEach(function (done) {
  setTimeout(function () {
    done();
  }, 1000);
});

describe("Test order book API", () => {
  before(function (done) {
    mongoose.connect(process.env.DB_URL_TEST);
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function () {
      console.log("We are connected to test database!");
      done();
    });
  });

  describe("/GET order book", () => {
    it("it should GET all order book", (done) => {
      chai
        .request(server)
        .get("/order")
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.be.eql("NOT IMPLEMENTED: Get Order book");
          done();
        });
    });
  });

  describe("/GET order book by not existing id", () => {
    it("it should GET specific order book by id", (done) => {
      chai
        .request(server)
        .get("/order/2719")
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.be.eql("Cannot found order Id = 2719");
          done();
        });
    });
  });

  describe("/GET order book by existing id", () => {
  var orderId;
    it("Create Bid Limit Order and return order Id", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "limit", qty: 1, price: 400 })
        .end((err, res) => {
          orderId = res.text;
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    });

    it("it should GET specific order book by id", (done) => {
      chai
        .request(server)
        .get("/order/" + orderId)
        .end((err, res) => {
          res.should.have.status(200);
          console.log(res.body[0]);
          should.equal(res.body[0].orderId, orderId);
          done();
        });
    });
  });

  after(function (done) {
    mongoose.connection.db.dropDatabase(function () {
      mongoose.connection.close(done);
    });
  });
});
