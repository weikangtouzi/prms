'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class RecruitmentRecord extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  RecruitmentRecord.init({
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "could be a personal user or enterprise user",
        unique: true,
    },
    recruitment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'recruitment',
            key: "id",
            deferrable: Deferrable.NOT
        }
    },
    canceled: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    extra_datas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: "{\
        \"site_size\": \"small\"\
      }"
    }
  }, {
    sequelize,
    modelName: 'RecruitmentRecord',
    tableName: 'recruitment_record',
    createdAt: false
  });
  return RecruitmentRecord;
};