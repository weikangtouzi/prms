'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class CensorQueue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  CensorQueue.init({
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
        allowNull: false,
    },
    target_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    msg: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("Waiting", "Failed"),
        allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CensorQueue',
    tableName: 'censor_queue'
  });
  return CensorQueue;
};