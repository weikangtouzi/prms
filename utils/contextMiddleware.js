const jwt = require('jsonwebtoken')
const { jwtConfig } = require('../project.json')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const { User, Worker } = require('../models')
const { ForbiddenError, UserInputError} = require('apollo-server');
const mongo = require('../mongo')
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
                if (userInfo.identity)  {
                    let isAvaliable
                    if(!userInfo.identity == "EnterpriseUser") {
                        isAvaliable = Worker.findOne({
                            where: {
                                user_binding: userInfo.user_id,
                                disabled: null,
                            }
                        })
                    } else {
                        isAvaliable = User.findOne({
                            where: {
                                id: userInfo.user_id,
                                disabled: null,
                            }
                        })
                    }
                    if (!isAvaliable) throw new ForbiddenError('account is banned');
                    User.update({ last_log_out_time: null },{
                        where: {
                            id: userInfo.user_id,
                        }
                    })
                } else {
                    if(!userInfo.uuid) throw new ForbiddenError("not a valid user")
                    console.log(userInfo)
                    let admin = mongo.query('admin_and_roles', async (collection) => {
                        try {
                            let user = await collection.findOne({
                                account: userInfo.account,
                            })
                            if (!user) throw new UserInputError('account not found');
                            return user
                        } catch (e) {
                            throw e
                        }
                    })
                    userInfo = {
                        ...admin,
                        id: admin.uuid
                    }
                }
            } catch (err) {
                userInfo = err
                // let id = jwt.decode(token).user_id;
                // // User.update({
                // //     last_log_out_time: new Date(),
                // // }, {
                // //     where: {
                // //         id,
                // //         last_log_out_time: null,
                // //     },
                // //     returning: true
                // // })
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
        if(!userInfo) {
            return 
        }
        try {
            let res = await User.update({
                last_log_out_time: new Date(),
            }, {
                where: {
                    id: userInfo.user_id,
                    last_log_out_time: null,
                },
                returning: true
            })
        } catch (error) {
            throw new Error(error.message);
        }
        if (!res || res[0] === 0) console.log("this user already log out or user not found");
        console.log(`user ${userInfo.user_id} log out`);
    }
}
