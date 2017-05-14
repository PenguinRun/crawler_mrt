var MRT = require('../models/catch_mrt_model');

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
}
