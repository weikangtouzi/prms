const { UserInputError } = require('apollo-server-errors');
const { GraphQLEnumType } = require('graphql');
const mongo = require('../mongo');
const { isvaildNum, isvaildidCardNum } = require('../utils/validations');

const Education = new GraphQLEnumType({
    name: 'Education',
    values: {
        LessThanPrime: { value: 0 },
        Primary: { value: 1 },
        Junior: { value: 2 },
        High: { value: 3 },
        JuniorCollege: { value: 4 },
        RegularCollege: { value: 5 },
        Postgraduate: { value: 6 },
        Doctor: { value: 7 },
    }
})


const insertPersonalData = async (parent, args, context, info) => {
    let error = {};
    let { name, number, idCardNum, education, skills } = args.info;
    if (name.trim() == "") { throw new UserInputError('real name cannot be empty') }
    if (number.trim() == "") { throw new UserInputError('phoneNumber cannot be empty') }
    isvaildNum(error, number);
    if (idCardNum.trim() == "") { throw new UserInputError('idCardNum cannot be empty') }
    isvaildidCardNum(error, idCardNum);
    if (Object.keys(error).length > 0) { throw new UserInputError('bad input', { error }) }
    await mongo.query('Talent Pool', async (collection) => {
        collection.updateOne({ idCardNum: idCardNum }, {
            $set: {
                name,
                number,
                idCardNum,
                education: education.toString(),
                skills
            }
        }, { upsert: true })
    })
    return {
        statusCode: "200",
        msg: "Success"
    }
}

module.exports = {
    insertPersonalData
}