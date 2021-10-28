const { AuthenticationError, UserInputError } = require('apollo-server');
const { Identity, EnterpriseNature, EnterpriseRole, EnterpriseCertificationStatus } = require('./types/')
const { Enterprise, User, Worker } = require('../models');
const jwt = require('jsonwebtoken');
const { isvalidTimeSection } = require('../utils/validations');
const { jwtConfig } = require('../project.json');
const mongo = require('../mongo')

function isvalidEnterpriseAdmin(userIdentity) {
  if(!userIdentity) {
    throw new AuthenticationError('missing identity in token, you request is not gonna be applied')
  }
  return userIdentity.identity == "EnterpriseUser" && userIdentity.role && userIdentity.role == "Admin"
}
function isvalidJobPoster(userIdentity) {
  if(!userIdentity) {
    throw new AuthenticationError('missing identity in token, you request is not gonna be applied')
  }
  return userIdentity.identity == "EnterpriseUser" && userIdentity.role && (userIdentity.role == "HR" || userIdentity.role == "Admin")
}
const enterpriseIdentify = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  const { enterpriseName, charter, phoneNumber } = args.info;
  try {
    await mongo.query('administrator_censor_list', async (collection) => {
      try {
        await collection.insertOne({
          user_id: userInfo.user_id,
          enterpriseName: enterpriseName,
          charter: charter,
          phoneNumber: phoneNumber ? phoneNumber : null,
          editable: false,
          passed: false,
          time: new Date(),
          description: null
        })
      } catch (e) {
        throw e
      }
    });
  } catch (e) {
    throw new UserInputError('your identify request is under censor right now, please wait')
  }
}
const insertEnterpriseBasicInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  try {
    isvalidEnterpriseAdmin(userInfo.identity)
  } catch (e) {
    let info = await mongo.query('administrator_censor_list', async (collection) => {
      let res = await collection.findOne({
        passed: true,
        user_id: userInfo.user_id
      })
      return res
    })
    if(!info) {
      throw new AuthenticationError('your enterprise identify request is not passed or not applied')
    }
    const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, logo, enterpriseSize, establishedDate, homepage, tel } = args.info;
    try{
      await Enterprise.create({
        user_id: userInfo.user_id,
        enterprise_name: enterpriseName,
        abbreviation: abbreviation,
        business_nature: enterpriseNature,
        industry_involved: enterpriseIndustry,
        enterprise_profile: enterpriseProfile,
        enterprise_financing: enterpriseFinancing,
        enterprise_size: enterpriseSize,
        enterprise_logo: logo,
        enterprise_loc_longtitude: enterprisecCoordinate[0],
        enterprise_loc_latitude: enterprisecCoordinate[1],
        enterprise_loc_detail: enterpriseLocation,
        homepage,
        established_time: establishedDate,
        tel: tel
      });
    }catch(e) {
      throw new UserInputError({e})
    }
    
  }
}
const editEnterpriseBasicInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, logo, enterpriseSize, establishedDate, homepage, tel } = args.info;
    if(enterpriseName|| abbreviation|| enterpriseNature|| enterpriseLocation|| enterpriseProfile|| enterprisecCoordinate|| enterpriseIndustry|| enterpriseFinancing|| logo|| enterpriseSize|| establishedDate|| homepage|| tel) {
      await Enterprise.update({
        enterprise_name: enterpriseName,
        abbreviation: abbreviation,
        business_nature: enterpriseNature,
        industry_involved: enterpriseIndustry,
        enterprise_profile: enterpriseProfile,
        enterprise_financing: enterpriseFinancing,
        enterprise_size: enterpriseSize,
        enterprise_logo: logo,
        enterprise_loc_longtitude: enterprisecCoordinate[0],
        enterprise_loc_latitude: enterprisecCoordinate[1],
        enterprise_loc_detail: enterpriseLocation,
        homepage,
        established_time: establishedDate,
        tel: tel
      }, {
        where: {
          user_id
        }
      });
    } else {
      throw new UserInputError('you need at least one data to update')
    }
    
  } else {
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const editEnterpriseWorkTimeAndWelfare = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    if (Object.keys(args.info).length == 0) {
      throw new UserInputError("none of the information is providered")
    }
    const { workRule, restRule, welfare, overtimeWorkDegree, customTags } = args.info;
    if (isvalidTimeSection(workRule)) {
      await Enterprise.update({
        rest_rule: restRule,
        work_time: workRule,
        enterprise_welfare: welfare,
        overtime_work_degree: overtimeWorkDegree,
        tags: customTags
      }, {
        where: { user_id: userInfo.user_id }
      })
      if (userInfo.exp && userInfo.exp > new Date().getTime() / 1000 && userInfo.exp <= (new Date().getTime() - 60000) / 1000) {
        return jwt.sign({
          user_id: userInfo.user_id,
          username: userInfo.username,
          identity: userInfo.identity
        }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
      }
    } else {
      throw new UserInputError("bad input", { workRule: `${workRule} is not a valid timesectiohn` })
    }
  } else {
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const editEnterpriseExtraData = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  try {
    JSON.parse(args.info);
  } catch (e) {
    throw new UserInputError(`${args.info} not a valid json value`)
  }
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    await Enterprise.update({
      extra_attribute: args.info,
    }, {
      where: { user_id: userInfo.user_id }
    });
    if (userInfo.exp && userInfo.exp > new Date().getTime() / 1000 && userInfo.exp <= (new Date().getTime() - 60000) / 1000) {
      return jwt.sign({
        user_id: userInfo.user_id,
        username: userInfo.username,
        identity: userInfo.identity
      }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
    }
  } else {
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const inviteWorkMate = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { phoneNumber, role, pos } = args.info;
    let user = await User.findOne({
      
      where: {
        phone_number: phoneNumber
      }
    });
    try {
      await Worker.create({
        company_belonged: userInfo.enterpriseId,
        real_name: user.real_name,
        user_binding: user.id,
        role,
        pos,
        phone_number: phoneNumber
      })
    } catch (e) {
      throw e
    }
  } else {
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const precheckForInviteWorkMate = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { phoneNumber } = args;
    let res = await User.findOne({
      include: [{
        model: Worker,
        required: false
      }],
      where: {
        phone_number: phoneNumber
      }
    });
    let user = res.dataValues;
    if(!user) return "NotAUser"
    if(!user.real_name) return "NotCertified"
    if(user.Worker) {
      if(user.Worker.company_belonged == userInfo.enterpriseId) {
        return "AlreadyWorkMate"
      } else {
        return "WorkingInAnotherCompany"
      }
    } else {
      return "OK"
    }
  } else {
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const checkEnterpriseIdentification = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  let res = await mongo.query('administrator_censor_list', async (collection) => {
    return collection.findOne({ user_id: userInfo.user_id })
  });
  if (res) {
    if (res.passed) {
      return {
        status: "Passed"
      }
    } else {
      if (res.editable) {
        return {
          status: "Failed",
          ...res
        }
      } else {
        return {
          status: "Waiting"
        }
      }
    }
  } else {
    return {
      status: "None"
    }
  }
}
const postJob = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if(isvalidJobPoster(userInfo.identity)) {
    const {jobTitle, workingAddress, experience, salary, education, description, requiredNum, isFullTime, tags} = args.info;
    
  } else {
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to post a job`);
  }
  
  
}
module.exports = {
  editEnterpriseBasicInfo,
  editEnterpriseWorkTimeAndWelfare,
  editEnterpriseExtraData,
  enterpriseIdentify,
  checkEnterpriseIdentification,
  precheckForInviteWorkMate,
  inviteWorkMate,
  postJob,
  insertEnterpriseBasicInfo
}