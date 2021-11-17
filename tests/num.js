const {Message} = require('../models');

Message.findAndCountAll({
    where: {},

}).then(result => { console.log(result)})