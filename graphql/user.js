const bcrypt = require('bcrypt');
const { UserInputError, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken')
const { User } = require('../models');
const { Op } = require('sequelize');
const mongo = require('../mongo');
const { jwtSecret } = require('../project.json');
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
                if (res.code == undefined) {
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
                username: user.username
            }, jwtSecret, { expiresIn: 60 * 60 });
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
        let res = User.findOne({
            where: {
                phone_number: args.num
            }
        }, ["id"]);
        if (res !== null && res !== undefined) {
            return true
        }
        return false
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
        }else {
            user = await User.create({
                username: username,
                password: password_encrypted,
                phone_number: phoneNumber,
                image_url: imageUrl,
                is_personal: true,
                identified: "None"
            });
        }
        return username
    } catch (e) {

        if (e.name === 'SequelizeUniqueConstraintError') {
            let key = e.original.constraint;
            let tableName = e.original.table;
            key = key.slice(tableName.length + 1, -4);
            errors[key] = e.original.detail;
        } else if (e.name === 'SequelizeValidationError') {
            e.errors.forEach((err) => (errors[err.path] = err.message))
        }
        throw new UserInputError('Bad input', { errors })
    }
};
function checkUser(user, errors) {
    if (!user) {
        errors.username = 'user not found'
        throw new UserInputError('user not found', { errors })
    }
}
const getUsers = async (parent, args, context, info) => {
    let user;
    if (context.req && context.req.headers.authorization) {
        const token = context.req.headers.authorization.split('Bearer ')[1]
        jwt.verify(token, jwtSecret, (e, decodedToken) => {
            if (e) {
                throw new AuthenticationError('Unauthenticated')
            }
            user = decodedToken

            console.log(user)
        })
    }
    return [{
        username: "shdauisdha"
    }]

}
module.exports = {
    logIn,
    numberCheck,
    register,
    getUsers,
}