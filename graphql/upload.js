const { finished } = require('stream/promises');
const { uploadPath } = require('../project.json')
const singleUpload = async (parent, { file }) => {
    const { createReadStream, filename, mimetype, encoding } = await file;
    console.log(file)
    try {
        const stream = createReadStream();
        let type = mimetype.split('/');
        const out = require('fs').createWriteStream(`${uploadPath}/${filename}`);
        stream.pipe(out);
        await finished(out);
    } catch (e) {
        throw e;
    }


    return "sdasdada"
}

module.exports = {
    singleUpload
}