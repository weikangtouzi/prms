'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const question = require('./interview_question');
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
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
            deferrable: Deferrable.NOT
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
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