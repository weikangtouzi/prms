const citys_data = require("../data/city");
const countys_data = require("../data/county");
const provinces_data = require("../data/province");
const models = require("../models");
let comp = (left, right, test_case_name) => {
    
    for(let i =0; i< right.length; i++){
        if(left[i].name !== right[i].name){
            console.log("left value :\n" + left[i].name + "\nright value: \n" + right[i].name)
        }
    }
    console.log(test_case_name + " data test passed!");
}
let pro_test = async () => {
    let pro = await models.Province.findAll({
        attributes: ["province_id", "name"]
    });
    
    comp(pro, provinces_data, "province")
}
pro_test()

let city_test = async () => {
    let city = await models.City.findAll({
        attributes: ["province_id", "name", "city_id"]
    });
    
    comp(city, citys_data, "city")
}
city_test()

let county_test = async () => {
    let county = await models.County.findAll({
        attributes: ["county_id", "name", "city_id"]
    });

    comp(county, countys_data, "county")
}
county_test()
