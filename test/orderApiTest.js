let chai = require('chai');
let chaiHttp = require('chai-http');
var should = chai.should();
chai.use(chaiHttp);
let server = require('../app');

describe('test API', () => {
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

    describe('/POST create order', () => {
        it('it should create a new order', (done) => {
        chai.request(server)
            .post('/order')
            .end((err, res) => {
                (res).should.have.status(200);
                (res.text).should.be.eql('NOT IMPLEMENTED: Create order');
                done();
                });
            });
        });
    });
