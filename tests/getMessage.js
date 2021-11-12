const {Message} = require('../models')

Message.findAll({ 
    where: {
        from: 3
    }
}).then(res => {
    console.log(res)
})