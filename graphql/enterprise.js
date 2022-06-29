const { UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server');
const { Enterprise, User, Worker, Job, ResumeDeliveryRecord, Interview, Message, JobExpectation, sequelize, Resume,
  ResumeWorkExp, ResumeEduExp, ResumeProjectExp} = require('../models');
const jwt = require('jsonwebtoken');
const { isvalidTimeSection, isvalidEnterpriseAdmin, isvalidJobPoster } = require('../utils/validations');
const { jwtConfig } = require('../project.json');
const mongo = require('../mongo');
const { Op } = require('sequelize');
const elasticSearch = require('../elasticSearch')
const queryBuilder = require('../elasticSearch/querys');
const { Education } = require('./types');
const { password } = require('pg/lib/defaults');
const enterpriseIdentify = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  const { enterpriseName, charter, phoneNumber } = args.info;
  try {
    await mongo.query('administrator_censor_list', async (collection) => {
      try {
        await collection.insertOne({
          user_id: userInfo.user_id,
          enterpriseName: enterpriseName,
          charter: charter,
          phoneNumber: phoneNumber ? phoneNumber : null,
          editable: false,
          passed: false,
          time: new Date(),
          description: null
        })
      } catch (e) {
        throw e
      }
    });
  } catch (e) {
    throw new ForbiddenError('your identify request is under censor right now, please wait')
  }
}
const insertEnterpriseBasicInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  try {
    isvalidEnterpriseAdmin(userInfo.identity)
  } catch (e) {
    let info = await mongo.query('administrator_censor_list', async (collection) => {
      let res = await collection.findOne({
        passed: true,
        user_id: userInfo.user_id
      })
      return res
    })
    if (!info) {
      throw new ForbiddenError('your enterprise identify request is not passed or not applied')
    }
    const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, logo, enterpriseSize, establishedDate, homepage, tel } = args.info;
    try {
      await Enterprise.create({
        user_id: userInfo.user_id,
        enterprise_name: enterpriseName,
        abbreviation: abbreviation,
        business_nature: enterpriseNature,
        industry_involved: enterpriseIndustry,
        enterprise_profile: enterpriseProfile,
        enterprise_financing: enterpriseFinancing,
        enterprise_size: enterpriseSize,
        enterprise_logo: logo,
        enterprise_loc_longtitude: enterprisecCoordinate[0],
        enterprise_loc_latitude: enterprisecCoordinate[1],
        enterprise_loc_detail: enterpriseLocation,
        homepage,
        established_time: establishedDate,
        tel: tel
      });
    } catch (e) {
      throw new UserInputError({ e })
    }

  }
}
const editEnterpriseBasicInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { enterpriseName, abbreviation, enterpriseNature, enterpriseLocation, enterpriseProfile, enterprisecCoordinate, enterpriseIndustry, enterpriseFinancing, logo, enterpriseSize, establishedDate, homepage, tel } = args.info;
    let update = {};
    if (enterpriseName) update.enterprise_name = enterpriseName;
    if (abbreviation) update.abbreviation = abbreviation;
    if (enterpriseFinancing) update.enterprise_financing = enterpriseFinancing;
    if (enterprisecCoordinate) update.enterprise_coordinates = {
      type: 'Point',
      coordinates: enterprisecCoordinate
    }
    if (enterpriseNature) update.business_nature = enterpriseNature;
    if (enterpriseLocation) update.enterprise_loc_detail = enterpriseLocation;
    if (enterpriseIndustry) update.industry_involved = enterpriseIndustry;
    if (enterpriseSize) update.enterprise_size = enterpriseSize;
    if (homepage) update.homepage = homepage;
    if (establishedDate) update.established_time = establishedDate;
    if (tel) update.tel = tel;
    if (enterpriseProfile) update.enterprise_profile;
    if (logo) update.enterprise_logo = logo;
    if (Object.keys(update).length > 0) {
      await Enterprise.update(update, {
        where: {
          user_id: userInfo.user_id
        }
      });
    } else {
      throw new UserInputError('you need at least one data to update')
    }
  } else {
    throw new ForbiddenError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const editEnterpriseWorkTimeAndWelfare = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    if (Object.keys(args.info).length == 0) {
      throw new UserInputError("none of the information is providered")
    }
    const { workRule, restRule, welfare, overtimeWorkDegree, customTags } = args.info;
    let update = {};
    if (workRule && isvalidTimeSection(workRule)) update.work_time = workRule;
    if (restRule) update.rest_rule = restRule;
    if (welfare) update.enterprise_welfare = welfare;
    if (overtimeWorkDegree) update.overtime_work_degree = overtimeWorkDegree;
    if (customTags) update.tags = customTags;
    await Enterprise.update(update, {
      where: { user_id: userInfo.user_id }
    })

  } else {
    throw new ForbiddenError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const editEnterpriseExtraData = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  try {
    JSON.parse(args.info);
  } catch (e) {
    throw new UserInputError(`${args.info} not a valid json value`)
  }
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    await Enterprise.update({
      extra_attribute: args.info,
    }, {
      where: { user_id: userInfo.user_id }
    });
    if (userInfo.exp && userInfo.exp > new Date().getTime() / 1000 && userInfo.exp <= (new Date().getTime() - 60000) / 1000) {
      return jwt.sign({
        user_id: userInfo.user_id,
        username: userInfo.username,
        identity: userInfo.identity
      }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
    }
  } else {
    throw new ForbiddenError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const inviteWorkMate = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { phoneNumber, role, pos } = args;
    let user = await User.findOne({
      where: {
        phone_number: phoneNumber
      }
    });
    if (!user) throw new UserInputError("目标不是平台用户");
    if (!user.real_name) throw new UserInputError("目标未完成实名认证");
    try {
      await Worker.create({
        company_belonged: userInfo.enterpriseId,
        real_name: user.real_name,
        user_binding: user.id,
        role,
        pos,
        phone_number: phoneNumber
      })
    } catch (e) {
      throw e
    }
  } else {
    throw new ForbiddenError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const precheckForInviteWorkMate = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { phoneNumber } = args;
    let res = await User.findOne({
      include: [{
        model: Worker,
        required: false
      }],
      where: {
        phone_number: phoneNumber
      }
    });
    let user = res.dataValues;
    if (!user) return "NotAUser"
    if (!user.real_name) return "NotCertified"
    if (user.Worker) {
      if (user.Worker.company_belonged == userInfo.enterpriseId) {
        return "AlreadyWorkMate"
      } else {
        return "WorkingInAnotherCompany"
      }
    } else {
      return "OK"
    }
  } else {
    throw new ForbiddenError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const checkEnterpriseIdentification = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  let res = await mongo.query('administrator_censor_list', async (collection) => {
    return collection.findOne({ user_id: userInfo.user_id })
  });
  if (res) {
    if (res.passed) {
      return {
        status: "Passed"
      }
    } else {
      if (res.editable) {
        return {
          status: "Failed",
          ...res
        }
      } else {
        return {
          status: "Waiting"
        }
      }
    }
  } else {
    return {
      status: "None"
    }
  }
}
const postJob = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { jobTitle, workingAddress, experience, salary, education, description, requiredNum, isFullTime, tags, coordinates, onLineTimes, publishNow, category } = args.info;
    let data = {
      worker_id: userInfo.identity.worker_id,
      title: jobTitle,
      detail: description,
      address_coordinate: {
        type: 'Point',
        coordinates: coordinates
      },
      address_description: workingAddress,
      min_salary: salary[0],
      max_salary: salary[1],
      min_experience: experience,
      min_education: education,
      required_num: requiredNum,
      full_time_job: isFullTime,
      tags: tags,
      comp_id: userInfo.identity.entId,
      category: category
    }
    if (onLineTimes) {
      data.createdAt = new Date(onLineTimes[0]);
      data.expired_at = new Date(onLineTimes[1]);
    } else {
      if (publishNow) data.expired_at = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    }
    await Job.create(data)
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to post a job`);
  }
}
const editJob = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { id, jobTitle, workingAddress, experience, salary, education, description, requiredNum, isFullTime, tags, coordinates, onLineTimes, publishNow } = args.info;
    let update = {};
    if (jobTitle) update.title = jobTitle;
    if (workingAddress) update.adress_description = workingAddress;
    if (experience) update.min_experience = experience;
    if (salary) {
      update.min_salary = salary[0]
      update.max_salary = salary[1]
    }
    if (education) update.min_education = education;
    if (description) update.detail = description;
    if (requiredNum) update.required_num = requiredNum;
    if (isFullTime) update.full_time_job = isFullTime;
    if (tags) update.tags = tags;
    if (coordinates) update.adress_coordinate = coordinates;
    if (Object.keys(update).length == 0) throw new UserInputError("at least need one field");
    if (onLineTimes) {
      update.createdAt = new Date(onLineTimes[0]);
      update.expired_at = new Date(onLineTimes[1]);
    } else {
      if (publishNow) update.expired_at = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    }
    let res = await Job.update(update, {
      where: {
        id: id,
        // expired_at: {
        //   [Op.lt]: new Date()
        // }
      },
      returning: true
    })
    // if (!res || res[0] === 0) throw new UserInputError("could not remove the job that is recruiting");
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to post a job`);
  }
}
const HRInviteInterview = async (parent, args, { userInfo, pubsub }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { userId, jobId, time } = args;
    let resume = await ResumeDeliveryRecord.findOne({
      where: {
        user_id: userId,
        hr_id: userInfo.user_id,
        job_id: jobId
      }
    });
    if (!resume) throw new UserInputError("could not invite the candidate that haven't sended resume to this job");
    let interview = await Interview.create({
      user_id: userId,
      job_id: jobId,
      hr_id: userInfo.identity.worker_id,
      appointment_time: new Date(time[0]),
      ended_at: new Date(time[1]),
      comp_name: userInfo.identity.entName
    });
    let msg = {
      title: `${userInfo.identity.entName}企业的${userInfo.username}向你发送了面试邀请，点击查看详情`,
      body: {
        ...interview.dataValues
      },
      type: "InterviewInvitation"
    }
    let res = await Message.create({
      user_id: interview.user_id,
      from: interview.hr_id,
      message_type: "Other",
      detail: JSON.stringify(msg)
    })
    pubsub.publish("NEW_MESSAGE", {
      newMessage: {
        to: res.user_id,
        messageType: res.message_type,
        messageContent: res.detail,
        ...res.dataValues
      }
    })
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}
const HREndInterview = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { interviewId, isPassed } = args;
    let updateed = await Interview.update({
      status: isPassed ? "Passed" : "Failed",
    }, {
      where: {
        id: interviewId,
        ended_at: {
          [Op.lt]: new Date()
        }
      }
    }, {
      returning: true
    })[0] >= 0;
    if (!updateed) throw new UserInputError("interview not started or canceled")
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}
const HRCancelInterview = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { interviewId, reason, candidateId } = args;
    let updateed = await Interview.update({
      status: "Canceled",
      description: reason
    }, {
      where: {
        id: interviewId,
        appointment_time: {
          [Op.lt]: new Date(),
        }
      }
    }, {
      returning: true
    })[0] >= 0;
    if (!updateed) throw new UserInputError("interview is started or already ended")
    let res = await Message.create({
      user_id: candidateId,
      message_type: "System",
      detail: "你有一项面试已被取消"
    });
    pubsub.publish("NEW_MESSAGE", {
      newMessage: {
        to: candidateId,
        messageType: res.message_type,
        messageContent: res.detail,
        ...res.dataValues
      }
    });
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}
const HRRemoveJob = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { jobId } = args;
    let feedback = await Job.update({
      expired_at: new Date(),
    }, {
      where: { id: jobId }
    }, { returning: true });
    if (!feedback || feedback[0] === 0) throw new UserInputError("job not found");
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const ENTRecruitmentApply = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    let { recruitmentId, size } = args;
    if (!size) {
      size = "small";
    }
    try {
      await RecruitmentRecord.upsert({
        user_id: userInfo.user_id,
        recruitment_id: recruitmentId,
        is_comp: true,
        canceled: false,
        extra_datas: JSON.stringify({ size })
      }, {
        where: {
          user_id: userInfo.user_id,
          recruitment_id: recruitmentId
        }
      })
    } catch (err) {
      throw new UserInputError({ ...err })
    }

  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}
const ENTRecruitmentCancel = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    let { recruitmentId } = args;
    let reply = await RecruitmentRecord.update({
      canceled: true,
    }, {
      where: {
        user_id: userInfo.user_id,
        recruitment_id: recruitmentId
      },
      returning: true
    })
    if (!reply || reply[0] === 0) throw new UserInputError("your may not apply this recruitment");
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const ENTRemoveWorker = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    switch (args.role) {
      case 'Admin':
        throw new UserInputError("could not delete admin user");
      case 'HR':
        await Job.update({
          worker_id: userInfo.identity.worker_id,
        }, {
          where: {
            worker_id: args.workerId
          }
        })
        Worker.destroy({
          where: {
            id: args.workerId,
          }
        })
      default:
        throw new UserInputError(`${args.role} is not supported yet`);
    }
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const HRHideJob = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    await Job.update({
      expired_at: new Date()
    }, {
      where: {
        id: args.jobId,
      }
    });
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const ENTSetDisabled = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    let res = await Worker.update({
      disabled: "LOW",
    }, {
      where: {
        company_belonged: userInfo.identity.entId,
        id: args.workerId,
        disabled: null,
      }
    })
    if (!res || res[0] == 0) throw new UserInputError("not a worker in your company or already disabled")
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const ENTSetEnabled = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { id } = args;
    let res = await Worker.update({
      disabled: null,
    }, {
      where: {
        company_belonged: userInfo.identity.entId,
        id,
        disabled: "LOW"
      }
    });
    if (!res || res[0] == 0) throw new UserInputError("目标用户已被管理员禁用，如需恢复请联系平台管理员");
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const ENTSearchCandidates = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { keyword, sortByUpdatedTime, category, education, industry_involved, city, gender, experience, salary, interview_status, age, job_status } = args.filter;
    let builder = queryBuilder();
    if (keyword) {
      let fieldNames = ["real_name", "Resumes.skills", "Resumes.ResumeWorkExp.comp_name"];
      let matchs = fieldNames.map(fieldName => {
        return builder.newMatch(fieldName, keyword)
      })
      builder.addMust(builder.newBool(matchs))

    }
    if (sortByUpdatedTime) builder.addSort(builder.newSort("updatedAt", false))
    if (category) {
      let musts = [...category];
      musts = musts.map(must => {
        return builder.newMatch("JobExpectations.job_category", must)
      })
      builder.addMust(builder.newBool(null, musts))
    }
    if (education && education != "Null") builder.addMust(builder.newRange("education.lvl", null, Education.getValue(education).value))
    if (industry_involved) {
      let musts = [...industry_involved];
      musts = musts.map(must => {
        return builder.newMatch("JobExpectations.industry_involved", must)
      })
      builder.addMust(builder.newBool(null, musts))
    }
    if (city) {
      let shoulds = [];
      city.forEach(c => {
        shoulds.push(builder.newMatch("current_city", c));
        shoulds.push(builder.newMatch("JobExpectations.aimed_city", c));
      })
      builder.addMust(builder.newBool(shoulds))
    }
    if (gender !== undefined) {
      builder.addMust(builder.newMatch("gender", gender))
    }
    if (experience) {
      builder.addMust(builder.newRange("experience", experience[0], experience[1]))
    }
    if (salary) {
      let shoulds = [];
      let con_1 = builder.newBool(null, [builder.newRange("JobExpectations.min_salary_expectation", salary[0]), builder.newRange("JobExpectations.max_salary_expectation", null, salary[0])])
      shoulds.push(con_1)
      shoulds.push(builder.newRange("JobExpectations.min_salary_expectation", salary[1], salary[0]))
      builder.addMust(builder.newBool(shoulds))
    }
    if (interview_status) {
      builder.addMust(builder.newMatch("interview_status.status", interview_status))
    }
    if (age) {
      let age_filter = [];
      if (age[0]) {
        let date = new Date()
        date.setFullYear(date.getFullYear() - age[0])
        age_filter.push(date)
      }
      if (age[1]) {
        let date = new Date()
        date.setFullYear(date.getFullYear() - age[1])
        age_filter.push(date)
      }
      builder.addMust(builder.newRange("birth_date", ...age_filter))
    }
    if (job_status) {
      builder.addMust(builder.newMatch("job_status", job_status))
    }
    builder.addMust(builder.newMatch("disabled", false))
    builder.addMust(builder.newMatch("Resumes.is_public", true))
    let size = 10;
    let from = 0;
    if (args.pageSize) size = args.pageSize;
    if (args.page) from = size * args.page;
    // console.log(JSON.stringify(builder.query))
    const res = (await builder.send(elasticSearch, "talent_search", size, from)).body
    return {
      count: res.hits.total.value,
      data: res.hits.hits.map(hit => {
        let interview_status = hit._source.interview_status ? hit._source.interview_status.filter((ele) => {
          return ele.HRId == userInfo.identity.worker_id
        }) : null
        return {
          ...hit._source,
          name: hit._source.real_name ? hit._source.real_name : hit._source.username,
          education: hit._source.education ? hit._source.education.name : null,
          job_expectation: hit._source.JobExpectations,
          age: hit._source.birth_date ? (new Date().getFullYear()) - (new Date(hit._source.birth_date).getFullYear()) : null,
          resume_data: hit._source.Resumes[0],
          interview_status
        }
      })
    }
  } else {
    throw new ForbiddenError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}
const ENTEditAccountInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (userInfo.identity.identity != "EnterpriseUser") throw new ForbiddenError('only for enterprise users');
  const { pos } = args;
  let data = {};
  if (pos) data.pos = pos
  await Worker.update(data, {
    where: {
      id: userInfo.identity.worker_id
    }
  })
}
const ENTGetAccountInfo = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (userInfo.identity.identity != "EnterpriseUser") throw new ForbiddenError('only for enterprise users');
  console.log(info)
  let res = await Worker.findOne({
    where: {
      id: userInfo.identity.worker_id
    }
  })
  return {
    ...res.dataValues
  }
}
const HRGetInterviewcomments = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if(!isvalidJobPoster(userInfo.identity)) throw new ForbiddenError('not a valid joboster')
  const {needReplys, onlyMine} = args;
  let filter = {
    "extra.interview_id": {
      $exists: true
    }
  }
  let project = {
    replys: 0
  };
  let sort = {
    updatedAt: -1,
    thumbs: -1
  };
  if(needReplys && needReplys > 0) project.replys = {$slice: needReplys}
  if(onlyMine) filter["extra.hr_id"] = userInfo.identity.worker_id
  let res = await mongo.query("comments", async (c) => {
    return await (c.find(filter).project(project).sort(sort))
  })
  return (await res.toArray()).map(item => {
    return {
      ...item,
      updatedAt: new Date(parseInt(item.updatedAt.toString())),
    }
  })
}
const HRGetCandidateResume = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if(!isvalidJobPoster(userInfo.identity)) throw new ForbiddenError('not a valid joboster')
  const {candidate_id} = args;
  let res = await User.findOne({
      where: {
          id: candidate_id,
          disabled: false
      },
      include: [{
        model: Resume,
        where: {
          is_public: true
        },
        include: [{
          model:ResumeWorkExp
        },{
          model:ResumeEduExp},{
          model:ResumeProjectExp
          }]
      }, {
        model: JobExpectation
      }]
  })
  if(res.dataValues.Resumes.length === 0) throw new UserInputError("该用户未创建简历或简历不公开")
  return {
    ...res.dataValues,
    password: null,
    identified: null
  }
}

module.exports = {
  editEnterpriseBasicInfo,
  editEnterpriseWorkTimeAndWelfare,
  editEnterpriseExtraData,
  enterpriseIdentify,
  checkEnterpriseIdentification,
  precheckForInviteWorkMate,
  inviteWorkMate,
  postJob,
  insertEnterpriseBasicInfo,
  HRInviteInterview,
  HREndInterview,
  HRRemoveJob,
  ENTRecruitmentApply,
  HRCancelInterview,
  editJob,
  ENTRecruitmentCancel,
  ENTRemoveWorker,
  HRHideJob,
  ENTSetDisabled,
  ENTSetEnabled,
  ENTSearchCandidates,
  ENTEditAccountInfo,
  ENTGetAccountInfo,
  HRGetInterviewcomments,
  HRGetCandidateResume
}