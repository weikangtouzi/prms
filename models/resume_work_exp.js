'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const resume = require('./resume');
module.exports = (sequelize, DataTypes) => {
  class ResumeWorkExp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ResumeWorkExp.init({
    resume_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "resume",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    comp_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pos_name: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    department: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    start_at: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_at: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    working_detail: {
        type: DataTypes.TEXT,
        allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ResumeWorkExp',
    tableName: 'resume_work_exp'
  });
  return ResumeWorkExp;
};