const { GraphQLEnumType } = require('graphql');

const EnterpriseNature = new GraphQLEnumType({
    name: 'EnterpriseNature',
    values: {
        ForeignVentures: { value: 0 },
        PrivateEnterprise: { value: 1 },
        ForeignFundedEnterprises: { value: 2 },
        StateOwnedEnterprises: { value: 3 },
        Extra: { value: 4 },
    }
})


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


const Identity = new GraphQLEnumType({
    name: 'Identity',
    values: {
        PersonalUser: { value: 0 },
        EnterpriseUser: { value: 1 },
        Administrator: { value: 2 },
        Counselor: { value: 3 }
    }
})

const EnterpriseRole = new GraphQLEnumType({
    name: 'Role',
    values: {
        HR: { value: 0 },
        Teacher: { value: 1 },
        Admin: { value: 2 },
        None: { value: 3 }
    }
});

const EnterpriseCertificationStatus = new GraphQLEnumType({
    name: 'EnterpriseCertificationStatus',
    values: {
        None: { value: 0 },
        Failed: { value: 1},
        Passed: { value: 2 },
        Waiting: { value: 3 }
    }
});

const WorkerMatePrecheckResult = new GraphQLEnumType({
    name: 'WorkMatePrecheckResult',
    values: {
        OK: { value: 0 },
        NotAUser: { value: 1 },
        AlreadyWorkMate: { value: 2 },
        WorkingInAnotherCompany: { value: 3 },
        NotCertified: { value: 4 }
    }
})
const MessageType = new GraphQLEnumType({
    name: 'WorkMatePrecheckResult',
    values: {
        Normal: { value: 0 },
        System: { value: 1 },
        Resume: { value: 2 },
        InterviewInvitation: { value: 3 },
        Other: { value: 4 }
    }
})

const FullTime = new GraphQLEnumType({
    name: 'FullTime',
    values: {
        FullTime: { value: 0},
        PartTime: { value: 1 },
        InternShip: { value: 2 },
    }
})

module.exports = {
    Education,
    EnterpriseNature,
    Identity,
    EnterpriseRole,
    EnterpriseCertificationStatus,
    WorkerMatePrecheckResult,
    MessageType,
    FullTime
}