const mysql = require('mysql');
const dbConfig = {
	host : 'minkyoe.csxcydste5tf.ap-northeast-2.rds.amazonaws.com',
	port : 3306,
	user : 'minkyoe',
	password : '31rodtns',
	database : 'week5_hw',
	connectionLimit : 10
};

module.exports = mysql.createPool(dbConfig);
