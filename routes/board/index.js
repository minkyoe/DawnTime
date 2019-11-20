const express = require('express');
const router = express.Router();

const like = require('./like');
const comment = require('./comment');

router.use('/like', like);
router.use('/comment', comment);

module.exports = router;
