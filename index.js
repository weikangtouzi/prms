var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
const { Sequelize } = require('sequelize');
const db = require('./models/db');
const { user } = require('./models/users');
const sequelize = new Sequelize('postgres://postgres:otAS9I6f3S5uBE2FyVK6@1.117.45.51:5432/fcx');
var schema = buildSchema(`
  input Login {
    account: String!
    password: Password!
  }
  type Mutation {
    register(info: Register!): String!
  }
  
  input Password {
    isVerifyCode: Boolean!
    value: String
  }
  
  type Query {
    logIn(info: Login!): Token!
    numberCheck(num: String!): Boolean!
  }
  
  input Register {
    username: String!
    email: String
    password: String!
    confirmPassword: String!
    phoneNumber: String!
  }
  
  type Token {
    token: String!
  }
`);

var root = {
  logIn: (info) => {
    return { token: "" }
  },
  numberCheck: (num) => {
    return false
  },
  register: (register) => {
    console.log(register)
    return "sdada"
  },
};
try {
  db.init(true);
} catch (err) {
  console.log("failed to init database structure with error: " + err);
} finally {
  var app = express();
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  }));
  app.listen(4000, () => console.log('Now browse to localhost:4000/graphql'));
}

