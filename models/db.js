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
const province = require("./province");
const city = require("./city");
const provinces_data = require("../data/province");
const citys_data = require("../data/city");
const countys_data = require("../data/county");
const towns_data = require("../data/town");
const county = require("./county");
const town = require("./town");


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
    next().then(_ => {
      console.log("database init success");
      console.log("now starting to load data of citys...");
      let last = async () => {
        province.sync({ force: force }).then(_ => {
          console.log("done init province data structure starting fetching data for this table...");
          let pro_async = async () => {
            await province.bulkCreate(provinces_data);
          };
          pro_async().then(_ => {
            console.log("done fetching province data for this table...");
            city.sync({ force: force }).then(_ => {
              console.log("done init city data structure starting fetching data for this table...");
              let city_async = async () => {
                await city.bulkCreate(citys_data);
              };
              city_async().then(_ => {
                console.log("done fetching city data for this table...");
                county.sync({ force: force }).then(_ => {
                  console.log("done init county data structure starting fetching data for this table...");
                  let county_async = async () => {
                    await county.bulkCreate(countys_data);
                  };
                  county_async().then(_ => {
                    town.sync({ force: force }).then(_ => {
                      console.log("done init town data structure starting fetching data for this table...");
                      let town_async = async () => {
                        await town.bulkCreate(towns_data);
                      };
                      town_async().then(_ => {
                        console.log("done with fetching data");
                      })
                    })
                  });
                })
              })
            })
          });
        }).catch(err => {
          console.log("database init failed with error: " + err);
        });
      };
      last().then(_ => {
        console.log("init city data finished");
      }).catch(err => {
        console.log("init city data failed with error: " + err);
      })
    })
  }
};