'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const job = require('./job');
const worker = require('./worker');
module.exports = (sequelize, DataTypes) => {
  class ResumeDeliveryRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ResumeDeliveryRecord.init({
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
            deferrable: Deferrable.NOT
        }
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "job",
            key: "id",
            deferrable: Deferrable.NOT
        }
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
    hr_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "worker",
            key: "id",
            deferrable: Deferrable.NOT
        }
    },
    readedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    inappropriate_reason: {
      type: DataTypes.ENUM("")
    }
  }, {
    sequelize,
    modelName: 'ResumeDeliveryRecord',
    tableName: 'resume_delivery_record',
    updatedAt: false,
  });
  return ResumeDeliveryRecord;
};