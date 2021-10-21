const { AuthenticationError, UserInputError } = require('apollo-server');
const { Identity, EnterpriseNature, EnterpriseRole } = require('./types/')
const { Enterprise } = require('../models');
const jwt = require('jsonwebtoken');


function isvalidEnterpriseAdmin(userIdentity) {
  return Identity.parseValue(userIdentity.identity) == Identity.getValue("EnterpriseUser").value && userIdentity.role && EnterpriseRole.parseValue(userIdentity.role) == EnterpriseRole.getValue("Admin").value
}


const editEnterpriseBasicInfo = async (parent, args, context, info) => {
  const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, logo, enterpriseSize } = args.info;
  let token = context.req.headers.authorization;
  if (context.req && context.req.headers.authorization) {
    let userInfo = jwt.decode(token);
    if (isvalidEnterpriseAdmin(userInfo.identity)) {
      await Enterprise.upsert({
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
      });
    } else {
      throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
    }

  } else {
    throw new AuthenticationError('missing authorization');
  }
}

module.exports = {
  editEnterpriseBasicInfo
}