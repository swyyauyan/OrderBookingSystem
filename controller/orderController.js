var OrderCreationService = require('../service/orderCreationService');
var orderCreationService = new OrderCreationService;

exports.getOrders = function(req, res) {
    orderCreationService.get();
    res.send('NOT IMPLEMENTED: Get Order book');
};

exports.getOrderById = function(req, res) {
    orderCreationService.getOrderById();
    res.send('NOT IMPLEMENTED: Get Order by ID = ' + req.params.id);
};

exports.createOrder = function(req, res) {
    orderCreationService.create();
    res.send('NOT IMPLEMENTED: Create order');
};
