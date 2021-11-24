const { JobExpectation, JobCache, Worker } = require('../models');

const CandidateGetAllJobExpectations = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
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
const CandidateGetJobListByExpectation = async (parent, args, { userInfo }, info) => {
    // if (!userInfo) throw new AuthenticationError('missing authorization')
    // if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    let { jobCategory, page, pageSize } = args;
    if (!page) page = 0;
    if (!pageSize) pageSize = 10;
    let res = await JobCache.findAndCountAll({
        where: {
            category: jobCategory
        },
        limit: pageSize,
        offset: page * pageSize,
        order: [
            ["ontop", "DESC"]
        ]
    })
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

module.exports = {
    CandidateGetAllJobExpectations,
    CandidateGetJobListByExpectation
}