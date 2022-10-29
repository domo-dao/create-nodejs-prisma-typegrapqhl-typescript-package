const shiftAdminService = require('./shift-admin.service');

jest.mock('../utils/util', () => ({
  __BRANCH_IDS__: {
    rra_db: {
      0: jest.fn(() => []),
      1: jest.fn(() => [1, 2, 4, 5, 6, 7, 18, 19, 20]),
      2: jest.fn(() => [8]),
      3: jest.fn(() => [9, 10]),
      4: jest.fn(() => [11, 12, 13]),
      5: jest.fn(() => [3, 14, 15, 16]),
      '-1': jest.fn(() => [-1]),
    },
  },
}));

describe('Shift admin service', () => {
  describe('getUnitsPendingRepossessions', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    const company = { dbName: 'rra_db' };
    const shiftBranchId = 1;
    const shiftWorkHours = {
      startTime: '2022-04-19T00:00:00+00:00',
      endTime: '2022-04-19T13:00:00+00:00',
    };

    test("Should send an empty array as unit pending repossessions when there is no case having one spotted vehicle with status 'Open' or 'Need Info' on current shift branch id", async () => {
      let companyDetails = {
        id: 1,
        name: 'Rapid Recovery Agency',
        email: 'admin@rra.com',
        emailReplyAddress: 'no-reply@insightt.io',
        companyDomain: '',
        password: '$2b$10$ldn95b8fcbrjqmGk3sBb8.k3o7GuYDa.Kd58ooq9NrjmCGBKcSJMO',
        dbName: 'rra_db',
        dbUsername: 'root',
        dbUserPassword: 'plit',
        uniqueName: 'insightt-rapidrecoveryagency',
        awsChecklistBucketName: 'insightt-rapidrecoveryagency/checklist',
        awsProfilePicsBucketName: 'insightt-rapidrecoveryagency/profile-pics',
        awsEmployementFilesBucketName: 'insightt-rapidrecoveryagency/employment-files',
        rdnId: '2895',
        rdnKey: '87086cebeff1129f4f3779cf5d8fd407',
        drnKey: '35878782-4459-454B-A840-37838197744A',
        syncRdnFrom: '2015-03-09T00:00:00.000Z',
        roleId: 1,
        status: 'approved',
        isRegistrationCompleted: true,
        lastImportedRdnEventTimestamp: '2022-03-16T16:30:52.000Z',
        lastOpenDate: null,
        lastCloseDate: null,
        lastHoldDate: null,
        lastRepossessedDate: null,
        lastScannedAndHitDate: null,
        approvedDate: null,
        createdAt: '2021-11-02T10:55:40.000Z',
        updatedAt: '2022-03-17T07:27:37.000Z',
      };
      jest.mock('../database/models', () => ({
        PlatformCompany: {
          findOne: jest.fn(() => companyDetails),
        },
        rra_db: {
          Case: {
            findAll: jest.fn(() => []),
          },
        },
      }));
      const unitsPendingRepossessionsOnShift = await shiftAdminService().getUnitsPendingRepossessions(
        shiftBranchId,
        company.dbName,
        {
          startTime: shiftWorkHours.startTime,
          endTime: shiftWorkHours.endTime,
        },
      );
      expect(unitsPendingRepossessionsOnShift.length > 0).toBe(false);
    });

    test("Should send an unit pending repossessions data when there are cases having atleast one spotted vehicle with status 'Open' or 'Need Info' on current shift branch id", async () => {
      let companyDetails = {
        id: 1,
        name: 'Rapid Recovery Agency',
        email: 'admin@rra.com',
        emailReplyAddress: 'no-reply@insightt.io',
        companyDomain: '',
        password: '$2b$10$ldn95b8fcbrjqmGk3sBb8.k3o7GuYDa.Kd58ooq9NrjmCGBKcSJMO',
        dbName: 'rra_db',
        dbUsername: 'root',
        dbUserPassword: 'plit',
        uniqueName: 'insightt-rapidrecoveryagency',
        awsChecklistBucketName: 'insightt-rapidrecoveryagency/checklist',
        awsProfilePicsBucketName: 'insightt-rapidrecoveryagency/profile-pics',
        awsEmployementFilesBucketName: 'insightt-rapidrecoveryagency/employment-files',
        rdnId: '2895',
        rdnKey: '87086cebeff1129f4f3779cf5d8fd407',
        drnKey: '35878782-4459-454B-A840-37838197744A',
        syncRdnFrom: '2015-03-09T00:00:00.000Z',
        roleId: 1,
        status: 'approved',
        isRegistrationCompleted: true,
        lastImportedRdnEventTimestamp: '2022-03-16T16:30:52.000Z',
        lastOpenDate: null,
        lastCloseDate: null,
        lastHoldDate: null,
        lastRepossessedDate: null,
        lastScannedAndHitDate: null,
        approvedDate: null,
        createdAt: '2021-11-02T10:55:40.000Z',
        updatedAt: '2022-03-17T07:27:37.000Z',
      };
      jest.mock('../database/models', () => ({
        PlatformCompany: {
          findOne: jest.fn(() => companyDetails),
        },
        rra_db: {
          Case: {
            findAll: jest.fn(() => [
              {
                caseId: '2105333122',
                vin: '1C6RR6GT9GS382311',
                orderType: 'Repossess',
                yearMakeModel: '2016 Ram 1500',
                vehicleColor: null,
                lenderClientName: 'Ally',
                spottedBranchId: 5,
                spotterId: 300,
                spottedDate: '2022-04-19T07:10:27.000Z',
                spottedNote: '',
                spottedAddress: '17011 NW 37th Ave, Miami Gardens, FL, 33056',
                user: {
                  id: 300,
                  firstName: 'Cookie',
                  lastName: 'Klaue',
                  avatarUrl: null,
                  branch: {
                    id: 1,
                    name: 'Main',
                  },
                },
                shiftId: 1,
              },
            ]),
          },
        },
      }));
      const unitsPendingRepossessionsOnShift = await shiftAdminService().getUnitsPendingRepossessions(
        shiftBranchId,
        company.dbName,
        {
          startTime: shiftWorkHours.startTime,
          endTime: shiftWorkHours.endTime,
        },
      );
      expect(unitsPendingRepossessionsOnShift.length > 0).toBe(true);
    });
  });
});
