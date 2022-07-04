'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const {User, Enterprise} = require('./enterprise');
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
      allowNull: false,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    real_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_binding: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    role: {
      type: DataTypes.ENUM("HR", "Teacher", "Admin", "None"),
      allowNull: false
    },
    pos: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    disabled: {
      type: DataTypes.ENUM("LOW", "MIDIUM", "HIGH"),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Worker',
    tableName: 'worker',
    
  });
  return Worker;
};