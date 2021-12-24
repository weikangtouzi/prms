const bcrypt = require('bcrypt');
const { Identity } = require('./types');
const { UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server');
const jwt = require('jsonwebtoken')
const { User, Worker, Enterprise, JobCache, JobExpectation, Job, sequelize, ResumeDeliveryRecord } = require('../models');
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
            throw new ForbiddenError('needed verification for none password login')
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
            throw new UserInputError('password is incorrect', { errors })
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
                        worker_id: worker.id,
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
    let { phoneNumber, password, confirmPassword } = args.info;
    if (password.trim() == '') throw new UserInputError('password must be not empty');
    if (confirmPassword.trim() == '') throw new UserInputError('confirmPassword must be not empty');
    if (!phoneNumber) phoneNumber = (await User.findOne({
        where: {
            id: userInfo.user_id,
        },
        attributes: ["phone_number"]
    })).phone_number;
    if (!await checkverified(phoneNumber, info.fieldName)) {
        throw new ForbiddenError('needed verification for this api')
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
            throw new ForbiddenError('this token is dead, you need to resign you account for a new token', { deadTime: userInfo.deadTime })
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
    if (Object.keys(update).length == 0) throw new ForbiddenError("you need submit at least one field to update");
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
        attributes: ["username", "image_url", "gender", "birth_date", "current_city", "first_time_working", "education", "phone_number", "email"]
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
    if (!userInfo.resume && (userInfo.identity.identity != "EnterpriseUser")) throw new ForbiddenError('need resume and job expectation for this operation');
    if (userInfo.resume && !args.entId) throw new ForbiddenError("need to specify entId for personal user query");
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
    let { entId, workerId, status, title } = args;
    let worker_id;
    let where = {};
    if (workerId) {
        worker_id = workerId;
    } else {
        if (entId) {
            if (!userInfo.jobExpectation || userInfo.jobExpectation.length == 0) throw new ForbiddenError('need job expectation for this operation');
            where.expired_at = {
                [Op.gt]: new Date()
            }
        } else {
            if (isvalidJobPoster(userInfo.identity)) {
                if (isvalidEnterpriseAdmin(userInfo.identity)) {
                    entId = userInfo.identity.entId
                } else {
                    worker_id = userInfo.identity.worker_id;
                }
            } else {
                throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to query this api`)
            }
        }
    }
    switch (status) {
        case 'NotPublishedYet':
            where.expired_at = null;
            break;
        case 'InRecruitment':
            where.expired_at = {
                [Op.gt]: new Date()
            };
            break;
        case 'OffLine':
            where.expired_at = {
                [Op.lte]: new Date()
            }
            break;
        default:
            break;
    }
    if (title) where.title = {
        [Op.substring]: title
    }
    if (entId) where.comp_id = entId;
    if (worker_id) where.worker_id = worker_id;
    let { page, pageSize, category } = args;
    if (!page) page = 0;
    if (!pageSize) pageSize = 10;
    if (category) where[category] = sequelize.literal(`"JobCache"."category"[1] = '${category}'`);
    if (Object.keys(where).length === 0) return {
        count: 0,
        data: []
    };
    let res = await JobCache.findAndCountAll({
        where,
        limit: pageSize,
        offset: page * pageSize,
        order: [["updated_at", "DESC"]],
        include: [{
            model: Job,
            attributes: ["id"],
            include: [{
                model: ResumeDeliveryRecord,
                attributes: ["id"],
            }]
        }],
    });
    return {
        count: res.count,
        data: res.rows.map(row => {
            row.address_coordinate = JSON.stringify(row.address_coordinate);
            if (!row.emergency) row.emergency = false;
            if (!row.logo) row.logo = "null";
            row.updated_at = row.updated_at.toISOString();
            switch (status) {
                case 'NotPublishedYet':
                    row.status = 'NotPublished';
                    break;
                case 'InRecruitment':
                    row.status = 'InRecruitment';
                    break;
                case 'OffLine':
                    row.status = 'OffLine';
                    break;
                default:
                    row.status = row.expired_at? (new Date(row.expired_at).getTime() > new Date().getTime()? 'InRecruitment': 'OffLine') :'NotPublished'
                    break;
            }
            row.createdAt = row.created_at.toISOString();
            row.resumeCount = row.Job.ResumeDeliveryRecords.length;
            return row
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
        if (!userInfo.jobExpectation || userInfo.jobExpectation.length == 0) throw new ForbiddenError('need job expectation for this operation');
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
            throw new ForbiddenError('should specify the enterprise id for this operation');
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

const UserChangePhoneNumber = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { newNum } = args;
    if (!await checkverified(newNum, info.fieldName)) throw new ForbiddenError("need check verify code for this operation");
    await User.update({
        phone_number: newNum
    }, {
        where: {
            id: userInfo.user_id
        }
    });
}

const UserEditEmail = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { newEmail, verifyCode } = args;
    let res = await mongo.query('user_log_in_cache', async (collection) => {
        return await collection.findOne({ email: newEmail, code: verifyCode });
    })
    if (!res) throw new UserInputError('verify code not right');
    User.update({ email: newEmail }, { where: { id: userInfo.user_id } });
}

const StaticGetHotJobs = async (parent, args, { userInfo }, info) => {
    let res = await JobCache.findAll({
        where: {
            expired_at: {
                [Op.gt]: new Date(),
            }
        },
        order: [["views", "DESC"], ["updated_at", "DESC"]],
        limit: 10
    })
    return res.map(item => {
        return {
            ...item.dataValues,
            createdAt: item.updated_at.toISOString(),
        }
    })
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
    UserGetEnterpriseDetail_WorkerList,
    UserChangePhoneNumber,
    UserEditEmail,
    StaticGetHotJobs
}