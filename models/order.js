'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Order.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
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
    sequelize,
    modelName: 'Order',
    tableName: 'order'
  });
  return Order;
};