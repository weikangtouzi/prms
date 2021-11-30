'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const question = require('./enterprise_question');
module.exports = (sequelize, DataTypes) => {
  class EnterpriseAnswer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  EnterpriseAnswer.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "worker",
        key: "id",
        deferrable: Deferrable.NOT
      }
    },
    question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
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
    thumbs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }
  }, {
    sequelize,
    modelName: 'EnterpriseAnswer',
    tableName: 'enterprise_answer'
  });
  return EnterpriseAnswer;
};