let chai = require('chai');
let chaiHttp = require('chai-http');
var should = chai.should();
chai.use(chaiHttp);
let server = require('../app');

describe('test API', () => {
    describe('/GET test', () => {
        it('it should GET all the podcast', (done) => {
        chai.request(server)
          .get('/test')
          .end((err, res) => {
                (res).should.have.status(200);
                (res.text).should.be.eql('Testing');
                done();
             });
          });
        });
    });
