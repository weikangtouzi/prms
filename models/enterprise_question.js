'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
const enterprise = require('./enterprise');
module.exports = (sequelize, DataTypes) => {
  class EnterpriseQuestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  EnterpriseQuestion.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    enterprise_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    question_description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    addtional_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    answer_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'EnterpriseQuestion',
    tableName: 'enterprise_question'
  });
  return EnterpriseQuestion;
};