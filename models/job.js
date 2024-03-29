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
    title: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    category: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    address_coordinate: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: false
    },
    address_description: {
      type: DataTypes.ARRAY(DataTypes.STRING),
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
    min_education: {
      type: DataTypes.ENUM("Null", "High", "JuniorCollege", "RegularCollege", "Postgraduate", "Doctor"),
      allowNull: false
    },
    required_num: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ontop: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    full_time_job: {
      type: DataTypes.ENUM("Full", "Part", "InternShip"),
      allowNull: false,
      defaultValue: "Full"
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING(15)),
      allowNull: true
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
    },
    expired_at: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    isAvaliable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'job',
  });
  return Job;
};