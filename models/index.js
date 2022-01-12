'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};
const mongo = require('../mongo');
mongo.init();
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable],
    {
      logging: false,
      ...config
    });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    logging: false,
    ...config
  });
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Worker.belongsTo(db.User, {
  foreignKey: 'user_binding'
});
db.Worker.belongsTo(db.Enterprise, {
  foreignKey: "company_belonged"
})
db.User.hasOne(db.Worker, {
  foreignKey: 'user_binding'
})
db.Enterprise.hasMany(db.Worker, {
  foreignKey: 'company_belonged'
})
db.Province.hasMany(db.City, {
  foreignKey: 'province_id'
});
db.City.belongsTo(db.Province, {
  foreignKey: 'province_id'
})
db.City.hasMany(db.County, {
  foreignKey: 'city_id'
})
db.County.belongsTo(db.City, {
  foreignKey: 'city_id'
})
db.County.hasMany(db.Town, {
  foreignKey: 'county_id'
})
db.Town.belongsTo(db.County, {
  foreignKey: 'county_id'
})
db.Job.hasMany(db.Interview, {
  foreignKey: 'job_id'
})
db.Interview.belongsTo(db.Job, {
  foreignKey: 'job_id'
})
db.Worker.hasMany(db.Job, {
  foreignKey: 'worker_id'
})
db.Job.belongsTo(db.Worker, {
  foreignKey: 'worker_id'
})
db.User.hasMany(db.JobExpectation, {
  foreignKey: 'user_id',
})
db.JobExpectation.belongsTo(db.User, {
  foreignKey: 'user_id'
})
db.User.hasMany(db.Resume, {
  foreignKey: 'user_id'
})
db.Job.hasOne(db.JobCache, {
  foreignKey: 'job_id',
})
db.JobCache.belongsTo(db.Job, {
  foreignKey: 'job_id'
})
db.Enterprise.hasMany(db.EnterpriseQuestion, {
  foreignKey: 'enterprise_id'
})
db.EnterpriseQuestion.belongsTo(db.Enterprise, {
  foreignKey: 'enterprise_id'
})
db.EnterpriseQuestion.hasMany(db.EnterpriseAnswer, {
  foreignKey: 'question_id'
})
db.EnterpriseAnswer.belongsTo(db.EnterpriseQuestion, {
  foreignKey: 'question_id'
})
db.EnterpriseQuestion.belongsTo(db.User, {
  foreignKey: 'user_id'
})
db.User.hasMany(db.EnterpriseQuestion, {
  foreignKey: 'user_id'
})
db.User.hasMany(db.InterviewRecomment, {
  foreignKey: 'user_id'
})
db.InterviewRecomment.belongsTo(db.User, {
  foreignKey: 'user_id'
})
db.User.hasMany(db.ContractList, {
  foreignKey: 'target'
})
db.ContractList.belongsTo(db.User, {
  foreignKey: 'target'
})
db.Job.hasMany(db.ResumeDeliveryRecord, {
  foreignKey: 'job_id'
})
db.ResumeDeliveryRecord.belongsTo(db.Job, {
  foreignKey: 'job_id'
})
db.Job.hasMany(db.ContractList, {
  foreignKey: 'job_id',
});
db.ContractList.belongsTo(db.Job, {
  foreignKey: 'job_id'
})
db.User.hasMany(db.Interview, {
  foreignKey: 'user_id',
});
db.Interview.belongsTo(db.User, {
  foreignKey: 'user_id'
})
db.User.hasMany(db.Resume, {
  foreignKey: 'user_id'
});
db.Resume.belongsTo(db.User, {
  foreignKey: 'user_id'
})
db.Resume.hasMany(db.ResumeWorkExp, {
  foreignKey: 'resume_id'
})
db.ResumeWorkExp.belongsTo(db.Resume, {
  foreignKey: 'resume_id'
})
db.User.afterCreate((user, options) => {
  try {
    db.User.findOne({
      where: user,
      include: [{
        model: db.JobExpectation,
      }, {
        model: db.Resume,
        include: [{
          model: db.ResumeWorkExp
        }]
      }]
    }).then(res => {
      mongo.query('talent_cache_for_search', async (collection) => {
        collection.updateOne({
          id: user.id,
        }, {
          $set: res.dataValues
        }, { upsert: true })
      })
    })
  } catch (e) {
    throw e
  }
});
db.User.afterUpdate((user, options) => {
  try {
    mongo.query('talent_cache_for_search', async (collection) => {
      collection.updateOne({
        id: user.id,
      }, {
        $set: user.dataValues
      }, { upsert: true })
    })
  } catch (e) {
    throw e
  }
});

db.mongo = mongo;
module.exports = db;
