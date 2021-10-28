const { MongoClient } = require('mongodb');
const { mongodb } = require('../project.json')
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const client = new MongoClient(mongodb.url);

// Database Name
const dbName = 'prms';

async function query(collectionName,runner) {
  // Use connect method to connect to the server
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  return await runner(collection);
  // the following code examples can be pasted here...
}


module.exports = {
    init: async () => {
        await client.connect();
        client.db(dbName).collection('administrator_censor_list').createIndex({time: 1})
        client.db(dbName).collection('administrator_censor_list').createIndex({enterpriseName: "text"})
        client.db(dbName).collection('administrator_censor_list').createIndex({user_id: 1}, {unique: true})
        client.db(dbName).collection('user_log_in_cache').createIndex({createdAt: 1},{expireAfterSeconds: 600})
    },
    close: client.close,
    query,
}