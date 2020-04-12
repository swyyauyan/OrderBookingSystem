var _ = require('lodash');
var Order = require('../model/order')
var OrderHistory = require('../model/orderHistory')
var historyList = require('../model/historyCodeList')

class OrderCreationService {

    create(request){
        var id = this.getOrderId();
        switch(request.action.toUpperCase()) {
            case 'BID':
                this.createBid(request, id);
                return id;
            case 'ASK':
                this.createAsk(request, id);
                return id;
            default:
                this.createLog(id, request, 0.3);
                return id;
          }
    }

    createBid(request, id){
        this.createLog(id, request, 0.1);
        var openAskOrder = Order.find({type: 'ASK', status: 'Open'});
        if( _.find(openAskOrder) || openAskOrder.size == 0 ){
            this.createLog(id, request, 1.1);
            this.notClosedOrderHandling(request, id);
        }
    }

    createAsk(request, id){
        this.createLog(id, request, 0.2);
        var openBidOrder = Order.find({type: 'BID', status: 'Open'});
        if( _.find(openBidOrder) || openBidOrder.size == 0 ){
            this.createLog(id, request, 1.2);
            this.notClosedOrderHandling(request, id);
        }
    }

    notClosedOrderHandling(request, id){
        request.type.toUpperCase() == 'LIMIT' ? 
        this.addToOrderBook(id, request.action, request.type, request.qty, request.price):
        this.createLog(id, request, 99.1);
    }

    addToOrderBook(id, action, type, qty, price){
        this.createLog(id, {action: action, type: type, qty: qty, price: price},  2.1);
        var order = new Order({
            orderId: id,
            action: action,
            type: type,
            qty: qty,
            price: price,
            status: 'OPEN',
            createAt: Date.now()
        });
        order.save();
    }


    createLog(id, request, code){
        var history = new OrderHistory({ 
            orderId: id,
            request: request, 
            description: historyList.getHistory(code) , 
            createAt: Date.now() });
        history.save();
    }

    getOrderId(){
        return '_' + Math.random().toString(36).substr(2, 9); 
    }

}

module.exports = OrderCreationService;