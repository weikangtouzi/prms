const { JobExpectation, JobCache, sequelize, Job, Worker, Enterprise, User, EnterpriseQuestion, EnterpriseAnswer, InterviewRecomment, Resume, ResumeWorkExp, ResumeEduExp, ResumeProjectExp, JobReadRecord } = require('../models');
const { Op } = require('sequelize');
const { AuthenticationError, UserInputError } = require('apollo-server');
const user = require('../models/user');
const mongo = require('../mongo');
const CandidateGetAllJobExpectations = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let res = await JobExpectation.findAndCountAll({
        where: {
            user_id: userInfo.user_id
        },
        limit: 3,
        order: [
            ["createdAt", "DESC"]
        ]
    })
    return res.rows
}
const CandidateGetJobList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let res;
    let page = 0;
    let pageSize = 10;
    if (args.filter) {
        let { salaryExpected,
            experience,
            education,
            enterpriseSize,
            enterpriseFinancing,
            sortWithDistance,
            full_time_job,
            category
        } = args.filter;
        if (args.filter.page) page = args.filter.page;
        if (args.filter.pageSize) pageSize = args.filter.pageSize;
        let where = {

        }
        if (category) where.category = category;
        if (salaryExpected) {
            where.min_salary = salaryExpected[0];
            where.max_salary = salaryExpected[1];
        }
        if (education) where.min_education = education;
        if (experience) where.min_experience = experience;
        if (full_time_job) where.full_time_job = full_time_job;
        if (enterpriseSize) where.comp_size = enterpriseSize;
        if (enterpriseFinancing) where.comp_financing = enterpriseFinancing;
        res = await JobCache.findAndCountAll({
            where,
            limit: pageSize,
            offset: page * pageSize,
            order: sortWithDistance ? [[sequelize.fn("ST_Distance", sequelize.col("address_coordinate"), sequelize.fn("ST_GeomFromGeoJSON", JSON.stringify({
                type: "POINT",
                coordinates: sortWithDistance
            })))], ["ontop", "DESC"], ["updatedAt", "DESC"]] : [["ontop", "DESC"], ["updatedAt", "DESC"]]
        })
    } else {
        res = await JobCache.findAndCountAll({
            limit: pageSize,
            offset: page * pageSize,
            order: [["ontop", "DESC"], ["updatedAt", "DESC"]]
        })
    }
    return {
        page, pageSize,
        count: res.count,
        data: res.rows.map(row => {
            console.log(row.address_coordinates)
            row.address_coordinate = JSON.stringify(row.address_coordinate);
            if (!row.logo) row.logo = "default_hr_logo";
            if (!row.emergency) row.emergency = false;
            return row
        })
    }
}
const CandidateGetJob = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    const { jobid } = args;
    let job = await Job.findOne({
        where: {
            id: jobid,
            // expired_at: {
            //     [Op.gt]: new Date()
            // }
        },
        include: [{
            model: Worker,
            attributes: ["real_name", "pos"],
            include: [{
                model: Enterprise,
                attributes: ["enterprise_name", "enterprise_size", "enterprise_coordinates", "industry_involved", "business_nature", "enterprise_logo", "enterprise_loc_detail", "enterprise_financing"]
            }, {
                model: User,
                attributes: ["image_url", "last_log_out_time"]
            }]
        }]
    });
    if (!job) throw new UserInputError("job not found");

    let data = job.dataValues;
    JobReadRecord.create({
        user_id: userInfo.user_id,
        job_name: data.title,
        job_salary: `${data.min_salary}-${data.max_salary}`,
        job_exp: `${data.experience}年`,
        job_edu: data.education,
        job_address: data.address_description[0],
        tags: data.tags,
        comp_name: data.Worker.Enterprise.enterprise_name,
        comp_financing: data.Worker.Enterprise.enterprise_financing,
        hr_name: data.Worker.real_name,
        hr_position: data.Worker.pos,
    })
    let res = {
        job: {
            id: data.id,
            title: data.title,
            category: data.category,
            detail: data.detail,
            address_coordinate: data.address_coordinate.coordinates,
            address_description: data.address_description,
            salaryExpected: [data.min_salary, data.max_salary],
            experience: data.min_experience,
            education: data.education,
            required_num: data.required_num,
            full_time_job: data.full_time_job,
            tags: data.tags,
            updatedAt: data.updatedAt,
        },
        hr: {
            id: data.worker_id,
            name: data.Worker.real_name,
            pos: data.Worker.pos,
            last_log_out_time: data.Worker.User.last_log_out_time,
            logo: data.Worker.User.image_url
        },
        company: {
            id: data.comp_id,
            name: data.Worker.Enterprise.enterprise_name,
            address_coordinates: data.Worker.Enterprise.enterprise_coordinates.coordinates,
            address_description: data.Worker.Enterprise.enterprise_loc_detail,
            industry_involved: data.Worker.Enterprise.industry_involved,
            business_nature: data.Worker.Enterprise.business_nature,
            enterprise_logo: data.Worker.Enterprise.enterprise_logo,
            enterprise_size: data.Worker.Enterprise.enterprise_size,
        }
    };
    return res
}


const CandidateGetEnterpriseDetail_HRList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let res = await Worker.findAll({
        where: {
            company_belonged: args.entId
        },
        attributes: ["id", "real_name", "pos"],
        include: [{
            model: User,
            attributes: ["image_url"]
        }]
    });
    res = res.map(origin => {
        let final = origin.dataValues;
        final = {
            ...final,
            name: final.real_name,
            logo: final.User.image_url ? final.User.image_url : "default",
        }
        return final
    })
    return res;
}
const CandidateGetEnterpriseDetail_InterviewRecomment = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let counts = sequelize.query('select sum("HR")::float / count("id") as "HR", sum("comp_env")::float / count("id") as "comp_env", sum("description")::float / count("id") as "description", sum("comp_env" + "description" + "HR")::float / (3 * count("id")) as total from interview_recomment where comp_id = $1;',
        {
            bind: [args.entId]
        });
    let rows = InterviewRecomment.findAndCountAll({
        where: {
            comp_id: args.entId,
        },
        attributes: ["id", "job_name", "tags", "thumbs", "content", "createdAt", [sequelize.literal('("HR" + "description" + "comp_env") / 3.0'), "score"]],
        include: [{
            model: User,
            attributes: ["image_url", "username"]
        }],
        limit: 2,
    })

    counts = await counts;
    rows = await rows;
    res = {
        total: counts[0][0].total,
        comp_env: counts[0][0].comp_env,
        description: counts[0][0].description,
        HR: counts[0][0].HR,
        count: rows.count,
        recommends: rows.rows.map(item => {
            return {
                ...item.dataValues,
                logo: item.User.dataValues.image_url ? item.User.dataValues.image_url : "",
                user_name: item.User.dataValues.username
            }
        })
    }
    return res
}

const CandidateGetEnterpriseDetail_QA = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let raw = await EnterpriseQuestion.findAndCountAll({
        where: {
            enterprise_id: args.entId
        },
        attributes: ["question_description", "answer_count"],
        limit: 1,
        order: [["answer_count", "DESC"]],
        include: [{
            model: EnterpriseAnswer,
            attributes: ["content"],
            limit: 1,
        }]
    });
    res = {
        ...raw.rows.map((row) => {
            return {
                question: row.dataValues.question_description,
                answerCount: row.dataValues.answer_count,
                answer: row.dataValues.EnterpriseAnswers[0].dataValues.content,
            }
        })[0],
        questionCount: raw.count
    }

    return res
}
const CandidateGetHRDetail_HRInfo = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let res = await Worker.findOne({
        where: {
            id: args.hrId,
        },
        include: [{
            model: Enterprise,
            attributes: ["enterprise_name"],
            required: true
        }, {
            model: User,
            attributes: ["image_url", "last_log_out_time"],
            required: true
        }],
        attributes: ["real_name", "pos"]
    })
    res = {
        name: res.real_name,
        pos: res.pos,
        company_belonged: res.Enterprise.dataValues.enterprise_name,
        logo: res.User.dataValues.image_url ? res.User.dataValues.image_url : "",
        last_log_out_time: res.User.dataValues.last_log_out_time
    }
    return res
}
const CandidateGetHRDetail_RecommendationsList = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let res = await Job.findAndCountAll({
        where: {
            [Op.and]: [
                { worker_id: args.hrId },
                {
                    [Op.or]: userInfo.jobExpectation.map(item => {
                        return {
                            category: item.job_category
                        }
                    })
                }
            ]
        }
    })
    res = {
        count: res.count,
        data: res.rows.map(item => {
            return {
                id: item.dataValues.id,
                title: item.dataValues.title,
                loc: item.dataValues.address_description[0] + "-" + item.dataValues.address_description[1],
                experience: item.dataValues.min_experience,
                education: item.dataValues.min_education,
                salary: [item.dataValues.min_salary, item.dataValues.max_salary],
                createdAt: item.dataValues.createdAt
            }
        })
    }
    return res
}
const CandidateGetHRDetail_JobListPageView = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let { page, pageSize, hrId } = args;
    if (!page) page = 0;
    if (!pageSize) pageSize = 10;
    let res = await Job.findAndCountAll({
        where: {
            worker_id: hrId,
        },
        limit: pageSize,
        offset: pageSize * page,
    });
    return {
        count: res.count,
        data: res.rows.map(item => {
            return {
                id: item.dataValues.id,
                title: item.dataValues.title,
                loc: item.dataValues.address_description[0] + "-" + item.dataValues.address_description[1],
                experience: item.dataValues.min_experience,
                education: item.dataValues.min_education,
                salary: [item.dataValues.min_salary, item.dataValues.max_salary],
                createdAt: item.dataValues.createdAt
            }
        })
    }
}
const CandidateGetAllJobCategoriesByEntId = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let { entId } = args;
    let res = await sequelize.query('SELECT category[1] FROM "job" AS "Job" WHERE "Job"."comp_id" = $1 GROUP BY category[1];',
        {
            bind: [entId]
        });

    return res[0].map(item => {
        return item.category
    })
}

const CandidateGetJobListByEntId = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let { page, pageSize, entId, category } = args;
    if (!page) page = 0;
    if (!pageSize) pageSize = 10;
    let where = {
        comp_id: entId,
    };
    if (category) where[category] = sequelize.literal(`category[1] = '${category}'`);
    let res = await Job.findAndCountAll({
        where,
        limit: pageSize,
        offset: pageSize * page,
    });
    return {
        count: res.count,
        data: res.rows.map(item => {
            return {
                id: item.dataValues.id,
                title: item.dataValues.title,
                loc: item.dataValues.address_description[0] + "-" + item.dataValues.address_description[1],
                experience: item.dataValues.min_experience,
                education: item.dataValues.min_education,
                salary: [item.dataValues.min_salary, item.dataValues.max_salary],
                createdAt: item.dataValues.createdAt
            }
        })
    }
}

const CandidateEditPersonalAdvantage = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { content } = args;
    try {
        await Resume.update({
            personal_advantage: content
        }, {
            where: {
                user_id: userInfo.user_id
            }
        });
    } catch (err) {
        throw err;
    }
}

const CandidateEditWorkExprience = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { id, resumeId, compName, posName, department, startAt, endAt, workDetail, hideFromThisCompany } = args.info;
    if (id) {
        let update = {};
        if (compName) update.comp_name = compName;
        if (posName) update.pos_name = posName;
        if (department) update.department = department;
        if (startAt) update.start_at = startAt;
        if (endAt) update.end_at = endAt;
        if (workDetail) update.work_detail = workDetail;
        if (Object.keys(update).length == 0) throw new UserInputError("needed at least one data");
        await ResumeWorkExp.update(update, {
            id: id
        });
    }
    else {
        if (!resumeId) throw new UserInputError("resumeId is required");
        if (!compName || compName.trim() == '') throw new UserInputError("compName is required when no id specified");
        if (!posName) throw new UserInputError("posName is required when no id specified");
        if (!department) throw new UserInputError("department is required when no id specified");
        if (!startAt) throw new UserInputError("startAt is required when no id specified");
        if (!endAt) throw new UserInputError("endAt is required when no id specified");
        if (!workDetail) throw new UserInputError("workDetail is required when no id specified");
        await ResumeWorkExp.create({
            comp_name: compName,
            pos_name: posName,
            department: department,
            start_at: startAt,
            end_at: endAt,
            working_detail: workDetail,
            resume_id: resumeId
        })
    }
    if (hideFromThisCompany) mongo.query("blacklist", async (collection) => {
        await collection.insert({
            user_id: userInfo.user_id,
            keyword: compName,
        })
    })
}

const CandidateEditEduExp = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { id,
        resumeId,
        schoolName,
        education,
        isFullTime,
        major,
        time,
        exp_at_school } = args;
    if (id) {
        let update = {};
        if (schoolName) update.school_name = schoolName;
        if (education) update.education = education;
        if (isFullTime) update.is_all_time = isFullTime;
        if (major) update.major = major;
        if (time) update.time = time;
        if (exp_at_school) update.exp_at_school = exp_at_school;
        await ResumeEduExp.update(update, {
            where: {
                id: id
            }
        });
    } else {
        if (!resumeId) throw new UserInputError("resumeId is required");
        if (!schoolName) throw new UserInputError("schoolName is required");
        if (!education) throw new UserInputError("education is required");
        if (!isFullTime) throw new UserInputError("isFullTime is required");
        if (!major) throw new UserInputError("major is required");
        if (!time) throw new UserInputError("time is required");
        if (!exp_at_school) throw new UserInputError("exp_at_school is required");
        await ResumeEduExp.create({
            resume_id: resumeId,
            school_name: schoolName,
            education: education,
            is_all_time: isFullTime,
            major: major,
            time: time,
            exp_at_school: exp_at_school
        })
    }
}

const CandidateEditProExp = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { id, resumeId, projectName, role, startAt, endAt, description, performance } = args.info;
    if (id) {
        let update = {};
        if (projectName) update.project_name = projectName;
        if (role) update.role = role;
        if (startAt) update.start_at = startAt;
        if (endAt) update.end_at = endAt;
        if (description) update.description = description;
        if (performance) update.performance = performance;
        await ResumeProjectExp.update(update, {
            where: {
                id: id,
            }
        })
    } else {
        if (!resumeId) throw new UserInputError("resumeId is required");
        if (!projectId) throw new UserInputError("projectId is required");
        if (!role) throw new UserInputError("role is required");
        if (!startAt) throw new UserInputError("startAt is required");
        if (!endAt) throw new UserInputError("endAt is required");
        if (!description) throw new UserInputError("startAt is required");
        if (!performance) throw new UserInputError("endAt is required");
        await ResumeProjectExp.create({
            resume_id: resumeId,
            project_name: projectName,
            role: role,
            startAt: startAt,
            endAt: endAt,
            description: description,
            performance: performance
        })
    }
}

const CandidateEditSkills = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    const { resumeId, skills } = args;
    await Resume.update({
        skills: skills
    }, {
        id: resumeId,
    })
}

const CandidateSendResume = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    const { jobId, resumeId, hrId, compId } = args;
    let record = await ResumeDeliveryRecord.findOne({
        where: {
            user_id: userInfo.user_id,
            job_id: jobId,
        }
    })
    if (record) throw new UserInputError("you already send your resume to this job");
    await ResumeDeliveryRecord.create({
        user_id: userInfo.user_id,
        job_id: jobId,
        resume_id: resumeId,
        comp_id: compId,
        hr_id: hrId
    });

}

const CandidateRecruitmentApply = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if (!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    const { recruitmentId } = args;
    try {
        await RecruitmentRecord.upsert({
          user_id: userInfo.user_id,
          recruitment_id: recruitmentId,
          is_comp: false,
          canceled: false,
        }, {
          where: {
            user_id: userInfo.user_id,
            recruitment_id: recruitmentId
          }
        })
      } catch (err) {
        throw new UserInputError({ ...err })
      }
}

module.exports = {
    CandidateGetAllJobExpectations,
    CandidateGetJobList,
    CandidateGetJob,
    CandidateGetEnterpriseDetail_HRList,
    CandidateGetEnterpriseDetail_InterviewRecomment,
    CandidateGetEnterpriseDetail_QA,
    CandidateGetHRDetail_HRInfo,
    CandidateGetHRDetail_RecommendationsList,
    CandidateGetHRDetail_JobListPageView,
    CandidateGetAllJobCategoriesByEntId,
    CandidateGetJobListByEntId,
    CandidateEditPersonalAdvantage,
    CandidateEditWorkExprience,
    CandidateEditEduExp,
    CandidateEditProExp,
    CandidateEditSkills,
    CandidateSendResume,
    CandidateRecruitmentApply
}

