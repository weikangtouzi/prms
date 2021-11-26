const { JobExpectation, JobCache, sequelize, Job } = require('../models');
const {Op} = require('sequelize');
const {AuthenticationError, UserInputError} = require('apollo-server')
const CandidateGetAllJobExpectations = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if(!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
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
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if(!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    let res;
    let page = 0;
    let pageSize = 10;
    if(args.filter) {
        let { salaryExpected,
            experience,
            education,
            enterpriseSize,
            enterpriseFinancing,
            sortWithDistance,
            full_time_job,
            category,
        } = args.filter;
        if (args.filter.page) page = args.filter.page;
        if (args.filter.pageSize) pageSize = args.filter.pageSize;
        let where = {
            
        }
        if(category) where.category = category;
        if(salaryExpected) {
            where.min_salary = salaryExpected[0];
            where.max_salary = salaryExpected[1];
        }
        if(education) where.min_education = education;
        if(experience) where.min_experience = experience;
        if(full_time_job) where.full_time_job = full_time_job;
        if(enterpriseSize) where.comp_size = enterpriseSize;
        if(enterpriseFinancing) where.comp_financing = enterpriseFinancing;
        res = await JobCache.findAndCountAll({
            where,
            limit: pageSize,
            offset: page * pageSize,
            order: sortWithDistance? [[sequelize.fn("ST_Distance", sequelize.col("adress_coordinate"), sequelize.fn("ST_GeomFromGeoJSON", JSON.stringify({
                type: "POINT",
                coordinates: sortWithDistance
            })))],["ontop", "DESC"], ["updatedAt", "DESC"]] : [["ontop", "DESC"], ["updatedAt", "DESC"] ]
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
            row.adress_coordinate = JSON.stringify(row.adress_coordinate);
            if (!row.logo) row.logo = "default_hr_logo";
            if (!row.emergency) row.emergency = false;
            return row
        })
    }
}
const CandidateGetJob = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    if(!userInfo.resume) throw new AuthenticationError('need resume and job expectation for this operation');
    const {jobid} = args;
    let job = await Job.findOne({
        where: {
            id: jobid,
            expired_at: {
                [Op.gt]: new Date()
            }
        },
        include:[{
            model: Worker,
            attributes: ["id","real_name", "pos"],
            include:[{
                model: Enterprise,
                attributes: ["id", "enterprise_name", "enterprise_size", "enterprise_coordinates", "industry_involved", "business_nature", "enterprise_logo"]
            },{
                model: User,
                attributes: ["image_url", ""]
            }]
        }]
    });
    if(!job) throw new UserInputError("job not found");
    let res = {
        ...job.dataValues
    };
    res.JobCache = null;
    res = {
        ...res,
        ...job.JobCache.dataValues,
    }
    console.log(res)
    return res
    
}

module.exports = {
    CandidateGetAllJobExpectations,
    CandidateGetJobList,
    CandidateGetJob
}