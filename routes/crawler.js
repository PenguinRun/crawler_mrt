var express = require('express');
var router = express.Router();
var GetData = require('../controllers/catch_mrt_controller')

var getData = new GetData();

/* GET home page. */
router.get('/mrt', getData.getMRT);

module.exports = router;
