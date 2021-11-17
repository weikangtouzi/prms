const jwt = require('jsonwebtoken')
const { AuthenticationError, UserInputError } = require('apollo-server')
const mongo = require('../mongo')
const { Message } = require('../models')
const { withFilter } = require('graphql-subscriptions');
const { Op } = require('sequelize')
const sendMessage = async (parent, args, { userInfo, pubsub }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { to, messageType, messageContent } = args.info;
    let right = await mongo.query('ContractList', async (collection) => {
        return await collection.findOne({
            user_id: userInfo.user_id,
            target_id: to
        })
    });
    if (!right) throw new UserInputError('could not send message to the target, you don\'t have that permission');
    let msg = await Message.create({
        user_id: to,
        from: userInfo.user_id,
        detail: messageContent,
        message_type: messageType,
        readed: false,
    })
    pubsub.publish("NEW_MESSAGE", {
        newMessage: {
            to: msg.user_id,
            messageType: msg.message_type,
            messageContent: msg.detail,
            ...msg.toJSON()
        }
    })
}
const newMessage = {
    subscribe: withFilter((_, __, { userInfo, pubsub }) => {
        if (!userInfo) throw new AuthenticationError('missing authorization');
        if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
        return pubsub.asyncIterator(['NEW_MESSAGE'])
    }, ({ newMessage }, _, { userInfo }) => {
        if (!newMessage) throw new UserInputError('what is it error?');
        return (newMessage.from == userInfo.user_id || newMessage.to == userInfo.user_id)
    })
}
const UserGetMessages = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    let { targetId, page, pageSize } = args;
    if (!page) page = 0;
    if (!pageSize) pageSize = 10;
    let res = await Message.findAndCountAll({
        where: {
            [Op.and]: [
                {
                    [Op.or]: [{
                        [Op.and]: [
                            { from: targetId },
                            { user_id: userInfo.user_id }
                        ]},
                        {[Op.and]: [
                            { from: userInfo.user_id },
                            { user_id: targetId }
                        ]}]
                },
                { avaliable: true }
            ]
        },
        order: [
            ["createdAt", "DESC"]
        ],
        limit: pageSize,
        offset: page * pageSize
    });
    return {
        page, pageSize, count: res.count,
        messages: res.rows.map(item => {
            return {
                to: item.dataValues.user_id,
                messageType: item.dataValues.message_type,
                messageContent: item.dataValues.detail,
                ...item.dataValues
            }
        })
    }
}
module.exports = {
    sendMessage,
    newMessage,
    UserGetMessages
}