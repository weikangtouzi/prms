const { AuthenticationError, UserInputError } = require('apollo-server');
const { Enterprise } = require('../models');
const jwt = require('jsonwebtoken');
const enterpriseCertificate = async (parent, args, context, info) => {
  const { enterpriseName, enterpriseNature, enterpriseLocation, enterpriseIndustry, enterpriseFinancing, role } = args.info;
  let token = context.req.headers.authorization;
  if (context.req && context.req.headers.authorization) {
    let userInfo = jwt.decode(token);
    Enterprise.create({
      enterprise_name: enterpriseName,
      business_nature: enterpriseNature,
      industry_involved: enterpriseIndustry,
      enterprise_profile: {
        type: DataTypes.STRING,
        allowNull: false
      },
      enterprise_financing: {
        type: DataTypes.ENUM("None"),
        allowNull: false
      },
      enterprise_size: {
        type: DataTypes.ENUM("LessThanFifteenPeople", "FifteenToFifty", "FiftyToOneHundredFifty", "OneHundredFiftyToFiveHundreds", "FiveHundredsToTwoThousands", "MoreThanTwoThousands"),
        allowNull: false
      },
      enterprise_welfare: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
      },
      enterprise_logo: {
        type: DataTypes.STRING,
        allowNull: false
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
      },
      extra_attribute: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      charter: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      censor_status: {
        type: DataTypes.ENUM("MissingCarter", "Waiting", "Passed", "Failed"),
        allowNull: false
      },
      failed_description: {
        type: DataTypes.STRING,
        allowNull: true
      }
    })
  } else {
    throw new AuthenticationError('missing authorization');
  }
}