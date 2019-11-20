const express = require('express');
const router = express.Router();

const shopLikeList = require('./shopLikeList');
const boardScrapList = require('./boardScrapList');
const blind = require('./blind');

router.use('/shopLikeList', shopLikeList);
router.use('/boardScrapList', boardScrapList);
router.use('/blind', blind);

module.exports = router;
