const {logIn, numberCheck, register, getUsers} = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData } = require('./extra_data');
const resolvers = {
    Query: {
        logIn: logIn,
        numberCheck: numberCheck,
        sendSms: sendSms,
        getUsers: getUsers
    },
    Mutation: {
        register: register,
        insertPersonalData: insertPersonalData
    }
};
module.exports = {
    resolvers
}