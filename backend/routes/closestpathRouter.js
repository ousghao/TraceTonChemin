const express = require('express');
const router = express.Router();
require('dotenv').config();
const cors = require('cors');
router.use(cors());
const {getPoints} = require('../controllers/closestpathController')
const {getfinalroute} = require('../controllers/closestpathController')
const { createSourcePoint } = require('../controllers/closestpathController');
const { getLocationPoint } = require('../controllers/closestpathController');

// Middleware to inject the Neo4j session into the request object
router.use((req, res, next) => {
    req.neo4jSession = req.app.get('neo4jSession');
    next();
  });

router.get('/getpoints', getPoints);
router.get('/getfinalroute',getfinalroute);
router.post('/createSourcePoint', createSourcePoint);
//router.get('/getlocationpoint', getLocationPoint);







module.exports = router;