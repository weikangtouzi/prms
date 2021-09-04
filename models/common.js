const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:otAS9I6f3S5uBE2FyVK6@1.117.45.51:5432/fcx');
module.exports = {
  sequelize: sequelize,
  DataTypes: DataTypes,
};