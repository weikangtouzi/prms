const jwt = require('jsonwebtoken')
const {jwtConfig} = require('../project.json')
module.exports = context => {
    if (context.req && context.req.headers.authorization) {
        let token = context.req.headers.authorization;
        let userInfo
        try {
            userInfo = jwt.verify(token, jwtConfig.secret);
        } catch (err) {
            userInfo = err
        }
        context.userInfo = userInfo;
    }
    return context;
}