const {PubSub} = require('graphql-subscriptions')
const {Message} = require('../models')
const pubsub = new PubSub()
let msg = Message.create({
    user_id: 1,
    from: 1,
    detail: "messageContent",
    message_type: "Normal",
    readed: false,
}).then(res => {
    pubsub.publish("NEW_MESSAGE", { newMessage: {
        to: 1,
        ...msg,
    } })
})
