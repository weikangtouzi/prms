const { JobExpectation, JobCache, sequelize, Job, Worker, Enterprise, User } = require('../models');
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
            // expired_at: {
            //     [Op.gt]: new Date()
            // }
        },
        include:[{
            model: Worker,
            attributes: ["real_name", "pos"],
            include:[{
                model: Enterprise,
                attributes: ["enterprise_name", "enterprise_size", "enterprise_coordinates", "industry_involved", "business_nature", "enterprise_logo", "enterprise_loc_detail"]
            },{
                model: User,
                attributes: ["image_url", "last_log_out_time"]
            }]
        }]
    });
    if(!job) throw new UserInputError("job not found");
    let data = job.dataValues;
    let res = {
        job: {
            id: data.id,
            title: data.title,
            category: data.category,
            detail: data.detail,
            adress_coordinate: data.adress_coordinate.coordinates,
            adress_description: data.adress_description,
            salaryExpected: [data.min_salary, data.max_salary],
            experience: data.min_experience,
            education: data.education,
            required_num: data.required_num,
            full_time_job: data.full_time_job,
            tags:data.tags,
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
            enterprise_logo: data.Worker.Enterprise.enterprise_logo
        }
    };
    return res
    
}

module.exports = {
    CandidateGetAllJobExpectations,
    CandidateGetJobList,
    CandidateGetJob
}