const { Client } = require('@elastic/elasticsearch')
const {username, password, host} = require('./config')
const client = new Client({ node: host,auth: {
  username,
  password
}})

module.exports = client;