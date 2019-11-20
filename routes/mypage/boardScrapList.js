const express = require('express');
const router = express.Router();
const async = require('async');
const pool = require('../../config/dbPool');
const crypto=require('crypto');
const verify = require('../jwt_verify');

// 스크랩 목록 조회
router.get('/', (req, res) => {
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
                  status : false,
                  msg : "fail"
               });
               callback("connection err : " + err);
            } else callback(null, verify_data, connection);
         });
      },
      //2. 전체 리스트 출력
      (verify_data, connection, callback) => {
      let com_count=0;
      let scrap_count=0;
      let selectAtdQuery = "select b.*, comment_count, scrap_count, ll.user_id as like_id, ssc.user_id as scrap_id,llk.like_count from dawn_time.community as b "+
"left outer join (select c.board_id, count(c.board_id) as comment_count from dawn_time.comment as c  group by c.board_id) as cc on (b.board_id=cc.board_id) "+
"left outer join (select s.board_id, count(s.board_id) as scrap_count from dawn_time.scrap as s  group by s.board_id) as ss on (b.board_id=ss.board_id) "+
"left outer join (select lk.board_id, count(lk.board_id) as like_count from dawn_time.like as lk  group by lk.board_id) as llk on (b.board_id=llk.board_id) "+
"left outer join (select l.board_id, l.user_id from dawn_time.like as l where user_id=?) as ll on(b.board_id=ll.board_id) "+
"left outer join (select sc.board_id, sc.user_id from dawn_time.scrap as sc where user_id =?) as ssc on(b.board_id=ssc.board_id) "+
"where ssc.user_id = ? order by  b.board_date desc";
         connection.query(selectAtdQuery, [Number(verify_data.user_id),Number(verify_data.user_id),Number(verify_data.user_id)], (err, data) => {
            if(err){
               res.status(500).send({
                  stat : "fail",
                  msg : "fail reason"
               });
               connection.release();
               callback("fail reason: "+ err);
            } else{
               let pack=[];
               let like=true;
               let scrap=true;
               let image, com_count, scrap_count,board_like, real_image;
               for(i=0;i<data.length;i++){
                  if(data[i].like_id===null){
                     like=false;
                  }else{
                     like=true;
                  }
                  if(data[i].scrap_id===null){
                     scrap=false;
                  }else{
                     scrap=true;
                  }
                  if(data[i].like_count===null){
                     board_like=0;
                  }else{
                     board_like=Number(data[i].like_count);
                  }
                  if(data[i].comment_count===null){
                     com_count=0;
                  }else{
                     com_count=Number(data[i].comment_count);
                  }
                  if(data[i].scrap_count===null){
                     scrap_count=0;
                  }else{
                     scrap_count=Number(data[i].scrap_count);
                  }
                  if(data[i].board_image===null){
                    real_image = null;
                  }else{
                    image=JSON.parse(data[i].board_image);
                    real_image = image[0];
                  }
               pack[i]={
                  board_id : data[i].board_id,
                  board_title : data[i].board_title,
                  board_tag: data[i].board_tag,
                  board_content: data[i].board_content,
                  board_image: real_image,
                  board_like: board_like,
                  com_count: com_count,
                  scrap_count: scrap_count,
                  user_like: like,
                  user_scrap: scrap
               };
            }
            res.status(200).send({
               status: true,
               message:"success",
               result : pack
            });
            connection.release();
               callback(null,"bestList success");
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
