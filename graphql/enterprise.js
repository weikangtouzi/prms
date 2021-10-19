const { AuthenticationError, UserInputError } = require('apollo-server');
const { Enterprise } = require('../models');
const jwt = require('jsonwebtoken');
//     enterpriseName: String!,
//     abbreviation: String!,
//     "pass the whole adress information in this array"
//     enterpriseLocation: [String]!,
//     "longtitude and latitude"
//     enterprisecCoordinate: [Float]!,
//     "checkout EnterpriseNature type for value options"
//     enterpriseNature: String!,
//     enterpriseIndustry: [String]!,
//     "checkout EnterpriseIndustry type for value options"
//     enterpriseFinancing: String!,
//     "checkout EnterpriseSize type for value options"
//     enterpriseSize: String!,
//     logo: String!
const enterpriseCertificate = async (parent, args, context, info) => {
  const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, role, logo } = args.info;
  let token = context.req.headers.authorization;
  if (context.req && context.req.headers.authorization) {
    let userInfo = jwt.decode(token);
    Enterprise.create({
      enterprise_name: enterpriseName,
      abbreviation: abbreviation,
      business_nature: enterpriseNature,
      industry_involved: enterpriseIndustry,
      enterprise_profile: enterpriseProfile,
      enterprise_financing: enterpriseFinancing,
      enterprise_size: enterpriseSize,
      enterprise_logo: logo,
      charter: charter,
      enterprise_loc_longtitude: enterprisecCoordinate[0],
      enterprise_loc_latitude: enterprisecCoordinate[1],
      enterprise_loc_detail: enterpriseLocation,
    });
  } else {
    throw new AuthenticationError('missing authorization');
  }
}