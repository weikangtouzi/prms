const jwt = require('jsonwebtoken')
const { AuthenticationError, UserInputError } = require('apollo-server')
const mongo = require('../mongo')
const { Message, ContractList, User, Worker, Enterprise, sequelize, JobExpectation, Job, Prologue } = require('../models')
const { withFilter } = require('graphql-subscriptions');
const { Op } = require('sequelize');
const { format } = require('../utils/string_format');
const {defaultMessageDetails} = require('../project.json')
function checkBlackList(to, from) {

}
async function sendMessageFunc(to, from, jobId, isPersonal, messageContent, messageType, pubsub) {
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
        from,
        detail: messageContent,
        message_type: messageType,
        readed: false,
    })
    ContractList.upsert({
        user_id: from,
        identity: isPersonal,
        target: to,
        last_msg: msg.detail,
        job_id: jobId
    }, {
        user_id: from
    }, {
        returning: true
    }).then((res) => {
        if (res[0].isNewRecord) {
            User.findOne({
                where: {
                    user_id: res[0].dataValues.target,
                    disabled: false,
                },
                include: include ? include : [],
            }), then(user => {
                pubsub.publish("NEW_CONTRACT", {
                    newContract: {
                        target: user.id,
                        user_id: from,
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
        identity: !isPersonal,
        target: from,
        last_msg: msg.detail,
        job_id: jobId
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
                    user_id: from,
                    disabled: false
                },
                include: include ? include : [],
            }), then(user => {
                pubsub.publish("NEW_CONTRACT", {
                    newContract: {
                        target: user.id,
                        user_id: from,
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
const sendMessage = async (parent, args, { userInfo, pubsub }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization');
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.identity) throw new AuthenticationError('missing identity');
    const { to, messageType, messageContent, jobId } = args.info;
    if (to == userInfo.user_id) throw new UserInputError("could not send message to yourself");
    checkBlackList(to, userInfo.user_id);
    let isPersonal = (userInfo.identity.identity == 'PersonalUser');
    
    await sendMessageFunc(to, userInfo.user_id, jobId, isPersonal, messageContent, messageType, pubsub);
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
                createdAt: item.dataValues.createdAt.toISOString(),
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
    let where = {
        user_id: userInfo.user_id,
        identity: isPersonal
    }
    where['"User"."disabled"'] = sequelize.literal('"User"."disabled" = false');
    let res = await ContractList.findAll({
        where,
        include: include_gen(isPersonal),
    });
    // console.log(res);
    if (isPersonal) {
        res = res.map(item => {
            if(!item.User.Worker) item.User.Worker = {
                pos: null,
                Enterprise: {
                    enterprise_name: null,
                },
                real_name: "已注销"
            }
            return {
                id: userInfo.user_id == item.user_id ? item.target : item.user_id,
                logo: item.User.image_url,
                name: item.User.Worker.real_name,
                pos: item.User.Worker.pos,
                ent: item.User.Worker.Enterprise.enterprise_name,
                last_msg: item.last_msg,
                last_msg_time: item.updatedAt.toISOString(),
                job: {
                    id: item.Job.dataValues.id,
                    title: item.Job.dataValues.title
                },
            }
        })
    } else {
        res = res.map(item => {
            // console.log(item.User.dataValues.JobExpectations)
            return {
                id: userInfo.user_id == item.user_id ? item.target : item.user_id,
                logo: item.User.image_url? item.User.image_url : "",
                job: {
                    id: item.Job.dataValues.id,
                    title: item.Job.dataValues.title
                },
                name: item.User.real_name ? item.User.real_name : item.User.username,
                gender: item.User.gender,
                age: new Date().getFullYear() - new Date(item.User.birth_date).getFullYear(),
                exp: new Date().getUTCFullYear() - new Date(item.User.first_time_working).getFullYear(),
                job_category_expectation: item.User.dataValues.JobExpectations[0].job_category,
                city_expectation: item.User.dataValues.JobExpectations[0].aimed_city,
                salary_expectations: [item.User.dataValues.JobExpectations[0].min_salary_expectation, item.User.dataValues.JobExpectations[0].max_salary_expectation],
                job_status: item.User.job_status,
                last_log_out_time: item.User.last_log_out_time,
                last_msg: item.last_msg,
                last_msg_time: item.updatedAt.toISOString(),
            }
        })
    }
    return res;
}
const UserSendPrologue = async (parent, args, { userInfo, pubsub }, info) => {
    const {job_id, to, prologue} = args;
    let messageContent;
    if(prologue) {
        messageContent = prologue;
    } else {
        const {job_name, exp} = args.selections;
        messageContent = format(defaultMessageDetails.greeting, exp, job_name);
    }
    let isPersonal = (userInfo.identity.identity == 'PersonalUser');
    await sendMessageFunc(to, userInfo.user_id, job_id, isPersonal, messageContent, "Normal", pubsub)
} 

function include_gen(isPersonal) {
    let include = [];
    if (isPersonal) {
        include.push({
            model: User,
            attributes: ["image_url", "username"],
            include: [{
                model: Worker,
                attributes: ["real_name", "pos"],
                include: [{
                    model: Enterprise,
                    attributes: ["enterprise_name"]
                }]
            }],
        })
    } else {
        include.push({
            model: User,
            attributes: ["id","image_url", "username", "education", "first_time_working", "gender", "birth_date", "current_city", "job_status"],
            include: [{
                model: JobExpectation,
                attributes: ["job_category", "aimed_city", "min_salary_expectation", "max_salary_expectation"],
                limit: 1,
                order: [["updatedAt", "DESC"]]
            }],

        });
    }
    include.push({
        model: Job,
        attributes: ["id", "title"]
    })
    return include;
}
module.exports = {
    sendMessage,
    newMessage,
    UserGetMessages,
    UserGetContractList,
    newContract,
    UserSendPrologue
}