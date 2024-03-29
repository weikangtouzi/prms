const smsClient = require('tencentcloud-sdk-nodejs').sms.v20210111.Client;
const mongo = require('../mongo');
const { UserInputError } = require('apollo-server-errors');
const { isvaildNum } = require('../utils/validations');
const jwt = require('jsonwebtoken');
const { User } = require('../models')
const { message } = require('../project.json');
const nodemailer = require("nodemailer");
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
    let res
    try {
        res = await client.SendSms(params);
    } catch (err) {
        throw new err;
    }
    saveVerifyCode(phoneNumber, code);
    return JSON.stringify(res);
}

function saveVerifyCode(to, code, isPhoneNumber = true) {
    mongo.query('user_log_in_cache', async (collection) => {
        let query = {};
        let data = {};
        if(isPhoneNumber) {
            query.phoneNumber = to
            data.phoneNumber = to
            data.code = code
        } else {
            query.email = to
            data.email = to
            data.code = code
        }
        data.createAt = new Date(Date.now()).toISOString()
        await collection.updateOne(query,
            [{
                $replaceWith: data
            }],
            {
                upsert: true
            });
    })
}

const sendEmail = async (parent, args, { userInfo }, info) => {
    const { emailAddress } = args;
    const { email } = require('../project.json');
    let transporter = nodemailer.createTransport({
        host: email.host,
        port: 465,
        secure: true,
        auth: {
            user: email.account.user,
            pass: email.account.pass
        }
    })
    let code = (Math.random() * (999999 - 100000) + 100000).toFixed();
    try {
        let info = await transporter.sendMail({
            from: `"${email.from}" <${email.account.user}>`,
            to: [emailAddress],
            subject: "邮箱验证码",
            html: `<p>验证码：${code}</p>`
        })
        saveVerifyCode(emailAddress, code, false);
        return info.messageId;
    } catch (e) {
        throw e;
    }
}
module.exports = {
    sendSms,
    sendEmail
}