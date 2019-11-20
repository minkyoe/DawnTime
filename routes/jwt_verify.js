const jwt = require('jsonwebtoken');
const key = require('../config/secret');
const constants = require('../routes/constants');

module.exports = function(token){
  var real_data;
  jwt.verify(token, key.secret, (err,data) => {
    if(err){
      if(err.message === 'jwt expired'){
        console.log(constants.EXP);
        real_data = 0;
      }
      else if(err.message === 'invalid token'){
        console.log(constants.INV);
        real_data = 0;
      }
      else{
        console.log(err.message);
      }
    }
    else{
      real_data = data;
    }
  });
  return real_data;
}
