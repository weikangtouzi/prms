const { logIn,
    numberCheck,
    register,
    chooseOrSwitchIdentity,
    resetPassword,
    refreshToken,
    UserVerifyCodeConsume,
    UserEditBasicInfo,
    UserGetBasicInfo,
    UserGetEnterpriseDetail_EntInfo,
    UserGetEnterpriseDetail_WorkerList,
    UserGetJobListByEntId,
    UserChangePhoneNumber,
    UserEditEmail,
    StaticGetHotJobs,
    UserSearchEnterprise,
    UserGetJob,
    userGetRecruitmentList,
    UserAddJobExpectation,
    UserEditJobExpectation,
    UserGetEnterpriseQuestions,
} = require('./user');
const { sendSms, sendEmail } = require('./send_sms');
const { insertPersonalData, phoneNumberCheck, checkIdCardNumber, showDatas } = require('./extra_data');
const { singleUpload } = require('./upload');
const { getProvinces, getCities, getCounties, getTowns, getAllRegion } = require('./citys_data');
const { sendMessage, newMessage, UserGetMessages, UserGetContractList, newContract, UserSendPrologue } = require('./message')
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
    ENTRecruitmentApply,
    ENTRemoveWorker,
    HRHideJob,
    ENTSetDisabled,
    ENTSetEnabled,
    editJob,
    ENTSearchCandidates,
    ENTEditAccountInfo,
    ENTGetAccountInfo,
    HRGetInterviewcomments
} = require('./enterprise');
const { CandidateGetAllJobExpectations, CandidateGetJobList,
    CandidateGetEnterpriseDetail_InterviewRecomment,
    CandidateGetHRDetail_HRInfo,
    CandidateGetHRDetail_RecommendationsList,
    CandidateGetHRDetail_JobListPageView,
    CandidateGetAllJobCategoriesByEntId,
    CandidateEditPersonalAdvantage,
    CandidateEditWorkExprience,
    CandidateRecruitmentApply,
    CandidateEditJobExpectations,
    CandidateGetWorkExps,
    CandidateGetOnlineResumeBasicInfo,
    CandidateEditSkills,
    CandidateGetEduExps,
    CandidateGetProjectExps,
    CandidateEditEduExp,
    CandidateEditProExp,
    CandidateRemoveEduExp,
    CandidateRemoveProExp,
    CandidateRemoveWorkExp,
    CandidateRemoveJobExpectation } = require('./candidate');
const { getCensorList, setCensoredForAnItem, AdminLogIn, AdminGetUserList } = require('./admin');
const resolvers = {
    JobDataListForAllUsers: {
        __resolveType(obj, context, info) {
            if (obj.min_salary) {
                return 'JobDataBriefly'
            } else {
                return 'JobDataForHRDetailPageOrEntJobList'
            }
        },
    },
    ContractItem: {
        __resolveType(obj, context, info) {
            if (obj.job_status) {
                return 'Talent'
            } else {
                return 'Contract'
            }
        }
    },
    JobDetailPageReply: {
        __resolveType(obj, context, info) {
            if (obj.status) {
                return 'JobDetailPageReplyEnt'
            } else {
                return 'JobDetailPageReplyCandiate'
            }
        }
    },
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
        UserGetMessages,
        CandidateGetAllJobExpectations,
        CandidateGetJobList,
        // CandidateGetJob,
        UserGetEnterpriseDetail_EntInfo,
        UserGetEnterpriseDetail_WorkerList,
        CandidateGetEnterpriseDetail_InterviewRecomment,
        CandidateGetHRDetail_HRInfo,
        CandidateGetHRDetail_RecommendationsList,
        CandidateGetHRDetail_JobListPageView,
        CandidateGetAllJobCategoriesByEntId,
        UserGetJobListByEntId,
        UserGetContractList,
        UserGetBasicInfo,
        AdminLogIn,
        AdminGetUserList,
        StaticSendEmail: sendEmail,
        StaticGetHotJobs,
        UserSearchEnterprise,
        ENTSearchCandidates,
        UserGetJob,
        UserGetRecruitmentList: userGetRecruitmentList,
        CandidateGetWorkExps,
        UserGetEnterpriseQuestions,
        CandidateGetOnlineResumeBasicInfo,
        ENTGetAccountInfo,
        CandidateGetEduExps,
        CandidateGetProjectExps,
        HRGetInterviewcomments
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
        CandidateEditJobExpectations,
        ENTRemoveWorker,
        HRHideJob,
        UserChangePhoneNumber,
        UserEditEmail,
        ENTSetDisabled,
        ENTSetEnabled,
        HREditJob: editJob,
        UserSendPrologue,
        UserVerifyCodeConsume,
        UserAddJobExpectation,
        UserEditJobExpectation,
        ENTEditAccountInfo,
        CandidateEditProExp,
        CandidateEditSkills,
        CandidateEditEduExp,
        CandidateRemoveEduExp,
        CandidateRemoveProExp,
        CandidateRemoveWorkExp,
        CandidateRemoveJobExpectation
    },
    Subscription: {
        newMessage,
        newContract
    }
};
module.exports = {
    resolvers
}