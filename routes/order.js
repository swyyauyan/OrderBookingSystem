var express = require("express");
var router = express.Router();

var orderController = require("../controller/orderController");

var iepController = require("../controller/iepController");

router.get("/overview", orderController.getOrderOverview);

router.get("/", orderController.getOrders);

router.get("/:id", orderController.getOrderById);

router.post("/", orderController.createOrder);

router.get("/history/:id", orderController.getHistoriesByOrderId);

router.get("/iep/value", iepController.getValue)

router.get("/iep/possibleResult", iepController.getPossibleResult)

router.get("/iep/trade", iepController.getTradeResult)

module.exports = router;
