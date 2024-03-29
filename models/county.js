'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const city = require('./city')
module.exports = (sequelize, DataTypes) => {
  class County extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  County.init({
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    county_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      primaryKey: true,
    },
    city_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      references: {
        model: 'city',
        key: 'city_id',
        deferrable: Deferrable.NOT
      }
    }
  }, {
    sequelize,
    modelName: 'County',
    tableName: 'county'
  });
  return County;
};