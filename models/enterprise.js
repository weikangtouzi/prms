'use strict';
const {
  Model, Deferrable
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Enterprise extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Enterprise.init({
    enterprise_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_nature: {
      type: DataTypes.ENUM("ForeignVentures", "ForeignFundedEnterprises", "PrivateEnterprise", "StateOwnedEnterprises", "Extra"),
      allowNull: false
    },
    industry_involved: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    enterprise_profile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    enterprise_financing: {
      type: DataTypes.ENUM("None"),
      allowNull: false
    },
    enterprise_size: {
      type: DataTypes.ENUM("LessThanFifteen", "FifteenToFifty", "FiftyToOneHundredFifty", "OneHundredFiftyToFiveHundreds", "FiveHundredsToTwoThousands", "MoreThanTwoThousands"),
      allowNull: false
    },
    enterprise_welfare: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    enterprise_logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    enterprise_loc_longtitude: {
      type: DataTypes.REAL,
      allowNull: false
    },
    enterprise_loc_latitude: {
      type: DataTypes.REAL,
      allowNull: false
    },
    enterprise_loc_detail: {
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
    failed_description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rest_rule: {
      type: DataTypes.ENUM("OneDayOffPerWeekend", "TwoDayOffPerWeekend", "StaggerWeekends"),
      allowNull: true
    },
    overtime_work_degree: {
      type: DataTypes.ENUM("None", "Occasionally", "Usually"),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Enterprise',
    tableName: 'enterprise',
    updatedAt: false
  });
  return Enterprise;
};