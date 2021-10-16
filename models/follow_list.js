'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
const enterprise = require('./enterprise');
module.exports = (sequelize, DataTypes) => {
  class FollowList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  FollowList.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    enterprise_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    }
  }, {
    sequelize,
    modelName: 'FollowList',
    tableName: 'follow_list'
  });
  return FollowList;
};