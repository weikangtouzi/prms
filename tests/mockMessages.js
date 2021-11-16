const {Message} = require('../models')
Message.destroy({force: true, where:{}})
function mock(messages = [],counter = 0, max = 5000 ) {
    if(counter == max) {
        return messages
    }
    messages.push( {
        user_id: Math.random() * 35 + 1,
        from: Math.random() * 149 + 37,
        message_type: "Normal",
        detail: "testing message: "+ counter,
        readed: false,
        avaliable: counter % 2 == 0? true: false
    });
    counter = counter + 1
    return mock(messages, counter, max )
}
let mockedMessages = mock()


Message.bulkCreate(mockedMessages)