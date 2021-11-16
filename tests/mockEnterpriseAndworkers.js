const { Enterprise, Worker, User } = require('../models');
const bcrypt = require('bcrypt');
let real_names = ["王飞跃", "辛成济", "束伟志", "蒋翰学", "益英纵", "徐雅健", "惠乐生", "车翰海", "向煊", "巢殿", "巢中", "冷全", "万馗", "厍轼", "隆竹", "桂俊", "璩容", "顾莎", "易烁", "鱼儿", "罗瑶", "能妍", "何琼", "田影", "糜冷雪", "何杉月", "牧娴雅", "简友绿", "雍笑寒", "松向莉", "黄端静", "秦以晴", "薛彬郁", "钟荣轩", "顾光誉", "沈天骄"]
let passwords = [];
for (let i = 0; i < 36; i++) {
    passwords[i] = bcrypt.hashSync("pass_" + i, 2)
}
let industry = [["互联网/IT/电子/通信","电子商务"], ["房地产/建筑","房地产开发与经营"], ["生活服务","餐饮"]]
async function mock(counter = {
    ent: 0,
    worker: 0,
    user: 0,
}, max = {
    ent: 12,
    worker: 36,
    user: 36
}) {
    if (counter.ent >= max.ent) {
        return
    } else {
        let ent;
        for (let i in [0, 1, 2]) {
            let user
            try {
                user = await User.create({
                    username: "worker_" + counter.user,
                    password: passwords[counter.user],
                    phone_number: "188000000" + (counter.user < 10 ? "0" + counter.user : counter.user),
                    real_name: real_names[counter.user],
                    identified: "Success"
                },{
                    returning: true
                });
            } catch (e) {
                console.log(e)
            }
            
            if (i == 0) {
                ent = await Enterprise.create({
                    user_id: user.dataValues.id,
                    enterprise_name: "ent_" + counter.ent,
                    abbreviation: "ent_" + counter.ent,
                    business_nature: "ForeignVentures",
                    industry_involved: industry[counter.ent%3],
                    enterprise_profile: "ent_" + counter.ent,
                    enterprise_financing: "NoNeed",
                    enterprise_size: "LessThanFifteen",
                    enterprise_coordinates: {
                        type: 'Point',
                        coordinates: [counter.ent, counter.ent]
                    },
                    enterprise_loc_detail: [""],
                },{
                    returning: true
                })
                await Worker.create({
                    company_belonged: ent.dataValues.id,
                    real_name: user.dataValues.real_name,
                    user_binding: user.dataValues.id,
                    role: "Admin",
                    pos: "总经理",
                    phone_number: user.dataValues.phone_number
                },{
                    returning: true
                })

            } else {
                await Worker.create({
                    company_belonged: ent.dataValues.id,
                    real_name: user.dataValues.real_name,
                    user_binding: user.dataValues.id,
                    role: "HR",
                    pos: "人事",
                    phone_number: user.dataValues.phone_number
                },{
                    returning: true
                })
            }
            
            counter.user = counter.user + 1
            counter.worker = counter.worker + 1
        }
        counter.ent = counter.ent + 1
        console.log(counter)
        return mock(counter, max)
    }


}
try {
    mock()
}catch(e) {
    console.log(e)
}
