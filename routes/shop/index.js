const express = require('express');
const router = express.Router();

const best = require('./best');
const newList = require('./new');
const category = require('./category');
const brand = require('./brand');
const detail = require('./detail');
const search = require('./search');
const keyword = require('./keyword');
const like = require('./like');

router.use('/best', best);
router.use('/new', newList);
router.use('/category', category);
router.use('/brand', brand);
router.use('/detail', detail);
router.use('/search', search);
router.use('/keyword', keyword);
router.use('/like', like);

module.exports = router;
