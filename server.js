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
const { GraphQLScalarType, execute, subscribe } = require('graphql');
const mongo = require('./mongo');
const fs = require('fs');
const { env } = require('./project.json');
const http = require('http');
const https = require('https');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const contextMiddleware = require('./utils/contextMiddleware');
const { EnterpriseCertificationStatus, EnterpriseRole, WorkerMatePrecheckResult } = require('./graphql/types')
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
    "verifyCode: required, expiresIn 5 minutes, make sense by the name"
    verifyCode: String!
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
  "just data needed to login"
  input Login {
    "could be username, email, phone number"
    account: String!
    password: Password!
  }
  "sometime password may not be password only, for very situation in one api, we need this"
  input Password {
    "if this is true, the value will be judge as verifyCode, or as password, one more thing, only will work when account is phoneNumber"
    isVerifyCode: Boolean!
    value: String
  }
  "education for extra_data api"
  enum Education {
    LessThanPrime,
    Primary,
    Junior,
    High,
    JuniorCollege,
    RegularCollege,
    Postgraduate,
    Doctor
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
  type JobData {
    JobTitle: String!,
    WorkingAddress: String!,
    experience: String!,
    "this data is a json data, to use it just parse json by this string"
    JobDetail: String!,
    education: String!,
    requiredNum: Int!,
    isFullTime: Boolean!,
    tags: [String]!,
    createdAt: String!,
    updatedAt: String!,
    
  }
  "for list query"
  type JobDataBriefly {
    id: Int!,
    JobTitle: String!,
    WorkingAddress: String!,
    experience: String!,
    education: String!,
    requiredNum: Int!,
    isFullTime: Boolean!,
    createdAt: String!
  }
  "contains a array of jobid, and a cache id"
  type JobQueryResult {
    "just job ids"
    data: [JobDataBriefly]!,
    cacheId: String!,
    
  }
  input JobPost {
    JobTitle: String!,
    workingAddress: String!,
    experience:Int!,
    "just a two value array which first value means the min one, second means the max"
    salary: [Int]!,
    education: EducationRequired!,
    description: String!,
    requiredNum: Int!,
    isFullTime: Boolean!,
    tags: [String]!,
  }
  "because the personal data is already exists, I choos this for the name"
  input BasicData {
    "a link to the file"
    logo: String!,
    name: String!,
    birthday: Int!,
    gender: Boolean!,
    currentCity: String!,
    phoneNumber: String!,
    education: Education!,
    firstTimeWorking: Int!,
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
    name: String!,
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
    tags:[String],
    pageNumber: Int, 
    pageSize: Int, 
    keyword: String
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
  enum Identity {
    "could be any personal user"
    PersonalUser,
    "not only hr"
    EnterpriseUser,
    Administrator,
    Counselor,
  }
  
  "reset password means that user forget password"
  input ResetPassword {
    verifyCode: String!,
    password: String!,
    confirmPassword: String!,
  }
  enum EnterpriseNature {
    ForeignVentures,
    ForeignFundedEnterprises, 
    PrivateEnterprise, 
    StateOwnedEnterprises, 
    Extra
  }
  enum EnterpriseFinancing {
    NotYet,
    AngelFinancing,
    A,
    B,
    C,
    D,
    Listed,
    NoNeed
  }
  enum EnterpriseSize {
    LessThanFifteen, 
    FifteenToFifty, 
    FiftyToOneHundredFifty, 
    OneHundredFiftyToFiveHundreds, 
    FiveHundredsToTwoThousands, 
    MoreThanTwoThousands
  }
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
    enterpriseNature: String!,
    enterpriseIndustry: [String]!,
    "checkout EnterpriseIndustry type for value options"
    enterpriseFinancing: String!,
    "checkout EnterpriseSize type for value options"
    enterpriseSize: String!,
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
  "for most of get query needed token for authorization"
  type Query {
    "api for login"
    logIn(info: Login!): LoginResult!
    "check if the input num is availiable or not"
    numberCheck(num: String!): Boolean!
    "get Province data"
    getProvinces: [Province]
    "get all cities of the given province"
    getCities(provinceId: String!): [City]!
    "get all counties of the given city"
    getCounties(cityId: String!): [County]!
    "get all town of the given county"
    getTowns(countyId: String!): [Town]!
    "send a verify code to the given number, if phoneNumber not provider and has token in header, will send to the user's phone number"
    sendSms(phoneNumber: String): String!
    "tags are those tags that hr added to a job. keyword stands for the input at search page. tags and keyword are not required. pageNumber and pageSize default value are 1 and 10"
    getJobs(filter: JobFilter): JobQueryResult!
    "using cached jobid, need to query at least once before calling this"
    getJobsFromCache(cacheId: String): [JobDataBriefly]!
    "get job data by id"
    getJob(jobid: Int): JobData!
    "get resume data, if cache id exists then will return the cache data, cache expired every 30 minutes"
    getResume(resumeId: Int, cacheId: String): ResumeData!
    phoneNumberCheck(phoneNumber: String, verifyCode: String): Int!
    "true means already inserted"
    checkIdCardNumber(idCardNum: String!): Boolean!
    "gets InterviewSchedule"
    getIterviewSchedule: InterviewSchedule!
    "detail page for interview"
    getIterviewDetail(interviewId: Int!): InterviewDetail
    "get applicant by conditions, null for no limitation, null when no matched data"
    getApplicants(filter: ApplicantFilter): SearchApplicantsResult
    checkResumeCompletion: Boolean!
    checkEnterpriseIdentification: EnterpriseIdentification!
    getCensorList(pageSize: Int, lastIndex: String): [CensorData]
    getAllRegion: RegionList!
    precheckForInviteWorkMate(phoneNumber: String): WorkerMatePrecheckResult!
    "just tests"
    showDatas: [PersonalDataView]!
  }
  
  "most of mutations needed token for authorization"
  type Mutation {
    "api for register"
    register(info: Register!): Void
    "this api need you to pass the provider's phone number as the authorization header"
    insertPersonalData(info: PersonalData!): Int!
    "leave extraAttributes null for default upload options"
    singleUpload(file: Upload!, extraAttributes: UploadExtraAttributes): FileLink!
    postJob(info: JobPost): Void
    "insert or edit a personal data"
    editPersonalData(info: BasicData): Void
    "insert or edit a personal advantage"
    editPersonalAdvantage(advantage: String!): Void
    "insert or edit a work experience"
    editWorkExprience(info: WorkExperience!): Void
    "insert or edit a education experience"
    editEduExp(info: EduExp): Void
    "insert or edit a project experience"
    editProExp(info: ProExp): Void
    "if wanted to send the online one, then don't need to pass resumeId"
    sendResume(resumeId:Int): Void
    "will create a interview data and set it to waiting, may return the interview id for dev version"
    inviteInterview(userId: Int!, jobId: Int!, time: Int!): Void
    "cancel a interview, both side will have this authority, may failed when time is close to the appointed time"
    cancelInterview(interviewId: Int!): Void
    "end a iterview with the description, need to tell the interview is passed or not, most of time the description is about some special situation"
    endIterview(interviewId: Int!, ispassed: Boolean!, description: String!): Void
    "accept or reject an interview by id"
    acceptOrRejectInterview(interviewId: Int!, accept: Boolean!): Void
    "switch to another indentity if exists, should pass indetity and role, Identity and role types are enums, checkout their type definitions, return token"
    chooseOrSwitchIdentity(targetIdentity: String!, role: String): Void
    "use phone number to reset password"
    resetPassword(info: ResetPassword!): Void
    "enterprise certification need censor"
    enterpriseIdentify(info: EnterpriseCharterSencorRequest!): Void
    "enterprise certificate required, if not will return error"
    editEnterpriseBasicInfo(info: EnterpriseBasicInfo!): Void
    editEnterpriseWorkTimeAndWelfare(info: EnterpriseWorkTimeAndWelfare!): Void
    editEnterpriseExtraData(info: String!): Void
    recruitmentApply(recruitmentId: Int!): Void
    "only availiable when token is expired and not dead"
    refreshToken: String!
    setCensoredForAnItem(_id: String!, isPassed: Boolean, description: String): Void
    inviteWorkMate(phoneNumber:String!, role: String, pos: String): Void
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
      ApolloServerPluginLandingPageGraphQLPlayground(), {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            }
          };
        }
      }
    ],
    context: contextMiddleware
  });

  await server.start();

  const app = express();

  app.use(graphqlUploadExpress());
  app.use(express.static('upload'));
  app.use(express.static('datas'));
  server.applyMiddleware({ app });
  let httpServer;
  if (env == 'production') {
    httpServer = https.createServer({
      key: fs.readFileSync('./ssl/2_chenzaozhao.com.key'),
      cert: fs.readFileSync('./ssl/1_chenzaozhao.com_bundle.crt'),
    }, app)
  } else {
    console.log(env)
    httpServer = http.createServer(app);
  }
  const subscriptionServer = SubscriptionServer.create({
    schema,
    execute,
    subscribe,
  }, {
    server: httpServer,
    path: server.graphqlPath
  });
  await new Promise(r => httpServer.listen({ port: 4000 }, r));
  mongo.init().then(() => {
    console.log('mongo Connection has been established successfully');
  })
  sequelize
    .authenticate()
    .then(() => {
      console.log('postgres Connection has been established successfully');
    })
  console.log(`🚀 Server ready at http${env == 'production' ? 's' : ''}://localhost:4000${server.graphqlPath}`);

}
startServer();
