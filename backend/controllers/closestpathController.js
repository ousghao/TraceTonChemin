const express = require('express');
require('dotenv').config();

const neo4j = require('neo4j-driver');

const getPoints = async (req, res) => {
  const fetchIntersectionsQuery = `
      MATCH (p:Point)
      WITH p LIMIT 100
      RETURN {
          name: coalesce(p.name, ""),
          amenity: coalesce(p.amenity, ""),
          shop: coalesce(p.shop, ""),
          addr_street: coalesce(p.addr_street, ""),
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          osmid: id(p)
      } AS poi
  `;

  // Include logic to fetch user's location if available
  const userLocationQuery = `
      MATCH (p:Point { amenity: 'My Location' })
      RETURN {
          name: coalesce(p.name, ""),
          amenity: coalesce(p.amenity, ""),
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          osmid: id(p)
      } AS userLocation
  `;

  const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', '00000000')
  );

  const session = driver.session({ defaultAccessMode: neo4j.session.READ });

  try {
      const result = await session.run(fetchIntersectionsQuery);
      const points = result.records.map((record) => record.get('poi'));

      // Fetch user's location if available
      const userLocationResult = await session.run(userLocationQuery);
      const userLocation = userLocationResult.records.map((record) => record.get('userLocation'))[0];

      // Combine user's location with other points
      const allPoints = userLocation ? points.concat(userLocation) : points;

      res.json({ points: allPoints });
  } catch (error) {
      console.error('Error executing Neo4j query:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      session.close();
  }
};


///////////////////////////////////////////////////////////////////////



const getfinalroute = async (req, res) => {
  const { source, dest } = req.query;

  const routeQuery = `
    MATCH (to:Point)-[:NEAREST_INTERSECTION]->(target:Intersection)
    WHERE id(to) = toInteger($dest)
    MATCH (from:Point)-[:NEAREST_INTERSECTION]->(source:Intersection)
    WHERE id(from) = toInteger($source)
    CALL apoc.algo.dijkstra(source, target, 'ROAD_SEGMENT', 'length')
    YIELD path, weight
    RETURN [n in nodes(path) | [n.location.latitude, n.location.longitude]] AS route
  `;

  const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', '00000000')
  );
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.run(routeQuery, { source, dest });
    console.log('Neo4j Query:', routeQuery);
    const route = result.records.map(record => record.get('route'));
    res.json({ route });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    session.close();
  }
};
//////////////////////////////////////////////////////////

const createSourcePoint = async (req, res) => {
  const { latitude, longitude } = req.body;
  
  // Check if a point with the same latitude and longitude already exists
  const checkExistingPointQuery = `
    MATCH (p:Point { location: point({ latitude: $latitude, longitude: $longitude }) })
    RETURN p
  `;

  const createPointQuery = `
    CREATE (p:Point {
      name: 'My Location',
      amenity: 'My Location',
      location: point({ latitude: $latitude, longitude: $longitude })
    })
    RETURN p
  `;

  const deleteExistingPointQuery = `
    MATCH (n:Point { amenity: 'My Location' })
    DETACH DELETE n
  `;

  const linkToNearestIntersectionQuery = `
    CALL apoc.periodic.iterate(
      'MATCH (p:Point) WHERE NOT EXISTS ((p)-[:NEAREST_INTERSECTION]->(:Intersection)) RETURN p',
      'CALL {
        WITH p
        MATCH (i:Intersection)
        USING INDEX i:Intersection(location)
        WHERE point.distance(i.location, p.location) < 200
        WITH i, p
        ORDER BY point.distance(p.location, i.location) ASC 
        LIMIT 1
        MERGE (p)-[:NEAREST_INTERSECTION]->(i)
        SET p.length = point.distance(p.location, i.location)
        RETURN i
      }
      RETURN COUNT(p)',
      { batchSize: 1000, parallel: false }
    );
  `;

  const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', '00000000')
  );

  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });

  try {
    // Delete existing 'My Location' point
    await session.run(deleteExistingPointQuery);

    // Check if a point with the same properties already exists
    const resultExistingPoint = await session.run(checkExistingPointQuery, { latitude, longitude });

    if (resultExistingPoint.records.length === 0) {
      // If no existing point, create the new point
      const resultCreatePoint = await session.run(createPointQuery, { latitude, longitude });
      console.log('Created Source Point:', resultCreatePoint.records[0].get('p'));

      // Link the new point to the nearest intersection
      await session.run(linkToNearestIntersectionQuery);

      res.status(200).json({ success: true });
    } else {
      console.log('Point already exists:', resultExistingPoint.records[0].get('p'));
      res.status(200).json({ success: true, message: 'Point already exists.' });
    }
  } catch (error) {
    console.error('Error creating source point:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    session.close();
  }
};


/////////////////////////////////////////////////////////
const getLocationPoint = async (req, res) => {
  const { latitude, longitude } = req.query;

  const getLocationPointQuery = `
  MATCH (p:Point)
  WHERE p.location.latitude = toFloat($latitude) AND p.location.longitude = toFloat($longitude)
  RETURN p
  `;

  const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', '00000000')
  );

  const session = driver.session({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.run(getLocationPointQuery, { latitude, longitude });

    // Check if any records are returned
    if (result.records.length > 0) {
      const locationPoint = result.records[0].get('p');
      res.status(200).json({ locationPoint });
    } else {
      console.error('Location point not found.');
      res.status(404).json({ error: 'Location point not found.' });
    }
  } catch (error) {
    console.error('Error getting location point:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    session.close();
  }
};




module.exports={
    getPoints,
    getfinalroute,
    createSourcePoint,
    getLocationPoint
}