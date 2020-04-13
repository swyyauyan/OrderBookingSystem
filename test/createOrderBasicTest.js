var _ = require("lodash");
let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
require("dotenv").config();

describe("test API", () => {
  before(function (done) {
    mongoose.connect(process.env.DB_URL_TEST);
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function () {
      console.log("We are connected to test database!");
      done();
    });
  });

  beforeEach(function (done) {
    setTimeout(function () {
      done();
    }, 500);
  });

  describe("Create Bid Market Order with no Ask Record", () => {
    var orderId;
    it("Create Bid Market Order and return order Id", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "bid", type: "market", qty: 1, amount: 400 })
        .end((err, res) => {
          orderId = res.text;
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    });

    it("Found the log in order history", (done) => {
      OrderHistory.find({ orderId: orderId }, (err, result) => {
        should.equal(result.length, 3);
        done();
      });
    });
    clearAllData();
  });

  describe("Create Ask Market Order with no Ask Record", () => {
    var orderId;
    it("Create Ask Market Order and return order Id", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "ask", type: "market", qty: 1, amount: 400 })
        .end((err, res) => {
          orderId = res.text;
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    });

    it("Found the log in order history", (done) => {
      OrderHistory.find({ orderId: orderId }, (err, result) => {
        should.equal(result.length, 3);
        done();
      });
    });
    clearAllData();
  });

  describe("Create Bid Limit Order with no Ask Record", () => {
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

    it("Found the log in order history", (done) => {
      OrderHistory.find({ orderId: orderId }, (err, result) => {
        if (err) {
          throw err;
        }
        if (result.length === 0) {
          throw new Error("No data");
        }
        should.equal(result.length, 3);
        done();
      });
    });

    it("Found the log in order book", (done) => {
      Order.find({ orderId: orderId }, (err, result) => {
        console.log(result);
        should.equal(result[0].type, "LIMIT");
        should.equal(result[0].action, "BID");
        should.equal(result[0].qty, 1);
        should.equal(result[0].price, 400);
        should.equal(result[0].status, "OPEN");
        done();
      });
    });
    clearAllData();
  });

  describe("Create Ask Limit Order with no Bid Record", () => {
    var orderId;

    it("Create Ask Limit Order and return order Id", (done) => {
      Promise.all([Order.deleteMany({}), OrderHistory.deleteMany({})]).then(
        (value) => {
          console.log("Cleared database");
          return Promise.resolve();
        }
      );

      chai
        .request(server)
        .post("/order")
        .send({ action: "Ask", type: "limit", qty: 1, price: 400 })
        .end((err, res) => {
          orderId = res.text;
          console.log("1 = " + orderId);
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    });

    it("Found the log in order history", (done) => {
      OrderHistory.find({ orderId: orderId }, (err, result) => {
        if (err) {
          throw err;
        }
        if (result.length === 0) {
          throw new Error("No data");
        }
        console.log("2 = " + result);
        should.equal(result.length, 3);
        done();
      });
    });

    it("Found the log in order book", (done) => {
      Order.find({ orderId: orderId }, (err, result) => {
        console.log("3 = " + result);
        should.equal(result[0].type, "LIMIT");
        should.equal(result[0].action, "ASK");
        should.equal(result[0].qty, 1);
        should.equal(result[0].price, 400);
        should.equal(result[0].status, "OPEN");
        done();
      });
    });
    clearAllData();
  });

  describe("Create Bid Limit Order with lower price ask record", () => {
    var orderId;
    var askOrder = new Order({
      orderId: "test_ask",
      action: "ASK",
      type: "LIMIT",
      qty: 1,
      price: 100,
      status: "OPEN",
    });

    it("Create Bid Limit Order and return order Id", (done) => {
      Promise.all([askOrder.save()]).then(() => {
        Order.find({}, (err, result) => {
          chai
            .request(server)
            .post("/order")
            .send({ action: "Bid", type: "limit", qty: 1, price: 40 })
            .end((err, res) => {
              orderId = res.text;
              res.should.have.status(200);
              should.not.equal(orderId, null);
              done();
            });
        });
      });
    });

    it("Found the log in order history", (done) => {
      OrderHistory.find(
        { orderId: orderId, "description.code": 3 },
        (err, result) => {
          if (err) {
            throw err;
          }
          should.equal(result.length, 1);
          should.equal(
            result[0].description.description,
            "Opreation: Cannot find any matching order in order book with the request price."
          );
          done();
        }
      );
    });
    clearAllData();
  });

  describe("Create Ask Limit Order with higher price bid record", () => {
    var orderId;
    var askOrder = new Order({
      orderId: "test_ask",
      action: "BID",
      type: "LIMIT",
      qty: 1,
      price: 100,
      status: "OPEN",
    });

    it("Create Ask Limit Order and return order Id", (done) => {
      Promise.all([askOrder.save()]).then(() => {
        Order.find({}, (err, result) => {
          chai
            .request(server)
            .post("/order")
            .send({ action: "Ask", type: "limit", qty: 1, price: 120 })
            .end((err, res) => {
              orderId = res.text;
              res.should.have.status(200);
              should.not.equal(orderId, null);
              done();
            });
        });
      });
    });

    it("Found the log in order history", (done) => {
      OrderHistory.find(
        { orderId: orderId, "description.code": 3 },
        (err, result) => {
          should.equal(result.length, 1);
          should.equal(
            result[0].description.description,
            "Opreation: Cannot find any matching order in order book with the request price."
          );
          done();
        }
      );
    });
    clearAllData();
  });

  function clearAllData() {
    Promise.all([Order.deleteMany({}), OrderHistory.deleteMany({})]).then(
      (value) => {
        console.log("Cleared all collections");
        return Promise.resolve();
      }
    );
  }

  after(function (done) {
    mongoose.connection.db.dropDatabase(function () {
      mongoose.connection.close(done);
    });
  });
});
