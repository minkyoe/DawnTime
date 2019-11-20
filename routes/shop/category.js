const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const numeral = require('numeral');

const verify = require('../jwt_verify');

// Category 리스트 조회
router.get('/:goods_category/:order',(req, res)=>{
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
        } else callback(null, verify_data, connection);
      });
    },

    (verify_data, connection, callback) => {
      let realQuery;
      let newQuery = 'select goods.goods_id, goods.goods_name, goods.goods_price, goods.goods_brand, goods.goods_image' +
                     ' from goods where goods.goods_category = ? order by goods.goods_date desc';
      let hotQuery = 'select goods.goods_id, goods.goods_name, goods.goods_price, goods.goods_brand, goods.goods_image' +
                     ' from goods where goods.goods_category = ? order by goods.goods_hit desc';
      let highPriceQuery = 'select goods.goods_id, goods.goods_name, goods.goods_price, goods.goods_brand, goods.goods_image' +
                           ' from goods where goods.goods_category = ? order by goods.goods_price desc';
      let lowPriceQuery = 'select goods.goods_id, goods.goods_name, goods.goods_price, goods.goods_brand, goods.goods_image' +
                          ' from goods where goods.goods_category = ? order by goods.goods_price asc';

      if(req.params.order == 4) realQuery = lowPriceQuery;
      else if(req.params.order == 2) realQuery = hotQuery;
      else if(req.params.order == 3) realQuery = highPriceQuery;
      else realQuery = newQuery;

      connection.query(realQuery,req.params.goods_category, (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 error"
          });
          connection.release();
          callback("get category list error : " + err);
        } else{
          callback(null,data, verify_data,connection);
        }
      });
    },
    (data, verify_data,connection,callback) => {
      var categoryList = [];
      for(let i = 0; i < data.length; i++){
        categoryList.push({
          goods_id : data[i].goods_id,
          goods_name : data[i].goods_name,
          goods_price : numeral(data[i].goods_price).format('0,0'),
          goods_brand : data[i].goods_brand,
          goods_image : JSON.parse(data[i].goods_image).image[0],
          goods_like : 0
        });
      };

      var userLikeQuery = 'select basket.goods_id from basket where basket.user_id = ? ';
      connection.query(userLikeQuery, verify_data.user_id, (err, data2) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 error"
          });
          connection.release();
          callback("get category list error : " + err);
        } else{
          // 사용자가 찜해놓은 상품 아이디만 담은 배열
          var likeGoodsID = [];
          for(let j=0; j<data2.length; j++){
            likeGoodsID.push(data2[j].goods_id);
          }

          // 해당하는 상품만 goods_like 1로 변환
          for(let k=0; k<categoryList.length; k++){
              for(let l=0; l<likeGoodsID.length; l++){
                if(categoryList[k].goods_id == likeGoodsID[l]){
                  categoryList[k].goods_like = 1;
                }
              }
          }
          res.status(201).send({
            status : true,
            message : "successful get category list",
            result : categoryList
          });
          connection.release();
          callback(null, "successful get category list");
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
