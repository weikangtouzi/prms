const { finished } = require('stream/promises');
const { Upload } = require('../models')
const { domain,uploadPath } = require('../project.json')
const { AuthenticationError } = require('apollo-server')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const {} = require('uuid');
const singleUpload = async (parent, args, context, info) => {
    let { createReadStream, filename, mimetype, encoding } = await args.file;
    const { extraAttributes } = args;
    let userInfo = jwt.decode(context.req.headers.authorization);
    filename = new Date().getTime() + '-' + filename;
    if (context.req && context.req.headers.authorization) {
        try {
            const stream = createReadStream();
            let path = `${uploadPath}/${userInfo.username}/${extraAttributes ? extraAttributes.customUploadPath : mimetype.split("/")[0]}`
            if (!fs.existsSync(fs.realpathSync(".") + "/" + uploadPath)) {
                fs.mkdirSync(fs.realpathSync(".") + "/" + uploadPath);
            }
            if (!fs.existsSync(fs.realpathSync(".") + "/" + `${uploadPath}/${userInfo.username}/`)) {
                fs.mkdirSync(fs.realpathSync(".") + "/" + `${uploadPath}/${userInfo.username}/`);
            }
            if (!fs.existsSync(fs.realpathSync(".") + "/" + path)) {
                fs.mkdirSync(fs.realpathSync(".") + "/" + path);
            }
            const out = fs.createWriteStream(`./${path}/${filename}`);
            stream.pipe(out);
            await finished(out);
            let url = "https://" + domain + uploadPath + `/${userInfo.username}/${extraAttributes ? extraAttributes.customUploadPath : mimetype.split("/")[0]}/${filename}`;
            await Upload.create({
                user_id: userInfo.user_id,
                filename: filename,
                fileType: mimetype,
                url: url,
            })
            return url
        } catch (e) {
            throw e;
        }
    } else {
        throw new AuthenticationError("missing authorization")
    }
    
}

module.exports = {
    singleUpload
}