const bcrypt = require('bcrypt');
const { Identity } = require('./types');
const { UserInputError, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken')
const { User } = require('../models');
const { Op } = require('sequelize');
const mongo = require('../mongo');
const { jwtConfig } = require('../project.json');
const { basic } = require('../project.json');

const logIn = async (parent, args, context, info) => {
    const { account, password } = args.info;
    let errors = {}
    try {
        if (account.trim() === '') errors.account = 'account must not be empty'
        if (password.value.trim() === '') errors.password = 'password/verifyCode must not be empty'
        if (Object.keys(errors).length > 0) {
            throw new UserInputError('bad input', { errors })
        }
        let user;
        if (password.isVerifyCode) {
            user = await User.findOne({
                where: {
                    phone_number: account
                }
            });
            checkUser(user, errors);
            await mongo.query("user_log_in_cache", async (collection) => {
                let res = await collection.findOne({
                    phoneNumber: account
                });
                if (!res) {
                    errors.verifyCode = "verify code out of time"
                    return
                }
                if (res.code !== password.value) {
                    errors.verifyCode = "invaild verify code";
                }
            });
            if (Object.keys(errors).length > 0) {
                throw errors
            }
            //TODO: mongodb or redis not set up yet
        } else {
            user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: account },
                        { username: account }
                    ],
                }
            })
            checkUser(user, errors);
            const correctPassword = await bcrypt.compare(password.value, user.password);
            if (!correctPassword) {
                errors.password = 'password is incorrect'
                throw new AuthenticationError('password is incorrect', { errors })
            }

            const token = await jwt.sign({
                user_id: user.id,
                username: user.username
            }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime });
            return {
                ...user.toJSON(),
                createdAt: user.createdAt.toISOString(),
                token
            }
        }
    } catch (err) {
        console.log(err)
        throw err

    }

};
const numberCheck = async (parent, args, context, info) => {
    try {
        let res = await User.findOne({
            where: {
                phone_number: args.num
            }
        }, ["id"]);
        if (res !== null && res !== undefined) {
            return false
        }
        return true
    } catch (err) {

    }
};
const register = async (parent, args, context, info) => {
    const { username, email, password, confirmPassword, imageUrl, phoneNumber, verifyCode } = args.info;
    let errors = {};
    try {
        if (basic.email) {
            if (email.trim() === '') errors.email = 'email must not be empty'
        }
        if (password.trim() === '') errors.password = 'password must not be empty'
        if (confirmPassword.trim() === '') errors.confirmPassword = 'repeat password must not be empty'
        if (username.trim() === '') errors.username = 'username must not be empty'
        if (password !== confirmPassword) errors.confirmPassword = 'passwords must match'
        if (Object.keys(errors).length > 0) {
            throw errors
        }
        await mongo.query("user_log_in_cache", async (collection) => {
            let res = await collection.findOne({
                phoneNumber: phoneNumber
            });
            if (res.code == undefined) {
                errors.verifyCode = "verify code out of time"
                return
            }
            if (res.code !== verifyCode) {
                errors.verifyCode = "invaild verify code";
            }
        });
        if (Object.keys(errors).length > 0) {
            throw errors
        }
        let password_encrypted = await bcrypt.hash(password, 2);
        let user;
        if (basic.email) {
            user = await User.create({
                username: username,
                email: email,
                password: password_encrypted,
                phone_number: phoneNumber,
                image_url: imageUrl,
                is_personal: true,
                identified: "None"
            });
        } else {
            user = await User.create({
                username: username,
                password: password_encrypted,
                phone_number: phoneNumber,
                image_url: imageUrl,
                is_personal: true,
                identified: "None"
            });
        }
        return jwt.sign({
            user_id: user.id,
            username: user.username
        }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime });
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            let key = e.original.constraint;
            let tableName = e.original.table;
            key = key.slice(tableName.length + 1, -4);
            errors[key] = e.original.detail;
        } else if (e.name === 'SequelizeValidationError') {
            e.errors.forEach((err) => (errors[err.path] = err.message))
        }
        throw new UserInputError('Bad input', { e })
    }
};

const chooseOrSwitchIdentity = async (parent, args, context, info) => {
    let token = context.req.headers.authorization;
    if (context.req && context.req.headers.authorization) {
        try {
            let userInfo = jwt.decode(token);
            if ((userInfo.exp && userInfo.exp > new Date().getTime() / 1000) || userInfo.identity) {
                if (Identity.parseValue(args.targetIdentity)) {
                    let tokenObj
                    let identity = Identity.parseValue(args.targetIdentity);
                    if (identity == Identity.getValue("EnterpriseUser").value) {
                        if (args.role) {
                            tokenObj = {
                                user_id: userInfo.user_id,
                                username: userInfo.username,
                                identity: {
                                    role: args.role,
                                    identity: args.targetIdentity
                                }
                            }
                        } else {
                            throw new UserInputError('bad input', { role: "enterprise user needs specify role for using" })
                        }
                    } else if (identity == Identity.getValue("PersonalUser").value) {
                        tokenObj = {
                            user_id: userInfo.user_id,
                            username: userInfo.username,
                            identity: { identity: args.targetIdentity }
                        }
                    } else {
                        throw new UserInputError('bad input', { indentity: "not supported identity: this identity may not be supported in this version" })
                    }
                    return jwt.sign(tokenObj, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
                } else {
                    throw new UserInputError("token invalid", { identity: `invaild identity: ${args.identity}` })
                }

            } else {
                throw new jwt.TokenExpiredError(`your token is expired and without any identity. identity switch needs a token that is not expired or contains current identity, your idnentity is ${userInfo.identity}`, userInfo.exp);
            }
        } catch (err) {
            throw new UserInputError("token invalid", {err})
        }
    } else {
        throw new AuthenticationError('missing authorization')
    }

}
const resetPassword = async (parent, args, context, info) => {
    let token = context.req.headers.authorization;
    let userInfo = jwt.decode(token);
    const { password, confirmPassword, phoneNumber, verifyCode } = args.info;
    if (password.trim() == '') throw new UserInputError('password must be not empty');
    if (confirmPassword.trim() == '') throw new UserInputError('confirmPassword must be not empty');
    if (verifyCode.trim() == '') throw new UserInputError('confirmPassword must be not empty');
    if (context.req && context.req.headers.authorization && userInfo) {
        try {
            await User.update({
                password: (await bcrypt.hash(password, 2)).toString(),
            }, {
                where: { username: userInfo.username }
            });
        } catch (e) {
            throw new UserInputError('bad input', { e })
        }


    } else {
        throw new AuthenticationError('missing authorization')
    }
}


function checkUser(user, errors) {
    if (!user) {
        errors.username = 'user not found'
        throw new UserInputError('user not found', { errors })
    }
}


module.exports = {
    logIn,
    numberCheck,
    register,
    chooseOrSwitchIdentity,
    resetPassword,
}