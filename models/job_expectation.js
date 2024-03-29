'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class JobExpectation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  JobExpectation.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    job_category: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    industry_involved: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    aimed_city: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    min_salary_expectation: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    max_salary_expectation: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    full_time_job: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Full",
    }
  }, {
    sequelize,
    modelName: 'JobExpectation',
    tableName: 'job_expectation'
  });
  return JobExpectation;
};