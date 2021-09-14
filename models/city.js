'use strict';
const {
  Model
} = require('sequelize');
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
    },
    province_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'City',
    tableName: 'city'
  });
  return City;
};