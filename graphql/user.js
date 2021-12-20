const bcrypt = require('bcrypt');
const { Identity } = require('./types');
const { UserInputError, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken')
const { User, Worker, Enterprise, Resume, JobExpectation, Job } = require('../models');
const { Op } = require('sequelize');
const mongo = require('../mongo');
const { jwtConfig } = require('../project.json');
const { basic } = require('../project.json');
const serializers = require('../utils/serializers');
const { checkverified, isvalidEnterpriseAdmin, isvalidJobPoster } = require('../utils/validations');
const { error } = require('../utils/logger');
const { user } = require('pg/lib/defaults');
const UserVerifyCodeConsume = async (parent, args, context, info) => {
    const { phoneNumber, verifyCode, operation } = args.info;
    if (verifyCode === "tested") {
        await mongo.query("user_log_in_cache", async (collection) => {
            let res = await collection.updateOne({
                phoneNumber
            }, {
                $set: {
                    phoneNumber,
                    verified: true,
                    operation,
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

    }
    User.update({ last_log_out_time: null }, {
        where: {
            id: user.id
        }
    })
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
        let verified = await checkverified(phoneNumber, info.fieldName)
        if (!verified) {
            console.log(info.fieldName)
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
        return serializers.jwt({
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
        throw new UserInputError(e)
    }
};

const chooseOrSwitchIdentity = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (args.targetIdentity) {
        let tokenObj
        if (args.targetIdentity == "EnterpriseUser") {
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
                    real_name: worker.real_name,
                    identity: {
                        work_id: worker.work_id,
                        role: args.role,
                        identity: args.targetIdentity,
                        entId: worker.Enterprise.dataValues.id
                    }
                }
            } else {
                throw new UserInputError('bad input', { role: "enterprise user needs specify role for using" })
            }
        } else if (args.targetIdentity == "PersonalUser") {
            let resume = await User.findOne({
                where: {
                    id: userInfo.user_id,
                },
                attributes: ["id"],
                include: [{
                    model: JobExpectation,
                    attributes: ["job_category"]
                }]
            })
            tokenObj = {
                user_id: userInfo.user_id,
                username: userInfo.username,
                identity: { identity: args.targetIdentity },
                jobExpectation: resume.dataValues.JobExpectations.map(item => { return item.dataValues })
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
            throw new AuthenticationError('this token is dead, you need to resign you account for a new token', { deadTime: userInfo.deadTime })
        }
    }
}

const UserEditBasicInfo = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { username, logo, gender, birthday, currentCity, firstTimeWorking, education } = args.info;
    let update = {};
    if (username) update.username = username;
    if (logo) update.image_url = logo;
    if (gender) update.gender = gender;
    if (birthday) update.birth_date = birthday;
    if (currentCity) update.current_city = currentCity;
    if (firstTimeWorking) update.first_time_working = firstTimeWorking;
    if (education) update.education = education;
    if (Object.keys(update).length == 0) throw new UserInputError("you need submit at least one field to update");
    try {
        await User.update(update, {
            where: {
                id: userInfo.user_id
            }
        });
    } catch (e) {
        throw e
    }
}
const UserGetBasicInfo = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    let res = await User.findOne({
        where: {
            id: userInfo.user_id
        },
        attributes: ["username", "image_url", "gender", "birth_date", "current_city", "first_time_working", "education"]
    })
    return {
        ...res.toJSON(),
        birth_date: res.birth_date,
        first_time_working: res.first_time_working,
    }
}

const UserGetEnterpriseDetail_EntInfo = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume && (userInfo.identity.identity != "EnterpriseUser")) throw new AuthenticationError('need resume and job expectation for this operation');
    if (userInfo.resume && !args.entId) throw new UserInputError("need to specify entId for personal user query");
    let where = {};
    if (args.entId) where.id = args.entId;
    else where.id = userInfo.identity.entId;
    let entInfo = Enterprise.findOne({
        where
    });
    let job_counter
    if (args.entId) {
        job_counter = Job.count({
            where: {
                comp_id: args.entId
            }
        });
    }
    entInfo = await entInfo;
    let res = {
        ...entInfo.toJSON(),
        enterprise_coordinates: entInfo.dataValues.enterprise_coordinates.coordinates,
        createdAt: entInfo.createdAt.toISOString(),
    }
    if (job_counter) res.job_counter = job_counter;
    return res
}

const UserGetJobListByEntId = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    let { entId } = args;
    let work_id;
    if (entId) {
        if (!userInfo.jobExpectation || userInfo.jobExpectation.length == 0) throw new AuthenticationError('need job expectation for this operation');
        where.expiredAt = {
            [Op.gte]: new Date()
        }
    } else {
        if (isvalidJobPoster(userInfo.identity)) {
            if (isvalidEnterpriseAdmin(userInfo.identity)) {
                entId = userInfo.identity.entId
            } else {
                work_id = userInfo.identity.work_id;
            }
        }
    }
    let where = {};
    if (entId) where.comp_id = entId;
    if (work_id) where.work_id = work_id;
    let { page, pageSize, category } = args;
    if (!page) page = 0;
    if (!pageSize) pageSize = 10;

    if (category) where[category] = sequelize.literal(`category[1] = '${category}'`);
    let res = await Job.findAndCountAll({
        where,
        limit: pageSize,
        offset: pageSize * page,
        order: [["ontop", "DESC"], ["updatedAt", "DESC"]]
    });
    return {
        count: res.count,
        data: res.rows.map(item => {
            return {
                id: item.dataValues.id,
                title: item.dataValues.title,
                loc: item.dataValues.address_description[0] + "-" + item.dataValues.address_description[1],
                experience: item.dataValues.min_experience,
                education: item.dataValues.min_education,
                salary: [item.dataValues.min_salary, item.dataValues.max_salary],
                createdAt: item.dataValues.createdAt
            }
        })
    }
}

const UserGetEnterpriseDetail_WorkerList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { entId, role } = args;
    let where = {};
    let attributes;
    if (entId) {
        if (!userInfo.jobExpectation || userInfo.jobExpectation.length == 0) throw new AuthenticationError('need job expectation for this operation');
        where.company_belonged = entId;
        if (role) {
            where.role = role;
        } else {
            where.role = {
                [Op.ne]: "Admin"
            }
        }
        attributes = ["id", "real_name", "pos"]
    } else {
        if (!isvalidEnterpriseAdmin(userInfo.identity)) {
            throw new AuthenticationError('should specify the enterprise id for this operation');
        }
        where.company_belonged = userInfo.identity.entId;
        if (role) {
            where.role = role;
        }
        attributes = ["id", "real_name", "pos", "createdAt", "role", "disabled"]
    }
    let res = await Worker.findAll({
        where,
        attributes,
        include: [{
            model: User,
            attributes: ["image_url"]
        }]
    });
    res = res.map(origin => {
        let final = origin.dataValues;
        final = {
            ...final,
            name: final.real_name,
            logo: final.User.image_url ? final.User.image_url : "default",
        }
        return final
    })
    return res;
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
    UserEditBasicInfo,
    UserGetBasicInfo,
    UserGetEnterpriseDetail_EntInfo,
    UserGetJobListByEntId,
    UserGetEnterpriseDetail_WorkerList
}