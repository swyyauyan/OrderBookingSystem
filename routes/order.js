var express = require("express");
var router = express.Router();

var orderController = require("../controller/orderController");

router.get("/overview", orderController.getOrderOverview);

router.get("/", orderController.getOrders);

router.get("/:id", orderController.getOrderById);

router.post("/", orderController.createOrder);

router.get("/history/:id", orderController.getHistoriesByOrderId);

module.exports = router;
