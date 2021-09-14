'use strict';

const { sequelize } = require("../models");
const { depCopy } = require('../utils/copy');
module.exports = {

  up: function (queryInterface, Sequelize) {
    return sequelize.sync({ force: true }).catch(err => {
      console.log(err)
    })

  },

  down: function (queryInterface, Sequelize) {
    let seq = {}; 
    depCopy(seq, sequelize);
    seq.User = undefined;
    return seq.drop();
  }

};