var OrderCreationService = require("../service/orderCreationService");
var orderCreationService = new OrderCreationService();

var OrderBookService = require("../service/orderBookService");
var orderBookService = new OrderBookService();

exports.getOrders = function (req, res) {
  orderBookService.get();
  res.send("NOT IMPLEMENTED: Get Order book");
};

exports.getOrderById = function (req, res) {
  orderBookService.getOrderById();
  res.send("NOT IMPLEMENTED: Get Order by ID = " + req.params.id);
};

exports.createOrder = function (req, res) {
  res.send(orderCreationService.create(req.body));
};
