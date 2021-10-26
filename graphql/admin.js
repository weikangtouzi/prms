const e = require('cors');
const jwt = require('jsonwebtoken');
const mongo = require('../mongo')
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
    const {_id, isPassed} = args;
    await mongo.query('administrator_censor_list', async (collection) => {
        if(isPassed) {
            await collection.updateOne({
                _id
            },{
                $set: {
                    passed: isPassed
                }
            }, {upsert: false})
        } else {
            await collection.updateOne({
                _id
            },{
                $set: {
                    editable: true
                }
            },{upsert: false})
        }
        
    })
}

module.exports = {
    getCensorList,
    setCensoredForAnItem
}