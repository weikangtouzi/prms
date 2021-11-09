const mongo = require('../mongo');
let userInfo = {
  user_id: 1
}
let enterpriseName = "test_enterpriseName";
let charter = "test_charterPath";
let phoneNumber = "test_phoneNumber";
mongo.init().then(() => {
  mongo.query('user_log_in_cache', async (collection) => {
    return collection.updateOne({
      phoneNumber: "18179395368",
      code: "424142"
    }, [
      {
        $replaceWith: {
          phoneNumber: 18179395368,
          verified: "UserLogIn",
          createAt: new Date(),
        }
      }
    ] )
  }).then(res => {
    console.log(res)
  })
  
})