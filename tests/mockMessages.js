const { Message, ContractList } = require('../models')


async function insert(counter = 0) {
    let to = Math.round(Math.random() * 35) + 1;
    let from = Math.round(Math.random() * 149) + 37;
    let msg = await Message.create({
        user_id: to,
        from: from,
        message_type: "Normal",
        detail: "testing message: " + counter,
        readed: false,
        avaliable: counter % 2 == 0 ? true : false
    });
    await ContractList.upsert({
        user_id: from,
        identity: true,
        target: to,
        last_msg: msg.detail
    }, {
        user_id: from
    })
    await ContractList.upsert({
        user_id: to,
        identity: false,
        target: from,
        last_msg: msg.detail
    }, {
        where: {
            user_id: to
        }
    })
    counter += 1;
    process.stdout.write(`mocking messages:${counter}/500000\n`)
    if(counter < 500000) {
        return insert(counter);
    }
    return;
}
insert();