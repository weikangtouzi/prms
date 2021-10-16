'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const resume = require('./resume');
module.exports = (sequelize, DataTypes) => {
  class ResumeProjectExp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ResumeProjectExp.init({
    resume_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "resume",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    project_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    start_at: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_at: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    project_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    project_performance: {
        type: DataTypes.TEXT,
        allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ResumeProjectExp',
    tableName: 'resume_project_exp'
  });
  return ResumeProjectExp;
};