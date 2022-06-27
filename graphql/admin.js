const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongo = require('../mongo')
const { Enterprise, User, Worker } = require('../models')
const JobModel = require('../models').Job;
const { AuthenticationError, UserInputError } = require('apollo-server');
const { ObjectId } = require('bson');
const serializers = require('../utils/serializers');
const { Op } = require('sequelize');
const { isvaildNum } = require('../utils/validations');
const { urlFormater } = require('../utils/serializers');
const editJsonFile = require('edit-json-file');
const {DateBuilder} = require('../utils/dateBuilder');
const getCensorList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { pageSize, lastIndex } = args;
    let res = await mongo.query('administrator_censor_list', async (collection) => {
        let res
        if (lastIndex) {
            res = await collection.find({
                passed: false, editable: false, time: {
                    $gt: lastIndex
                }
            }).sort({ time: 1 }).limit(pageSize ? pageSize : 10).toArray();
        } else {
            res = await collection.find({ passed: false, editable: false }).sort({ time: 1 }).limit(pageSize ? pageSize : 10).toArray();
        }
        return res
    })
    return res
}
const setCensoredForAnItem = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { _id, isPassed, description } = args;
    try {
        await mongo.query('administrator_censor_list', async (collection) => {
            try {
                if (isPassed) {
                    await collection.updateOne({
                        _id: ObjectId(_id)
                    }, {
                        $set: {
                            passed: isPassed
                        }
                    })
                } else {
                    if (!description) {
                        throw new UserInputError('description is required for set a identity request to failed')
                    }
                    await collection.updateOne({
                        _id
                    }, {
                        $set: {
                            editable: true,
                            description,
                        }
                    })
                }
            } catch (e) {
                throw e
            }

        });
    } catch (e) {
        throw e
    }
}
const AdminSetRole = async (parent, args, { userInfo }, info) => {

}

const AdminLogIn = async (parent, args, { userInfo }, info) => {
    const { account, password } = args;
    try {
        let res = await mongo.query('admin_and_roles', async (collection) => {
            try {
                let user = await collection.findOne({
                    account,
                })
                if (!user) throw new UserInputError('account not found');
                if (!await bcrypt.compare(password, user.password)) throw new UserInputError('password is incorrect');
                return {
                    token: serializers.jwt({
                        uuid: user._id,
                        account: account,
                        role: user.role.name,
                    }),
                    rights: JSON.stringify(user.role.rights)
                }
            } catch (e) {
                throw e
            }
        })
        return res;
    } catch (e) {
        throw e
    }
}
const AdminGetUserList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { id,
        keyword,
        phoneNumber,
        currentCity,
        registerTime,
        isAvaliable,
        } = args.info;
    let {page, pageSize} = args;
    if(id) {
        let res = await User.findOne({
            where: {
                id: id,
            }
        });
        return [res.toJSON()]
    } else {
        let where = {};
        if(keyword && keyword.trim() !== '') {
            where.username = {
                [Op.substring]: keyword.trim(),
            }
            where.real_name = {
                [Op.substring]: keyword.trim(),
            }
        }
        let error = {};
        if(keyword && keyword.trim() !== '') {
            where.phoneNumber = {
                [Op.substring]: phoneNumber.trim(),
            }
        }
        if(currentCity) {
            where.current_city = currentCity;
        }
        if(registerTime && registerTime.length == 2) {
            where.createdAt = {
                [Op.gte]: new Date(registerTime[0]),
                [Op.lte]: new Date(registerTime[1])
            }
        }
        if(isAvaliable !== undefined) {
            where.isAvaliable = isAvaliable;
        }
        if(!page) page = 0;
        if(!pageSize) pageSize = 10;
        let res = await User.findAll({
            where,
            limit: pageSize,
            offset: page * pageSize,
            order: [["createdAt", "DESC"]]
        }).map(item =>{ return item.dataVaules});
        return res;
    }
}
const AdminGetEntList = async ( parent, args, { userInfo }, info) => {
    const {id, fullName, phoneNumber, identitifyTime, isAvaliable} = args.info;
    let {page, pageSize} = args;
    let res;
    if(id) {
        res =[ await Enterprise.findOne({
            where: {
                id,
            }
        })]
    }else {
        if(!pageSize) pageSize = 10;
        if(!page) page = 0;
        let where = {};
        if(fullName) where.fullName = {
            [Op.substring]: fullName
        };
        if(phoneNumber) where.phoneNumber = phoneNumber;
        if(identitifyTime && identitifyTime.length == 2) where.identitifyTime = {
            [Op.gte]: new Date(registerTime[0]),
            [Op.lte]: new Date(registerTime[1])
        }
        if(isAvaliable) where.isAvaliable = isAvaliable;
        res = (await Enterprise.findAll({
            where,
            limit: pageSize,
            offset: pageSize * page,
            order: [["createdAt", "DESC"]]
        })).map(item =>{ return item.dataValues});
    }
    return res;
}

const AdminGetHomePageDataCollection = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    let new_user_counter = {
        monthly: 0,
        weekly: 0,
        graphData: {
            monthly: [],
            weekly: [],
        }
    }
    let dateBuilder = new DateBuilder()
    let monthly = dateBuilder.monthly()
    let weekly = dateBuilder.weekly()
    const query = async (filter) => {
        return await mongo.query('new_user_record', async (collection) => {
            return (await collection.find({
                register_time: filter
            })).toArray()
        })
    }
    let weekly_data = await query(weekly.toMongoFilter())
    let monthly_data = await query(monthly.toMongoFilter())
    new_user_counter.weekly = weekly_data.length
    new_user_counter.monthly = monthly_data.length
    new_user_counter.graphData.monthly = dateBuilder.monthly_devided_into_days(monthly_data)
    new_user_counter.graphData.weekly = dateBuilder.weekly_devided_into_days(weekly_data)
    let user_counter = {
        sum: 0,
        enterpriseUserCount: 0,
    }
    user_counter.sum = await User.count({where: {}})
    user_counter.enterpriseUserCount = await Worker.count({where: {}})
    let censors = await mongo.query('administrator_censor_list', async (collection) => {
        return await collection.count({
            editable: false,
            passed: false
        })
    })
    let sum = await JobModel.count({where: {}})
    return {
        newUserCounter: new_user_counter,
        userCounter: user_counter,
        jobCounter: {sum},
        censors,
    }
}
const AdminDisableUserAccount = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { user_id } = args;
    let res = await User.update({
        where: {
            id: user_id,
            disabled: null
        },
        returning: true
    },{
        disabled: true
    })
    if (res[0] === 0) throw new UserInputError('user not found or already be disabled')
}

const AdminEnableUserAccount = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { user_id } = args;
    let res = await User.update({
        where: {
            id: user_id,
            disabled: true
        },
        returning: true
    },{
        disabled: null
    })
    if (res[0] === 0) throw new UserInputError('user not found or not being disabled')
}

const AdminDisableEnterpriseUserAccount = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { worker_id } = args;
    let res = await Worker.update({
        where: {
            id: worker_id,
            disabled: null
        },
        returning: true
    },{
        disabled: "HIGH"
    })
    if (res[0] === 0) throw new UserInputError('enterprise user not found or already be disabled')

}

const AdminEnableEnterpriseUserAccount = async (parent, args, { userInfo }, info) => { 
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { worker_id } = args;
    let res = await Worker.update({
        where: {
            id: worker_id,
            disabled: "HIGH"
        },
        returning: true
    },{
        disabled: null
    })
    if (res[0] === 0) throw new UserInputError('enterprise user not found or not being disabled')
}

const AdminDisableEnterpriseMainAccount = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { enterprise_id } = args;
    let res = await Enterprise.update({
        where: {
            id: enterprise_id,
            disabled: null
        },
        returning: true
    },{
        disabled: true
    })
    if (res[0] === 0) throw new UserInputError('enterprise not found or already be disabled')
    await Worker.update({
        where: {
            company_belonged: enterprise_id,
            disabled: null,
        }
    },{
        disabled: "MIDIUM"
    })
}

const AdminEnableEnterpriseMainAccount = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { enterprise_id } = args;
    let res = await Enterprise.update({
        where: {
            id: enterprise_id,
            disabled: true
        },
        returning: true
    },{
        disabled: null
    })
    if (res[0] === 0) throw new UserInputError('enterprise not found or not being disabled')
    await Worker.update({
        where: {
            company_belonged: enterprise_id,
            disabled: "MIDIUM"
        }
    },{
        disabled: null
    })
}

const AdminGetJobList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    let { page, pageSize, id, title, isAvaliable } = args;
    if (!page) page = 0
    if (!pageSize) pageSize = 10
    let where = {};
    if (!id) {
        if (title) where.title = {
            [Op.like]: `%${title}%`
        }
        if (isAvaliable !== undefined) {
            where.isAvaliable = isAvaliable;
        }
    } else {
        where.id = id;
    }
    let res = await Job.findAll({
        where: where,
        limit: pageSize,
        offset: page * pageSize,
        order: [['createdAt', 'DESC']]
    }
    )
    return res;
}

const AdminShowJobInfo = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { job_id } = args;
    let res = await Job.findOne({
        where: {
            id: job_id
        },
        include: [{
            model: Worker,
            as: 'worker',
            attributes: ['id', 'full_name', 'phoneNumber', 'identifyTime', 'isAvaliable']
        }]
    })
    res = res.map(item => {
        return {
            ...item,
            id: item.id,
            full_name: item.worker.full_name,
            phoneNumber: item.worker.phoneNumber,
            identifyTime: item.worker.identifyTime,
            isAvaliable: item.worker.isAvaliable,
            address_coordinate: JSON.stringify(item.address_coordinate)
        }
    })
    return res;
}

const AdminDisableJob = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { job_id } = args;
    let res = await Job.update({
        where: {
            id: job_id,
            isAvaliable: true
        }
    },{
        isAvaliable: false
    })
    if (res[0] === 0) throw new UserInputError('job not found or already be disabled')
}
const AdminEnableJob = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const { job_id } = args;
    let res = await Job.update({
        where: {
            id: job_id,
            isAvaliable: false
        }
    },{
        isAvaliable: true
    }
    )
    if (res[0] === 0) throw new UserInputError('job not found or not being disabled')
}
const AdminResetPassword = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    const {oldOne, newOne} = args;
    if (oldOne === newOne) throw new UserInputError('new password is the same as old one')
    mongo.query("admin_and_roles", async (collection) => {
        let res = await collection.findOne({
            account: userInfo.account,
            password: old
        })
        if (!res) throw new UserInputError('old password is not correct')
        await collection.updateOne({
            account: userInfo.account
        }, {
            $set: {
                password: newOne
            }
        })
    })
}

module.exports = {
    getCensorList,
    setCensoredForAnItem,
    AdminLogIn,
    AdminGetUserList,
    AdminGetEntList,
    AdminGetHomePageDataCollection,
    AdminDisableUserAccount,
    AdminEnableUserAccount,
    AdminDisableEnterpriseUserAccount,
    AdminEnableEnterpriseUserAccount,
    AdminDisableEnterpriseMainAccount,
    AdminEnableEnterpriseMainAccount,
    AdminGetJobList,
    AdminShowJobInfo,
    AdminDisableJob,
    AdminEnableJob,
    AdminResetPassword
}