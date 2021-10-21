'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const worker = require('./worker');
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
    worker_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "worker",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    worker_name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    adress_coordinate: {
      type: DataTypes.ARRAY(DataTypes.REAL),
      allowNull: false
    },
    adress_description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    min_salary: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    max_salary: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    min_experience: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    max_experience: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    min_education: {
      type: DataTypes.ENUM("Null", "High", "JuniorCollege", "RegularCollege", "Postgraduate", "Doctor"),
      allowNull: false
    },
    requiredNum: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ontop: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_fulltime: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING(15)),
      allowNull: false
    },
    comp_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "enterprise",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    tranfering_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'job',
  });
  return Job;
};