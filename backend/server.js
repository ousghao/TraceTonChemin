const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const app = express();
const port = 3000;

/////////////////////////////////// Neo4j credentials
const neo4jUri = 'bolt://localhost:7687';
const neo4jUser = 'neo4j';
const jwtSecret = process.env.JWT_SECRET;
const neo4jPassword = '00000000';

/////////////////// Connect to Neo4j
const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
const session = driver.session();

// Check if the connection to Neo4j is successful
driver.verifyConnectivity()
  .then(() => { 
    console.log("Connected to Neo4j");
    startMongoDBConnection();
  })
  .catch(error => {
    console.error("Error connecting to Neo4j:", error);
    process.exit(1); // Exit the process if there's an error in connecting to Neo4j
  });

////////////////////////////// MongoDB connection
function startMongoDBConnection() {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    startServer();
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if there's an error in connecting to MongoDB
  });
}

////////////////////////////////////////// Create server
function startServer() {
  app.use(express.json());
  app.use(express.urlencoded({extended:false}));
  app.use(cors({origin: true, credentials: true}));
  app.set('neo4jSession', session);

  // Add routes from the route folder
  const closestpathRoute = require('./routes/closestpathRouter');
  const amenityRoutes = require('./routes/amenityRoutes');
  const userRouter = require('./routes/user');
  app.use('/api', closestpathRoute);
  app.use('/api/amenities',amenityRoutes);
  app.use('/log',userRouter);

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
