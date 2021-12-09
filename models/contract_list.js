'use strict';
const {
  Model, Deferrable
} = require('sequelize');
const user = require('./user');
module.exports = (sequelize, DataTypes) => {
  class ContractList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  ContractList.init({
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        
    },
    identity: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    target: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: "users",
            key: "id",
            deferrable: Deferrable.NOT
        }
    },
    last_msg: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    unreaded_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'ContractList',
    tableName: 'contract_list'
  });
  return ContractList;
};