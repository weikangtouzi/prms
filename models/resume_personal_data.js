'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const resume = require('./resume');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class ResumePersonalData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ResumePersonalData.init({
    resume_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "resume",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    real_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    first_time_working: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    current_city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING,
        references: {
            model: user,
            key: "phone_number",
            deferrable: Deferrable.NOT
        }
    }
  }, {
    sequelize,
    modelName: 'ResumePersonalData',
    tableName: 'resume_personal_data'
  });
  return ResumePersonalData;
};