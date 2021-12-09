const {User, RecruitmentRecord, Recruitment} = require('../models')
const {Op} = require('sequelize')

Recruitment.create({}).then(result => {
    try {
        RecruitmentRecord.upsert({
            user_id: 1,
            recruitment_id: 3,
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
