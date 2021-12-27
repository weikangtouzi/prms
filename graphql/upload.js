const { finished } = require('stream/promises');
const { Upload } = require('../models')
const { domain, uploadPath } = require('../project.json')
const { AuthenticationError } = require('apollo-server')
const {urlFormater} = require('../utils/serializers')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const singleUpload = async (parent, args, context, info) => {
    let { createReadStream, filename, mimetype, encoding } = await args.file;
    const { extraAttributes } = args;
    let userInfo = jwt.decode(context.req.headers.authorization);
    filename = new Date().getTime() + '-' + filename;
    if (context.req && context.req.headers.authorization) {
        try {
            const stream = createReadStream();
            const {path, url} = urlFormater.encoder(extraAttributes, filename);
            const out = fs.createWriteStream(`./${path}/${filename}`);
            stream.pipe(out);
            await finished(out);
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
const AdminUploadPreludeData = async ( parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    
    let { createReadStream, filename, mimetype, encoding } = await args.file;
    
}
module.exports = {
    singleUpload
}