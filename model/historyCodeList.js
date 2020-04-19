var _ = require("lodash");
const historyList = [
  {
    code: 1,
    description: "Received %ORDER_TYPE% request",
  },
  {
    code: 2,
    description: "Opreation: Without any order in another side.",
  },
  {
    code: 3,
    description:
      "Opreation: Cannot find any matching order in order book with the request price.",
  },
  {
    code: 4,
    description:
      "Opreation: Order reduce stock amount, related order = %OTHER_ORDER_ID%",
  },
  {
    code: 5,
    description: "Opreation: Still have stock in order. ",
  },
  {
    code: 6,
    description: "Opreation: Add request to order book.",
  },
  {
    code: 97,
    description: "Invalid request action.  %ORDER_TYPE%",
  },
  {
    code: 98,
    description: "Closed: Order, all stock sold.",
  },
  {
    code: 99,
    description: "Closed: Market order.",
  },
];

module.exports.getHistory = function getHistoryDescription(code) {
  return getMessageByCode(code);
};

function getMessageByCode(code) {
  return _.filter(historyList, { code: code })[0];
}
