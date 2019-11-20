const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const numeral = require('numeral');

const verify = require('../jwt_verify');

// 상품 상세보기
router.get('/:goods_id',(req, res)=>{
  let taskArray = [

    (callback) => {
      let verify_data = verify(req.headers.user_token);
      callback(null, verify_data);
    },


    (verify_data, callback) => {
      pool.getConnection((err, connection) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          callback("DB connection err : " + err);
        } else{
           callback(null,verify_data, connection);
        }
      });
    },

    (verify_data,connection, callback) => {
      let goodsDetailQuery = 'select goods.goods_id, goods.goods_name, goods.goods_brand, goods.goods_price, goods.goods_info, goods.goods_image, goods.goods_url' +
                          ' from goods where goods.goods_id = ?';

      connection.query(goodsDetailQuery,req.params.goods_id, (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("get goods detail error : " + err);
        } else{
          callback(null,data,verify_data,connection);
        }
      });
    },
    (data,verify_data,connection,callback) => {
      if(data.length != 0){
        var imageJson = JSON.parse(data[0].goods_image).image;
        var imageArray = [];

        for(let i=0; i<imageJson.length; i++){
          imageArray.push(imageJson[i]);
        }
        var goodsDetail = {};
        goodsDetail.goods_id = data[0].goods_id;
        goodsDetail.goods_name = data[0].goods_name;
        goodsDetail.goods_brand = data[0].goods_brand;
        goodsDetail.goods_price = numeral(data[0].goods_price).format('0,0');
        goodsDetail.goods_info = data[0].goods_info;
        goodsDetail.goods_images = imageArray;
        goodsDetail.goods_url = data[0].goods_url;
        goodsDetail.goods_like = 0;

        var userLikeQuery = 'select * from basket where basket.user_id = ? and basket.goods_id = ? ';
        connection.query(userLikeQuery, [verify_data.user_id,req.params.goods_id], (err, data2) => {
          if(err){
            res.status(500).send({
              status : false,
              message : "500 Error"
            });
            connection.release();
            callback("get goods detail error : " + err);
          } else{
            if(data2.length != 0){
              goodsDetail.goods_like = 1;
            }
            res.status(201).send({
              status : true,
              message : "successful get goods detail",
              result : goodsDetail
            });
            // connection.release();
            // callback(null, "successful get goods detail");
            callback(null,connection);
          }
        });
      }else{
        res.status(201).send({
          status : true,
          message : "no goods exists"
        });
      }
    },
    (connection,callback) => {
      let hitUpdateQuery = 'update goods set goods_hit = goods_hit + 1  where goods_id = ?';

      connection.query(hitUpdateQuery,req.params.goods_id, (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("update goods hit error : " + err);
        } else{
          connection.release();
          callback(null,"successful update goods hit");
        }
      });
    }
  ];
  async.waterfall(taskArray , (err, result)=> {
      if(err) console.log(err);
      else console.log(result);
   });
});

module.exports = router;
