const { logIn, numberCheck, register, chooseOrSwitchIdentity, resetPassword } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns } = require('./citys_data');
const { editEnterpriseBasicInfo, editEnterpriseWorkTimeAndWelfare } = require('./enterprise')
const resolvers = {
    Query: {
        logIn,
        numberCheck,
        sendSms,
        // getUsers: getUsers,
        phoneNumberCheck,
        checkIdCardNumber,
        getProvinces,
        getCities,
        getCounties,
        getTowns,
    },
    Mutation: {
        register,
        insertPersonalData,
        singleUpload,
        chooseOrSwitchIdentity,
        resetPassword,
        editEnterpriseBasicInfo,
        editEnterpriseWorkTimeAndWelfare
    }
};
module.exports = {
    resolvers
}