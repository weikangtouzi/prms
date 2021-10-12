'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class Recruitment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Recruitment.init({
    sponsor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    co_organizer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contractor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    seekers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    detail: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    adress: {
        
    }
  }, {
    sequelize,
    modelName: 'Recruitment',
    tableName: 'recruitment'
  });
  return Recruitment;
};