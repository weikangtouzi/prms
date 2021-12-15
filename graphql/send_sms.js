const smsClient = require('tencentcloud-sdk-nodejs').sms.v20210111.Client;
const mongo = require('../mongo');
const { UserInputError } = require('apollo-server-errors');
const { isvaildNum } = require('../utils/validations');
const jwt = require('jsonwebtoken');
const { User } = require('../models')
const {message} = require('../project.json');
const sendSms = async (parent, args, context, info) => {
    let { phoneNumber } = args;
    let error = {};
    if (!phoneNumber) {
        let token = context.req.headers.authorization;
        if (context.req && context.req.headers.authorization) {
            let username = jwt.decode(token).username;
            let res = await User.findOne({ where: { username: username } });
            phoneNumber = res.phone_number;
        } else {
            throw new AuthenticationError('this api needs at least a phone number of your account token');
        }
    }
    // isvaildNum(error, phoneNumber);
    if (Object.keys(error).length > 0) {
        throw new UserInputError('bad input', { error })
    }
    const client = new smsClient({
        credential: message.tencent.credential,
        region: message.tencent.region,
        profile: {
            signMethod: message.tencent.signMethod,
            httpProfile: message.tencent.httpProfile,
        }
    })
    let code = (Math.random() * (999999 - 100000) + 100000).toFixed();
    const params = {
        SmsSdkAppId: message.tencent.SmsSdkAppId,
        SignName: message.tencent.SignName,
        TemplateId: message.tencent.Templates.verifyCode.id,
        PhoneNumberSet: [`+86${phoneNumber}`],
        TemplateParamSet: [code]
    }
    let res = await client.SendSms(params)
    return JSON.stringify(res);
}

function saveVerifyCode(phoneNumber, code) {
    mongo.query('user_log_in_cache', async (collection) => {
        await collection.updateOne({
            phoneNumber: phoneNumber
        },
            [{
                $replaceWith: {
                    phoneNumber,
                    code: code,
                    createAt: new Date(Date.now()).toISOString()
                }
            }],
            {
                upsert: true
            });
    })
}

module.exports = {
    sendSms
}