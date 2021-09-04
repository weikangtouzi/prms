const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');


module.exports = sequelize.define('job_expectation', {
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    },
  },
  job_category: {
    type: DataTypes.JSON,
    allowNull: false
  },
  min_salary_expectation: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  max_salary_expectation: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  job_status: {
    type: DataTypes.ENUM("NoJobButNoJob", "NoJobButWantJob", "OnTheJob", "OnTheJobButLookingForAJob", "GraduatingStudents"),
    allowNull: false
  },
  employment_nature: {
    type: DataTypes.ENUM("Anytime", "LessThanTwoDays", "LessThanOneWeek", "LessThanTwoWeeks", "LessThanOneMonth", "MoreThanOneMonth"),
    allowNull: false
  }



}, {
  freezeTableName: true
});