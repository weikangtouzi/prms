const { AuthenticationError, UserInputError } = require('apollo-server');
const { Identity, EnterpriseNature, EnterpriseRole } = require('./types/')
const { Enterprise } = require('../models');
const jwt = require('jsonwebtoken');
const { isvalidTimeSection } = require('../utils/validations');


function isvalidEnterpriseAdmin(userIdentity) {
  return Identity.parseValue(userIdentity.identity) == Identity.getValue("EnterpriseUser").value && userIdentity.role && EnterpriseRole.parseValue(userIdentity.role) == EnterpriseRole.getValue("Admin").value
}


const editEnterpriseBasicInfo = async (parent, args, context, info) => {
  if (context.req && context.req.headers.authorization) {
    let token = context.req.headers.authorization;
    let userInfo = jwt.decode(token);
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
  } else {
    throw new AuthenticationError('missing authorization');
  }
}
const editEnterpriseWorkTimeAndWelfare = async (parent, args, context, info) => {
  if (context.req && context.req.headers.authorization) {
    let token = context.req.headers.authorization;
    let userInfo = jwt.decode(token);
    if (isvalidEnterpriseAdmin(userInfo.identity)) {
      if(Object.keys(args.info).length == 0) {
        throw new UserInputError("none of the information is providered")
      }
      const {workRule, restRule, welfare, overtimeWorkDegree, customTags} = args.info;
      if(isvalidTimeSection(workRule)) {
        await Enterprise.update({
          rest_rule: restRule,
          work_time: workRule,
          enterprise_welfare: welfare,
          overtime_work_degree: overtimeWorkDegree,
          tags: customTags
        },{
          where: {user_id: userInfo.user_id}
        })
      } else {
        throw new UserInputError("bad input", {workRule: `${workRule} is not a valid timesectiohn`})
      }
      
    } else {
      throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
    }
  }
}
module.exports = {
  editEnterpriseBasicInfo,
  editEnterpriseWorkTimeAndWelfare
}