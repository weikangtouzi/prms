const editJsonFile = require('edit-json-file');
const a = () => {
    let json = editJsonFile(`${__dirname}/../project.json`);
    json.set('preludePics.male.0', 'aaaaa');
    json.save();
}
a();