const jwt = require('jsonwebtoken')
const { jwtConfig } = require('../project.json')
const {PubSub} = require('graphql-subscriptions')
const pubsub = new PubSub()

module.exports = context => {
    let token
    if (context.req && context.req.headers.authorization) {
        token = context.req.headers.authorization;
    } else if (context.Authorization) {
        token = context.Authorization
    }
    if(token) {
        let userInfo
        try {
            userInfo = jwt.verify(token, jwtConfig.secret);
        } catch (err) {
            userInfo = err
        }
        context.userInfo = userInfo;
    }
    context.pubsub = pubsub
    
    return context;
}