const { MongoClient } = require('mongodb');
const { mongodb } = require('../project.json')
const bcrypt = require('bcrypt');

const client = new MongoClient(mongodb.url);

const dbName = 'prms';

async function query(collectionName,runner) {

  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  return await runner(collection);
  
}


module.exports = {
    init: async () => {
        await client.connect();
        client.db(dbName).collection('administrator_censor_list').createIndex({time: 1})
        client.db(dbName).collection('administrator_censor_list').createIndex({enterpriseName: "text"})
        client.db(dbName).collection('administrator_censor_list').createIndex({user_id: 1}, {unique: true})
        client.db(dbName).collection('user_log_in_cache').createIndex({createdAt: 1},{expireAfterSeconds: 600})
        client.db(dbName).collection('admin_and_roles').updateOne({
          account: "admin",
        }, {
          $set: {
            account: "admin",
            password: await bcrypt.hash("admin", 5),
            role: {
              name: "super",
              rights: {

              }
            }
          }
        }, {
          upsert: true,
        })
    },
    close: client.close,
    query,
}
