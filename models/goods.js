'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Goods extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Goods.init({
    goods_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    goods_detail: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_time_limited: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    goods_price: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    is_repeative: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    subgoods: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Goods',
    tableName: 'goods'
  });
  return Goods;
};