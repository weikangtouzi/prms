const { logIn, numberCheck, register, chooseOrSwitchIdentity, resetPassword, refreshToken } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns } = require('./citys_data');
const { editEnterpriseBasicInfo, editEnterpriseWorkTimeAndWelfare, editEnterpriseExtraData, enterpriseIdentify, checkEnterpriseIdentification } = require('./enterprise')
const {getCensorList} = require('./admin')
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
        checkEnterpriseIdentification,
        getCensorList
    },
    Mutation: {
        register,
        insertPersonalData,
        singleUpload,
        chooseOrSwitchIdentity,
        resetPassword,
        editEnterpriseBasicInfo,
        editEnterpriseWorkTimeAndWelfare,
        editEnterpriseExtraData,
        refreshToken,
        enterpriseIdentify,
        
    }
};
module.exports = {
    resolvers
}