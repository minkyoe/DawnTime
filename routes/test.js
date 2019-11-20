const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto=require('crypto');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
aws.config.loadFromPath('../config/aws_config.json');
const verify = require('../jwt_verify');

const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'jiyoon1217',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

//전체목록조회----------localhost:3000/board/list-------------
router.post('/',upload.array('image',5), (req, res) => {
  let com=[];
	let taskArray = [
    (callback) => {
      let verify_data = verify(req.headers.user_token);
      callback(null, verify_data);
    },

		//1. connection을 pool로부터 가져옴
		(verify_data, callback) => {
			pool.getConnection((err, connection) => {
				if(err){
					res.status(500).send({
						stat : "fail",
						msg : "fail reason"
					});
					callback("fail reason : " + err);
				} else callback(null, verify_data, connection);
			});
		},
		//2. 전체 리스트 출력
		(verify_data, connection, callback) => {
      let com_count=0;
      let scrap_count=0;
      let board_id=0;
      let  board_title= req.body.board_title;
      let  board_content =req.body.board_content;
      let   board_tag= req.body.board_tag;
      let   user_id=Number(verify_data.user_id);
      let image=new Array();
      let aaaa= req.files;
      for(let i=0; i<req.files.length; ++i){
        image[i]=req.files[i].location;
      }
      let board_image=  JSON.stringify(image);

			let selectAtdQuery = 'insert into community(board_title, board_content, board_tag, board_image, user_id) values(?, ?, ?, ?, ?)';
			connection.query(selectAtdQuery,[board_title, board_content, board_tag, board_image, user_id] , (err, data) => {
				if(err){
					res.status(500).send({
						stat : "fail",
						msg : "fail reason"
					});
					connection.release();
					callback("fail reason: "+ err);
				} else{
          res.status(200).send({
            status:'success',
						msg:"successful",
					});
          connection.release();
          callback(null, "successful write");
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
