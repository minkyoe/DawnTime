const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const numeral = require('numeral');

const verify = require('../jwt_verify');

// 상품 검색
router.post('/:order',(req, res)=>{
  var min_price = parseInt(req.body.min_price);
  var max_price = parseInt(req.body.max_price);
  var real_max = parseInt(req.body.max_price);
  var real_min = parseInt(req.body.min_price);
  var real_keywords;

  let taskArray = [

    (callback) => {
      let verify_data = verify(req.headers.user_token);
      callback(null, verify_data);
    },

    (verify_data,callback) => {
      pool.getConnection((err, connection) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          callback("DB connection err : " + err);
        } else callback(null,verify_data, connection);
      });
    },

    (verify_data,connection, callback) => {
      let realQuery;
      let newQuery = 'select goods.goods_id, goods.goods_name, goods.goods_brand, goods.goods_price, goods.goods_info, goods.goods_image, goods.goods_url' +
                     ' from goods where goods.goods_price >= ? and goods.goods_price <= ? and goods.goods_name LIKE "%"?"%" order by goods.goods_date desc';
      let hotQuery = 'select goods.goods_id, goods.goods_name, goods.goods_brand, goods.goods_price, goods.goods_info, goods.goods_image, goods.goods_url' +
                     ' from goods where goods.goods_price >= ? and goods.goods_price <= ? and goods.goods_name LIKE "%"?"%" order by goods.goods_hit desc';
      let highPriceQuery = 'select goods.goods_id, goods.goods_name, goods.goods_brand, goods.goods_price, goods.goods_info, goods.goods_image, goods.goods_url' +
                           ' from goods where goods.goods_price >= ? and goods.goods_price <= ? and goods.goods_name LIKE "%"?"%" order by goods.goods_price desc';
      let lowPriceQuery = 'select goods.goods_id, goods.goods_name, goods.goods_brand, goods.goods_price, goods.goods_info, goods.goods_image, goods.goods_url' +
                          ' from goods where goods.goods_price >= ? and goods.goods_price <= ? and goods.goods_name LIKE "%"?"%" order by goods.goods_price asc';

      if(req.params.order == 4) realQuery = lowPriceQuery;
      else if(req.params.order == 2) realQuery = hotQuery;
      else if(req.params.order == 3) realQuery = highPriceQuery;
      else realQuery = newQuery;

      if(min_price == -1) {
          min_price = 0;
          real_min = -1;
      }
      if(max_price == -1) {
          max_price = 1000000000000000000000000;
          real_max = -1;
      }

      if(req.body.goods_keyword == "null"){
        real_keywords = "";
      }else{
        real_keywords = req.body.goods_keyword;
      }

      connection.query(realQuery,[min_price,max_price,real_keywords], (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("get search result error : " + err);
        } else{
          callback(null,data,verify_data,connection);
        }
      });
    },

    (data,verify_data,connection,callback) => {
      // 해당 데이터가 있을 때 (예외처리 O)
      if(data.length != 0){

        var searchList = [];
        for(let i = 0; i < data.length; i++){
          var imageJson = JSON.parse(data[i].goods_image).image;
          var imageArray = [];
          for(let j=0; j<imageJson.length; j++){
            imageArray.push(imageJson[j]);
          }
          searchList.push({
            goods_id : data[i].goods_id,
            goods_name : data[i].goods_name,
            goods_brand : data[i].goods_brand,
            goods_price : numeral(data[i].goods_price).format('0,0'),
            goods_image : imageArray[0],
            goods_like : 0
          });
        };
        var userLikeQuery = 'select basket.goods_id from basket where basket.user_id = ? ';
        connection.query(userLikeQuery, verify_data.user_id, (err, data2) => {
          if(err){
            res.status(500).send({
              status : false,
              message : "500 Error"
            });
            connection.release();
            callback("get search result error : " + err);
          } else{
            // 사용자가 찜해놓은 상품 아이디만 담은 배열
            var likeGoodsID = [];
            for(let j=0; j<data2.length; j++){
              likeGoodsID.push(data2[j].goods_id);
            }

            // 해당하는 상품만 goods_like 1로 변환
            for(let k=0; k<searchList.length; k++){
                for(let l=0; l<likeGoodsID.length; l++){
                  if(searchList[k].goods_id == likeGoodsID[l]){
                    searchList[k].goods_like = 1;
                  }
                }
            }
            res.status(201).send({
              status : true,
              message : "successful get search result",
              result : searchList
            });
            callback(null,verify_data,connection);
          }
        });
      }
      // 해당 데이터 없을 때
      else{
        res.status(201).send({
          status : true,
          message : "successful get search result : no data",
          result : {}
        });
        callback(null,verify_data, connection);
      }
    },
    // 검색 결과 값 보내준 뒤, keyword 테이블에 insert
    (verify_data,connection, callback) => {
      if(real_keywords != ""){
        var insertQuery = 'select * from keyword where user_id = ? and user_keyword = ?';
        connection.query(insertQuery, [verify_data.user_id,real_keywords],(err,data3) => {
          if(err){
            connection.release();
            callback("error : "+ err);
          } else{
            // 이미 사용자가 검색한 키워드가 있을시 delete
            if(data3.length != 0){
              var deleteQuery = 'delete from keyword where user_id = ? and user_keyword = ?';
              connection.query(deleteQuery,[verify_data.user_id,real_keywords],(err, data4) =>{
                if(err){
                  connection.release();
                  callback("delete before keyword error : "+ err);
                }else{
                  console.log("delete before keyword");
                }
              });
            }
            // 키워드 insert (최근 검색어 update)
            var insertNewQuery = 'insert into keyword(keyword_id,user_id,user_keyword) values(?,?,?)';
            console.log(real_keywords);
              connection.query(insertNewQuery,[null,verify_data.user_id,real_keywords],(err, data5) =>{
                if(err){
                  connection.release();
                  callback("successful insert keywords error : "+ err);
                } else{
                  connection.release();
                  callback(null, "successful insert keywords");
                }
              });
          }
        });
      }else{
        connection.release();
        callback(null, "successful : has no keywords");
      }

    }
  ];
  async.waterfall(taskArray , (err, result)=> {
		if(err) console.log(err);
		else console.log(result);
	});
});

module.exports = router;
