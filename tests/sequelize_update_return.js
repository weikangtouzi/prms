const {User} = require('../models')
const {Op} = require('sequelize')
User.update({username: "a"},{where:{id:1, createdAt: {[Op.lt]: new Date()}}}, {returning: true}).then(result => {
    console.log(result)
})