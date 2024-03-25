const express = require('express');
const router = express.Router();
require('dotenv').config();
const cors = require('cors');
router.use(cors());
const { getPointsByAmenity, getRouteByAmenity, createSourcePointByAmenity, getLocationPointByAmenity } = require('../controllers/amenityController');

// Middleware to inject the Neo4j session into the request object
router.use((req, res, next) => {
    req.neo4jSession = req.app.get('neo4jSession');
    next();
  });
/////////////////////////////////////////////////////////
router.get('/:amenity', async (req, res) => {
  const { amenity } = req.params;

  // Appeler le contrôleur approprié en fonction de l'amenity
  switch (amenity) {
      case 'pharmacy':
          return await getPointsByAmenity(req, res, 'pharmacy');
      case 'veterinary':
          return await getPointsByAmenity(req, res, 'veterinary');
      case 'cafe':
          return await getPointsByAmenity(req, res, 'cafe');
      case 'restaurant':
          return await getPointsByAmenity(req, res, 'restaurant');
      case 'clinic':
          return await getPointsByAmenity(req, res, 'clinic');
      case 'school':
          return await getPointsByAmenity(req, res, 'school'); 
      case 'marketplace':
          return await getPointsByAmenity(req, res, 'marketplace');
      case 'doctors':
          return await getPointsByAmenity(req, res, 'doctors');
      case 'fast_food':
          return await getPointsByAmenity(req, res, 'fast_food');
      case 'library':
          return await getPointsByAmenity(req, res, 'library');
      case 'dentist':
          return await getPointsByAmenity(req, res, 'dentist');
      case 'bank':
          return await getPointsByAmenity(req, res, 'bank');
      case 'fuel':
          return await getPointsByAmenity(req, res, 'fuel');
      case 'bureau_de_change':
          return await getPointsByAmenity(req, res, 'bureau_de_change');
      case 'car_wash':
          return await getPointsByAmenity(req, res, 'car_wash');
      case 'driving_school':
          return await getPointsByAmenity(req, res, 'driving_school');
      
      default:
          return res.status(404).json({ error: 'Amenity not found' });
  }
});
//////////////////////////////////////////////////////////////////////////////
router.get('/:amenity/getfinalroute',getRouteByAmenity);
router.post('/:amenity/createSourcePoint',createSourcePointByAmenity);

module.exports = router;