const {
  ApolloServerPluginLandingPageGraphQLPlayground
} = require("apollo-server-core");
const { ApolloServer, gql } = require('apollo-server');
const { sequelize } = require('./models');
const { resolvers} = require('./graphql')
const mongo = require('./mongo')
// The GraphQL schema
const typeDefs = gql`
  input Register {
    username: String!
    email: String
    password: String!
    confirmPassword: String!
    phoneNumber: String!
    verifyCode: String!
  }
  type User {
    username: String!,
  }
  type LoginResult {
    username: String!,
    createdAt: String!,
    token: String!,
  }
  type Province {
    name: String!
  }
  input Login {
    account: String!
    password: Password!
  }
  input Password {
    isVerifyCode: Boolean!
    value: String
  }
  type Query {
    logIn(info: Login!): LoginResult!
    numberCheck(num: String!): Boolean!
    getProvince: [Province]
    sendSms(phoneNumber: String): String!
    getUsers: [User]!
  }
  type Mutation {
    register(info: Register!): String!
  }
`;

// A map of functions which return data for the schema.


const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  context: (ctx) => ctx,  
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
  mongo.init().then(() => {
    console.log('mongo Connection has been established successfully');
  })
  sequelize
    .authenticate()
    .then(() => {
      console.log('postgres Connection has been established successfully');
    })
}).finally(() => mongo.close());
