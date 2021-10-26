const {Province, City, County, Town} = require('../models');

Province.findAll({
    attributes:["province_id", "name"],
    include:[{
        model: City,
        required: true,
        attributes: ["city_id", "name"],
        include:[{
            model: County,
            required: true,
            attributes: ["county_id", "name"],
            include:[{
                model: Town,
                required: true,
                attributes: ["town_id", "name"]
            }]
        }]
    }]
}).then(result => {
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
    console.log(JSON.stringify(res))
})