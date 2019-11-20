const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');

const verify = require('../jwt_verify');

// 게시글 좋아요, 좋아요 해제
router.put('/:board_id', (req, res) => {
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

      (verify_data,connection, callback) => {
        var likeQuery = 'select * from dawn_time.like where board_id =? and user_id= ?';
        connection.query(likeQuery, [req.params.board_id,verify_data.user_id], (err, data) => {
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
        	var insertLikeQuery = "insert into dawn_time.like values(?,?,?)";
          var deleteLikeQuery = "delete from dawn_time.like where user_id =? and board_id= ?";
          if(data.length==0){
          connection.query(insertLikeQuery, [null,verify_data.user_id,req.params.board_id], (err) => {
    				if(err){
    					res.status(500).send({
    						status : false,
    						message : "DB connection err"
    					});
    					connection.release();
    					callback("like error : "+ err);
    				} else{
    					res.status(201).send({
    						status : true,
    						message : "successful like"
    					});
    					connection.release();
    					callback(null, "successful like");
    				}
    			});
        }else{
          connection.query(deleteLikeQuery, [verify_data.user_id,req.params.board_id], (err) => {
    				if(err){
    					res.status(500).send({
    						status : false,
    						message : "DB connection err"
    					});
    					connection.release();
    					callback("unlike err : "+ err);
    				} else{
    					res.status(201).send({
    						status : true,
    						message : "successful unlike"
    					});
    					connection.release();
    					callback(null, "successful unlike");
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
