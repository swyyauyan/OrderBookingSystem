var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var SessionInformation = require("../model/sessionInformation");

class OrderOverviewService {
  async get(res) {
    var totalOrders = (await OrderHistory.distinct("orderId")).length;

    var askOrders = await Order.find({ action: "ASK" });
    var bidOrders = await Order.find({ action: "BID" });

    await SessionInformation.findOne({"key" : "orderOverview"}, function (err, overview) {
        if(overview === null){
            res.send({
                lstPrc: 0,
                lstVol: 0,
                lstTime: "",
                totalVol: 0,
                high: 0, 
                low: 0,
                open: 0,
                close: 0,
              });
        }else{
            var overviewObj = overview.value;
            res.send({
                lstPrc: overviewObj.lstPrc,
                lstVol: overviewObj.lstVol,
                lstTime: overviewObj.lstTime,
                totalVol: overviewObj.totalVol,
                high: overviewObj.high, 
                low: overviewObj.low,
                open: askOrders.length + bidOrders.length,
                close: totalOrders - (askOrders.length + bidOrders.length),
              });
        }
    });
    
  }

  async updateLastRecord(price, qty){
    await SessionInformation.findOne({"key" : "orderOverview"}, async function (err, overview) {
        if(overview === null){
            await new SessionInformation({
                key: "orderOverview",
                value: {
                lstPrc: price,
                lstVol: qty,
                lstTime: new Date().toString(),
                totalVol: qty,
                high: price, 
                low: price
                }
            }).save();
        }else{
            var value = {
                lstPrc : price,
                lstVol : qty,
                lstTime: new Date().toString(),
                totalVol: (overview.value.totalVol + qty),
                high: overview.value.high < price ? price : overview.value.high,
                low: overview.value.low > price ? price : overview.value.low
            }
            overview.value = value;
            await overview.save(function (err, overview) {
                if (err) return console.error(err);
              });
        }
      });
  }
}
module.exports = OrderOverviewService;
