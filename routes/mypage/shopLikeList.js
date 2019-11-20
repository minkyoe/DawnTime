const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');

const verify = require('../jwt_verify');


// 상품 찜목록 조회
router.get('/',(req, res)=>{
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
        } else callback(null, verify_data,connection);
      });
    },

    (verify_data,connection, callback) => {
      let likeIDQuery = 'select goods_id from basket where basket.user_id = ?';

      connection.query(likeIDQuery,verify_data.user_id, (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("get like goods ID error : " + err);
        } else{
          let goodsID = [];
          for(let i=0; i<data.length; i++){
            goodsID.push(data[i].goods_id);
          }
          callback(null,goodsID,verify_data,connection);
        }
      });
    },
    (goodsID,verify_data,connection,callback) => {
      var myGoodsQuery = 'select * from goods where goods.goods_id in (?)';
      connection.query(myGoodsQuery, [goodsID], (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("get my goods list error : " + err);
        } else{

          var myGoods = [];
          for(let j=0; j<data.length; j++){
            myGoods.push({
              goods_id: data[j].goods_id,
              goods_name: data[j].goods_name,
              goods_brand: data[j].goods_brand,
              goods_price: data[j].goods_price,
              goods_image: JSON.parse(data[j].goods_image).image[0],
              goods_like: 1
            });
          }

          res.status(201).send({
            status : true,
            message : "successful get my goods list",
            result : myGoods
          });
          connection.release();
          callback(null, "successful get my goods list");
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
