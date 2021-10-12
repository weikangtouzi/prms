const { UserInputError, AuthenticationError } = require('apollo-server-errors');
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
    if (context.req && context.req.headers.authorization) {
        const pro_number = context.req.headers.authorization;
        isvaildNum(error, pro_number);
        if (Object.keys(error).length > 0) { throw new AuthenticationError('invaild provider phone number', { error }) }
        let { name, number, idCardNum, education, skills } = args.info;
        if (name.trim() == "") { throw new UserInputError('real name cannot be empty') }
        if (number.trim() == "") { throw new UserInputError('phoneNumber cannot be empty') }
        isvaildNum(error, number);
        if (idCardNum.trim() == "") { throw new UserInputError('idCardNum cannot be empty') }
        isvaildidCardNum(error, idCardNum);
        if (Object.keys(error).length > 0) { throw new UserInputError('bad input', { error }) }
        await mongo.query('Talent Pool', async (collection) => {
            collection.updateOne({ "data.idCardNum": idCardNum }, {
                $set: {
                    data: {
                        name,
                        number,
                        idCardNum,
                        education: education.toString(),
                        skills
                    },
                    providerNumber: pro_number
                }
            }, { upsert: true })
        })
        return await mongo.query('Talent Pool', async (collection) => {
            return collection.countDocuments({providerNumber: pro_number})
        })
    } else {
        throw new AuthenticationError('missing provider phone number')
    }
}

const phoneNumberCheck = async (parent, args, context, info) => {
    let errors = {};
    const {phoneNumber, verifyCode} = args;
    isvaildNum(errors, phoneNumber);
    if(Object.keys(errors).length > 0) {
        throw new UserInputError('bad input', { errors });
    }
    await mongo.query('user_log_in_cache', async (collection) => {
        let res = await collection.findOne({
            phoneNumber: phoneNumber
        });
        if (!res) {
            errors.verifyCode = "verify code out of time"
            return
        }
        if (res.code !== verifyCode) {
            errors.verifyCode = "invaild verify code";
        }
    })
    if(Object.keys(errors).length > 0) {
        throw new UserInputError('bad input', { errors });
    }
    return await mongo.query('Talent Pool', async (collection) => {
        return collection.countDocuments({providerNumber: phoneNumber})
    })
}

const checkIdCardNumber = async (parent, args, context, info) => {
    const {idCardNum} = args
    let count = await mongo.query('Talent Pool', (collection) => {
        return collection.countDocuments({"data.idcardNum": idCardNum})
    })
    return count == 1
}

module.exports = {
    insertPersonalData,
    phoneNumberCheck,
    checkIdCardNumber
}