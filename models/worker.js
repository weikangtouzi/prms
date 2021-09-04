const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');

module.exports = sequelize.define('worker', {
  worker_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  real_name: {
    type: DataTypes.STRING,
    allowNull: false,

  },
  company_belonged: {
    type: DataTypes.INTEGER,
    references: {
      model: user,

      key: "user_id",

      deferrable: Deferrable.NOT
    }
  },
  user_binding: {
    type: DataTypes.INTEGER,
    allowNull: false

  },
  position: {
    type: DataTypes.JSON,
    allowNull: false

  }
}, {
  freezeTableName: true
});