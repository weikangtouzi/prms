'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const job = require('./job');
const worker = require('./worker');
module.exports = (sequelize, DataTypes) => {
  class JobReadRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  JobReadRecord.init({
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
            deferrable: Deferrable.NOT
        }
    },
    job_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    job_salary: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    job_exp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    job_edu: {
      type: DataTypes.STRING,
      allowNull: false
    },
    job_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
    },
    comp_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    comp_financing: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hr_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hr_position: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
  }, {
    sequelize,
    modelName: 'JobReadRecord',
    tableName: 'job_read_record',
    createdAt: false,
    updatedAt: false,
  });
  return JobReadRecord;
};