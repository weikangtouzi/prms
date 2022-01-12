const jwt = require('jsonwebtoken')
const {jwtConfig, uploadPath} = require('../project.json')
function encodeUrl(extraAttributes, filename, username) {
    let path = `${uploadPath}/${userInfo.username}/${extraAttributes ? extraAttributes.customUploadPath : mimetype.split("/")[0]}`
    if (!fs.existsSync(fs.realpathSync(".") + "/" + uploadPath)) {
        fs.mkdirSync(fs.realpathSync(".") + "/" + uploadPath);
    }
    if (!fs.existsSync(fs.realpathSync(".") + "/" + `${uploadPath}/${username}/`)) {
        fs.mkdirSync(fs.realpathSync(".") + "/" + `${uploadPath}/${username}/`);
    }
    if (!fs.existsSync(fs.realpathSync(".") + "/" + path)) {
        fs.mkdirSync(fs.realpathSync(".") + "/" + path);
    }
    return {
        url: "https://" + domain + `/${path}/${filename}`,
        path
    }
}

module.exports = {
    jwt: (userInfo) => {
        let res;
        if(userInfo.exp) {
            userInfo.exp = Math.round(new Date().getTime() / 1000) + 3600
            res = jwt.sign({
                ...userInfo,
                deadTime: new Date().getTime() + jwtConfig.deadTime,
            }, jwtConfig.secret)
        } else {
            res = jwt.sign({
                ...userInfo,
                deadTime: new Date().getTime() + jwtConfig.deadTime,
            }, jwtConfig.secret, { expiresIn: jwtConfig.expireTime })
        }
        return res
    },
    urlFormater: {
        encoder: encodeUrl,
    },
    dateToJobStatus: (expired_at) => {
        if(!expired_at) return 'NotPublished'
        if(expired_at.getTime() < new Date().getTime()) {
            return 'OffLine'
        } else {
            return 'InRecruitment'
        }
    }
}