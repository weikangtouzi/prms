'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class Job extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Job.init({
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
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
    sequelize,
    modelName: 'Job',
    tableName: 'job'
  });
  return Job;
};