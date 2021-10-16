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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
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
    adress_longtitude: {
        type: DataTypes.REAL,
        allowNull: false
    },
    address_latitude: {
      type: DataTypes.REAL,
      allowNull: false
    },
    job_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Recruitment',
    tableName: 'recruitment'
  });
  return Recruitment;
};