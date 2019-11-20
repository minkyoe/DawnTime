const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');

const verify = require('../jwt_verify');

// 찜 등록,삭제
router.put('/:goods_id', (req, res) => {
  	var taskArray = [

      (callback) => {
        let verify_data = verify(req.headers.user_token);
        callback(null, verify_data);
      },

  		(verify_data, callback) => {
  			pool.getConnection((err, connection) => {
  				if(err){
  					res.status(500).send({
  						status : false,
  						message : "DB connection error"
  					});
  					callback("DB connection err : "+ err);
  				} else callback(null,verify_data,connection);
  			});
  		},
      (verify_data, connection, callback) => {
        var likeQuery = 'select * from basket where goods_id =? and user_id= ?';
        connection.query(likeQuery, [req.params.goods_id,verify_data.user_id], (err, data) => {
          if(err){
            res.status(500).send({
              status : false,
              message : "DB connection error"
            });
            connection.release();
            callback("DB connection err : "+ err);
          } else{
            callback(null,data,verify_data,connection);
          }
        });
      },
  		(data,verify_data,connection,callback) => {
        	var insertLikeQuery = "insert into basket values(?,?,?)";
          var deleteLikeQuery = "delete from basket where goods_id =? and user_id= ?";
          if(data.length==0){
          connection.query(insertLikeQuery, [null,req.params.goods_id,verify_data.user_id], (err) => {
    				if(err){
    					res.status(500).send({
    						status : false,
    						message : "DB connection err"
    					});
    					connection.release();
    					callback("regist basket error : "+ err);
    				} else{
    					res.status(201).send({
    						status : true,
    						message : "successful regist basket"
    					});
    					connection.release();
    					callback(null, "successful resist basket");
    				}
    			});
        }else{
          connection.query(deleteLikeQuery, [req.params.goods_id,verify_data.user_id], (err) => {
    				if(err){
    					res.status(500).send({
    						status : false,
    						message : "DB connection err"
    					});
    					connection.release();
    					callback("delete basket err : "+ err);
    				} else{
    					res.status(201).send({
    						status : true,
    						message : "successful delete basket"
    					});
    					connection.release();
    					callback(null, "successful delete basket");
    				}
    			});
        }
  		}
  	];
  	async.waterfall(taskArray, (err, result) => {
  		if(err) console.log(err);
  		else console.log(result);
  	});
});


module.exports = router;
