const e = require('cors');
const jwt = require('jsonwebtoken');
const mongo = require('../mongo')
const {Enterprise} = require('../models')
const {AuthenticationError, UserInputError} = require('apollo-server');
const { ObjectId } = require('bson');
const getCensorList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const {pageSize, lastIndex} = args;
    let res = await mongo.query('administrator_censor_list',async (collection) => {
        let res
        if(lastIndex) {
            res = await collection.find({passed: false, editable: false, time: {
                $gt: lastIndex
            }}).sort({time: 1}).limit(pageSize? pageSize: 10).toArray();
        } else {
            res = await collection.find({passed: false, editable: false}).sort({time: 1}).limit(pageSize? pageSize: 10).toArray();
        }
        return res
    })
    return res
}
const setCensoredForAnItem = async (parent, args, {userInfo}, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const {_id, isPassed, description} = args;
    try {
        await mongo.query('administrator_censor_list', async (collection) => {
            try {
                if(isPassed) {
                    await collection.updateOne({
                        _id: ObjectId(_id)
                    },{
                        $set: {
                            passed: isPassed
                        }
                    })
                } else {
                    if(!description) {
                        throw new UserInputError('description is required for set a identity request to failed')
                    }
                    await collection.updateOne({
                        _id
                    },{
                        $set: {
                            editable: true,
                            description,
                        }
                    })
                }
            }catch (e) {
                throw e
            }
            
        });
    } catch (e) {
        throw e
    }
    
}

module.exports = {
    getCensorList,
    setCensoredForAnItem
}