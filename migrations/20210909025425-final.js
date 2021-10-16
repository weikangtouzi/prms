'use strict';

const { sequelize } = require("../models");
const models = require("../models");

module.exports = {

  up: function (queryInterface, Sequelize) {
    
    return models.User.sync({force: true})
    
  },

  down: function (queryInterface, Sequelize) {
    return models.User.drop();
  }

};