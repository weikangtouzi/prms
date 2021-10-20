const { finished } = require('stream/promises');
const { uploadPath } = require('../project.json')
const { Upload } = require('../models')
const {domain} = require('../project.json')
const { AuthenticationError } = require('apollo-server')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const singleUpload = async (parent, args, context, info) => {
    const { createReadStream, filename, mimetype, encoding } = await args.file;
    const {extraAttributes} = args;
    
    let userInfo = jwt.decode(context.req.headers.authorization);
    
    if(context.req && context.req.headers.authorization) {
        try {
            const stream = createReadStream();
            let path = `${uploadPath}/${userInfo.username}/${extraAttributes? extraAttributes.customUploadPath: mimetype}/`
            if(!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
            const out = fs.createWriteStream(`${path}${filename}`);
            stream.pipe(out);
            await finished(out);
            let url = domain + '/' + filename
            Upload.create({
                filename: filename,
                fileType: mimetype,
                url: url,
            })
        } catch (e) {
            throw e;
        }
    }else {
        throw new AuthenticationError("missing authorization")
    }
    return url
}

module.exports = {
    singleUpload
}