const { User, RecruitmentRecord, Recruitment } = require('../models')
const { Op } = require('sequelize')
const chars = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
const run = () => {
  for (let i = 0; i < 100; i++) {
    let name = ""
    for (let j = 0; j < 6; j++) {
      name += chars[Math.round(Math.random() * 26)]
    }
    Recruitment.create({
      name,
      address_description: [],
      cover: ""
    }).then(result => {
      try {
        RecruitmentRecord.upsert({
          user_id: 1,
          recruitment_id: result.id,
          canceled: false,
          extra_datas: JSON.stringify({ size: 1 }),
          is_comp: true,

        }, {
          where: {
            user_id: 1,
            recruitment_id: 1,
          },
          returning: true
        }).then(res => {
          console.log(res[0].isNewRecord)
        })
      } catch (err) {
        throw err
      }
    })
  }
}
for (let i = 0; i < 100; i++) {
  run()
}