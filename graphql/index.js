const { logIn, numberCheck, register, chooseOrSwitchIdentity, resetPassword, refreshToken } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber,showDatas } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns, getAllRegion } = require('./citys_data');
const { editEnterpriseBasicInfo, 
    editEnterpriseWorkTimeAndWelfare, 
    editEnterpriseExtraData, 
    enterpriseIdentify, 
    checkEnterpriseIdentification, 
    inviteWorkMate, 
    precheckForInviteWorkMate, 
    postJob,
    insertEnterpriseBasicInfo
} = require('./enterprise')
const { getCensorList, setCensoredForAnItem } = require('./admin')
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
        getCensorList,
        getAllRegion,
        precheckForInviteWorkMate,
        showDatas
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
        inviteWorkMate,
        postJob,
        setCensoredForAnItem,
        insertEnterpriseBasicInfo
    }
};
module.exports = {
    resolvers
}