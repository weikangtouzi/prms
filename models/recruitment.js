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
      allowNull: false,
      defaultValue: "testing"
    },
    sponsor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "趁早找"
    },
    co_organizer: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "趁早找"
    },
    contractor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "趁早找"
    },
    seekers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    detail: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "testing"
    },
    adress: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: false,
      defaultValue: {
        type: 'Point',
        coordinates: [1.,1.]
      }
    },
    job_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    start_at: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_at: {
      type: DataTypes.TIME,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Recruitment',
    tableName: 'recruitment',
  });
  return Recruitment;
};