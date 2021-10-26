const { QueryInterface, DataTypes } = require('sequelize');
const { Province, City, County, Town } = require('../models');
const getProvinces = async (parent, args, context, info) => {
    let res = await Province.findAll();
    return res
};
const getCities = async (parent, args, context, info) => {
    const { provinceId } = args;
    let res = await City.findAll({
        where: { province_id: provinceId },
    })
    return res
}
const getCounties = async (parent, args, context, info) => {
    const { cityId } = args;
    let res = await County.findAll({
        where: { city_id: cityId },
    })
    return res
}
const getTowns = async (parent, args, context, info) => {
    const { countyId } = args;
    let res = await Town.findAll({
        where: { county_id: countyId }
    });
    return res
}
const getAllRegion = async (parent, args, context, info) => {
    let result = await Province.findAll({
        attributes: ["province_id", "name"],
        include: [{
            model: City,
            required: true,
            attributes: ["city_id", "name"],
            include: [{
                model: County,
                required: true,
                attributes: ["county_id", "name"],
                include: [{
                    model: Town,
                    required: true,
                    attributes: ["town_id", "name"]
                }]
            }]
        }]
    })
    let res = [];
    for (const pro_id in result) {
        let citys = [];
        for (const city_id in result[pro_id].City) {
            let countys = []
            for (const county_id in result[pro_id].City[city_id].County) {
                let towns = []
                for (const town_id in result[pro_id].City[city_id].County[county_id].Town) {
                    let town = {
                        ...result[pro_id].City[city_id].County[county_id].Town[town_id].dataValues
                    }
                    towns.push(town)
                }
                let county = {
                    ...result[pro_id].City[city_id].County[county_id].dataValues,
                    towns
                }
                countys.push(county)
            }
            let city = {
                ...result[pro_id].City[city_id].dataValues,
                countys
            }
            citys.push(city);
        }
        let pro = {
            ...result[pro_id].dataValues,
            citys: citys,
        }
        res.push(pro)
    }
    return {
        data: res
    }
}
module.exports = {
    getProvinces,
    getCities,
    getCounties,
    getTowns,
    getAllRegion
}