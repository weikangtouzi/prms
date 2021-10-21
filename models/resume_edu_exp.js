'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const resume = require('./resume');
module.exports = (sequelize, DataTypes) => {
  class ResumeEduExp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ResumeEduExp.init({
    resume_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "resume",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    school_name: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    education: {
      type: DataTypes.ENUM("LessThanPrime", "Primary", "Junior", "High", "JuniorCollege", "RegularCollege", "Postgraduate", "Doctor"),
      allowNull: false
    },
    is_all_time: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    major: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    time: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    exp_at_school: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ResumeEduExp',
    tableName: 'resume_edu_exp'
  });
  return ResumeEduExp;
};