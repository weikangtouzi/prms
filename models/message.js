const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');


module.exports = sequelize.define('message', {
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    }
  },
  from: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM("Normal", "System", "Share", "Other"),
    allowNull: false

  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: false

  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  availiable: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }


}, {
  freezeTableName: true
});
