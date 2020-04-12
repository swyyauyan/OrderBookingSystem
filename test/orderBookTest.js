let chai = require('chai');
let chaiHttp = require('chai-http');
var should = chai.should();
chai.use(chaiHttp);
let server = require('../app');
const mongoose = require('mongoose');
var Order = require('../model/order')
require('dotenv').config();

describe('Test order book API', () => {
    
    before(function (done) {
        mongoose.connect(process.env.DB_URL_TEST);
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error'));
        db.once('open', function() {
          console.log('We are connected to test database!');
          done();
        });
      });

    describe('/GET order book', () => {
        it('it should GET all order book', (done) => {
        chai.request(server)
          .get('/order')
          .end((err, res) => {
                (res).should.have.status(200);
                (res.text).should.be.eql('NOT IMPLEMENTED: Get Order book');
                done();
             });
          });
        });

    describe('/GET order book by id', () => {
        it('it should GET specific order book by id', (done) => {
        chai.request(server)
            .get('/order/2719')
            .end((err, res) => {
                (res).should.have.status(200);
                (res.text).should.be.eql('NOT IMPLEMENTED: Get Order by ID = 2719');
                done();
                });
            });
        });

    after(function(done){
        mongoose.connection.db.dropDatabase(function(){
            mongoose.connection.close(done);
        });
        });
});