const { User, Resume, ResumeWorkExp, ResumeProjectExp, ResumeDeliveryRecord, ResumeEduExp, JobExpectation, Interview, InterviewRecomment, EnterpriseQuestion, EnterpriseAnswer, Job } = require('../models');
const bcrypt = require('bcrypt');
let names_as_str = "丁宏伯陈涵煦江雅畅林明知贺巍昂朱晋鹏蔡和志潘元亮张奇正刘康盛武志尚谭高原韩欣荣赵志诚毛兴文邵凯歌董思聪贾茂勋萧琪睿贺景明赵斌蔚于飞龙廖子瑜钟乐安郑温书顾宏义卢晋鹏黎睿诚罗安国任心思石才哲冯弘阔邹博文高自珍钱光华崔景胜陈阳焱易弘阔康涵涵曾修伟乔烨烨姚飞驰顾浩然赵良策丁飞捷魏咏思姜星纬康永昌阎永元郝烨华韩光远杜彭湃任建木冯伟才孟嘉慕杜天翰曹明亮梁彬炳陆天工姚昊然孙俊彦孔雨信白高阳杨修杰袁乐语邓雅懿徐学博熊星纬谢雨华白建德姜弘博彭承平周茂勋金高朗杨俊爽崔初瑶廖忻愉文半香韩凝荷林巧茹叶冰莹彭雪环毛乐芸卢乐欣孟海蓝秦妙柏夏嘉宝韩子美叶悦玮周献玉朱雅蕊毛雨晨高子欣范觅海马丽华汤晨风孔燕楠崔映萱沈一瑾钱思蕊胡忠燕文朵薇贺问柳吕迎梅赖宛曼汤津童魏柔婉文忆彤贺采莲任淳美江欣畅何韶阳何秋彤宋小妹易海云郑如容唐绮梅宋琳溪杜婉慧邹韶丽沈夏山汤柔雅武玉琲田韧颖袁宛凝曹古韵姜赫然朱思彤任泽恩常玲琅陆香洁丁寄凡戴映萱谢哲妍汤梦柏尹欣合陈霞飞杜韶仪段太文王谷丝武海萍谭玲玉方好慕孔玉轩许叶飞刘希蓉乔芬芬范友菱戴绮思赵任真";
let births_as_str = "1988-11-19\n\
1982-11-10\n\
1986-03-21\n\
1993-07-28\n\
1986-12-20\n\
1993-04-08\n\
1995-06-10\n\
2000-11-07\n\
1983-01-20\n\
1998-11-17\n\
1998-01-01\n\
1996-02-25\n\
1996-04-19\n\
1993-08-26\n\
1994-02-02\n\
1992-10-17\n\
1990-01-08\n\
1992-06-21\n\
1984-07-16\n\
1986-01-13\n\
1986-09-16\n\
1999-09-19\n\
1998-09-09\n\
1988-03-02\n\
1986-06-16\n\
2000-01-10\n\
1982-05-20\n\
1996-02-12\n\
1995-04-06\n\
1990-11-21\n\
1984-05-13\n\
1995-05-12\n\
1993-05-17\n\
1987-01-02\n\
1992-02-14\n\
1995-02-04\n\
1987-01-04\n\
1985-03-06\n\
2001-10-17\n\
1999-12-18\n\
1999-12-25\n\
2000-06-20\n\
1990-01-20\n\
1983-04-11\n\
1982-07-07\n\
1989-01-11\n\
1982-09-26\n\
1982-11-23\n\
2001-01-12\n\
1998-08-14\n\
1981-11-24\n\
1999-08-10\n\
2001-09-09\n\
1987-03-04\n\
1990-08-10\n\
1992-09-03\n\
1997-10-06\n\
1997-04-15\n\
1984-10-08\n\
1986-07-21\n\
1995-01-08\n\
1988-06-29\n\
1991-08-23\n\
1982-10-29\n\
1985-05-08\n\
1993-11-12\n\
1985-06-18\n\
1985-10-14\n\
1988-01-20\n\
1995-09-15\n\
1999-06-02\n\
1983-05-27\n\
1994-04-08\n\
1991-08-08\n\
1985-09-09\n\
1995-04-28\n\
1982-08-19\n\
1984-09-19\n\
1996-02-15\n\
1987-09-11\n\
1996-05-22\n\
1986-06-03\n\
1998-06-08\n\
1987-07-29\n\
1995-12-24\n\
1982-10-15\n\
1991-07-22\n\
1989-05-27\n\
1997-10-15\n\
1994-11-25\n\
2000-06-23\n\
1989-08-10\n\
1993-04-29\n\
1990-03-19\n\
2001-02-13\n\
2001-01-14\n\
1980-06-02\n\
1993-11-14\n\
1988-12-06\n\
1987-11-18\n\
1996-08-18\n\
1996-08-03\n\
2000-11-22\n\
2001-06-25\n\
2000-03-10\n\
1995-05-03\n\
1988-09-25\n\
1991-01-08\n\
1993-05-05\n\
1986-09-10\n\
1995-06-11\n\
1997-12-19\n\
1985-04-30\n\
1994-11-03\n\
1988-09-30\n\
1991-07-04\n\
1986-06-14\n\
1983-03-26\n\
1991-12-06\n\
1989-03-16\n\
1999-05-08\n\
1998-01-26\n\
1994-10-27\n\
1993-09-19\n\
1997-03-21\n\
1998-08-30\n\
1997-02-22\n\
1989-06-04\n\
1983-04-15\n\
1999-06-23\n\
1993-12-02\n\
1987-04-02\n\
1984-02-05\n\
1988-07-09\n\
1986-09-08\n\
1982-06-21\n\
1981-12-15\n\
1981-10-07\n\
1984-09-30\n\
1999-02-27\n\
1986-09-26\n\
1982-10-20\n\
1981-05-03\n\
1993-05-15\n\
1991-01-20\n\
1985-08-02\n\
1986-10-21\n\
2000-03-16\n\
1996-06-18\n\
1981-10-18";
const births = births_as_str.split("\n");
let ftws_as_str = "2001-03-26\n\
2012-08-26\n\
2020-03-02\n\
1996-07-13\n\
2016-09-08\n\
2001-06-06\n\
2010-07-14\n\
2005-08-08\n\
2009-12-06\n\
2014-01-17\n\
2018-10-10\n\
2011-09-02\n\
2015-09-09\n\
1999-09-08\n\
2019-07-30\n\
1999-12-14\n\
2015-12-07\n\
2020-08-22\n\
2001-09-05\n\
2004-01-12\n\
2019-10-02\n\
1999-04-15\n\
2012-01-19\n\
2014-06-22\n\
2018-01-02\n\
2019-11-27\n\
2001-02-13\n\
2013-12-26\n\
2010-08-28\n\
2010-04-11\n\
1998-12-05\n\
2008-11-15\n\
2005-04-01\n\
2009-08-08\n\
2001-03-17\n\
2004-03-30\n\
2015-07-17\n\
2008-07-17\n\
2019-08-27\n\
2021-09-22\n\
2005-02-05\n\
2011-03-20\n\
1999-04-02\n\
2000-01-12\n\
2002-08-18\n\
2010-05-11\n\
1997-06-30\n\
2000-04-18\n\
2009-09-15\n\
2002-01-16\n\
2008-10-01\n\
1996-09-02\n\
2008-11-19\n\
2014-09-16\n\
1998-01-21\n\
2010-01-07\n\
1999-04-05\n\
2005-06-20\n\
2006-12-24\n\
2000-06-30\n\
2012-09-24\n\
2003-01-11\n\
2009-10-19\n\
2002-12-15\n\
2009-08-05\n\
2007-06-16\n\
1996-08-20\n\
2010-07-25\n\
1998-11-19\n\
2008-04-19\n\
2018-11-18\n\
2007-08-05\n\
2011-07-26\n\
1998-10-10\n\
2012-02-18\n\
2021-04-01\n\
1999-05-02\n\
1997-04-20\n\
2018-02-05\n\
2010-07-28\n\
1997-01-11\n\
2010-07-12\n\
2008-02-07\n\
2001-08-20\n\
2000-04-24\n\
2014-08-26\n\
2003-11-17\n\
2014-10-21\n\
1999-11-02\n\
2004-05-04\n\
2002-03-05\n\
2016-11-08\n\
2017-10-14\n\
2021-08-20\n\
2008-01-18\n\
2016-03-11\n\
1996-02-16\n\
2015-09-21\n\
2019-09-13\n\
2004-10-31\n\
1999-04-17\n\
2019-07-24\n\
2014-02-09\n\
2017-09-30\n\
2013-08-10\n\
1997-07-15\n\
1996-01-05\n\
1996-09-13\n\
2020-12-13\n\
2017-06-21\n\
1997-05-15\n\
2016-04-28\n\
2017-01-29\n\
2011-07-16\n\
2002-02-07\n\
2013-11-10\n\
2020-11-09\n\
2010-08-14\n\
2002-04-01\n\
2014-12-26\n\
2011-04-01\n\
2009-04-18\n\
2021-01-12\n\
2021-07-05\n\
2001-06-06\n\
2006-09-13\n\
2019-04-06\n\
1998-05-15\n\
1999-09-28\n\
2003-11-21\n\
2021-06-21\n\
2020-11-10\n\
2014-04-11\n\
2014-02-24\n\
2017-05-24\n\
2008-10-11\n\
2010-05-10\n\
2002-01-17\n\
2003-09-18\n\
2011-11-05\n\
1998-08-09\n\
2001-10-26\n\
2004-06-25\n\
2016-12-15\n\
2020-04-25\n\
2001-04-19\n\
2017-12-22\n\
2009-01-10\n\
2016-07-31\n\
2009-12-09";
const ftws = ftws_as_str.split("\n");
let wests_as_str = "2000-04\n\
2007-03\n\
2004-07\n\
2013-09\n\
2018-04\n\
2012-07\n\
2002-03\n\
2013-08\n\
2001-04\n\
2003-05\n\
2013-03\n\
2001-08\n\
2007-12\n\
2013-07\n\
2004-12\n\
2005-08\n\
2008-08\n\
2016-07\n\
2017-10\n\
2003-06\n\
2008-10\n\
2005-05\n\
2005-07\n\
2013-07\n\
2006-09\n\
2005-08\n\
2009-02\n\
2014-01\n\
2006-12\n\
2008-11\n\
2002-10\n\
2007-03\n\
2004-08\n\
2002-11\n\
2011-10\n\
2017-12\n\
2015-09\n\
2014-11\n\
2014-04\n\
2016-11\n\
2003-01\n\
2006-01\n\
2006-05\n\
2018-10\n\
2002-10\n\
2016-04\n\
2014-07\n\
2004-10\n\
2016-12\n\
2002-05\n\
2008-11\n\
2004-04\n\
2015-04\n\
2002-11\n\
2003-02\n\
2007-08\n\
2017-09\n\
2008-03\n\
2017-04\n\
2008-03\n\
2015-06\n\
2018-05\n\
2009-04\n\
2015-02\n\
2003-02\n\
2013-01\n\
2005-08\n\
2014-01\n\
2009-09\n\
2011-12\n\
2006-01\n\
2007-04\n\
2016-11\n\
2016-03\n\
2002-06\n\
2011-04\n\
2008-12\n\
2002-06\n\
2003-10\n\
2009-04\n\
2003-09\n\
2005-11\n\
2013-07\n\
2017-04\n\
2000-12\n\
2006-12\n\
2010-01\n\
2009-09\n\
2004-03\n\
2001-12\n\
2000-04\n\
2001-03\n\
2011-04\n\
2016-07\n\
2010-05\n\
2010-11\n\
2004-04\n\
2004-05\n\
2015-01\n\
2013-08\n\
2000-09\n\
2000-09\n\
2003-10\n\
2012-02\n\
2018-03\n\
2014-10\n\
2006-09\n\
2010-05\n\
2007-01\n\
2002-02\n\
2005-05\n\
2002-10\n\
2012-02\n\
2016-01\n\
2000-04\n\
2005-03\n\
2018-05\n\
2001-01\n\
2015-07\n\
2000-08\n\
2002-03\n\
2006-02\n\
2009-10\n\
2004-02\n\
2004-05\n\
2006-03\n\
2005-10\n\
2009-10\n\
2013-12\n\
2009-12\n\
2018-03\n\
2008-05\n\
2005-12\n\
2010-01\n\
2007-04\n\
2000-07\n\
2004-06\n\
2012-10\n\
2010-09\n\
2009-10\n\
2016-07\n\
2011-06\n\
2000-09\n\
2014-09\n\
2005-05\n\
2005-10\n\
2008-11\n\
2012-11\n\
2014-11\n\
2014-08";
const wests = wests_as_str.split("\n");
let weets_as_str = "2020-07\n\
2020-09\n\
2019-09\n\
2020-04\n\
2020-03\n\
2020-11\n\
2019-07\n\
2020-03\n\
2019-05\n\
2020-11\n\
2020-04\n\
2019-01\n\
2020-11\n\
2020-09\n\
2020-06\n\
2019-01\n\
2020-03\n\
2020-07\n\
2019-09\n\
2019-02\n\
2019-04\n\
2019-11\n\
2020-07\n\
2019-02\n\
2020-12\n\
2020-05\n\
2020-12\n\
2020-11\n\
2019-02\n\
2020-09\n\
2020-04\n\
2020-03\n\
2019-07\n\
2019-10\n\
2019-03\n\
2020-02\n\
2020-03\n\
2020-08\n\
2020-04\n\
2020-05\n\
2020-10\n\
2019-08\n\
2020-06\n\
2019-09\n\
2019-09\n\
2019-10\n\
2019-07\n\
2019-05\n\
2019-05\n\
2020-03\n\
2020-08\n\
2020-10\n\
2019-10\n\
2020-08\n\
2019-11\n\
2020-06\n\
2019-09\n\
2020-04\n\
2020-06\n\
2020-01\n\
2020-10\n\
2019-01\n\
2019-10\n\
2020-09\n\
2020-10\n\
2020-04\n\
2020-01\n\
2019-07\n\
2020-03\n\
2020-05\n\
2020-04\n\
2019-05\n\
2019-04\n\
2019-09\n\
2019-05\n\
2020-10\n\
2019-07\n\
2019-08\n\
2019-06\n\
2019-02\n\
2019-10\n\
2020-06\n\
2020-03\n\
2019-04\n\
2019-02\n\
2020-11\n\
2019-09\n\
2020-05\n\
2020-05\n\
2020-02\n\
2020-12\n\
2020-07\n\
2020-10\n\
2020-01\n\
2020-04\n\
2020-09\n\
2020-04\n\
2020-08\n\
2020-12\n\
2019-04\n\
2020-09\n\
2019-04\n\
2020-07\n\
2019-07\n\
2019-07\n\
2020-07\n\
2019-06\n\
2019-06\n\
2019-02\n\
2020-05\n\
2020-06\n\
2019-03\n\
2020-05\n\
2020-07\n\
2020-08\n\
2020-09\n\
2020-03\n\
2020-05\n\
2020-10\n\
2019-08\n\
2019-03\n\
2019-06\n\
2020-08\n\
2020-08\n\
2019-06\n\
2019-07\n\
2020-01\n\
2020-04\n\
2019-01\n\
2020-09\n\
2019-12\n\
2020-12\n\
2020-12\n\
2019-08\n\
2019-03\n\
2020-12\n\
2020-04\n\
2020-11\n\
2020-09\n\
2020-01\n\
2020-05\n\
2020-04\n\
2020-10\n\
2019-04\n\
2019-06\n\
2020-11\n\
2019-11\n\
2020-08\n\
2019-02\n\
2019-11";
const weets = weets_as_str.split("\n");
const job_statuss = ["NoJobButNoJob", "NoJobButWantJob", "OnTheJob", "OnTheJobButLookingForAJob", "GraduatingStudent"];
const ens = ["Anytime", "LessThanTwoDays", "LessThanOneWeek", "LessThanTwoWeeks", "LessThanOneMonth", "MoreThanOneMonth"]
let passwords = [];
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
job_titles = job_titles.map(item => { return ["互联网/通信及硬件", "软件研发", item] });
const skills_selections = ["C#", "C", "C++", "JavaScript/Typescript", "MySQL", "Microsoft SQL Server", "Oracle", "PostgreSQL"];
let industry = [["互联网/IT/电子/通信", "电子商务"], ["房地产/建筑", "房地产开发与经营"], ["生活服务", "餐饮"]]
function getName(index) {
    return names_as_str.substring(index * 3, (index + 1) * 3);
}
for (let i = 0; i < 150; i++) {
    passwords[i] = bcrypt.hashSync("word_" + i, 2)
}
async function mock(counter = 0, max = 150) {
    process.stdout.write(`mocking candidates: ${counter}/${max}\n`)
    if (counter == max) {
        return
    }
    let user = await User.create({
        username: "client_" + counter,
        password: passwords[counter],
        phone_number: "18800001" + (counter < 100 ? (counter < 10 ? "00" + counter : "0" + counter) : counter),
        identified: "None",
        gender: counter < 75,
        real_name: getName(counter),
        birth_date: new Date(births[counter]),
    });
    let ms = Math.round(Math.random() * 10 + 1) * 1000;
    for (let i = 0; i < 3; i++) {
        await JobExpectation.create({
            user_id: user.id,
            job_category: job_titles[((counter % 29 + i) < 28) ? (counter % 29 + i) : i],
            aimed_city: "city",
            min_salary_expectation: ms,
            max_salary_expectation: ms + Math.round(Math.random() * 4 + 1) * 1000,
            industry_involved: industry[counter % 3]
        })
    }

    let resume = await Resume.create({
        user_id: user.id,
        personal_advantage: "",
        skills: [skills_selections[counter % 8]]
    });
    await User.update({
        real_name: getName(counter),
        birth_date: user.birth_date,
        first_time_working: new Date(ftws[counter]),
        current_city: "上饶",
        job_status: job_statuss[counter % 4],
        employment_nature: ens[counter % 6],
    }, {
        where: {
            id: user.id,
        }
    });
    await ResumeWorkExp.create({
        resume_id: resume.id,
        comp_name: "ent_" + counter % 12,
        pos_name: "开发",
        department: "技术部",
        start_at: wests[counter],
        end_at: weets[counter],
        working_detail: "keep it as a secret"
    });
    await ResumeEduExp.create({
        resume_id: resume.id,
        school_name: "广州大学",
        education: "RegularCollege",
        is_all_time: true,
        major: "计算机科学与技术",
        time: `${parseInt(wests[counter].substring(0, 4)) - 4}-${wests[counter].substring(0, 4)}`,
        exp_at_school: "keep it as a secret"
    })
    await ResumeProjectExp.create({
        resume_id: resume.id,
        project_name: "project_" + counter,
        role: "开发",
        start_at: new Date(wests[counter]),
        end_at: new Date(weets[counter]),
        project_description: "keep it as a secret",
        project_performance: "keep it as a secret"
    })
    let comp_id = (user.id % 12)+1;
    let res = await Job.findOne({
        where: {
            comp_id
        },
    })
    await ResumeDeliveryRecord.create({
        user_id: user.id,
        resume_id: resume.id,
        job_id: res.id,
        comp_id,
        hr_id: res.worker_id,
        readedAt: user.id%2 == 0? new Date() : null
    })
    counter++
    return mock(counter, max)
}
mock().then(() => {
    Interview.create({
        user_id: 37,
        job_id: 1,
        hr_id: 2,
        appointment_time: new Date(),
        ended_at: new Date(new Date().getTime() + 1000),
        comp_name: "ent_0",
        status: "Passed"
    }).then((interview) => {
        InterviewRecomment.create({
            interview_id: interview.id,
            job_name: "Java",
            user_id: 37,
            comp_id: 1,
            content: "aaaaa",
            description: 2,
            comp_env: 3,
            tags: ["a", "b"]
        })
    })
    Interview.create({
        user_id: 38,
        job_id: 1,
        hr_id: 2,
        appointment_time: new Date(),
        ended_at: new Date(new Date().getTime() + 1000),
        comp_name: "ent_0",
        status: "Passed"
    }).then((interview) => {
        InterviewRecomment.create({
            interview_id: interview.id,
            job_name: "Java",
            user_id: 38,
            comp_id: 1,
            content: "aaaaa",
            description: 2,
            comp_env: 3,
            tags: ["a", "b"]
        })
    })
    Interview.create({
        user_id: 39,
        job_id: 1,
        hr_id: 2,
        appointment_time: new Date(),
        ended_at: new Date(new Date().getTime() + 1000),
        comp_name: "ent_0",
        status: "Passed"
    }).then((interview) => {
        InterviewRecomment.create({
            interview_id: interview.id,
            job_name: "Java",
            user_id: 39,
            comp_id: 1,
            content: "aaaaa",
            description: 2,
            comp_env: 3,
            tags: ["a", "b"]
        }).then((res) => {
            EnterpriseQuestion.create({
                user_id: 37,
                enterprise_id: 1,
                question_description: "daiodasfhaij",
                anonymous: false
            }).then(question => {
                EnterpriseAnswer.create({
                    user_id: 2,
                    question_id: 1,
                    content: "djasdfhasudhadh",
                    anonymous: false,
                })
            })
        })
    })


})


