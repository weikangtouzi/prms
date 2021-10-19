const { Config } = require('@alicloud/openapi-client');
const Client = require('@alicloud/dysmsapi20170525');
const mongo = require('../mongo');
const { UserInputError } = require('apollo-server-errors');
const { isvaildNum } = require('../utils/validations');
const jwt = require('jsonwebtoken');
const {User} = require('../models')
const sendSms = async (parent, args, context, info) => {
    let { phoneNumber } = args;
    let error = {};
    
    if(!phoneNumber) {
        let token = context.req.headers.authorization;
        if(context.req && context.req.headers.authorization) {
            let username = jwt.decode(token).username;
            let res = await User.findOne({ where: { username: username}});
            phoneNumber = res.phone_number;
        }else {
            throw new AuthenticationError('this api needs at least a phone number of your account token');
        }
    }
    isvaildNum(error, phoneNumber);
    if (Object.keys(error).length > 0) {
        throw new UserInputError('bad input', { error })
    }
    let config = new Config({
        accessKeyId: 'LTAI5tSoCesdP9NwSjWgC1Wb',
        accessKeySecret: 'FgfTSTvuQmnXERQ0uWcP7FDeDu2D7u'
    });
    config.endpoint = 'dysmsapi.aliyuncs.com';
    let client = new Client.default(config);
    let code = (Math.random() * (999999 - 100000) + 100000).toFixed();
    let req = new Client.SendSmsRequest({
        phoneNumbers: phoneNumber,
        signName: "德兴在线",
        templateCode: 'SMS_214980009',
        templateParam: JSON.stringify({ code: code }),
    });
    try {
        let res = await client.sendSms(req);
        saveVerifyCode(phoneNumber, code);
        return JSON.stringify(res)
    } catch (err) {
        throw new err
    }
}

function saveVerifyCode(phoneNumber, code) {
    mongo.query('user_log_in_cache', async (collection) => {
        await collection.updateOne({
            phoneNumber: phoneNumber
        }, {
            $set: {
                code: code,
                createAt: new Date(Date.now()).toISOString()
            }

        }, {
            upsert: true
        });
    })
}

module.exports = {
    sendSms
}