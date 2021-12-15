const { logIn,
    numberCheck,
    register,
    chooseOrSwitchIdentity,
    resetPassword,
    refreshToken,
    UserVerifyCodeConsume,
    UserEditBasicInfo,
    UserGetBasicInfo,
    UserGetEnterpriseDetail_EntInfo } = require('./user');
const { sendSms } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber, showDatas } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns, getAllRegion } = require('./citys_data');
const { sendMessage, newMessage, UserGetMessages, UserGetContractList, newContract } = require('./message')
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
    HREndInterview,
    HRRemoveJob,
    ENTRecruitmentApply
} = require('./enterprise');
const { CandidateGetAllJobExpectations, CandidateGetJobList, CandidateGetJob,
    CandidateGetEnterpriseDetail_HRList,
    CandidateGetEnterpriseDetail_InterviewRecomment,
    CandidateGetEnterpriseDetail_QA,
    CandidateGetHRDetail_HRInfo,
    CandidateGetHRDetail_RecommendationsList,
    CandidateGetHRDetail_JobListPageView,
    CandidateGetAllJobCategoriesByEntId,
    CandidateGetJobListByEntId,
    CandidateEditPersonalAdvantage,
    CandidateEditWorkExprience,
    CandidateRecruitmentApply,
    CandidateEditJobExpectations } = require('./candidate');
const { getCensorList, setCensoredForAnItem, AdminLogIn, AdminGetUserList } = require('./admin');
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
        UserVerifyCodeConsume,
        UserGetMessages,
        CandidateGetAllJobExpectations,
        CandidateGetJobList,
        CandidateGetJob,
        UserGetEnterpriseDetail_EntInfo,
        CandidateGetEnterpriseDetail_HRList,
        CandidateGetEnterpriseDetail_InterviewRecomment,
        CandidateGetEnterpriseDetail_QA,
        CandidateGetHRDetail_HRInfo,
        CandidateGetHRDetail_RecommendationsList,
        CandidateGetHRDetail_JobListPageView,
        CandidateGetAllJobCategoriesByEntId,
        CandidateGetJobListByEntId,
        UserGetContractList,
        UserGetBasicInfo,
        AdminLogIn,
        AdminGetUserList
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
        HRInviteInterview,
        HREndInterview,
        UserEditBasicInfo,
        HRRemoveJob,
        ENTRecruitmentApply,
        CandidateEditPersonalAdvantage,
        CandidateEditWorkExprience,
        CandidateRecruitmentApply,
        CandidateEditJobExpectations
    },
    Subscription: {
        newMessage,
        newContract
    }
};
module.exports = {
    resolvers
}