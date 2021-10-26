const mongo = require('../mongo');
let userInfo = {
  user_id: 1
}
let enterpriseName = "test_enterpriseName";
let charter = "test_charterPath";
let phoneNumber = "test_phoneNumber";
mongo.init().then(() => {
  mongo.query('administrator_censor_list', async (collection) => {
    collection.updateOne({
      "user_id": userInfo.user_id,
      "editable": true,
    }, {
      $set: {
        user_id: userInfo.user_id,
        enterpriseName: enterpriseName,
        charter: charter,
        phoneNumber: phoneNumber? phoneNumber: null,
        editable: false
      }
    }, { upsert: false })
  }).then(res => {
    console.log(res)
  })
  
})