var _ = require('lodash');
const historyList= [
    {
        code: 0.1,
        description: 'Received bid request'
    },{
        code: 0.2,
        description: 'Received ask request'
    },{
        code: 0.3,
        description: 'Received Unknown request'
    },{
        code: 1.1,
        description: 'Opreation: Without any Ask order'
    },{
        code: 1.2,
        description: 'Opreation: Without any Bid order'
    },{
        code: 2.1,
        description: 'Opreation: Create record in order book'
    },{
        code: 99.1,
        description: 'Closed: Market order.'
    }
]

module.exports.getHistory = function getHistoryDescription(code){
    return _.filter(historyList, { 'code': code })[0];
}

