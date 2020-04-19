let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var OrderHistory = require("../model/orderHistory");
require("dotenv").config();

beforeEach(function (done) {
  setTimeout(function () {
    done();
  }, 1000);
});

describe("Test order history API", () => {
  before(function (done) {
    mongoose.connect(process.env.DB_URL_TEST);
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function () {
      console.log("We are connected to test database!");
      done();
    });
  });

  describe("/GET order history by not existing Id", () => {
    it("it should GET empty when no record in database.", (done) => {
      chai
        .request(server)
        .get("/order/history/123")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.eql([]);
          done();
        });
    });

    it("Put record in order book", (done) => {
      Promise.all([
        new OrderHistory({ orderId: "_x44zapjv4"}).save(),
        new OrderHistory({ orderId: "_d44zapjv4"}).save(),
        new OrderHistory({ orderId: "_x44zapjv4"}).save(),
        new OrderHistory({ orderId: "_x44zapjv4"}).save(),
      ]).then(()=>{
        chai
        .request(server)
        .get("/order/history/_x44zapjv4")
        .end((err, res) => {
          res.should.have.status(200);
          console.log(res.body);
          should.equal(res.body.length, 3);
          done();
        });
      });
    });
  });
  after(function (done) {
    Promise.all([OrderHistory.deleteMany({})]).then(
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
