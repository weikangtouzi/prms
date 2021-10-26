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
        where: {county_id: countyId}
    });
    return res
}
const getAllData = async (parent, args, context, info) => {
    
}
module.exports = {
    getProvinces,
    getCities,
    getCounties,
    getTowns
}