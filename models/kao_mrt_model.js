var cheerio = require('cheerio');
var request = require('request');
var async = require('async')
var db = require('./connection_db');

module.exports = class KMRT {
  crawler(path) {
    return new Promise(function(resolve, reject) {

      //先抓取整個捷運站的站名
      var stationValues = [];

      //為了不出現頻繁request而造成的資料缺失的問題，將資料切半做迴圈，並分為1跟2部份。
      var halfStation1 = [];
      var halfStation2 = [];

      function firstFunction(callback) {
        request(path, function(err, res, body) {
          var $ = cheerio.load(body);
          $('option', '#ddlStation1').each(function() {
            var stationValue = $(this).text();
            stationValues.push(stationValue);
          })
          stationValues.splice(0, 1);//去除請選擇
          stationValues.splice(8, 1);//去除重複的美麗島站
          // console.log(stationValues);
          // console.log(stationValues.length);

          //提取前17個站
          for (var i = 0; i < 17; i++) {
            halfStation1.push(stationValues[i]);
          }
          // console.log(halfStation1);
          // console.log(halfStation1.length);

          //提取剩下的20個站
          for (var i = 17; i < stationValues.length; i++) {
            halfStation2.push(stationValues[i]);
          }
          // console.log(halfStation2);
          // console.log(halfStation2.length);

          var viewState = $('#__VIEWSTATE').val();
          var eventValidation = $('#__EVENTVALIDATION').val();
          callback(null, stationValues, halfStation1, halfStation2, viewState, eventValidation);
          // console.log("stationValues: " + stationValues.length);
        })
      }

      async.waterfall([
        firstFunction
      ], function(err, stationValues, halfStation1, halfStation2,viewStateValue, eventValidationValue) {
        if (err) {
          reject(err);
        }
        // var place = "";
        var test = 0;
        // console.log(stationValues);
        // var values =[];

        //這邊需要做手動切換迴圈的動作，先跑halfStation1再跑halfStation2，屆時所有有關halfStation1的地方都要替換。
        for (var i = 0; i < halfStation1.length; i++) {
          for (var j = 0; j < stationValues.length; j++) {
            if (halfStation1[i] != stationValues[j]) {

              // console.log("stationValues[i]: " + stationValues[i]);
              // console.log("stationValues[j]: " + stationValues[j]);
              request.post({
                  headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                  },
                  url: path,
                  form: {
                    'ddlCard': 1,
                    'ddlStation1': halfStation1[i],
                    'ddlStation2': stationValues[j],
                    'button3': '查詢',
                    '__EVENTVALIDATION': eventValidationValue,
                    '__VIEWSTATE': viewStateValue
                  }
                },
                function(err, res, body) {
                  if (body) {
                    var $ = cheerio.load(body);

                    //取得起始站
                    var startStation = $('option[selected="selected"]', '#ddlStation1').text();
                    // console.log("start: " + startStation);

                    //取得終點站
                    var endStation = $('option[selected="selected"]', '#ddlStation2').text();
                    // console.log("end: " + endStation);

                    //取得到達時間
                    var time = $('#lblShipping').text();
                    time = time.substring(0, time.indexOf("分"));
                    // console.log(time);

                    //取得到原始票價
                    var oriMoney = $('#lblTicket').text();
                    oriMoney = oriMoney.substring(0, oriMoney.indexOf("元"));
                    // console.log(oriMoeny);

                    //取得一般票價
                    var normalMoney = $('#lblTicket1').text();
                    normalMoney = normalMoney.substring(0, normalMoney.indexOf("元"));
                    // console.log(normalMoney);

                    //取得學生票價
                    var studentMoney = $('#lblTicket3').text();
                    studentMoney = studentMoney.substring(0, studentMoney.indexOf("元"));
                    // console.log(studentMoney);

                    //取得到社福票價
                    var welfareMoney = $('#lblTicket2').text();
                    welfareMoney = welfareMoney.substring(0, welfareMoney.indexOf("元"));
                    // console.log(welfareMoney);

                    var values = {};
                    values = {
                        start_station: startStation,
                        end_station: endStation,
                        arrive_time: time,
                        ori_money: oriMoney,
                        normal_money: normalMoney,
                        student_money: studentMoney,
                        welfare_money: welfareMoney
                      }
                      // console.log(values);

                      //輸入資料庫
                      db.query('INSERT INTO kao_mrt SET ?', values, function(err, rows) {
                        if (err) {
                          console.log(err);
                        }
                      })
                  } else {
                    //防止因為有TypeError: Cannot read property 'parent' of null，而讓程式中斷的問題。
                    test = test + 1;
                    console.log("err" + test);
                  }
                })
            }
          }
        }

      });
      console.log("hi");

      resolve("hello");
    });

  }
}
