var request = require('request');

var base_url = 'https://api.crex24.com/CryptoExchangeService/BotPublic';

function get_summary(coin, exchange, cb) {
var summary = {};
  var req_url = base_url + '/ReturnTicker?request=[NamePairs=' + exchange + '_' + coin + ']';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.Error) {
        return cb(body.Error, null)
      } else {
         //summary['bid'] = body.Tickers[0]['Last'].toFixed(8);
         //summary['ask'] = body.Tickers[0]['AskPrice'].toFixed(8);
         summary['volume'] = body.Tickers[0]['BaseVolume'];
         summary['high'] = body.Tickers[0]['HighPrice'].toFixed(8);
         summary['low'] = body.Tickers[0]['LowPrice'].toFixed(8);
         summary['last'] = body.Tickers[0]['Last'].toFixed(8);
         summary['change'] = body.Tickers[0]['PercentChange'];
         //console.log(summary);
         return cb(null, summary);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/ReturnTradeHistoryPub?request=[PairName=' + exchange + '_' + coin + '],[Count=50]';
  console.log(req_url);
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.Error == null) {
    var tTrades = body.Trades;
            var trades = [];
            for (var i = 0; i < tTrades.length; i++) {
                if (tTrades[i].IsSell){ 
                  tordertype ="Sell"; 
                } else { 
                  tordertype="Buy";
                }
                var Trade = {
                    orderpair: tTrades[i].PairName,
                    ordertype: tordertype,
                    amount: parseFloat(tTrades[i].CoinCount).toFixed(8),
                    price: parseFloat(tTrades[i].CoinPrice).toFixed(8),
                    //  total: parseFloat(tTrades[i].Total).toFixed(8)
                    // Necessary because API will return 0.00 for small volume transactions
                    total: (parseFloat(tTrades[i].CoinCount).toFixed(8) * parseFloat(tTrades[i].CoinPrice)).toFixed(8),
                    timestamp: tTrades[i].DtCreateTS
                }
                trades.push(Trade);
            }
      //console.log(trades);
      return cb (null, trades);
    } else {
      return cb(body.Error, null);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/ReturnOrderBook?request=[PairName='  + exchange + '_' + coin + ']';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.Error == null) {
      var orders = body;
      var buys = [];
      var sells = [];
            if (orders.BuyOrders.length > 0){
                for (var i = 0; i < orders.BuyOrders.length; i++) {
                    var order = {
                        amount: parseFloat(orders.BuyOrders[i].CoinCount).toFixed(8),
                        price: parseFloat(orders.BuyOrders[i].CoinPrice).toFixed(8),
                        //  total: parseFloat(orders.buy[i].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders.BuyOrders[i].CoinCount).toFixed(8) * parseFloat(orders.BuyOrders[i].CoinPrice)).toFixed(8)
                    }
                    buys.push(order);
                }
            }
            if (orders.SellOrders.length > 0) {
                for (var x = 0; x < orders.SellOrders.length; x++) {
                    var order = {
                        amount: parseFloat(orders.SellOrders[x].CoinCount).toFixed(8),
                        price: parseFloat(orders.SellOrders[x].CoinPrice).toFixed(8),
                        //    total: parseFloat(orders.sell[x].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: (parseFloat(orders.SellOrders[x].CoinCount).toFixed(8) * parseFloat(orders.SellOrders[x].CoinPrice)).toFixed(8)
                    }
                    sells.push(order);
                }
            }
            console.log(sells);
            return cb(null, buys, sells);
    } else {
       return cb(body.Error, [], [])
    }
  });
}
module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_orders(coin, exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};