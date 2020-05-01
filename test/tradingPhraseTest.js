let chai = require("chai");
let chaiHttp = require("chai-http");
var should = chai.should();
chai.use(chaiHttp);
let server = require("../app");
const mongoose = require("mongoose");
var SessionInformation = require("../model/sessionInformation");
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

describe("Test order overview API - Submit request in trading phrase.", () => {
  it("Case 0: Submit request in Continuous trading - Can submit and trade", (done) => {
      done();
  });

  it("Case 1: Submit request in Pre-opening session - Order Input Period - Can submit but no trade", (done) => {done();});

  it("Case 2: Submit request in Pre-opening session - Pre-order matching Period - Can submit only market order and no trade", (done) => {done();});

  it("Case 3: Submit request in Pre-opening session - Order matching Period - Cannot submit and no trade", (done) => {done();});

  it("Case 4: Submit request in Pre-opening session - Blocking Period - Cannot submit and trade", (done) => {done();});

});
