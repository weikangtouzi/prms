const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'prms';

async function query(collectionName,runner) {
  // Use connect method to connect to the server
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  await runner(collection);
  // the following code examples can be pasted here...
}

module.exports = {
    init: async () => {
        await client.connect();
    },
    close: client.close,
    query
}