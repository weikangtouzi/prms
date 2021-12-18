'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
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
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    enterprise_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    abbreviation: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    business_nature: {
      type: DataTypes.ENUM("ForeignVentures", "ForeignFundedEnterprises", "PrivateEnterprise", "StateOwnedEnterprises", "Extra"),
      allowNull: false
    },
    industry_involved: {
      type: DataTypes.ARRAY(DataTypes.STRING(40)),
      allowNull: false
    },
    enterprise_profile: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    enterprise_financing: {
      type: DataTypes.ENUM("NotYet","AngelFinancing","A","B","C","D","Listed","NoNeed"),
      allowNull: false
    },
    enterprise_size: {
      type: DataTypes.ENUM("LessThanFifteen", "FifteenToFifty", "FiftyToOneHundredFifty", "OneHundredFiftyToFiveHundreds", "FiveHundredsToTwoThousands", "MoreThanTwoThousands"),
      allowNull: false
    },
    enterprise_welfare: {
      type: DataTypes.ARRAY(DataTypes.STRING(15)),
      allowNull: true
    },
    enterprise_logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING(15)),
      allowNull: true
    },
    enterprise_coordinates: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: false
    },
    enterprise_loc_detail: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    extra_attribute: {
      type: DataTypes.JSON,
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
    },
    homepage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    established_time: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    tel: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    work_time: {
      type: DataTypes.STRING(12),
      allowNull: true
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Enterprise',
    tableName: 'enterprise',
    updatedAt: false
  });
  return Enterprise;
};