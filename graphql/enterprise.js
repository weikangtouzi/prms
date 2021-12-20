const { AuthenticationError, UserInputError } = require('apollo-server');
const { Enterprise, User, Worker, Job, ResumeDeliveryRecord, Interview, Message } = require('../models');
const jwt = require('jsonwebtoken');
const { isvalidTimeSection, isvalidEnterpriseAdmin, isvalidJobPoster } = require('../utils/validations');
const { jwtConfig } = require('../project.json');
const mongo = require('../mongo');
const user = require('../models/user');



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
    throw new UserInputError('your identify request is under censor right now, please wait')
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
      throw new AuthenticationError('your enterprise identify request is not passed or not applied')
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
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
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
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
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
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
  }
}
const inviteWorkMate = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    const { phoneNumber, role, pos } = args.info;
    let user = await User.findOne({
      where: {
        phone_number: phoneNumber
      }
    });
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
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
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
    throw new AuthenticationError(`${userInfo.identity.role} role does not have the right for edit enterprise info`)
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
    const { jobTitle, workingAddress, experience, salary, education, description, requiredNum, isFullTime, tags, coordinates } = args.info;
    await Job.create({
      worker_id: userInfo.user_id,
      title: jobTitle,
      detail: description,
      adress_coordinate: {
        type: 'Point',
        coordinates: coordinates
      },
      adress_description: workingAddress,
      min_salary: salary[0],
      max_salary: salary[1],
      min_experience: experience,
      min_education: education,
      required_num: requiredNum,
      full_time_job: isFullTime,
      tags: tags,
      comp_id: userInfo.identity.enterpriseId,
      expired_at: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    })
  } else {
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to post a job`);
  }
}
const editJob = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidJobPoster(userInfo.identity)) {
    const { jobId, jobTitle, workingAddress, experience, salary, education, description, requiredNum, isFullTime, tags, coordinates } = args.info;
    let update = {};
    if(jobTitle) update.title = jobTitle;
    if(workingAddress) update.adress_description = workingAddress;
    if(experience) update.min_experience = experience;
    if(salary) {
      update.min_salary = salary[0]
      update.max_salary = salary[1]
    }
    if(education) update.min_education = education;
    if(description) update.detail = description;
    if(requiredNum) update.required_num = requiredNum;
    if(isFullTime) update.full_time_job = isFullTime;
    if(tags) update.tags = tags;
    if(coordinates) update.adress_coordinate = coordinates;
    if(Object.keys(update).length == 0) throw new UserInputError("at least need one field");
    await Job.update(update, {
      where: {
        id: jobId,
      }
    })
  } else {
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to post a job`);
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
      hr_id: userInfo.user_id,
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
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
  }
}

const ENTRemoveWorker = async (parent, args, { userInfo }, info) => {
  if (!userInfo) throw new AuthenticationError('missing authorization')
  if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
  if (isvalidEnterpriseAdmin(userInfo.identity)) {
    Worker.destroy({
      where: {
        id: args.workerId,
      }
    })
  } else {
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
        id: jobId,
      }
    });
  } else {
    throw new AuthenticationError(`your account right: \"${userInfo.identity.role}\" does not have the right to start a interview`);
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
  HRHideJob
}