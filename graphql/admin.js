const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongo = require('../mongo')
const { Enterprise, User } = require('../models')
const { AuthenticationError, UserInputError } = require('apollo-server');
const { ObjectId } = require('bson');
const serializers = require('../utils/serializers');
const { Op } = require('sequelize');
const { isvaildNum } = require('../utils/validations');
const { urlFormater } = require('../utils/serializers');
const editJsonFile = require('edit-json-file');
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
        res = await Enterprise.findAll({
            where,
            limit: pageSize,
            offset: pageSize * page,
            order: [["createdAt", "DESC"]]
        }).map(item =>{ return item.dataVaules});
    }
    return res;
}

const AdminGetHomePageDataCollection = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.role) throw new ForbiddenError('not a Admin account')
    
}


module.exports = {
    getCensorList,
    setCensoredForAnItem,
    AdminLogIn,
    AdminGetUserList,
    AdminGetEntList,
    AdminGetHomePageDataCollection
}