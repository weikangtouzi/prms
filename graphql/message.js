const jwt = require('jsonwebtoken')
const { AuthenticationError, UserInputError } = require('apollo-server')
const mongo = require('../mongo')
const { Message, ContractList, User, Worker, Enterprise } = require('../models')
const { withFilter } = require('graphql-subscriptions');
const { Op } = require('sequelize')
function checkBlackList(to, from) {

}
const sendMessage = async (parent, args, { userInfo, pubsub }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.identity) throw new AuthenticationError('missing identity');
    const { to, messageType, messageContent } = args.info;
    if(to == userInfo.user_id) throw new UserInputError("could not send message to yourself");
    checkBlackList(to, userInfo.user_id);
    let isPersonal = (userInfo.identity.identity == 'PersonalUser');
    let include;
    if (isPersonal) {
        include = [{
            model: Worker,
            attributes: ["real_name", "pos"],
            include: [{
                model: Enterprise,
                attributes: ["enterprise_name"]
            }]
        }]
    }
    let msg = await Message.create({
        user_id: to,
        from: userInfo.user_id,
        detail: messageContent,
        message_type: messageType,
        readed: false,
    })
    ContractList.upsert({
        user_id: userInfo.user_id,
        identity: userInfo.identity == "PersonalUser",
        target: to,
        last_msg: msg.detail
    }, {
        user_id: userInfo.user_id
    }, {
        returning: true
    }).then((res) => {
        if (res[0].isNewRecord) {
            User.findOne({
                where: {
                    user_id: res[0].dataValues.target,
                },
                include: include? include : [],
            }),then(user => {
                pubsub.publish("NEW_CONTRACT", {
                    newContract: {
                        target: user.id,
                        user_id: userInfo.user_id,
                        logo: user.image_url,
                        name: isPersonal ? user.Worker.real_name : user.username,
                        pos: isPersonal ? user.Worker.pos : null,
                        ent: isPersonal ? user.Enterprise.enterprise_name : null,
                        last_msg: res.last_msg,
                        last_msg_time: res.updatedAt.toISOString()
                    }
                })
            })
            
        }
    })
    ContractList.upsert({
        user_id: to,
        identity: userInfo.identity != "PersonalUser",
        target: userInfo.user_id,
        last_msg: msg.detail
    }, {
        where: {
            user_id: to
        }
    }, {
        returning: true
    }).then((res) => {
        if (res[0].isNewRecord) {
            User.findOne({
                where: {
                    user_id: userInfo.user_id,
                },
                include: include? include : [],
            }),then(user => {
                pubsub.publish("NEW_CONTRACT", {
                    newContract: {
                        target: user.id,
                        user_id: userInfo.user_id,
                        logo: user.image_url,
                        name: isPersonal ? user.Worker.real_name : user.username,
                        pos: isPersonal ? user.Worker.pos : null,
                        ent: isPersonal ? user.Enterprise.enterprise_name : null,
                        last_msg: res.last_msg,
                        last_msg_time: res.updatedAt.toISOString()
                    }
                })
            })
            
        }
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
const newContract = {
    subscribe: withFilter((_, __, { userInfo, pubsub }) => {
        if (!userInfo) throw new AuthenticationError('missing authorization');
        if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
        return pubsub.asyncIterator(['NEW_CONTRACT'])
    }, ({ newContract }, _, { userInfo }) => {
        if (!newContract) throw new UserInputError('what is it error?');
        return (newContract.user_id == userInfo.user_id)
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
                        ]
                    },
                    {
                        [Op.and]: [
                            { from: userInfo.user_id },
                            { user_id: targetId }
                        ]
                    }]
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
const UserGetContractList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.identity) throw new AuthenticationError('missing identity');
    let isPersonal = (userInfo.identity.identity == 'PersonalUser');
    let res = await ContractList.findAll({
        where: {
            user_id: userInfo.user_id,
            identity: isPersonal
        },
        include: include_gen(isPersonal),
    });
    console.log(res);
    res = res.map(item => {
        return {
            id: userInfo.user_id == item.user_id ? item.target : item.user_id,
            logo: item.User.image_url,
            name: isPersonal ? item.User.Worker.real_name : item.User.username,
            pos: isPersonal ? item.User.Worker.pos : null,
            ent: isPersonal ? item.User.Worker.Enterprise.enterprise_name : null,
            last_msg: item.last_msg,
            last_msg_time: item.updatedAt.toISOString()
        }
    })
    return res;
}
function include_gen(isPersonal) {
    let include = [];
    include.push({
        model: User,
        attributes: ["image_url", "username"],
    });
    if (isPersonal) {
        include[0].include = [{
            model: Worker,
            attributes: ["real_name", "pos"],
            include: [{
                model: Enterprise,
                attributes: ["enterprise_name"]
            }]
        }]
    }
    return include;
}
module.exports = {
    sendMessage,
    newMessage,
    UserGetMessages,
    UserGetContractList,
    newContract
}

