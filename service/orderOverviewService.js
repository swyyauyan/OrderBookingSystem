var _ = require("lodash");
var Order = require("../model/order");
var OrderHistory = require("../model/orderHistory");
var orderOverview = require("../model/orderOverview");

class OrderOverviewService {
  async get(res) {
    var totalOrders = (await OrderHistory.distinct("orderId")).length;

    var askOrders = await Order.find({ action: "ASK" });
    var bidOrders = await Order.find({ action: "BID" });

    var overview = await orderOverview.find({}, function (err, overview) {
        if(overview.length === 0){
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
            res.send({
                lstPrc: overview[0].lstPrc,
                lstVol: overview[0].lstVol,
                lstTime: overview[0].lstTime,
                totalVol: overview[0].totalVol,
                high: overview[0].high, 
                low: overview[0].low,
                open: askOrders.length + bidOrders.length,
                close: totalOrders - (askOrders.length + bidOrders.length),
              });
        }
    });
    
  }

  async updateLastRecord(price, qty){
      console.log(qty);
    await orderOverview.findOne({}, async function (err, overview) {
        if(overview === null){
            await new orderOverview({
                lstPrc: price,
                lstVol: qty,
                lstTime: Date.now(),
                totalVol: qty,
                high: price, 
                low: price,
            }).save();
        }else{
            overview.lstPrc = price;
            overview.lstVol = qty;
            overview.lstTime = Date.now();
            overview.totalVol = (overview.totalVol + qty);
            if(overview.high < price){
                overview.high = price;
            }
            if(overview.low > price){
                overview.low = price;
            }
            await overview.save();
        }
      });
  }
}
module.exports = OrderOverviewService;
