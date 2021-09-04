const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');


module.exports = sequelize.define('order', {
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    }
  },
  order_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  order_status: {
    type: DataTypes.ENUM("Unpaid", "Done", "Canceled", "RefundmentInReview", "RefundmentSucceed", "RefundmentFailed"),
    allowNull: false

  },
  required_invoice: {
    type: DataTypes.TEXT,
    allowNull: false

  },
  invoice: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  goods: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: "{\
                goods_id: (integer),\
                goods_name: (string),\
                purchase_quantity: (integer),\
                total_price: (double),\
                extra_data: (undefined)\
            }"
  }


}, {
  freezeTableName: true
});