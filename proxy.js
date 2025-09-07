const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const MONGODB_URI = "mongodb+srv://nada:t96Z6lDghHjd7pIB@cluster0.1mhdpzu.mongodb.net/nadaart?retryWrites=true&w=majority&appName=Cluster0";
const PORT = process.env.PORT || 3000;

let client = null;

// Initialize MongoDB connection
async function connectToMongo() {
  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      console.log('Connected to MongoDB Atlas');
    }
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'MongoDB proxy is running' });
});

// Test connection endpoint
app.get('/test', async (req, res) => {
  try {
    const mongoClient = await connectToMongo();
    const db = mongoClient.db('nadaart');
    const collections = await db.listCollections().toArray();
    res.json({ success: true, collections: collections.map(c => c.name) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generic MongoDB operation endpoint
app.post('/mongo/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const { collection, filter, update, document, options = {} } = req.body;
    
    const mongoClient = await connectToMongo();
    const db = mongoClient.db('nadaart');
    const coll = db.collection(collection);
    
    let result;
    
    switch (operation) {
      case 'find':
        result = await coll.find(filter || {}, options).toArray();
        break;
      case 'findOne':
        result = await coll.findOne(filter || {}, options);
        break;
      case 'insertOne':
        result = await coll.insertOne(document, options);
        break;
      case 'insertMany':
        result = await coll.insertMany(document, options);
        break;
      case 'updateOne':
        result = await coll.updateOne(filter, update, options);
        break;
      case 'updateMany':
        result = await coll.updateMany(filter, update, options);
        break;
      case 'replaceOne':
        result = await coll.replaceOne(filter, document, options);
        break;
      case 'deleteOne':
        result = await coll.deleteOne(filter, options);
        break;
      case 'deleteMany':
        result = await coll.deleteMany(filter, options);
        break;
      case 'countDocuments':
        result = await coll.countDocuments(filter || {}, options);
        break;
      case 'aggregate':
        result = await coll.aggregate(filter || [], options).toArray();
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`Error in ${req.params.operation}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MongoDB HTTP proxy running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  if (client) {
    client.close();
  }
  process.exit(0);
});
