const {User, RecruitmentRecord, Recruitment} = require('../models')
const {Op} = require('sequelize')
// User.upsert({},{username: "aqqqqq"},{where:{id:1, createdAt: {[Op.lt]: new Date()}}}, {returning: true}).then(result => {
//     console.log(result)
// })
// Recruitment.create({}).then(result => {
    try {
        RecruitmentRecord.upsert({
            user_id: 1,
            recruitment_id: 1,
            canceled: false,
            extra_datas: JSON.stringify({ size: 1 })
          }, {
            where: {
              user_id: 1,
              recruitment_id: 1,
            },
            returning: true
          }).then(res => {
              console.log(res)
          })
        } catch (err) {
          throw err
        }
// })
