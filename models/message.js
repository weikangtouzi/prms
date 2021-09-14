'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Message.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    from: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM("Normal", "System", "Share", "Other"),
      allowNull: false
  
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: false
  
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    availiable: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'message'
  });
  return Message;
};