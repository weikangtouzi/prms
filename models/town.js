'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const county = require('./county')
module.exports = (sequelize, DataTypes) => {
  class Town extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Town.init({
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    town_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      primaryKey: true,
    },
    county_id: {
      type: DataTypes.STRING(12),
      allowNull: false,
      references: {
        model: 'county',
        key: 'county_id',
        deferrable: Deferrable.NOT
      }
    }
  }, {
    sequelize,
    modelName: 'Town',
    tableName: 'town'
  });
  return Town;
};