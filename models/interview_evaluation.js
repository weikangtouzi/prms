const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');

module.exports = sequelize.define('interview_evaluation', {
  comment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: user,
      key: "user_id",
      deferrable: Deferrable.NOT
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  anonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  stars: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  freezeTableName: true
});