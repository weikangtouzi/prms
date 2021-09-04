const { sequelize, DataTypes } = require('./common');


module.exports = sequelize.define('goods', {
  goods_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
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
  freezeTableName: true
});