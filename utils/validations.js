const mongo = require('../mongo');
const {ForbiddenError} = require('apollo-server');
function isvaildNum(error, num, useZh) {
    let reg = /^1(3[0-9]|4[5,7]|5[0,1,2,3,5,6,7,8,9]|6[2,5,6,7]|7[0,1,7,8]|8[0-9]|9[1,8,9])\d{8}$/;
    let res = reg.test(num);
    if (!res) {
        error.phoneNumber = useZh ? "无效的手机号码" : "invaild phone number"
    }
}
function isvaildidCardNum(error, idCard, useZh) {
    if (idCard.length == 18) {
        var idCard_string = JSON.stringify(idCard);
        var spstr = idCard_string.split("");
        var x = spstr[spstr.length - 2];
        if (x === "x") {
            error.idCard = useZh ? "身份证末尾的x应大写X" : "the last character x should be upcast";
        }
        var reg = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
        var arrSplit = idCard.match(reg);  //检查生日日期是否正确，value就是身份证号
        if (!arrSplit) {
            error.idCard = useZh ? "无效身份证号" : "invaild idCardNum";
            return;
        }
        var dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
        var bGoodDay;
        bGoodDay = (dtmBirth.getFullYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
        if (!bGoodDay) {
            error.idCard = useZh ? "身份证号出生日期部分有误" : "invaild birthday in idCardNum";
            return;
        } else { //检验18位身份证的校验码是否正确。 //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
            let age = new Date().getFullYear() - dtmBirth.getFullYear();
            if (age >= 60 || age <= 16) {
                error.idCard = useZh ? "仅接受16至60岁的有效劳动力信息" : "only allowed 16-60 years old"
                return
            }
            var valnum;
            var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
            var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
            var nTemp = 0, i;
            for (i = 0; i < 17; i++) {
                nTemp += idCard.substr(i, 1) * arrInt[i];
            }
            valnum = arrCh[nTemp % 11];
            if (valnum != idCard.substr(17, 1)) {
                error.idCard = useZh ? "身份证号末尾验证位有误，应为：" + valnum : "invaild verify num in idCard, expected: " + valnum;
                return;
            }
        }
    } else {
        error.idCard = useZh ? "无效的身份证号长度" : "invaild length for idCardNum";
    }
}

function isvalidTimeSection(input) {
    let twosides = input.split('-');
    if (twosides.length <= 1) {
        return false
    }
    for (key in twosides) {
        let HAM = twosides[key].split(":");
        if (HAM.length <= 1 || HAM[0].length <= 1 || HAM[1].length <= 1) {
            return false
        }
        let hour = Number.parseInt(HAM[0]);
        let minute = Number.parseInt(HAM[1]);
        let condition = hour !== NaN && hour < 24 && hour >= 0 && minute !== NaN && minute >= 0 && minute < 60;
        if (!condition) {
            return false
        }
    }
    return true
}

async function checkverified(phoneNumber, operation) {
    let res
    if (phoneNumber) {
        try {
            res = await mongo.query('user_log_in_cache', async (collection) => {
                return await collection.findOneAndDelete({
                    phoneNumber,
                    verified: true,
                    operation
                })
            })
            if (res.value) {
                return true
            } else {
                return false
            }
        } catch (e) {
            throw e
        }
    }
    console.log(res)
    return false

}
function isvalidEnterpriseAdmin(userIdentity) {
    if (!userIdentity) {
        throw new ForbiddenError('missing identity in token, you request is not gonna be applied')
    }
    return userIdentity.identity == "EnterpriseUser" && userIdentity.role && userIdentity.role == "Admin"
}
function isvalidJobPoster(userIdentity) {
    if (!userIdentity) {
        throw new ForbiddenError('missing identity in token, you request is not gonna be applied')
    }
    return userIdentity.identity == "EnterpriseUser" && userIdentity.role && (userIdentity.role == "HR" || userIdentity.role == "Admin")
}
module.exports = {
    isvaildNum,
    isvaildidCardNum,
    isvalidTimeSection,
    checkverified,
    isvalidEnterpriseAdmin,
    isvalidJobPoster
}