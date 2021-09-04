const enterprise = require("./enterprise");
const goods = require("./goods");
const interview = require("./interview");
const interview_evaluation = require("./interview_evaluation");
const job = require("./job");
const job_expectation = require("./job_expectation");
const user = require("./users");
const worker = require("./worker");
const message = require("./message");
const order = require("./order");
const resume = require("./resume");


module.exports = {
  init: async (force) => {
    await user.sync({ force: force });
    let next = async () => {
      enterprise.sync({ force: force });
      goods.sync({ force: force });
      interview.sync({ force: force });
      interview_evaluation.sync({ force: force });
      job_expectation.sync({ force: force });
      job.sync({ force: force });
      order.sync({ force: force });
      message.sync({ force: force });
      worker.sync({ force: force });
      resume.sync({ force: force });
    };
    await next();
    console.log("database init success");
  }
}