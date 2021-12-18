const jwt = require('jsonwebtoken')
const { jwtConfig } = require('../project.json')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const { User, Worker } = require('../models')
module.exports = {
    before:async context => {
        let token
        if (context.req && context.req.headers.authorization) {
            token = context.req.headers.authorization;
        } else if (context.Authorization) {
            token = context.Authorization
        }
        if (token) {
            let userInfo
            try {
                userInfo = jwt.verify(token, jwtConfig.secret);
            } catch (err) {
                userInfo = err
            }
            context.suerInfo = userInfo;
            if(userInfo.identity && userInfo.identity.identity == 'EnterpriseUser') {
                let isAvaliable = await Worker.findOne({
                    user_binding: userInfo.user_id,
                    disabled: false,
                    disabled_by_ent: false
                })
                if(!isAvaliable) throw new AuthenticationError('account is banned');
            } else {
                let isAvaliable = await User.findOne({
                    user_id: userInfo.user_id,
                    disabled: false,
                })
                if(!isAvaliable) throw new AuthenticationError('account is banned');
            }
        }
        context.pubsub = pubsub
        return context;
    },
    ws_close: async (webSocket, context) => {
        // console.log(webSocket);
        let init = await context.initPromise;
        let userInfo = jwt.decode(init.Authorization);
        let res = await User.update({
            last_log_out_time: new Date(),
        }, {
            where: {
                id: userInfo.user_id,
                last_log_out_time: null,
            },
            returning: true
        })
        if (!res || res[0] === 0) console.log("this user already log out or user not found");
        console.log(`user ${userInfo.user_id} log out`);
    }
}
