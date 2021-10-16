'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class Interview extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Interview.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    HR_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    appointment_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    comp_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("Waiting", "Started", "Canceled", "Failed", "Passed"),
      allowNull: false
    },
    description: {
      type: DataTypes.ENUM("RejectionFromApplicants", "CanceledByApplicants", "CanceledByHR"),
      allowNull: true,
      comment: "Description only needed when this interview is canceled"
    }
  }, {
    sequelize,
    modelName: 'Interview',
    tableName: 'interview'
  });
  return Interview;
};