const jwt = require('jsonwebtoken')
const { jwtConfig } = require('../project.json')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const { User, Worker } = require('../models')
const { ForbiddenError} = require('apollo-server');
module.exports = {
    before: context => {
        let token = null
        if (context.req && context.req.headers.authorization) {
            token = context.req.headers.authorization;
        } else if (context.Authorization) {
            token = context.Authorization
        }
        if (token !== null) {
            let userInfo
            try {
                userInfo = jwt.verify(token, jwtConfig.secret);
                if (userInfo.identity && userInfo.identity.identity == 'EnterpriseUser') {
                    let isAvaliable = Worker.findOne({
                        where: {
                            user_binding: userInfo.user_id,
                            disabled: null,
                        }
                    })
                    if (!isAvaliable) throw new ForbiddenError('account is banned');
                } else {
                    let isAvaliable = User.findOne({
                        where: {
                            id: userInfo.user_id,
                            disabled: null,
                        }
                    })
                    if (!isAvaliable) throw new ForbiddenError('account is banned');
                }
                User.update({ last_log_out_time: null },{
                    where: {
                        id: userInfo.user_id,
                    }
                })
            } catch (err) {
                userInfo = err
                let id = jwt.decode(token).user_id;
                User.update({
                    last_log_out_time: new Date(),
                }, {
                    where: {
                        id,
                        last_log_out_time: null,
                    },
                    returning: true
                })
            }
            
            context.userInfo = userInfo;
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
