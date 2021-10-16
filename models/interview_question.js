'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
const enterprise = require('./enterprise');
module.exports = (sequelize, DataTypes) => {
  class InterviewQuestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  InterviewQuestion.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    comp_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    target: {
        type: DataTypes.ENUM("EnterpriseWorker", "Interviewee"),
        allowNull: false
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
    }
  }, {
    sequelize,
    modelName: 'InterviewQuestion',
    tableName: 'Interview_question'
  });
  return InterviewQuestion;
};