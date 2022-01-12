const { finished } = require('stream/promises');
const { Upload } = require('../models')
const { domain, uploadPath } = require('../project.json')
const { AuthenticationError } = require('apollo-server')
const { urlFormater } = require('../utils/serializers')
const jwt = require('jsonwebtoken');
const fs = require('fs');
const editJsonFile = require('edit-json-file');
const singleUpload = async (parent, args, {userInfo}, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    let { createReadStream, filename, mimetype, encoding } = await args.file;
    const { extraAttributes } = args;
    filename = new Date().getTime() + '-' + filename;
    try {
        const stream = createReadStream();
        const { path, url } = urlFormater.encoder(extraAttributes, filename, userInfo.username);
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
}
const AdminUploadPreludeData = async (parent, args, { userInfo }, info) => {
    if (!userInfo) throw new AuthenticationError('missing authorization')
    if (userInfo instanceof jwt.TokenExpiredError) throw new AuthenticationError('token expired', { expiredAt: userInfo.expiredAt })
    let { createReadStream, filename, mimetype, encoding } = await args.file;
    const { type, id } = args;
    let config = editJsonFile(`${__dirname}/../project.json`);
    if (!config.get(`preludePics.${type}.${id}`)) throw new UserInputError('not a valid operation for edit default pic');
    try {
        const stream = createReadStream();
        const out = fs.createWriteStream(`${__dirname}/../datas/${filename}`);
        stream.pipe(out);
        await finished(out);
        config.set(`${__dirname}/../project.json`, `${config.get('domain')}/preludeDatas/${filename}`);
        config.save();
    }catch (e) {
        throw e
    }
}
module.exports = {
    singleUpload,
    AdminUploadPreludeData
}