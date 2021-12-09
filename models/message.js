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
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue:DataTypes.UUIDV4
    },
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
      allowNull: true
    },
    message_type: {
      type: DataTypes.ENUM("Normal", "System", "Other"),
      allowNull: false
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    readed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    avaliable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'message'
  })
  return Message;
};