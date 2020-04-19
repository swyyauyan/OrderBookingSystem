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
    it("it should GET empty when no record in database.", (done) => {
      chai
        .request(server)
        .get("/order")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.eql({
            Bid: [],
            Ask: [],
          });
          done();
        });
    });

    it("Put record in order book", (done) => {
      Promise.all([
        new Order({ orderId: "_x44zapjv4", action: "ASK", type: "LIMIT", qty: 1, price: 70 , createAt: "2020-04-19T18:48:00.747Z"}).save(),
        new Order({ orderId: "_hwuzimq3o", action: "BID", type: "LIMIT", qty: 1, price: 30 , createAt: "2020-04-19T18:48:04.747Z"}).save(),
        new Order({ orderId: "_axkpe2w3m", action: "ASK", type: "LIMIT", qty: 1, price: 70 , createAt: "2020-04-19T18:30:00.747Z"}).save(),
        new Order({ orderId: "_l4xh19jqr", action: "BID", type: "LIMIT", qty: 1, price: 50 , createAt: "2020-04-19T18:48:04.747Z"}).save(),
        new Order({ orderId: "_crnmkeg1z", action: "ASK", type: "LIMIT", qty: 1, price: 60 , createAt: "2020-04-19T18:48:04.747Z"}).save(),
        new Order({ orderId: "_cacy2r5ug", action: "BID", type: "LIMIT", qty: 1, price: 40 , createAt: "2020-04-19T18:49:04.747Z"}).save(),
      ]).then(()=>{
        chai
        .request(server)
        .get("/order")
        .end((err, res) => {
          res.should.have.status(200);
          console.log(res.body);
          should.equal(res.body.Bid[0].orderId, "_l4xh19jqr");
          should.equal(res.body.Bid[1].orderId, '_cacy2r5ug');
          should.equal(res.body.Bid[2].orderId, '_hwuzimq3o');
          should.equal(res.body.Ask[0].orderId, '_crnmkeg1z');
          should.equal(res.body.Ask[1].orderId, '_axkpe2w3m');
          should.equal(res.body.Ask[2].orderId, '_x44zapjv4');
          done();
        });
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
