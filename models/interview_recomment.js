'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./interview');
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
    job_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
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
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: (value) => {
        if (value > 5 || value < 1) throw new Error("should not beyond the range [1,5]");
      }
    },
    comp_env: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: (value) => {
        if (value > 5 || value < 1) throw new Error("should not beyond the range [1,5]");
      }
    },
    HR: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: (value) => {
        if (value > 5 || value < 1) throw new Error("should not beyond the range [1,5]");
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    thumbs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'InterviewRecomment',
    tableName: 'interview_recomment'
  });
  return InterviewRecomment;
};