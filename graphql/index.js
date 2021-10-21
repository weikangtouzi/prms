const { logIn, numberCheck, register, chooseOrSwitchIdentity, resetPassword } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns } = require('./citys_data');
const { editEnterpriseBasicInfo } = require('./enterprise')
const resolvers = {
    Query: {
        logIn: logIn,
        numberCheck: numberCheck,
        sendSms: sendSms,
        // getUsers: getUsers,
        phoneNumberCheck: phoneNumberCheck,
        checkIdCardNumber: checkIdCardNumber,
        getProvinces: getProvinces,
        getCities: getCities,
        getCounties: getCounties,
        getTowns: getTowns,
    },
    Mutation: {
        register: register,
        insertPersonalData: insertPersonalData,
        singleUpload: singleUpload,
        chooseOrSwitchIdentity: chooseOrSwitchIdentity,
        resetPassword: resetPassword,
        editEnterpriseBasicInfo: editEnterpriseBasicInfo,
    }
};
module.exports = {
    resolvers
}