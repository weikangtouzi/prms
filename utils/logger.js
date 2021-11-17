var log4js = require("log4js");
const {env} = require("../project.json")
log4js.configure({
  appenders: {
    deepLink: {
      type: 'file', filename: "server.log"
    },
    stdout: {
      type: 'stdout'
    }
  },
  categories: {
    default: {
      appenders: ['deepLink'],
      level: 'INFO'
    }
  }
})
const logger = log4js.getLogger('default');
const info = (msg) => {
  logger.info(msg)
}
const error = (msg) => {
    if(env == 'development') console.error(msg)
    logger.error(msg)
}

module.exports = {
    info,
    error,
}