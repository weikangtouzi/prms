const express = require('express');
const {
  ApolloServerPluginLandingPageGraphQLPlayground
} = require("apollo-server-core");
const { ApolloServer, gql } = require('apollo-server-express');
const { sequelize } = require('./models');
const {
  GraphQLUpload,
  graphqlUploadExpress, // A Koa implementation is also exported.
} = require('graphql-upload');
const { resolvers } = require('./graphql');
const { GraphQLScalarType, GraphQLUnionType, GraphQLInputObjectType, execute, subscribe, GraphQLString } = require('graphql');
const mongo = require('./mongo');
const fs = require('fs');
const { env, uploadPath } = require('./project.json');
const http = require('http');
const https = require('https');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const contextMiddleware = require('./utils/contextMiddleware');
const { EnterpriseCertificationStatus, EnterpriseRole, WorkerMatePrecheckResult, MessageType, FullTime, Education, EnterpriseSize, EnterpriseFinancing, EnterpriseNature, Identity } = require('./graphql/types')
const { info } = require('./utils/logger');

const Void = new GraphQLScalarType({
  name: 'Void',

  description: 'Represents NULL values',

  serialize(value) {
    return value ? value : null;
  },

  parseValue() {
    return null
  },

  parseLiteral() {
    return null
  }
})

// The GraphQL schema
const typeDefs = gql`
  scalar Upload
  scalar Void
  "enum Education {\
    LessThanPrime,\
    Primary,\
    Junior,\
    High,\
    JuniorCollege,\
    RegularCollege,\
    Postgraduate,\
    Doctor\
  }"
  scalar Education
  # data used by register user
  input Register {
    "username: required, unique, make sense by the name"
    username: String!
    "email: not required in this version, unique, make sense by the name"
    email: String
    "password: required, rule not set up yet"
    password: String!
    "confirmPassword: required, exactly same as password"
    confirmPassword: String!
    "phoneNumber: required, unique, make sense by the name"
    phoneNumber: String!
  }
  "the return type of getUsers api, not stable now, just because the api not implement yet"
  type User {
    "username: the username of the user stored in the database"
    username: String!,
  }
  "logInResult: the result of the login operation"
  type LoginResult {
    "maybe become nullable in the future"
    username: String!,
    "the very first time the user is created"
    createdAt: String!,
    "jwt token for the user, expiresIn 60 minutes"
    token: String!,
  }
  "the data of province, usually contains name and id"
  type Province {
    "this id is = require(the official data, so don't trying to change it"
    province_id: String!,
    name: String!
  }
  type City {
    city_id: String!,
    name: String!
  }
  type County {
    county_id: String!,
    name: String!
  }
  type Town {
    town_id: String!,
    name: String!
  }
  input LogIn {
    account: String!,
    password: String,
    deviceId: String
  }
  
  "min education required for the job"
  enum EducationRequired {
    High,
    JuniorCollege,
    RegularCollege,
    Postgraduate,
    Doctor
  }
  "the data = require(the providers?"
  input PersonalData {
    "real name"
    name: String!,
    number: String!,
    idCardNum: String!,
    education: Education!,
    city: String!,
    skills: [String]!
  }
  type PersonalDataDetail {
    name: String!,
    number: String!,
    idCardNum: String!,
    education: Education!,
    city: String!,
    skills: [String]!
  }
  type PersonalDataView {
    _id: String!,
    "real name"
    data: PersonalDataDetail
  }
  "a job always contains these datas. these are formatted data, not exactly what is in database"
  type JobDataForJobDetailPage {
    id: Int!,
    title: String!,
    category: [String]!,
    detail: String!,
    adress_coordinate: [Float]!,
    adress_description: [String]!,
    salaryExpected: [Int]!,
    experience: Int,
    education: Education,
    required_num: Int!,
    full_time_job: FullTime!,
    tags: [String],
    updatedAt: String!,
  }
  type HRInfoForJobDetailPage {
    id: Int!,
    name: String!,
    pos: String!,
    last_log_out_time: String,
    logo: String!
  }
  type CompInfoForJobDetailPage {
    id: Int!,
    name: String!,
    address_coordinates: [Float]!,
    address_description: [String]!,
    industry_involved: String!,
    business_nature: EnterpriseNature!,
    enterprise_logo: String!
  }
  type JobDetailPageReply {
    job: JobDataForJobDetailPage!,
    hr: HRInfoForJobDetailPage!,
    company: CompInfoForJobDetailPage!
  } 
  "for list query"
  type JobDataBriefly {
    id: Int!,
    job_id: Int!,
    hr_name: String!,
    hr_pos: String!,
    title: String!,
    category: [String]!,
    adress_coordinate: String!,
    min_salary: Int!,
    max_salary: Int!,
    min_experience: Int!,
    min_education: Education!,
    ontop: Boolean!,
    full_time_job: FullTime!,
    tags: [String]!,
    comp_name: String!,
    comp_size: EnterpriseSize!,
    comp_financing: EnterpriseFinancing!,
    expired_at: String!,
    logo: String!,
    emergency: Boolean!
  }
  type JobSimpifiedDataPageView {
    page: Int!,
    pageSize: Int!,
    count: Int!,
    data: [JobDataBriefly]!
  }
  "enum {Full,\
        Part,\
        InternShip}"
  scalar FullTime
  input JobPost {
    JobTitle: String!,
    workingAddress: String!,
    experience:Int!,
    "just a two value array which first value means the min one, second means the max"
    salary: [Int]!,
    education: EducationRequired!,
    description: String!,
    requiredNum: Int!,
    isFullTime: FullTime!,
    tags: [String]!,
    coordinates: [Float]!
  }
  "because the personal data is already exists, I choos this for the name"
  input BasicData {
    "a link to the file"
    logo: String!,
    realName: String!,
    username: String!,
    birthday: Int!,
    gender: Boolean!,
    currentCity: String!,
    phoneNumber: String!,
    education: Education!,
    firstTimeWorking: String!,
  }
  input WorkExperience {
    "for edit you need pass this data"
    id: Int,
    compName: String!,
    posName: String!,
    department: String!,
    startAt: String!,
    endAt: String!,
    workDetail: String!,
    hideFromThisCompany: Boolean!
  }
  input EduExp {
    "for edit you need pass this data"
    id: Int,
    schoolName: String!,
    education: Education!,
    isFullTime: Boolean!,
    major: String!,
    time: String!,
    exp_at_school: String!
  }
  input ProExp {
    "for edit you need pass this data"
    id: Int,
    projectName: String!,
    role: String!,
    startAt: String!,
    endAt: String!,
    description: String!,
    performance: String
  }
  type ResumePersonalData {
    "a link to the file"
    logo: String!,
    realName: String!,
    age: Int!,
    gender: Boolean!,
    phoneNumber: String!,
    education: Education!,
    WorkExperienceTime: Int!,
  }
  enum ResumeJobStatus {
    "不想找工作的无业游民"
    NoJobButNoJob,
    "离职状态的求职者"
    NoJobButWantJob,
    "有工作，但无求职意向"
    OnTheJob, 
    "准备跳槽下家的在职者"
    OnTheJobButLookingForAJob,
    "应届生"
    GraduatingStudent
  }
  enum ResumeEmployNature {
    "随时待命"
    Anytime, 
    "两天之内"
    LessThanTwoDays,
    "一周之内" 
    LessThanOneWeek, 
    "两周内"
    LessThanTwoWeeks,
    "一月内" 
    LessThanOneMonth,
    "大于一个月" 
    MoreThanOneMonth
  }
  type JobExpectation {
    jobCategory: [String]!,
    aimedCity: String!,
    salary: String!
  }
  type ResumeWorkExp {
    enterpriseName: String!,
    positionName: String!,
    departmentName: String!,
    time: String!,
    detail: String!
  }
  type ResumeProExp {
    projectName: String!,
    role: String!,
    time: String!,
    detail: String!
    "maybe not needed to send when showing the whole resume at a page"
    project_performance: String,
  }
  type ResumeEduExp {
    schoolName: String!,
    major: String!,
    "check out Education type for value options"
    education: String!,
    detail: String!
  }
  type ResumeData {
    personalData: ResumePersonalData!,
    "checkout ResumeJobStatus type for value options"
    jobStatus: String!,
    "checkout ResumeEmployNature type for value options"
    employmentNature: String!,
    jobExpectation: JobExpectation!
    workExperience: [ResumeWorkExp],
    projectExperience: [ResumeProExp],
    educationExperience: [ResumeEduExp],
  }
  "for personal user the interview data will be like this"
  type PersonalUserSideInterviewData {
    enterpriseName: String!,
    jobName: String!,
    salary: String!,
    hrName: String!,
    hrPosition: String!,
  }
  "for enterprise user interview data will be like this"
  type EnterpriseUserSideInterviewData {
    targetName: String!,
    jobName: String!,
    jobExpectation: String!,
    salary: String!,
  }
  enum InterviewProcess {
    "Waiting is a status that stands for waiting applicant to accept this invitation"
    Waiting,
    "whatnever this is canceled the status will be set to Canceled, when status is like this, return value will contains a description of the canceled status"
    Canceled,
    "means this interview is not able to be canceled now, but may not be started yet"
    Started,
    "Only HR could set this, means this applicant is not the one their company is looking for"
    Failed,
    "means this applicant get that offer, but may not choose to work there"
    Passed
  }
  type InterviewDetail {
    enterpriseName: String!,
    hrName: String!,
    hrPosition: String!,
    time: String!,
    jobName: String!,
    jobSalary: String!,
    jobContractor: String!,
    jobContractedNumer: String!,
    isOutline: Boolean!,
    address: String!,
    attachments: String!,
    "checkout InterviewProcess type for value options"
    process: String!,
    
  }
  "make it available when different thing happens in same query"
  union InterviewData = PersonalUserSideInterviewData | EnterpriseUserSideInterviewData
  enum ActiveTime {
    Today,
    LastDay,
    RecentlyThreeDays,
    RecentlyOneWeek,
    MoreThanOneWeek
  }
  type ApplicantData {
    applicantName: String!,
    age: Int!,
    experience: Int!,
    "checkout Education type for value options"
    education: String!,
    salaryExpected: String!,
    "null when not had job before"
    lastJobName: String,
    "same as last field"
    lastEnterpriseName: String,
    "also same as last field"
    lastJobTime: String,
    personalAdvantage: String!,
  }
  input JobFilter {
    salaryExpected: [Int],
    experience: Int,
    education: Education,
    enterpriseSize: EnterpriseSize,
    enterpriseFinancing: EnterpriseFinancing,
    sortWithDistance: [Float],
    category: [String],
    full_time_job: FullTime,
    page: Int,
    pageSize: Int
  }
  input ApplicantFilter {
    token:String!, 
    "checkout Education type for value options"
    education: String,
    experience: Int,
    "checkout ActiveTime type for value options"
    activeTime: String,
    age: Int,
    "true means male, sorry for female people"
    gender: Boolean,
    "checkout ResumeJobStatus type for value options"
    jobStatus: String,
    city: String,
    category: String,
    min_salary: Int,
    max_salary: Int,
  }
  "enum {\
    PersonalUser,\
    EnterpriseUser,\
    Administrator,\
    Counselor,\
  }"
  scalar Identity
  "reset password means that user forget password"
  input ResetPassword {
    phoneNumber: String!,
    password: String!,
    confirmPassword: String!,
  }
  "enum EnterpriseNature {\
    ForeignVentures,\
    ForeignFundedEnterprises, \
    PrivateEnterprise, \
    StateOwnedEnterprises, \
    Extra\
  }"
  scalar EnterpriseNature
  
  "enum EnterpriseFinancing {\
    NotYet,\
    AngelFinancing,\
    A,\
    B,\
    C,\
    D,\
    Listed,\
    NoNeed\
  }"
  scalar EnterpriseFinancing 
  
  "enum EnterpriseSize {\
    LessThanFifteen, \
    FifteenToFifty, \
    FiftyToOneHundredFifty, \
    OneHundredFiftyToFiveHundreds, \
    FiveHundredsToTwoThousands, \
    MoreThanTwoThousands\
  }"
  scalar EnterpriseSize
  
  enum EnterpriseRestRule {
    OneDayOffPerWeekend, 
    TwoDayOffPerWeekend, 
    StaggerWeekends
  }
  enum EnterpriseOvertimeDegree {
    None, 
    Occasionally, 
    Usually
  }
  input EnterpriseBasicInfo {
    enterpriseName: String!,
    abbreviation: String!,
    "pass the whole adress information in this array"
    enterpriseLocation: [String]!,
    "longtitude and latitude"
    enterprisecCoordinate: [Float]!,
    "checkout EnterpriseNature type for value options"
    enterpriseNature: EnterpriseNature!,
    enterpriseIndustry: [String]!,
    "checkout EnterpriseIndustry type for value options"
    enterpriseFinancing: EnterpriseFinancing!,
    "checkout EnterpriseSize type for value options"
    enterpriseSize: EnterpriseSize!,
    enterpriseProfile: String!,
    logo: String,
    establishedDate: String,
    homepage: String,
    tel: String
  }
  enum CustomFileType {
    Charter,
    Resume,
    Photo,
    Other
  }
  input UploadExtraAttributes {
    customUploadPath: String,
    customFileName: String,
    "checkout CustomFileType for value options"
    customFileType: String,
  }
  input EnterpriseWorkTimeAndWelfare {
    workRule: String,
    restRule: String,
    welfare: [String],
    overtimeWorkDegree: String,
    customTags: [String]
  }
  type InterviewSchedule {
    schedul: [InterviewData]!,
    
  }
  type SearchApplicantsResult {
    data: [ApplicantData],
  }
  type FileLink {
    link: String!,
  }
  input EnterpriseCharterSencorRequest {
    enterpriseName: String!,
    charter: String!,
    "just a phone number for notification"
    phoneNumber: String
  }
  "enum {None, Failed, Passed, Waiting}"
  scalar EnterpriseIdentificationStatus
  "if the status is Failed, will get the other three fields"
  type EnterpriseIdentification {
    status: EnterpriseIdentificationStatus,
    enterpriseName: String,
    charter: String,
    phoneNumber: String
  }
  type CensorData {
    _id: String!,
    enterpriseName: String,
    charter: String,
  }
  "enum Role {\
    HR,\
    Teacher,\
    Admin,\
    None\
  }"
  scalar EnterpriseRole
  "enum WorkerMatePrecheckResult {\
    OK\
    NotAUser\
    AlreadyWorkMate\
    WorkingInAnotherCompany\
  }"
  scalar WorkerMatePrecheckResult
  type Town {
    town_id: String!,
    name: String!
  }
  type CountyWithChildren {
    county_id: String!,
    name: String!,
    Towns: [Town]!
  }
  type CityWithChildren {
    city_id: String!,
    name: String!,
    Counties: [CountyWithChildren]!,
  }
  type ProvinceWithChildren {
    province_id: String!,
    name: String!,
    Cities: [CityWithChildren]!,
  }
  type RegionList {
    data: [ProvinceWithChildren]!
  }
  "enum {\
    Normal,\
    System,\
    Resume,\
    InterviewInvitation,\
    Other\
    }"
  scalar MessageType
  input SendMessage {
    to: Int!,
    messageType: MessageType!,
    messageContent: String!
  }
  type MessageEntitySelectionString {
    value: String
  }
  type MessageEntitySelectionInt {
    value: Int
  }
  
  type Message {
    "0 for system message"
    from: String!,
    messageType: MessageType!,
    messageContent: String!
    to: String!,
    uuid: String!,
  }
  "same datas as the Insert one, but are all not required"
  input EditEnterpriseBasicInfo {
    enterpriseName: String,
    abbreviation: String,
    "pass the whole adress information in this array"
    enterpriseLocation: [String],
    "longtitude and latitude"
    enterprisecCoordinate: [Float],
    "checkout EnterpriseNature type for value options"
    enterpriseNature: EnterpriseNature,
    enterpriseIndustry: [String],
    "checkout EnterpriseIndustry type for value options"
    enterpriseFinancing: EnterpriseFinancing,
    "checkout EnterpriseSize type for value options"
    enterpriseSize: EnterpriseSize,
    enterpriseProfile: String,
    logo: String,
    establishedDate: String,
    homepage: String,
    tel: String
  }
  input EnterpriseWorkerInfo {
    role: EnterpriseRole!,
    pos: String!,
  }
  input VerifyInfo {
    phoneNumber: String!,
    verifyCode: String!,
    operation: String!
  }
  type MessagePage {
    messages: [Message]!,
    count: Int!,
    page: Int!,
    pageSize: Int!,
  }
  type JobExpectation {
    job_category: [String]!,
    aimed_city: String!,
    min_salary_expectation: Int!,
    max_salary_expectation: Int!
  }
  type EnterpriseInfoForEntDetail {
    enterprise_name: String!,
    business_nature: EnterpriseNature!,
    industry_involved: [String]!,
    enterprise_profile: String!,
    enterprise_financing: EnterpriseFinancing!,
    enterprise_size: EnterpriseSize,
    enterprise_welfare:[String],
    enterprise_logo: String,
    tags: String,
    enterprise_coordinates: [Float]!,
    enterprise_loc_detail: [String]!,
    extra_attribute: String,
    rest_rule: String,
    overtime_work_degree: String,
    homepage: String,
    established_time: Int,
    tel: Int,
    work_time: Int,
    createdAt: String!,
  }
  type HRInfoForEntDetail {
    id: Int!,
    name: String!,
    logo: String!,
    pos: String!
  }
  type InterviewRecommentInfoForEntDetail{
    id: Int!,
    user_name: String!,
    score: Float!,
    job_name: String!,
    tags: [String]!,
    content: String!,
    thumbs: Int!,
    createdAt: String!,
    logo: String!,
  }
  type InterviewRecommentListForEntDetail {
    total: Float!,
    description: Float!,
    comp_env: Float!,
    HR: Float!,
    count: Int!,
    recommends: [InterviewRecommentInfoForEntDetail]!
  }
  type EnterpriseQAForEntDetail {
    questionCount: Int!,
    answerCount: Int!,
    question: String!,
    answer: String!
  }
  type JobDataForHRDetailPageOrEntJobList {
    id: Int!,
    title: String!,
    loc: String!,
    experience: Int!,
    education: Education!,
    salary: [Int]!,
    createdAt: String!,
  }
  type RecommendationsListForHRDetailPage {
    data: [JobDataForHRDetailPageOrEntJobList]!,
    count: Int!,
  }
  type HRInfoForHRDetailPage {
    name: String!,
    pos: String!,
    last_log_out_time: String,
    company_belonged: String!,
    logo: String!
  }
  type JobListForHRDetailPageOrEntJobList {
    count: Int!,
    data: [JobDataForHRDetailPageOrEntJobList]!
  }
  "for most of get query needed token for authorization"
  type Query {
    "api for login"
    UserLogIn(info: LogIn!): LoginResult!
    "check if the input num is availiable or not"
    UserNumberCheck(num: String!): Boolean!
    "get Province data"
    StaticGetProvinces: [Province]
    "get all cities of the given province"
    StaticGetCities(provinceId: String!): [City]!
    "get all counties of the given city"
    StaticGetCounties(cityId: String!): [County]!
    "get all town of the given county"
    StaticGetTowns(countyId: String!): [Town]!
    "send a verify code to the given number, if phoneNumber not provider and has token in header, will send to the user's phone number"
    StaticSendSms(phoneNumber: String): String!
    "get job data by id"
    CandidateGetJob(jobid: Int): JobDetailPageReply!
    "get resume data, if cache id exists then will return the cache data, cache expired every 30 minutes"
    CommonGetResume(resumeId: Int, cacheId: String): ResumeData!
    QNPhoneNumberCheck(phoneNumber: String, verifyCode: String): Int!
    "true means already inserted"
    QNCheckIdCardNumber(idCardNum: String!): Boolean!
    "gets InterviewSchedule"
    CommonGetIterviewSchedule: InterviewSchedule!
    "detail page for interview"
    CommonGetIterviewDetail(interviewId: Int!): InterviewDetail
    "get applicant by conditions, null for no limitation, null when no matched data"
    HRGetApplicants(filter: ApplicantFilter): SearchApplicantsResult
    CandidateCheckResumeCompletion: Boolean!
    ENTCheckEnterpriseIdentification: EnterpriseIdentification!
    AdminGetCensorList(pageSize: Int, lastIndex: String): [CensorData]
    StaticGetAllRegion: RegionList!
    ENTPrecheckForInviteWorkMate(phoneNumber: String): WorkerMatePrecheckResult!
    "just tests"
    TestShowDatas(pageSize: Int, lastIndex: String): [PersonalDataView]!
    UserVerifyCodeConsume(info: VerifyInfo) : Void
    "if page not provided it will be 0,for pageSize it will be 10"
    UserGetMessages(targetId: Int!, page: Int, pageSize: Int): MessagePage
    CandidateGetAllJobExpectations: [JobExpectation]!
    CandidateGetJobList(filter:JobFilter): JobSimpifiedDataPageView!
    CandidateGetEnterpriseDetail_EntInfo(entId: Int): EnterpriseInfoForEntDetail!
    CandidateGetEnterpriseDetail_HRList(entId: Int): [HRInfoForEntDetail]!
    CandidateGetEnterpriseDetail_InterviewRecomment(entId: Int): InterviewRecommentListForEntDetail!
    CandidateGetEnterpriseDetail_QA(entId: Int): EnterpriseQAForEntDetail!
    CandidateGetHRDetail_HRInfo(hrId: Int): HRInfoForHRDetailPage!
    CandidateGetHRDetail_RecommendationsList(hrId: Int!): RecommendationsListForHRDetailPage!
    CandidateGetHRDetail_JobListPageView(hrId: Int!, pageSize: Int, page: Int): JobListForHRDetailPageOrEntJobList!
    CandidateGetAllJobCategoriesByEntId(entId: Int): [String]!
    CandidateGetJobListByEntId(entId: Int!, category: String): JobListForHRDetailPageOrEntJobList!
  }
  
  "most of mutations needed token for authorization"
  type Mutation {
    "api for register"
    UserRegister(info: Register!): Void
    "this api need you to pass the provider's phone number as the authorization header"
    QNInsertPersonalData(info: PersonalData!): Int!
    "leave extraAttributes null for default upload options"
    CommonSingleUpload(file: Upload!, extraAttributes: UploadExtraAttributes): FileLink!
    HRPostJob(info: JobPost): Void
    "insert or edit a personal data"
    UserEditBasicInfo(info: BasicData): Void
    "insert or edit a personal advantage"
    CandidateEditPersonalAdvantage(advantage: String!): Void
    "insert or edit a work experience"
    CandidateEditWorkExprience(info: WorkExperience!): Void
    "insert or edit a education experience"
    CandidateEditEduExp(info: EduExp): Void
    "insert or edit a project experience"
    CandidateEditProExp(info: ProExp): Void
    "if wanted to send the online one, then don't need to pass resumeId"
    CandidateSendResume(resumeId:Int, targetUser: Int): Void
    "will create a interview data and set it to waiting, may return the interview id for dev version"
    HRInviteInterview(userId: Int!, jobId: Int!, time: [String]!): Void
    HREndInterview(interviewId: Int!, ispassed:  Boolean!): Void
    "cancel a interview, both side will have this authority, may failed when time is close to the appointed time"
    CommoncancelInterview(interviewId: Int!): Void
    "end a iterview with the description, need to tell the interview is passed or not, most of time the description is about some special situation"
    HREndIterview(interviewId: Int!, ispassed: Boolean!, description: String): Void
    "accept or reject an interview by id"
    CandidateAcceptOrRejectInterview(interviewId: Int!, accept: Boolean!): Void
    "switch to another indentity if exists, should pass indetity and role, Identity and role types are enums, checkout their type definitions, return token"
    UserChooseOrSwitchIdentity(targetIdentity: String!, role: String): Void
    "use phone number to reset password"
    UserResetPassword(info: ResetPassword!): Void
    "enterprise certification need censor"
    UserEnterpriseIdentify(info: EnterpriseCharterSencorRequest!): Void
    "enterprise certificate required, if not will return error"
    ENTEditEnterpriseBasicInfo(info: EditEnterpriseBasicInfo!): Void
    ENTEditEnterpriseWorkTimeAndWelfare(info: EnterpriseWorkTimeAndWelfare!): Void
    ENTEditEnterpriseExtraData(info: String!): Void
    CandidateRecruitmentApply(recruitmentId: Int!): Void
    HRRecruitmentApply(recruitmentId: Int!): Void
    "only availiable when token is expired and not dead"
    UserRefreshToken: String!
    AdminSetCensoredForAnItem(_id: String!, isPassed: Boolean, description: String): Void
    ENTInviteWorkMate(phoneNumber:String!, role: String, pos: String): Void
    ENTInsertEnterpriseBasicInfo(info:EnterpriseBasicInfo!): Void
    ENTEnterpriseWorkerRegister(info: EnterpriseWorkerInfo!): Void
    UserSendMessage(info: SendMessage!): Void
    HRRemoveJob(jobId: Int!): Void
    ENTRecruitmentApply(recruitmentId: Int!, size: String): Void
  }
  type Subscription {
    newMessage: Message!
  }
`;

// A map of functions which return data for the schema.
async function startServer() {
  const configurations = {
    // Note: You may need sudo to run on port 443
    production: { ssl: true, port: 443, hostname: 'example.com' },
    development: { ssl: false, port: 4000, hostname: 'localhost' },
  };
  resolvers.Upload = GraphQLUpload;
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground()
    ],
    context: contextMiddleware.before,
  });
  server.graphqlPath = "/";
  await server.start();

  const app = express();

  app.use(graphqlUploadExpress());
  app.use(uploadPath, express.static(uploadPath.split('/')[1]));
  app.use('/preludeDatas', express.static('datas'));
  server.applyMiddleware({ app });
  let httpServer;
  if (env == 'production') {
    httpServer = https.createServer({
      key: fs.readFileSync('./ssl/2_chenzaozhao.com.key'),
      cert: fs.readFileSync('./ssl/1_chenzaozhao.com_bundle.crt'),
    }, app)
  } else {
    httpServer = http.createServer(app);
  }
  const subscriptionServer = SubscriptionServer.create({
    schema,
    execute,
    subscribe,
    onConnect: contextMiddleware.before,
    onDisconnect: contextMiddleware.ws_close
  }, {
    server: httpServer,
    path: "/graphql"
  });
  await new Promise(r => httpServer.listen({ port: 4000 }, r));
  mongo.init().then(() => {
    info('mongo Connection has been established successfully');
  })
  sequelize
    .authenticate()
    .then(() => {
      info('postgres Connection has been established successfully');
    })
  info(`🚀 Server ready at http${env == 'production' ? 's' : ''}://localhost:4000${server.graphqlPath}`);

}
startServer();
