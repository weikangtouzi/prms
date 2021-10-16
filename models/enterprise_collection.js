'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
const enterprise = require('./enterprise');
module.exports = (sequelize, DataTypes) => {
  class EnterpriseCollection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  EnterpriseCollection.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    target_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
  }, {
    sequelize,
    modelName: 'EnterpriseCollection',
    tableName: 'enterprise_collection'
  });
  return EnterpriseCollection;
};