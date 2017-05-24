var MRT = require('../models/catch_mrt_model');
var KMRT = require('../models/kao_mrt_model');

module.exports = class GetData {
  getMRT(req, res, next) {
    var mrt = new MRT();
    var path = "http://web.metro.taipei/c/TicketALLresult.asp";
    mrt.crawler(path).then(
      function(body) {
        res.json({
          result: body
        })
      }
    ).catch(function(err) {
      res.json({
        err: err
      })
    })
  }
  getKaoMRT(req, res, next) {
    var kmrt = new KMRT();
    var path = "http://www.krtco.com.tw/searchTicket.aspx?TYPE=PC";
    kmrt.crawler(path).then(
      function(body) {
        res.json({
          result: body
        })
      }
    ).catch(function(err){
      res.json({
        err: err
      })
    })
  }
}
