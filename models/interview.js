const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');

module.exports = sequelize.define('interview', {
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    }
  },
  HR_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  appointment_time: {
    type: DataTypes.TIME,
    allowNull: false

  },
  status: {
    type: DataTypes.ENUM("Waiting", "Start", "Cancel", "Done", "Pass"),
    allowNull: false
  }

}, {
  freezeTableName: true
});