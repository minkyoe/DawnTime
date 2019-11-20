const express = require('express');
const router = express.Router();

const signin = require('./signin');

router.use('/signin', signin);

module.exports = router;
