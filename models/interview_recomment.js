'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class InterviewRecomment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  InterviewRecomment.init({
    interview_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "interview",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comp_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.ENUM("One", "Two", "Three", "Four", "Five"),
        allowNull: false
    },
    comp_env: {
        type: DataTypes.ENUM("One", "Two", "Three", "Four", "Five"),
        allowNull: false
    },
    HR: {
        type: DataTypes.ENUM("One", "Two", "Three", "Four", "Five"),
        allowNull: false
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
    }
  }, {
    sequelize,
    modelName: 'InterviewRecomment',
    tableName: 'interview_recomment'
  });
  return InterviewRecomment;
};