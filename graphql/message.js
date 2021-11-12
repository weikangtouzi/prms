const jwt = require('jsonwebtoken')
const { AuthenticationError, UserInputError } = require('apollo-server')
const mongo = require('../mongo')
const { Message } = require('../models')
const { withFilter } = require('graphql-subscriptions');
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
    pubsub.publish("NEW_MESSAGE", { newMessage: {
        to: msg.user_id,
        messageType: msg.message_type,
        messageContent: msg.detail,
        ...msg.toJSON()
    } })
}
const newMessage = {
    subscribe: withFilter((_, __, { userInfo, pubsub }) => {
        if (!userInfo) throw new AuthenticationError('missing authorization');
        if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
        return pubsub.asyncIterator(['NEW_MESSAGE'])
    },({newMessage}, _, {userInfo}) => {
        if(!newMessage) throw new UserInputError('what is it error?');
        return (newMessage.from == userInfo.user_id || newMessage.to == userInfo.user_id)
    })
}
module.exports = {
    sendMessage,
    newMessage,
}