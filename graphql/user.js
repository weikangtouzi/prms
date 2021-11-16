const bcrypt = require('bcrypt');
const { Identity } = require('./types');
const { UserInputError, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken')
const { User, Worker, Enterprise } = require('../models');
const { Op } = require('sequelize');
const mongo = require('../mongo');
const { jwtConfig } = require('../project.json');
const { basic } = require('../project.json');
const serializers = require('../utils/serializers');
const { checkverified } = require('../utils/validations')
const UserVerifyCodeConsume = async (parent, args, context, info) => {
    const { phoneNumber, verifyCode, operation } = args.info;
    if (verifyCode === "tested") {
        await mongo.query("user_log_in_cache", async (collection) => {
            let res = await collection.updateOne({
                phoneNumber
            }, {
                $set: {
                    phoneNumber,
                    verified: operation,
                    createdAt: new Date(),
                }
            }, { upsert: true })

        });
        return
    }
    let errors = {};
    await mongo.query("user_log_in_cache", async (collection) => {
        let res = await collection.updateOne({
            phoneNumber,
            code: verifyCode
        }, [
            {
                $replaceWith: {
                    phoneNumber,
                    verified: operation,
                    createdAt: new Date(),
                }
            }
        ])
        if (res.matchedCount == 0) {
            errors.verifyCode = "verify code out of time or not right"
            return
        }
    });
    if (Object.keys(errors).length > 0) {
        throw new UserInputError("bad input", { ...errors })
    }
}

const logIn = async (parent, args, context, info) => {
    console.log(context.req.connection.remoteAddress)
    const { account, password } = args.info;
    let user;
    let token;
    if (!password) {
        let verified = await checkverified(account, info.fieldName);
        if (!verified) {
            throw new AuthenticationError('needed verification for none password login')
        }
        user = await User.findOne({
            where: {
                phone_number: account
            }
        })
        if (!user) {
            throw new UserInputError("user not found")
        }
        token = serializers.jwt({
            user_id: user.id,
            username: user.username
        })

    } else {
        let errors = {}
        try {
            if (account.trim() === '') errors.account = 'account must not be empty'
            if (password.trim() === '') errors.password = 'password/verifyCode must not be empty'
            if (Object.keys(errors).length > 0) {
                throw new UserInputError('bad input', { errors })
            }
            user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: account },
                        { phone_number: account }
                    ],
                }
            })
            checkUser(user, errors);
            const correctPassword = await bcrypt.compare(password, user.password);
            if (!correctPassword) {
                errors.password = 'password is incorrect'
                throw new AuthenticationError('password is incorrect', { errors })
            }
            token = serializers.jwt({
                user_id: user.id,
                username: user.username
            })
        } catch (err) {
            console.log(err)
            throw err
        }
    }
    return {
        ...user.toJSON(),
        createdAt: user.createdAt.toISOString(),
        token
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
        throw new err
    }
};
const register = async (parent, args, context, info) => {
    const { username, email, password, confirmPassword, imageUrl, phoneNumber } = args.info;
    let errors = {};
    try {
        if (email) {
            if (email.trim() === '') errors.email = 'email must not be empty'
        }
        if (password.trim() === '') errors.password = 'password must not be empty'
        if (confirmPassword.trim() === '') errors.confirmPassword = 'repeat password must not be empty'
        if (username.trim() === '') errors.username = 'username must not be empty'
        if (password !== confirmPassword) errors.confirmPassword = 'passwords must match'
        if (Object.keys(errors).length > 0) {
            throw errors
        }
        if (!await checkverified(phoneNumber, info.fieldName)) {
            throw new AuthenticationError('needed verification for none password login')
        }
        if (Object.keys(errors).length > 0) {
            throw errors
        }
        let password_encrypted = await bcrypt.hash(password, 2);
        let user;
        if (email) {
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
        console.log(e)
        throw new UserInputError('Bad input', { e })
    }
};

const chooseOrSwitchIdentity = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (Identity.parseValue(args.targetIdentity)) {
        let tokenObj
        let identity = Identity.parseValue(args.targetIdentity);
        if (identity == Identity.getValue("EnterpriseUser").value) {
            let worker = await Worker.findOne({
                where: {
                    user_binding: userInfo.user_id
                },
                include: Enterprise
            })
            if (!worker) {
                throw new UserInputError('bad input', { identity: "it's not a enterprise user" })
            }
            if (args.role) {
                tokenObj = {
                    user_id: userInfo.user_id,
                    username: userInfo.username,
                    identity: {
                        role: args.role,
                        identity: args.targetIdentity,
                        enterpriseId: worker.company_belonged
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
        return serializers.jwt(tokenObj)
    } else {
        throw new UserInputError("token invalid", { identity: `invaild identity: ${args.identity}` })
    }
}
const resetPassword = async (parent, args, { userInfo }, info) => {
    const { phoneNumber, password, confirmPassword } = args.info;
    if (password.trim() == '') throw new UserInputError('password must be not empty');
    if (confirmPassword.trim() == '') throw new UserInputError('confirmPassword must be not empty');
    if (!await checkverified(phoneNumber, info.fieldName)) {
        throw new AuthenticationError('needed verification for this api')
    }
    try {
        await User.update({
            password: (await bcrypt.hash(password, 2)).toString(),
        }, {
            where: { phone_number: phoneNumber }
        });
    } catch (e) {
        throw new UserInputError('bad input', { e })
    }

}


const refreshToken = async (parent, args, context, info) => {
    if (context.req && context.req.headers.authorization) {
        let token = context.req.headers.authorization;
        let userInfo = jwt.decode(token);
        if (userInfo.deadTime > new Date().getTime()) {
            return serializers.jwt(userInfo)
        } else {
            console.log(userInfo)
            throw new AuthenticationError('this token is dead, you need to resign you account for a new token', { deadTime: userInfo.deadTime })
        }
    }
}

const UserEditBasicInfo = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { username, imageUrl } = args.info;
    User.update({ username, image_url: imageUrl }, {
        where: {
            id: userInfo.user_id
        }
    });

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
    refreshToken,
    UserVerifyCodeConsume,
    UserEditBasicInfo
}