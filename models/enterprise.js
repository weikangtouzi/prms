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
    enterprise_welfare: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
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
    sequelize,
    modelName: 'Enterprise',
    tableName: 'enterprise'
  });
  return Enterprise;
};