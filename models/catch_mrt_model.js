var cheerio = require('cheerio');
var request = require('request');
var async = require('async')
var db = require('./connection_db');

module.exports = class MRT {
  crawler(path) {
    return new Promise((resolve, reject) => {

      //先抓取整個捷運站的站名
      var stationValues = [];

      function firstFunction(callback) {
        request(path, function(err, res, body) {
          var $ = cheerio.load(body);
          $('body option').each(function() {
            var stationValue = $(this).val();
            stationValues.push(stationValue);
          })
          callback(null, stationValues);
          // console.log("stationValues: " + stationValues.length);
        })
      }

      async.waterfall([
        firstFunction
      ], function(err, result) {
        if (err) {
          reject(err);
        }
        //從每個站名當起始去抓到每個站之間的時間, 金錢...之類
        for (var temp = 0; temp < result.length; temp++) {
          request.post({
              headers: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              url: path,
              // body: 's2elect=BR05-015&submit=確定'
              body: 's2elect=' + result[temp] + '&submit=確定'
            },
            function(err, res, body) {
              // console.log("tmep :" + temp);
              // console.log("testing: " + stationValues[2]);
              if (err) {
                reject(err)
              } else {
                var $ = cheerio.load(body);
                var title = $('head meta[name=Title]').attr('content');
                // var startStation = $('body td[width="20%"] font[size=-1]').text();
                //錢的部份(包括原價、8折、4折)
                var moneyList = [];
                var money = "";
                $('body td[width="15%"] font[size=-1]').each(function() {
                  money = $(this).eq(0).text();
                  moneyList.push(money);
                });
                //站名的部份（包括起站及到站）
                var station = "";
                var stations = [];
                $('body td[width="20%"] font[size=-1]').each(function() {
                    station = $(this).text();
                    stations.push(station);
                  })
                  //到站時間
                var time = "";
                var times = [];
                $('body td[width="14%"] font[size=-1]').each(function() {
                  time = $(this).text();
                  times.push(time);
                })

                var startStation = [];
                var endStation = [];

                //起始站
                for (var i = 0; i < stations.length; i = i + 2) {
                  startStation.push(stations[i]);
                }
                // console.log("startStation: " + startStation.length);

                //到達站
                for (var j = 1; j < stations.length; j = j + 2) {
                  endStation.push(stations[j]);
                }
                // console.log("endStation: " + endStation.length);

                var oriMoney = [];
                var off8Money = [];
                var off4Money = [];

                //原價
                for (var i = 0; i < moneyList.length; i = i + 3) {
                  oriMoney.push(moneyList[i]);
                }

                // console.log("oriMoney: " + oriMoney.length);

                //8折
                for (var j = 1; j < moneyList.length; j = j + 3) {
                  off8Money.push(moneyList[j]);
                }

                // console.log("off8Money: " + off8Money.length);

                //4折
                for (var k = 2; k < moneyList.length; k = k + 3) {
                  off4Money.push(moneyList[k]);
                }

                // console.log("off4Money: " + off4Money.length);

                // console.log("arriveTime: " + times.length);


                //重整成輸入database table的資料串
                //values = [[startStation, endStation, oriMoney, off8Money, off4Money, arriveTime],...]

                var values = [];

                for (var i = 0; i < 120; i++) {
                  values.push([startStation[i], endStation[i], oriMoney[i], off8Money[i], off4Money[i], times[i]]);
                }
                // console.log(values);

                db.query('INSERT INTO taipei_mrt (start_station, end_station, ori_money, off80_money, off40_money, arrive_time) VALUES ?', [values], function(err, rows) {
                    if (err) {
                      console.log(err);
                    }
                  })

              }
            })
        }
      })

      resolve("成功");

    })
  }
}

//參考：http://stackoverflow.com/questions/38780642/nodejs-request-post-method-issue
