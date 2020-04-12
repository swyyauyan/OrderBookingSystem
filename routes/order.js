var express = require("express");
var router = express.Router();

var orderController = require("../controller/orderController");

router.get("/", orderController.getOrders);

router.get("/:id", orderController.getOrderById);

router.post("/", orderController.createOrder);

module.exports = router;
