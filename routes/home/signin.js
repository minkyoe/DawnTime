const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');

const jwt = require('jsonwebtoken');
const constants = require('../constants');


// 로그인
router.post('/',(req, res)=>{
  let option = {
    algorithm : "HS512",
    expiresIn : 3600 * 24 * 1 // 하루! (앱잼기간 중엔 길게 늘여놓기)
  }

  let taskArray = [
    (callback) => {
      pool.getConnection((err, connection) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          callback("DB connection err : " + err);
        } else callback(null, connection);
      });
    },
    (connection,callback) => {
      var postIDQuery = 'select * from user where user_email = ? and user_uid = ?';
      connection.query(postIDQuery, [req.body.user_email,req.body.user_uid], (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 error"
          });
          connection.release();
          callback("sign in error : " + err);
        } else{
          callback(null, data, connection);
        }
      });
    },
    (data, connection, callback) => {
      let signinQuery = 'insert into user values(?,?,?,?)';
      // 데이터가 없을 시 (새로 로그인하는 회원일 시) => 새로 DB에 insert 후, 정보 보내주기
      if(data.length == 0){
        connection.query(signinQuery, [null,req.body.user_email,0,req.body.user_uid],(err, data2) => {
          if(err){
            res.status(500).send({
              status : false,
              message : "500 error"
            });
            connection.release();
            callback("sign in error : " + err);
          } else{
            callback(null,connection);
          }
        });
      }else{ // 재로그인 시 => DB에 있는 정보 보내주기
        callback(null,connection);
      }
    },
    (connection, callback) => {
      let selectUserQuery = 'select * from user where user_email = ? and user_uid = ?';
      connection.query(selectUserQuery, [req.body.user_email,req.body.user_uid], (err, data3) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 error"
          });
          connection.release();
          callback("sign in error : " + err);
        } else{

          var userInfo = {};
          userInfo.user_id = data3[0].user_id;
          userInfo.user_email = data3[0].user_email;
          userInfo.user_blind = data3[0].user_blind;
          
          let payload = {
            user_id : data3[0].user_id,
            user_email : req.body.user_email,
            user_uid : req.body.user_uid
          };

          // 로그인 할 때마다 jwt token 새로 발급
          jwt.sign(payload, req.app.get('secret'), option , (err,token)=>{
            if(err){
              res.status(500).send({
                status : false,
                message : "500 error"
              });
              connection.release();
              callback("get jwt token error : " + err);
            }else{
              userInfo.user_token = token;
              res.status(201).send({
                status : true,
                message : "successful sign in",
                result : userInfo
              });
              connection.release();
              callback(null,"successful insert user");
            }
          });
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
