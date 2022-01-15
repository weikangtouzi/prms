const elasticSearch = require('../elasticSearch')
const db = require('../models')
const { Education } = require('../graphql/types')
const { Op } = require('sequelize')
db.User.findAll({
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
  let dataset = res.map(item => {
    return {
      ...item.dataValues,
      education: item.dataValues.education ? {
        name: item.dataValues.education,
        lvl: Education.getValue(item.dataValues.education).value
      } : null,
      experience: item.dataValues.first_time_working ? (new Date().getFullYear() - new Date(item.dataValues.first_time_working).getFullYear()) : null,
      Resumes: item.dataValues.Resumes.map(resume => {
        return {
          ...resume.dataValues,
          ResumeWorkExps: resume.dataValues.ResumeWorkExps[0] ? resume.dataValues.ResumeWorkExps[0].dataValues : null
        }
      }),
      JobExpectations: item.dataValues.JobExpectations.map(je => je.dataValues),
      interview_status: []
    }
  })
  const body = dataset.flatMap(doc => ([{ index: { _index: "talent_search", _id: doc.id } }, doc]))
  elasticSearch.bulk({
    refresh: true,
    body
  }).catch(err => console.error(err)).then(es_res => {
    let users = res.map(user => {
      return user.dataValues.id
    })
    db.Interview.findAll({
      where: {
        user_id: users
      }
    }).then(interviews => {
      interviews.forEach(interview => {
        elasticSearch.update({
          index: 'talent_search',
          id: String(interview.dataValues.user_id),
          body: {
            // operation to perform
            // the document to index
            script: {
              source: 'def is = ctx._source.interview_status;def add = true;for(int i = 0; i < is.length; i++) { if(is[i].candidateId == params.interview_status.candidateId) { if(is[i].jobId == params.interview_status.jobId) { if(is[i].HRId == params.interview_status.HRId) { add = false;ctx._source.interview_status[i].status = params.interview_status.status;break; } } } } if(add) { ctx._source.interview_status.add(params.interview_status) }',
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
    })

  })
})