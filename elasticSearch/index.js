const { Client } = require('@elastic/elasticsearch')
const {username, password} = require('./config')
const client = new Client({ node: 'http://localhost:9200',auth: {
  username,
  password
}})

module.exports = client;