'use strict';
const {
  Model,Deferrable
} = require('sequelize');
const pro = require('./province')
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  City.init({
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    city_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      primaryKey: true,
    },
    province_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      references: {
        model: 'province',
        key: 'province_id',
        deferrable: Deferrable.NOT
      }
    }
  }, {
    sequelize,
    modelName: 'City',
    tableName: 'city',
  });
  return City;
};