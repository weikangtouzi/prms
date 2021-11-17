const {Message} = require('../models')
Message.destroy({force: true, where:{}})

let messages =[];
for(let i = 0; i < 500000; i++) {
    messages.push({
        user_id: Math.round(Math.random() * 35) + 1,
        from:  Math.round(Math.random() * 149) + 37,
        message_type: "Normal",
        detail: "testing message: "+ i,
        readed: false,
        avaliable: i % 2 == 0? true: false
    });
}
Message.bulkCreate(messages)