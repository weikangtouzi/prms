const {
  ApolloServerPluginLandingPageGraphQLPlayground
} = require("apollo-server-core");
const { ApolloServer, gql } = require('apollo-server');
const { sequelize } = require('./models');

// The GraphQL schema
const typeDefs = gql`
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
    logIn(info: Login!): Token!
    numberCheck(num: String!): Boolean!
    getProvince: [Province]
  }
  type Mutation {
    register(info: Register!): String!
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    logIn(parent, args, context, info){
      console.log(args)
      return { token: "" }
    },
    numberCheck(parent, args, context, info){
      let res = sequelize.models.User.findOne({
        where: {
          phone_number: args.num
        }
      },["id"]);
      if (res !== null && res !== undefined) {
        return true
      }
      return false
    },
    
  },
  Mutation: {
    register(parent, args, context, info){
      console.log(register)
      return "sdada"
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);

  sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully');
    })
});
