const schedule = require('node-schedule');
const { JobCache } = require('../models');
const { Op } = require('sequelize');
const { error, info } = require('./logger');
const clearViewsEveryMonday = schedule.scheduleJob('* * * * * 3', async () => {
    try {
        let res = await JobCache.update({
            views: 0,
        }, {
            where: {
                expired_at: {
                    [Op.gt]: new Date()
                }
            },
            returning: true
        })
        info(res)
    } catch (e) {
        error(e);
    }
})

module.exports = {
    clearViewsEveryMonday
}