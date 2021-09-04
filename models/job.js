const { Deferrable } = require('sequelize');
const { sequelize, DataTypes } = require('./common');
const user = require('./users');

module.exports = sequelize.define('job', {
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
    allowNull: false
  },
  detail: {
    type: DataTypes.JSON,
    allowNull: false
  },
  ontop: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  welfare: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_fulltime: {
    type: DataTypes.BOOLEAN,
    allowNull: false

  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: false

  }

}, {
  freezeTableName: true
});
