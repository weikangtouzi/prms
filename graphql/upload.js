const { finished } = require('stream/promises');
const { Upload } = require('../models')
const { basic,uploadPath } = require('../project.json')
const { AuthenticationError } = require('apollo-server')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bcrypt = require('bcrypt');

const singleUpload = async (parent, args, context, info) => {
    const { createReadStream, filename, mimetype, encoding } = await args.file;
    const { extraAttributes } = args;
    let domain = basic.host;
    let userInfo = jwt.decode(context.req.headers.authorization);
    
    if (context.req && context.req.headers.authorization) {
        try {
            const stream = createReadStream();
            let usernameHashed = await bcrypt.hash(userInfo.username);
            let path = `${uploadPath}/${usernameHashed}/${extraAttributes ? extraAttributes.customUploadPath : mimetype.split("/")[0]}`
            if (!fs.existsSync(fs.realpathSync(".") + "/" + uploadPath)) {
                fs.mkdirSync(fs.realpathSync(".") + "/" + uploadPath);
            }
            if (!fs.existsSync(fs.realpathSync(".") + "/" + `${uploadPath}/${usernameHashed}/`)) {
                fs.mkdirSync(fs.realpathSync(".") + "/" + `${uploadPath}/${usernameHashed}/`);
            }
            if (!fs.existsSync(fs.realpathSync(".") + "/" + path)) {
                fs.mkdirSync(fs.realpathSync(".") + "/" + path);
            }
            const out = fs.createWriteStream(`${path}/${filename}`);
            stream.pipe(out);
            await finished(out);
            let url = domain + uploadPath + `${usernameHashed}/${extraAttributes ? extraAttributes.customUploadPath : mimetype.split("/")[0]}/${filename}`;
            Upload.create({
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