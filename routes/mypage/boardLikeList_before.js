// const express = require('express');
// const router = express.Router();
// const async = require('async');
// const pool = require('../../config/dbPool');
//
// const verify = require('../jwt_verify');
//
// // 스크랩 목록 조회
// router.get('/',(req, res)=>{
//   let taskArray = [
//     (callback) => {
//       let verify_data = verify(req.headers.user_token);
//       callback(null, verify_data);
//     },
//
//     (verify_data,callback) => {
//       pool.getConnection((err, connection) => {
//         if(err){
//           res.status(500).send({
//             status : false,
//             message : "500 Error"
//           });
//           callback("DB connection err : " + err);
//         } else callback(null, verify_data,connection);
//       });
//     },
//
//     (verify_data,connection, callback) => {
//       let likeIDQuery = 'select board_id from like where user_id = ?';
//       connection.query(likeIDQuery,verify_data.user_id, (err, data) => {
//         if(err){
//           res.status(500).send({
//             status : false,
//             message : "500 Error"
//           });
//           connection.release();
//           callback("get scrap ID error : " + err);
//         } else{
//           let likeID = [];
//           for(let i=0; i<data.length; i++){
//             likeID.push(data[i].board_id);
//           }
//           callback(null,likeID,verify_data,connection);
//         }
//       });
//     },
//     (verify_data,likeID,connection,callback) => {
//       var myLikeQuery = 'select * from community where board_id in (?)';
//       connection.query(myLikeQuery, [likeID], (err, data) => {
//         if(err){
//           res.status(500).send({
//             status : false,
//             message : "500 Error"
//           });
//           connection.release();
//           callback("get my scrap list error : " + err);
//         } else{
//           var myScrap = [];
//           for(let j=0; j<data.length; j++){
//             myScrap.push({
//               board_id: data[j].board_id,
//               board_title: data[j].board_title,
//               board_content: data[j].board_content,
//               board_tag: data[j].board_tag,
//               board_image: JSON.parse(data[j].board_image)[0],
//               board_like: data[j].board_like,
//               scrap_count: 0,
//               com_count: 0,
//               user_like: false,
//               user_scrap: false
//             });
//           }
//
//           var userScrapQuery = 'select board_id,count(board_id) as coun from scrap group by board_id';
//           connection.query(userScrapQuery,  (err, data2) => {
//             if(err){
//               res.status(500).send({
//                 status : false,
//                 message : "500 Error"
//               });
//               connection.release();
//               callback("get scrap count : " + err);
//             } else{
//
//               // 해당하는 글의 스크랩 수 변경
//               for(let k=0; k<myScrap.length; k++){
//                   for(let l=0; l<data2.length; l++){
//                     if(myScrap[k].board_id == data2[l].board_id){
//                       myScrap[k].scrap_count = data2[l].coun;
//                     }
//                   }
//               }
//               callback(null,myScrap,verify_data,connection);
//             }
//           });
//         }
//       });
//     },
//     (myScrap,verify_data,connection,callback) => {
//       var userComQuery = 'select board_id,count(com_id) as coun from comment group by board_id';
//       connection.query(userComQuery, (err, data3) => {
//         if(err){
//           res.status(500).send({
//             status : false,
//             message : "500 Error"
//           });
//           connection.release();
//           callback("get comment count error : " + err);
//         } else{
//           // 해당하는 글의 댓글 수 변경
//           for(let k=0; k<myScrap.length; k++){
//               for(let l=0; l<data3.length; l++){
//                 if(myScrap[k].board_id == data3[l].board_id){
//                   myScrap[k].com_count = data3[l].coun;
//                 }
//               }
//           }
//         }
//       });
//     },
//     (myScrap,verify_data,connection,callback) => {
//       var userLikeQuery = 'select board_id from like where like.user_id = ?';
//       connection.query(userLikeQuery, verify_data.user_id, (err, data4) => {
//         if(err){
//           res.status(500).send({
//             status : false,
//             message : "500 Error"
//           });
//           connection.release();
//           callback("get user like error : " + err);
//         } else{
//           // 사용자가 스크랩 해 놓은 게시글 아이디만 담은 배열
//           var likeBoardsID = [];
//           for(let j=0; j<data4.length; j++){
//             likeBoardsID.push(data4[j].board_id);
//           }
//
//           // 해당하는 게시글만 user_like true로 변환
//           for(let k=0; k<myScrap.length; k++){
//               for(let l=0; l<likeBoardsID.length; l++){
//                 if(myScrap[k].board_id == likeBoardsID[l]){
//                   myScrap[k].user_like = true;
//                 }
//               }
//           }
//           res.status(201).send({
//             status : true,
//             message : "successful get my scrap list",
//             result : myScrap
//           });
//           connection.release();
//           callback(null,"successful get my scrap list");
//         }
//       });
//     }
//   ];
//   async.waterfall(taskArray , (err, result)=> {
// 		if(err) console.log(err);
// 		else console.log(result);
// 	});
// });
//
// module.exports = router;
