const province = require('../models/province');
const getProvinces = async () => {
    console.log("getProvinces called")
    let res = await province.findAll({
        attributes: ["name"]
    });
    return res
};

module.exports = {
    getProvinces: getProvinces,
}