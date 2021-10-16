'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./enterprise');
module.exports = (sequelize, DataTypes) => {
  class Worker extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Worker.init({
    company_belonged: {
      type: DataTypes.INTEGER,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    real_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_binding: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("HR", "Teacher", "Admin"),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Worker',
    tableName: 'worker',
    
  });
  return Worker;
};