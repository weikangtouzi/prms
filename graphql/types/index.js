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

const EnterpriseSize = new GraphQLEnumType({
    name: 'EnterpriseNature',
    values: {
        LessThanFifteen: { value: 0 },
        FifteenToFifty: { value: 1 },
        FiftyToOneHundredFifty: { value: 2 },
        OneHundredFiftyToFiveHundreds: { value: 3 },
        FiveHundredsToTwoThousands: { value: 4 },
        MoreThanTwoThousands: { value: 5 },
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
        Failed: { value: 1 },
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
        Full: { value: 0 },
        Part: { value: 1 },
        InternShip: { value: 2 },
    }
})
const EnterpriseFinancing = new GraphQLEnumType({
    name: 'EnterpriseFinancing',
    values: {
        NotYet: { value: 0 },
        AngelFinancing: { value: 1 },
        A: { value: 2 },
        B: { value: 3 },
        C: { value: 4 },
        D: { value: 5 },
        Listed: { value: 6 },
        NoNeed: { value: 7 }
    }

})
const EnterpriseOvertime = new GraphQLEnumType({
    name: 'EnterpriseFinancing',
    values: {
        None: { value: 0 },
        Paid: { value: 1 },
        SomeTime: { value: 2 }
    }

})
const EnterpriseRestRule = new GraphQLEnumType({
    name: "EnterpriseRestRule",
    values: {
        OneDayOffPerWeekend: { value: 0 },
        TwoDayOffPerWeekend: { value: 1 },
        StaggerWeekends: { value: 2 },
        ShiftWork: { value: 3 },
    }
})
const JobStatus = new GraphQLEnumType({
    name: "JobStatus",
    values: {
        NotPublishedYet: { value: 0 },
        InRecruitment: { value: 1 },
        OffLine: { value: 2 }
    }
})
const ResumeJobStatus = new GraphQLEnumType({
    name: "ResumeJobStatus",
    values: {

        NoJobButWantJob: { value: 0 },

        NoJobButNoJob: { value: 1 },
        
        OnTheJob: { value: 4 },

        OnTheJobButLookingForAJob: { value: 3 },

        GraduatingStudent: { value: 2 },
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
    FullTime,
    EnterpriseSize,
    EnterpriseFinancing,
    EnterpriseOvertime,
    EnterpriseRestRule,
    JobStatus,
    ResumeJobStatus
}