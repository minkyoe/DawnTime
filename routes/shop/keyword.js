const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');


const verify = require('../jwt_verify');

// 인기 키워드, 최근 검색 키워드 조회
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
        } else callback(null,verify_data, connection);
      });
    },

    (verify_data,connection, callback) => {
      let recentQuery = 'SELECT user_keyword' +
                  ' from dawn_time.keyword where keyword.user_id = ? order by keyword.keyword_date desc';

      connection.query(recentQuery,verify_data.user_id, (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("get keyword error : " + err);
        } else{
          callback(null,data,verify_data,connection);
        }
      });
    },
    (data,verify_data,connection,callback) => {
      var keywordList = {};
      var recentArray = []; // 최근 검색 키워드 배열
      var hotArray = []; // 인기 키워드 배열

      for(let j=0; j<data.length; j++){
        recentArray.push(data[j].user_keyword);
      }

      keywordList.recent_keywords = recentArray;

      var hotQuery = 'select user_keyword,count(user_keyword) as coun from keyword group by user_keyword order by coun desc limit 15'

      connection.query(hotQuery,(err,data2) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("post hot keywords error : " + err);
        } else{
          for(let k=0; k<data2.length; k++){
            hotArray.push(data2[k].user_keyword);
          }

          keywordList.hot_keywords = hotArray;

          res.status(201).send({
            status : true,
            message : "successful post keywords list",
            result : keywordList
          });
          connection.release();
        }
      });
    }
  ];
  async.waterfall(taskArray , (err, result)=> {
		if(err) console.log(err);
		else console.log(result);
	});
});












// 최근 검색어 삭제
router.delete('/delete/:user_keyword',(req, res)=>{
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
      let deleteKeywordQuery = 'delete from keyword where user_keyword = ? and user_id = ?';

      connection.query(deleteKeywordQuery,[req.params.user_keyword,verify_data.user_id], (err, data) => {
        if(err){
          res.status(500).send({
            status : false,
            message : "500 Error"
          });
          connection.release();
          callback("delete keyword error : " + err);
        } else{
          res.status(201).send({
            status : true,
            message : "successful delete keyword"
          });
          connection.release();
          callback(null, "successful delete keyword");
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
