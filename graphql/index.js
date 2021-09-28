const { logIn, numberCheck, register, getUsers } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck } = require('./extra_data');
const { singleUpload } = require('./upload');
const resolvers = {
    Query: {
        logIn: logIn,
        numberCheck: numberCheck,
        sendSms: sendSms,
        getUsers: getUsers,
        phoneNumberCheck: phoneNumberCheck,
    },
    Mutation: {
        register: register,
        insertPersonalData: insertPersonalData,
        singleUpload: singleUpload,
    }
};
module.exports = {
    resolvers
}