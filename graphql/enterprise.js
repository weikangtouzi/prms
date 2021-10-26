const { AuthenticationError, UserInputError } = require('apollo-server');
const { Identity, EnterpriseNature, EnterpriseRole, EnterpriseCertificationStatus } = require('./types/')
const { Enterprise, User, Worker } = require('../models');
const jwt = require('jsonwebtoken');
const { isvalidTimeSection } = require('../utils/validations');
const { jwtConfig } = require('../project.json');
const mongo = require('../mongo')

function isvalidEnterpriseAdmin(userIdentity) {
  return Identity.parseValue(userIdentity.identity) == Identity.getValue("EnterpriseUser").value && userIdentity.role && EnterpriseRole.parseValue(userIdentity.role) == EnterpriseRole.getValue("Admin").value
}
const enterpriseIdentify = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  const { enterpriseName, charter, phoneNumber, isEdit } = args.info;
  try {
    await mongo.query('administrator_censor_list', async (collection) => {
      collection.insertOne({
        user_id: userInfo.user_id,
        enterpriseName: enterpriseName,
        charter: charter,
        phoneNumber: phoneNumber ? phoneNumber : null,
        editable: false,
        passed: false,
        time: new Date()
      })
    });
  } catch (e) {
    throw new Error(e)
  }
}

const editEnterpriseBasicInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, logo, enterpriseSize, establishedDate, homepage, tel } = args.info;
    await Enterprise.upsert({
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
    if(!user) throw new UserInputError('this phone number not register yet')
    if(!user.real_name) throw new UserInputError('this account is not certificated')
    if(user.Worker) {
      if(user.Worker.company_belonged == userInfo.enterpriseId) {
        throw new UserInputError('this account is already your workmate')
      } else {
        throw new UserInputError('this account is already binding to another company')
      }
    } else {
      return 
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
module.exports = {
  editEnterpriseBasicInfo,
  editEnterpriseWorkTimeAndWelfare,
  editEnterpriseExtraData,
  enterpriseIdentify,
  checkEnterpriseIdentification
}