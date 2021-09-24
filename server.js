const {
  ApolloServerPluginLandingPageGraphQLPlayground
} = require("apollo-server-core");
const { ApolloServer, gql } = require('apollo-server');
const { sequelize } = require('./models');
const { resolvers} = require('./graphql')
const mongo = require('./mongo')
// The GraphQL schema
const typeDefs = gql`
  "data used by register user,"
  input Register {
    "username: required, unique, make sense by the name"
    username: String!
    "email: not required in this version, unique, make sense by the name"
    email: String
    "password: required, rule not set up yet"
    password: String!
    "confirmPassword: required, exactly same as password"
    confirmPassword: String!
    "phoneNumber: required, unique, make sense by the name"
    phoneNumber: String!
    "verifyCode: required, expiresIn 5 minutes, make sense by the name"
    verifyCode: String!
  }
  "the return type of getUsers api, not stable now, just because the api not implement yet"
  type User {
    "username: the username of the user stored in the database"
    username: String!,
  }
  "logInResult: the result of the login operation"
  type LoginResult {
    "maybe become nullable in the future"
    username: String!,
    "the very first time the user is created"
    createdAt: String!,
    "jwt token for the user, expiresIn 60 minutes"
    token: String!,
  }
  "the data of province, usually contains name and id"
  type Province {
    "this id is from the official data, so don't trying to change it"
    province_id: String!,
    name: String!
  }
  "just data needed to login"
  input Login {
    "could be username, email, phone number"
    account: String!
    password: Password!
  }
  "sometime password may not be password only, for very situation in one api, we need this"
  input Password {
    "if this is true, the value will be judge as verifyCode, or as password, one more thing, only will work when account is phoneNumber"
    isVerifyCode: Boolean!
    value: String
  }
  enum Education {
    LessThanPrime,
    Primary,
    Junior,
    High,
    JuniorCollege,
    RegularCollege,
    Postgraduate,
    Doctor
  }
  "the data from the providers?"
  input PersonalData {
    "real name"
    name: String!,
    number: String!,
    idCardNum: String!,
    education: Education!,
    skills: [String]!
  }
  type InsertResult {
    statusCode: String!,
    msg: String!,
  }
  type Query {
    "api for login"
    logIn(info: Login!): LoginResult!
    "check if the input num is availiable or not"
    numberCheck(num: String!): Boolean!
    "get Province data"
    getProvince: [Province]
    "send a verify code to the given number"
    sendSms(phoneNumber: String): String!
    "not able to be used yet"
    getUsers: [User]!
  }
  type Mutation {
    "api for register"
    register(info: Register!): String!
    "this api need you to add a custom header parameter call provider phoneNumber"
    insertPersonalData(info: PersonalData!): InsertResult!
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
