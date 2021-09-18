const {logIn, numberCheck, register, getUsers} = require('./user');
const { sendSms } = require('./send_sms');
const resolvers = {
    Query: {
        logIn: logIn,
        numberCheck: numberCheck,
        sendSms: sendSms,
        getUsers: getUsers
    },
    Mutation: {
        register: register,
    }
};
module.exports = {
    resolvers
}