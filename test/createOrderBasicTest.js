var _ = require("lodash");
let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var SessionInformation = require("../model/sessionInformation");
require("dotenv").config();

describe("createOrderBasicTest", () => {
  before(function (done) {
    mongoose.connect(process.env.DB_URL_TEST);
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function () {
      console.log("We are connected to test database!");
      done();
    });
  });

  describe("Create Bid Market Order with no Ask Record", () => {
    var orderId;
    it("Create Bid Market Order and return order Id", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "bid", type: "market", qty: 1, price: 400 })
        .end((err, res) => {
          orderId = res.text;
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    }).timeout(1000);

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
        .send({ action: "ask", type: "market", qty: 1, price: 400 })
        .end((err, res) => {
          orderId = res.text;
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    }).timeout(1000);

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
    }).timeout(1000);

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
    }).timeout(1000);
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
          res.should.have.status(200);
          should.not.equal(orderId, null);
          done();
        });
    }).timeout(1000);

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
        should.equal(result[0].type, "LIMIT");
        should.equal(result[0].action, "ASK");
        should.equal(result[0].qty, 1);
        should.equal(result[0].price, 400);
        should.equal(result[0].status, "OPEN");
        done();
      });
    }).timeout(1000);
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
    }).timeout(1000);

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
    }).timeout(1000);

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

  describe("Create Order in Pre-opening session - Pre-order matching Period", () => {
    var orderId = '';
    it("1. Set trading phrase in Pre-opening session - Pre-order matching Period", (done) => {
      chai
        .request(server)
        .post("/tradingPhrase")
        .send({ tradingPhrase: "Pre-opening session - Pre-order matching Period" })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("2. create market order in Pre-opening session - Pre-order matching Period", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "market", qty: 1, price: 400 })
        .end((err, res) => {
          res.should.have.status(200);
          orderId = res.text;
          done();
        });
    }).timeout(2000);

    it("3. create limit order in Pre-opening session - Pre-order matching Period", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "limit", qty: 1, price: 400 })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    }).timeout(2000);

    it("4. Market record is in order book - Pre-order matching Period", (done) => {
      Order.findOne({'orderId': orderId}, function(err, order){
        console.log(order);
        should.equal(order.type, 'MARKET');
        done();
      });
    }).timeout(2000);
  });


  describe("Create Order in Pre-opening session - Order matching Period", () => {
    it("1. Set trading phrase in Pre-opening session - Order matching Period", (done) => {
      chai
        .request(server)
        .post("/tradingPhrase")
        .send({ tradingPhrase: "Pre-opening session - Order matching Period" })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("2. create limit order in Pre-opening session - Order matching Period", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "limit", qty: 1, price: 400 })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    }).timeout(2000);

    it("3. create market order in Pre-opening session - Order matching Period", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "market", qty: 1, price: 400 })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    }).timeout(2000);
  });

  describe("Create Order in Pre-opening session - Blocking Period", () => {
    it("1. Set trading phrase in Pre-opening session - Blocking Period", (done) => {
      chai
        .request(server)
        .post("/tradingPhrase")
        .send({ tradingPhrase: "Pre-opening session - Blocking Period" })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("2. create limit order in Pre-opening session - Blocking Period", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "limit", qty: 1, price: 400 })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    }).timeout(2000);

    it("3. create market order in Pre-opening session - Blocking Period", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "BID", type: "market", qty: 1, price: 400 })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    }).timeout(2000);
    clearAllData();
  });

  function clearAllData() {
    Promise.all([SessionInformation.deleteMany({}), Order.deleteMany({}), OrderHistory.deleteMany({})]).then(
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
