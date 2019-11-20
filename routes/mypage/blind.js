const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');

const verify = require('../jwt_verify');

// 블라인드 설정, 해제
router.put('/', (req, res) => {
  	var taskArray = [

      (callback) => {
        let verify_data = verify(req.headers.user_token);
        callback(null, verify_data);
      },

  		(verify_data,callback) => {
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
      (verify_data,connection, callback) => {
        var blindQuery = 'select * from user where user.user_id= ?';
        connection.query(blindQuery, verify_data.user_id, (err, data) => {
          if(err){
            res.status(500).send({
              status : false,
              message : "500 Error"
            });
            connection.release();
            callback("DB connection err : "+ err);
          } else{
            callback(null,data,verify_data,connection);
          }
        });
      },
  		(data,verify_data,connection,callback) => {
          var blindQuery = 'update user set user_blind = ? where user_id = ?';
          // 해당 사용자가 없을 시
          if(data.length == 0){
            res.status(500).send({
              status : false,
              message : "no user exists"
            });
            connection.release();
            callback("no user exists");
          }
          // 해당 사용자가 있을 시
          else{
            if(data[0].user_blind==0){
              connection.query(blindQuery, [1,verify_data.user_id], (err) => {
                if(err){
                 res.status(500).send({
                   status : false,
                   message : "500 Error"
                });
                connection.release();
                callback("blind set error : "+ err);
               }else{
                res.status(201).send({
                  status : true,
                  message : "successful blind set"
                });
                connection.release();
                callback(null, "successful blind set");
              }
            });
          }
          else{
            connection.query(blindQuery, [0,verify_data.user_id], (err) => {
              if(err){
                res.status(500).send({
                  status : false,
                  message : "DB connection err"
                });
                connection.release();
                callback("blind set err : "+ err);
              } else{
                res.status(201).send({
                  status : true,
                  message : "successful blind set"
                });
                connection.release();
                callback(null, "successful blind set");
              }
            });
          }
        }
  		}
  	];
  	async.waterfall(taskArray, (err, result) => {
  		if(err) console.log(err);
  		else console.log(result);
  	});
});


module.exports = router;
