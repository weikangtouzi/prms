const { logIn, numberCheck, register, chooseOrSwitchIdentity, resetPassword, refreshToken, UserVerifyCodeConsume } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber,showDatas } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns, getAllRegion } = require('./citys_data');
const {sendMessage,newMessage} = require('./message')
const { editEnterpriseBasicInfo, 
    editEnterpriseWorkTimeAndWelfare, 
    editEnterpriseExtraData, 
    enterpriseIdentify, 
    checkEnterpriseIdentification, 
    inviteWorkMate, 
    precheckForInviteWorkMate, 
    postJob,
    insertEnterpriseBasicInfo,
    HRInviteInterview,
    HREndInterview
} = require('./enterprise');
const { getCensorList, setCensoredForAnItem } = require('./admin');
const resolvers = {
    Query: {
        UserLogIn: logIn,
        UserNumberCheck: numberCheck,
        StaticSendSms: sendSms,
        // getUsers: getUsers,
        QNPhoneNumberCheck: phoneNumberCheck,
        QNCheckIdCardNumber: checkIdCardNumber,
        StaticGetProvinces: getProvinces,
        StaticGetCities: getCities,
        StaticGetCounties: getCounties,
        StaticGetTowns: getTowns,
        ENTCheckEnterpriseIdentification: checkEnterpriseIdentification,
        AdminGetCensorList: getCensorList,
        StaticGetAllRegion: getAllRegion,
        ENTPrecheckForInviteWorkMate: precheckForInviteWorkMate,
        TestShowDatas: showDatas,
        UserVerifyCodeConsume
    },
    Mutation: {
        UserRegister: register,
        QNInsertPersonalData: insertPersonalData,
        CommonSingleUpload: singleUpload,
        UserChooseOrSwitchIdentity: chooseOrSwitchIdentity,
        UserResetPassword: resetPassword,
        ENTEditEnterpriseBasicInfo: editEnterpriseBasicInfo,
        ENTEditEnterpriseWorkTimeAndWelfare: editEnterpriseWorkTimeAndWelfare,
        ENTEditEnterpriseExtraData: editEnterpriseExtraData,
        UserRefreshToken: refreshToken,
        UserEnterpriseIdentify: enterpriseIdentify,
        ENTInviteWorkMate: inviteWorkMate,
        HRPostJob: postJob,
        AdminSetCensoredForAnItem: setCensoredForAnItem,
        ENTInsertEnterpriseBasicInfo: insertEnterpriseBasicInfo,
        UserSendMessage: sendMessage,
        HRInviteInterview
    },
    Subscription: {
        newMessage
    }
};
module.exports = {
    resolvers
}