var OrderCreationService = require("../service/orderCreationService");
var orderCreationService = new OrderCreationService();

var OrderBookService = require("../service/orderBookService");
var orderBookService = new OrderBookService();

exports.getOrders = function (req, res) {
  orderBookService.get();
  res.send("NOT IMPLEMENTED: Get Order book");
};

exports.getOrderById =( async function(req, res) {
  await orderBookService.getOrderById(req, res);
 });

exports.createOrder = function (req, res) {
  res.send(orderCreationService.create(req.body));
};

