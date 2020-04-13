var _ = require("lodash");
const historyList = [
  {
    code: 1,
    description: "Received %ORDER_TYPE% request",
  },
  {
    code: 2,
    description: "Opreation: Without any order in another side.",
  },{
    code: 2,
    description: "Opreation: Without any order in another side.",
  },
  {
    code: 3,
    description: "Opreation: Cannot find any matching order in order book with the request price.",
  },
  {
    code: 2.1,
    description: "Opreation: Create record in order book",
  },
  {
    code: 99.1,
    description: "Closed: Market order.",
  },
];

module.exports.getHistory = function getHistoryDescription(request, code){
  var message = getMessageByCode(code);
  return {
    code: message.code,
    description: message.description.replace('%ORDER_TYPE%', request.type)
  };
}


function getMessageByCode(code) {
  return  _.filter(historyList, { code: code })[0];
};
