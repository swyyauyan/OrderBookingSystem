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

describe("Test post order API", () => {
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

  describe("Bid Order request's price lower then all ask requests.", () => {
    //HERE
    var askOrderId;
    var bidOrderId;
    it("Step 1: Create Ask limit Order.", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "ask", type: "limit", qty: 500, price: 100 })
        .end((err, res) => {
          askOrderId = res.text;
          res.should.have.status(200);
          done();
        });
    });

    it("Step 2: Create bid limit Order and the price is lower than ask request.", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "bid", type: "limit", qty: 500, price: 99 })
        .end((err, res) => {
            bidOrderId = res.text;
          res.should.have.status(200);
          done();
        });
    });

    it("Step 2: Bid record should in Order book.", (done) => {
      Order.find({ orderId: bidOrderId }, (err, result) => {
        should.equal(result[0].qty, 500);
        should.equal(result[0].price, 99);
        should.equal(result[0].status, "OPEN");
        done();
      });
    });

    it("Step 3: Create bid limit Order(qty = 100) and the price is equal to ask request.", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "bid", type: "limit", qty: 100, price: 100 })
        .end((err, res) => {
          bidOrderId = res.text;
          res.should.have.status(200);
          done();
        });
    });

    it("Step 3: Ask record's stock should reduced(500 - 100(bid Stock) ) .", (done) => {
      Order.find({ orderId: askOrderId }, (err, result) => {
        should.equal(result[0].qty, 400);
        should.equal(result[0].price, 100);
        should.equal(result[0].status, "OPEN");
        done();
      });
    });

    it("Step 4: Create bid limit Order and the price is higger to ask request.", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "bid", type: "limit", qty: 300, price: 101 })
        .end((err, res) => {
          bidOrderId = res.text;
          res.should.have.status(200);
          done();
        });
    });

    it("Step 4: Ask record's stock should reduced(500 - 100(3) - 300(bid Stock) ) .", (done) => {
      Order.find({ orderId: askOrderId }, (err, result) => {
        should.equal(result[0].qty, 100);
        should.equal(result[0].price, 100);
        should.equal(result[0].status, "OPEN");
        done();
      });
    });

    it("Step 5: Create bid limit Order with stock higger than ask stock (100)", (done) => {
      chai
        .request(server)
        .post("/order")
        .send({ action: "bid", type: "limit", qty: 150, price: 101 })
        .end((err, res) => {
          bidOrderId = res.text;
          res.should.have.status(200);
          done();
        });
    });

    it("Step 5: Ask record's should closed in order book.", (done) => {
      Order.find({ orderId: askOrderId }, (err, result) => {
        should.equal(result.length, 0);
        done();
      });
    });

    it("Step 5: Bid record's should be created in order book.", (done) => {
      Order.find({ orderId: bidOrderId }, (err, result) => {
        console.log(result);
        should.equal(result[0].qty, 50);
        should.equal(result[0].price, 101);
        should.equal(result[0].status, "OPEN");
        done();
      });
    });

    it("Step 6: Create ask market Order works", (done) => {
        chai
          .request(server)
          .post("/order")
          .send({ action: "ask", type: "market", qty: 10 })
          .end((err, res) => {
            askOrderId = res.text;
            res.should.have.status(200);
            done();
          })
      });

    it("Step 6: Bid record's should be reduced in order book.", (done) => {
        Order.find({ orderId: bidOrderId }, (err, result) => {
            should.equal(result[0].qty, 40);
            should.equal(result[0].price, 101);
            should.equal(result[0].status, "OPEN");
            done();
        });
      });

      it("Step 7: Create ask market Order with stock bigger than the bid's stock.", (done) => {
        chai
          .request(server)
          .post("/order")
          .send({ action: "ask", type: "market", qty: 50 })
          .end((err, res) => {
            askOrderId = res.text;
            res.should.have.status(200);
            done();
          })
      });

    it("Step 7: Check ask record doesn't in order book, because this is market order.", (done) => {
        Order.find({ orderId: askOrderId }, (err, result) => {
            should.equal(result.length, 0);
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
