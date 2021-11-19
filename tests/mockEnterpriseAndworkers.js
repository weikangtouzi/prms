const { Enterprise, Worker, User, Job } = require('../models');
const bcrypt = require('bcrypt');
let real_names = ["王飞跃", "辛成济", "束伟志", "蒋翰学", "益英纵", "徐雅健", "惠乐生", "车翰海", "向煊", "巢殿", "巢中", "冷全", "万馗", "厍轼", "隆竹", "桂俊", "璩容", "顾莎", "易烁", "鱼儿", "罗瑶", "能妍", "何琼", "田影", "糜冷雪", "何杉月", "牧娴雅", "简友绿", "雍笑寒", "松向莉", "黄端静", "秦以晴", "薛彬郁", "钟荣轩", "顾光誉", "沈天骄"]
let passwords = [];
for (let i = 0; i < 36; i++) {
    passwords[i] = bcrypt.hashSync("pass_" + i, 2)
}
let industry = [["互联网/IT/电子/通信", "电子商务"], ["房地产/建筑", "房地产开发与经营"], ["生活服务", "餐饮"]]
let job_titles = [
    "Java",
    "PHP",
    "Python",
    ".NET",
    "C",
    "C#",
    "C++",
    "Delphi",
    "Erlang",
    "GIS",
    "Golang",
    "mano",
    "Node.js",
    "Perl",
    "Ruby",
    "VB",
    "架构师",
    "全栈工程师",
    "软件工程师",
    "嵌入式软件开发",
    "脚本开发",
    "需求分析",
    "配置管理",
    "系统集成",
    "云计算",
    "语音/视频/图形开发",
    "ERP技术/应用",
    "研发经理",
    "IT技术/研发总监"
];
job_titles = job_titles.map(item => {return ["互联网/通信及硬件","软件研发",item]});
console.log(job_titles[37 %29 + 0])
console.log(job_titles[37 %29 + 1])
console.log(job_titles[37 %29 + 2])
const edu_requirements = ["Null", "High", "JuniorCollege", "RegularCollege", "Postgraduate", "Doctor"]
const full_time_jobs = ["FullTime", "PartTime", "InterShip"]
const tags = ["免费体检", "住房补贴", "餐补", "上市公司"];
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
                }, {
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
                    industry_involved: industry[counter.ent % 3],
                    enterprise_profile: "ent_" + counter.ent,
                    enterprise_financing: "NoNeed",
                    enterprise_size: "LessThanFifteen",
                    enterprise_coordinates: {
                        type: 'Point',
                        coordinates: [counter.ent, counter.ent]
                    },
                    enterprise_loc_detail: [""],
                }, {
                    returning: true
                })
                await Worker.create({
                    company_belonged: ent.dataValues.id,
                    real_name: user.dataValues.real_name,
                    user_binding: user.dataValues.id,
                    role: "Admin",
                    pos: "总经理",
                    phone_number: user.dataValues.phone_number
                }, {
                    returning: true
                })

            } else {
                let hr = await Worker.create({
                    company_belonged: ent.dataValues.id,
                    real_name: user.dataValues.real_name,
                    user_binding: user.dataValues.id,
                    role: "HR",
                    pos: "人事",
                    phone_number: user.dataValues.phone_number
                }, {
                    returning: true
                })
                for (let j = 0; j < 29; j++) {
                    let ms = Math.round(Math.random() * 10 + 1) * 1000;
                    let ts = Math.round(Math.random() * 3);
                    await Job.create({
                        worker_id: hr.id,
                        title: job_titles[j][2],
                        category: job_titles[j],
                        detail: "keep it as a secret",
                        adress_coordinate: {
                            type: 'Point',
                            coordinates: [counter.ent, counter.ent]
                        },
                        adress_description: "",
                        min_salary: ms,
                        max_salary: ms + Math.round(Math.random() * 4 + 1) * 1000,
                        min_experience: Math.round(Math.random() * 5) + 1,
                        min_education: edu_requirements[j % 6],
                        required_num: Math.round(Math.random() * 10) + 1,
                        ontop: j % 2 == 0,
                        full_time_job: full_time_jobs[j % 3],
                        tags: tags.slice(ts, ts = 3? undefined : ts + Math.round(Math.random() * (3 - ts))),
                        comp_id: ent.id,
                    })
                }
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
} catch (e) {
    console.log(e)
}
