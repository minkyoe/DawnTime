const express = require('express');
const router = express.Router();

const shop = require('./shop/index');
const mypage = require('./mypage/index');
const home = require('./home/index');
const board = require('./board/index');

router.use('/shop', shop);
router.use('/mypage', mypage);
router.use('/home', home);
router.use('/board', board);

module.exports = router;
