const {Resume} = require('../models')
async function test() {
    const [resume, created] = await Resume.findOrCreate({
        where: {user_id: 1},
        defaults: {

        }
    })
    console.log(resume, created)
}
test()