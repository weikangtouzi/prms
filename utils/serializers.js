const jwt = require('jsonwebtoken')
const {jwtConfig} = require('../project.json')
module.exports = {
    jwt: (userInfo) => {
        if(userInfo.exp) {
            userInfo.exp = undefined
        }
        return jwt.sign({
            ...userInfo,
            deadTime: new Date().getTime() + jwtConfig.deadTime,
        }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
    }
}