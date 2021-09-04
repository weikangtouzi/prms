const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');

module.exports = sequelize.define('resume', {
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,


  },
  detail: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ontop: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }

}, {
  freezeTableName: true
});