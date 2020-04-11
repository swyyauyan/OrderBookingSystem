var _ = require('lodash');
var OrderModel = require('../model/order')

class OrderCreationService {
    get(){
        console.log('********');
        console.log('NOT IMPLEMENTED: Get Order book');
        console.log('********');
    }

    getOrderById(){
        console.log('********');
        console.log('NOT IMPLEMENTED: Get Order bookGet Order by ID');
        console.log('********');
    }

    create(){
        console.log('********');
        console.log('NOT IMPLEMENTED: create Order');
        var order = new OrderModel({ test: 'awesome' });
        order.save(function (err) {
            if (err) return handleError(err);
            console.log(order + " saved to collection.");
          });
        console.log('********');
    }
}

module.exports = OrderCreationService;