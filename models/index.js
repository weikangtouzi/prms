'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};
const mongo = require('../mongo');
const { info } = require('../utils/logger');
const elasticSearch = require('../elasticSearch')
const { Education, ResumeJobStatus} = require('../graphql/types/')

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
      where: {
        id: user.id,
      }
    }).then(res => {
      elasticSearch.index({
        index: 'talent_search',
        id: user.id,
        body: {
          ...res.dataValues,
          education: {
            name: res.dataValues.education,
            lvl: Education.getValue(res.dataValues.education)
          },
          first_time_working: res.dataValues.first_time_working ? new Date(res.dataValues.first_time_working) : null,
          birth_date: res.dataValues.birth_date ? new Date(res.dataValues.birth_date) : null,
        }
        // operation to perform
      }).catch(err => {
        throw err
      })
    })
  } catch (e) {
    throw e
  }
});
db.User.afterBulkUpdate((user, options) => {
  try {
    db.User.findOne({
      where: {
        id: user.where.id,
      },
      include: [{
        model: db.JobExpectation,
      }, {
        model: db.Resume,
        include: [{
          model: db.ResumeWorkExp,
          limit: 1,
          order: [["end_at", "DESC"]]
        }]
      }]
    }).then(res => {
      if (user.attributes && user.attributes.image_url) {
        db.EnterpriseQuestion.update({
          logo: res.dataValues.image_url,
        }, {
          where: {
            user_id: res.dataValues.id
          }
        })
        db.Worker.findOne({
          where: {
            user_binding: res.dataValues.id
          },
          attributes: ["id"]
        }).then(({ dataValues }) => {
          if (dataValues) {
            db.EnterpriseAnswer.update({
              logo: res.dataValues.image_url,
            }, {
              where: {
                user_id: dataValues.id
              }
            })
          }
        })
      }
      elasticSearch.update({
        index: 'talent_search',
        id: String(res.dataValues.id),
        body: {
          // operation to perform
          // the document to index
          doc: {
            ...res.dataValues,
            education: res.dataValues.education ? {
              name: res.dataValues.education,
              lvl: Education.getValue(res.dataValues.education).value
            } : null, 
            job_status: res.dataValues.job_status ? {
              name: res.dataValues.job_status,
              lvl: ResumeJobStatus.getValue(res.dataValues.job_status).value
            } : null,
            Resumes: res.dataValues.Resumes.map(item => {
              return {
                ...item.dataValues,
                ResumeWorkExps: item.dataValues.ResumeWorkExps[0] ? item.dataValues.ResumeWorkExps[0].dataValues : null
              }
            }),

            JobExpectations: res.dataValues.JobExpectations.map(item => item.dataValues),
            first_time_working: res.dataValues.first_time_working ? new Date(res.dataValues.first_time_working) : null,
            birth_date: res.dataValues.birth_date ? new Date(res.dataValues.birth_date) : null,
          }
        },
        retry_on_conflict: 8,
      }).catch(err => {
        throw err
      })
    })

  } catch (e) {
    throw e
  }
});
db.JobExpectation.afterBulkUpdate((jobExpectation, options) => {
  try {
    db.JobExpectation.findOne({
      where: {
        id: jobExpectation.where.id
      }, attributes: ["user_id"]
    }).then(res => {
      db.User.update({ updatedAt: res.dataValues.updatedAt }, {
        where: {
          id: res.dataValues.user_id
        }
      })
    })
  } catch (e) {
    throw e
  }
})
db.JobExpectation.afterCreate((jobExpectation, options) => {
  try {
    db.User.update({ updatedAt: jobExpectation.updatedAt }, {
      where: {
        id: jobExpectation.dataValues.user_id
      }
    })
  } catch (e) {
    throw e
  }
})
db.Resume.afterCreate((resume, options) => {
  try {
    db.User.update({ updatedAt: resume.updatedAt }, {
      where: {
        id: resume.dataValues.user_id
      }
    })
  } catch (e) {
    throw e
  }
})
db.Resume.afterBulkUpdate((resume, options) => {
  console.log(resume)
  try {
    db.Resume.findOne({
      where: {
        id: resume.where.id
      }, attributes: ["user_id"]
    }).then(res => {
      db.User.update({ updatedAt: res.dataValues.updatedAt }, {
        where: {
          id: res.dataValues.user_id
        }
      })
    })
  } catch (e) {
    throw e
  }
})
db.ResumeWorkExp.afterCreate((resumeWorkExp, options) => {
  try {
    db.Resume.update({ updatedAt: resumeWorkExp.updatedAt }, {
      where: {
        id: resumeWorkExp.dataValues.resume_id
      }
    })
  } catch (e) {
    throw e
  }
})
db.ResumeWorkExp.afterBulkUpdate((resumeWorkExp, options) => {
  try {
    db.ResumeWorkExp.findOne({
      where: {
        id: resumeWorkExp.where.id
      }, attributes: ["resume_id"]
    }).then(res => {
      db.Resume.update({ updatedAt: res.dataValues.updatedAt }, {
        where: {
          id: res.dataValues.resume_id
        }
      })
    })

  } catch (e) {
    throw e
  }
})
db.ResumeProjectExp.afterCreate((resumeProjectExp, options) => {
  try {

    db.Resume.update({ updatedAt: resumeProjectExp.updatedAt }, {
      where: {
        id: resumeProjectExp.dataValues.resume_id
      }
    })
  } catch (e) {
    throw e
  }
})
db.ResumeProjectExp.afterBulkUpdate((resumeProjectExp, options) => {
  try {
    db.ResumeProjectExp.findOne({
      where: {
        id: resumeProjectExp.where.id
      }, attributes: ["resume_id"]
    }).then(res => {
      db.Resume.update({ updatedAt: res.dataValues.updatedAt }, {
        where: {
          id: res.dataValues.resume_id
        }
      })
    })

  } catch (e) {
    throw e
  }
})
db.ResumeEduExp.afterCreate((resumeEduExp, options) => {
  try {
    db.Resume.update({ updatedAt: resumeEduExp.updatedAt }, {
      where: {
        id: resumeEduExp.dataValues.resume_id
      }
    })
  } catch (e) {
    throw e
  }
})
db.ResumeEduExp.afterBulkUpdate((resumeEduExp, options) => {
  try {
    db.ResumeEduExp.findOne({
      where: {
        id: resumeEduExp.where.id
      }, attributes: ["resume_id"]
    }).then(res => {
      db.Resume.update({ updatedAt: res.dataValues.updatedAt }, {
        where: {
          id: res.dataValues.resume_id
        }
      })
    })
  } catch (e) {
    throw e
  }
})
db.Interview.afterCreate((interview, options) => {
  elasticSearch.update({
    index: 'talent_search',
    id: String(interview.dataValues.user_id),
    body: {
      // operation to perform
      // the document to index
      script: {
        source: 'if(ctx._source.interview_status == null) {ctx._source.interview_status = new def[]{params.interview_status};} else {def is = ctx._source.interview_status;def add = true;for(int i = 0; i < is.length; i++) {if(is[i].candidateId == params.interview_status.candidateId) { if(is[i].jobId == params.interview_status.jobId) { if(is[i].HRId == params.interview_status.HRId) { add = false;ctx._source.interview_status[i].status = params.interview_status.status;break; } } } } if(add) { ctx._source.interview_status.add(params.interview_status); }}',
        lang: "painless",
        params: {
          interview_status: {
            candidateId: interview.dataValues.user_id,
            jobId: interview.dataValues.job_id,
            HRId: interview.dataValues.hr_id,
            status: interview.dataValues.status
          }
        }
      }
    }
  }).catch(err => {
    throw err
  })
})
db.Interview.afterUpdate((interview, options) => {
  db.Interview.findOne({
    where: {
      id: interview.id
    }
  }).then(res => {
    elasticSearch.update({
      index: 'talent_search',
      id: String(res.dataValues.user_id),
      body: {
        // operation to perform
        // the document to index
        script: {
          source: 'if(ctx._source.interview_status == null) {ctx._source.interview_status = new def[]{params.interview_status};} else {def is = ctx._source.interview_status;def add = true;for(int i = 0; i < is.length; i++) {if(is[i].candidateId == params.interview_status.candidateId) { if(is[i].jobId == params.interview_status.jobId) { if(is[i].HRId == params.interview_status.HRId) { add = false;ctx._source.interview_status[i].status = params.interview_status.status;break; } } } } if(add) { ctx._source.interview_status.add(params.interview_status); }}',
          lang: "painless",
          params: {
            interview_status: {
              candidateId: res.dataValues.user_id,
              jobId: res.dataValues.job_id,
              HRId: res.dataValues.hr_id,
              status: res.dataValues.status
            }
          }
        }
      }
    }).catch(err => {
      throw err
    })
  })
})
db.Job.afterCreate((job, options) => {
  db.Job.findOne({
    where: {
      id: job.id
    },
    include: [{
      model: db.Worker,
      include: [{
        model: db.Enterprise
      }, {
        model: db.User
      }]
    }]
  }).then(res => {
    db.JobCache.create({
      ...res.dataValues,
      id: null,
      job_id: res.dataValues.id,
      worker_id: res.dataValues.Worker.id,
      hr_name: res.dataValues.Worker.real_name,
      hr_pos: res.dataValues.Worker.pos,
      comp_id: res.dataValues.Worker.Enterprise.id,
      comp_name: res.dataValues.Worker.Enterprise.enterprise_name,
      comp_size: res.dataValues.Worker.Enterprise.enterprise_size,
      comp_financing: res.dataValues.Worker.Enterprise.enterprise_financing,
      logo: res.dataValues.Worker.User.logo,
      created_at: res.dataValues.createdAt,
      updated_at: res.dataValues.updatedAt
    })
  })
})
db.Job.afterBulkUpdate((job, options) => {
  db.Job.findOne({
    where: {
      id: job.where.id
    }
  }).then(res => {
    db.JobCache.update({
      ...res.dataValues,
      created_at: res.dataValues.createdAt,
      updated_at: res.dataValues.updatedAt
    }, {
      where: {
        job_id: res.dataValues.id
      }
    })
  })
})
db.Worker.afterBulkUpdate((worker, options) => {
  let where;
  if(worker.where.id) where = { id: worker.where.id }
  if(worker.where.company_belonged) where = { company_belonged: worker.where.company_belonged }
  if(!where) return
  db.Worker.findOne({
    where,
  }).then(res => {
   db.JobCache.update({
    worker_id: res.dataValues.id,
    hr_name: res.dataValues.real_name,
    hr_pos: res.dataValues.pos,
   }, {
     where: {
        worker_id: res.dataValues.id
     }
   })
  })
})
db.Enterprise.afterBulkUpdate((enterprise, options) => {
  db.Enterprise.findOne({
    where: {
      id: enterprise.where.id
    },
  }).then(res => {
    db.JobCache.update({
      comp_id: res.dataValues.id,
      comp_name: res.dataValues.enterprise_name,
      comp_size: res.dataValues.enterprise_size,
      comp_financing: res.dataValues.enterprise_financing,
    }, {
      where: {
        comp_id: res.dataValues.id
      }
    })
  })
})

db.JobCache.afterCreate((job) => {
  db.JobCache.findOne({
    where: {
      id: job.id
    }
  }).then(res => {
    elasticSearch.index({
      index: 'job_search',
      id: job.id,
      body: {
        ...res.dataValues,
        min_education: {
          name: res.dataValues.min_education,
          lvl: Education.getValue(res.dataValues.min_education)
        }
      }
      // operation to perform
    }).catch(err => {
      throw err
    })
  })
})

db.Enterprise.hasMany(db.Job, {
  foreignKey: "comp_id"
})
db.Job.belongsTo(db.Enterprise, {
  foreignKey: "comp_id"
})
db.Resume.hasMany(db.ResumeEduExp, {
  foreignKey: "resume_id"
})
db.ResumeEduExp.belongsTo(db.Resume, {
  foreignKey: "resume_id"
})
db.Resume.hasMany(db.ResumeProjectExp, {
  foreignKey: "resume_id"
})
db.ResumeProjectExp.belongsTo(db.Resume, {
  foreignKey: "resume_id"
})
db.mongo = mongo;
module.exports = db;
