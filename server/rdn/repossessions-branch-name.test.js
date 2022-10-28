const { REPOSSESSED_VEHICLE, UNKNOWN_BRANCH_ID } = require('../constants/app.constants');
const shiftService = require('../services/shift.service');
const { CASE_STATUSES } = require('./constants');

describe('Crons service', () => {
  describe('getSubBranchIdBasedOnAddress', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    const company = { dbName: 'rra_db' };
    test('Repossessed Branch Name value is unKnown when case status is other than Repossessed', () => {
      const status = CASE_STATUSES.onHold;
      expect(status === CASE_STATUSES.repossessed).toBe(false);
    });

    test("Repossessed Branch Name value is unKnown when case's zipcode and repo address is null or empty", () => {
      const status = CASE_STATUSES.repossessed;
      const _recoveryZip = null;
      const repoAddress = null;
      expect(status === CASE_STATUSES.repossessed).toBe(true);
      expect(!_recoveryZip && !repoAddress).toBe(true);
    });

    test('Repossessed Branch Name value is unKnown when zip code does not belongs to any branch', async () => {
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
          SubBranch: {
            findAll: jest.fn(() => []),
          },
        },
      }));

      const status = CASE_STATUSES.repossessed;
      const _recoveryZip = 34233;
      const repoAddress = '4644 Clark Rd, Sarasota, FL, 34233';
      const vendorBranchName = 'Tampa Office MC';
      expect(status === CASE_STATUSES.repossessed).toBe(true);
      expect(!!_recoveryZip && !!repoAddress).toBe(true);

      const repossessedSubBranch = await shiftService().getSubBranchIdBasedOnAddress(
        _recoveryZip,
        repoAddress,
        vendorBranchName,
        company.dbName,
        REPOSSESSED_VEHICLE,
      );

      expect(repossessedSubBranch.success).toBe(true);
      expect(repossessedSubBranch.subBranchId).toBe(UNKNOWN_BRANCH_ID);
    });

    test('Repossessed Branch Name value is not unKnown when zip code belongs to any branch', async () => {
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
          SubBranch: {
            findAll: jest.fn(() => [
              {
                id: 14,
                branchId: 5,
                rdnBranchId: 18331,
                name: 'Jacksonville Office',
                address: '1329 W Church St',
                state: 'FL',
                city: 'Jacksonville',
                zipCode: 32204,
                phone: '954-597-1396',
                displayRank: 0,
                createdAt: '2021-11-25T13:27:36.000Z',
                updatedAt: '2022-04-20T00:00:01.000Z',
                zipCodes:
                  '["32004","32006","32007","32009","32011","32030","32033","32034","32035","32040","32041","32042","32043","32044","32046","32050","32058","32063","32065","32067","32068","32072","32073","32079","32080","32081","32082","32084","32085","32086","32087","32091","32092","32095","32097","32099","32110","32112","32131","32135","32136","32137","32138","32139","32140","32142","32143","32145","32147","32148","32149","32157","32160","32164","32177","32178","32181","32185","32187","32189","32193","32201","32202","32203","32204","32205","32206","32207","32208","32209","32210","32211","32212","32214","32216","32217","32218","32219","32220","32221","32222","32223","32224","32225","32226","32227","32228","32229","32231","32232","32233","32234","32235","32236","32237","32238","32239","32240","32241","32244","32245","32246","32247","32250","32254","32255","32256","32257","32258","32259","32260","32266","32277","32622","32656","32666"]',
              },
              {
                id: 15,
                branchId: 5,
                rdnBranchId: 18490,
                name: 'Rapid - Jacksonville MC',
                address: null,
                state: null,
                city: null,
                zipCode: null,
                phone: null,
                displayRank: 0,
                createdAt: '2021-11-25T13:27:36.000Z',
                updatedAt: '2022-04-20T00:00:01.000Z',
                zipCodes:
                  '["32003","32006","32009","32011","32030","32034","32035","32040","32041","32043","32046","32050","32063","32065","32067","32068","32072","32073","32079","32082","32084","32087","32092","32095","32097","32099","32160","32201","32202","32203","32204","32205","32206","32207","32208","32209","32210","32211","32212","32214","32216","32217","32218","32219","32220","32221","32222","32223","32224","32225","32226","32227","32228","32229","32231","32232","32233","32234","32235","32236","32237","32238","32239","32240","32241","32244","32245","32246","32247","32250","32254","32255","32256","32257","32258","32259","32266","32277"]',
              },
            ]),
          },
        },
      }));

      const status = CASE_STATUSES.repossessed;
      const _recoveryZip = 32092;
      const repoAddress = '6835 County Road 16a #16A, St Augustine, FL, 32092';
      const vendorBranchName = 'Jacksonville Office';
      expect(status === CASE_STATUSES.repossessed).toBe(true);
      expect(!!_recoveryZip && !!repoAddress).toBe(true);

      const repossessedSubBranch = await shiftService().getSubBranchIdBasedOnAddress(
        _recoveryZip,
        repoAddress,
        vendorBranchName,
        company.dbName,
        REPOSSESSED_VEHICLE,
      );

      expect(repossessedSubBranch.success).toBe(true);
      expect(repossessedSubBranch.subBranchId !== UNKNOWN_BRANCH_ID).toBe(true);
    });
  });
});
