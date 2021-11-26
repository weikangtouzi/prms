const jwt = require('jsonwebtoken')
const {jwtConfig} = require('../project.json')
module.exports = {
    jwt: (userInfo) => {
        let res;
        if(userInfo.exp) {
            userInfo.exp = Math.round(new Date().getTime() / 1000) + 3600
            res = jwt.sign({
                ...userInfo,
                deadTime: new Date().getTime() + jwtConfig.deadTime,
            }, jwtConfig.secret)
        } else {
            jwt.sign({
                ...userInfo,
                deadTime: new Date().getTime() + jwtConfig.deadTime,
            }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
        }
        return res
    }
}