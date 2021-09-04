const { sequelize, DataTypes } = require('./common');
const { Deferrable } = require('sequelize');
const user = require('./users');

module.exports = sequelize.define('enterprise', {
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    }
  },
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
  enterprise_size: {
    type: DataTypes.ENUM("LessThanFivePeople", "FiveToTwenty", "TwentyToHundred", "MoreThanHundred"),
    allowNull: false
  },
  enterprise_logo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  extra_attribute: {
    type: DataTypes.JSON,
    allowNull: false,
  },


}, {
  freezeTableName: true
});