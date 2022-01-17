const { Message, ContractList,Job, Worker } = require('../models');
const worker = require('../models/worker');


async function insert(counter = 0) {
    let to = Math.round(Math.random() * 35) + 1;
    let from = Math.round(Math.random() * 149) + 37;
    Worker.findOne({
        where: {
            user_binding: to,
        }
    }).then(worker => {
        Job.findOne({
            where: {
                worker_id: worker.dataValues.id
            }
        }).then(job => {
            if(!job) {
                process.stdout.write(`mocking messages:${counter}/500000\n`)
                counter += 1;
                if (counter < 500000) {
                    return insert(counter);
                } else {
                    return
                }
            }
            Message.create({
                user_id: to,
                from: from,
                message_type: "Normal",
                detail: "testing message: " + counter,
                readed: false,
                avaliable: counter % 2 == 0 ? true : false
            }).then(msg => {
                ContractList.upsert({
                    user_id: from,
                    identity: true,
                    target: to,
                    last_msg: msg.detail,
                    job_id: job.dataValues.id
                }, {
                    user_id: from
                })
                ContractList.upsert({
                    user_id: to,
                    identity: false,
                    target: from,
                    last_msg: msg.detail,
                    job_id: job.dataValues.id
                }, {
                    where: {
                        user_id: to
                    }
                })
                process.stdout.write(`mocking messages:${counter}/500000\n`)
                counter += 1;
                if (counter <= 500000) {
                    return insert(counter);
                }
            })
        })
    })
    return;
}
insert().then(_ => {
    process.exit()
});