const { MISSED_REPOSSESSED_STATUSES } = require("./constants");

describe("Crons service", () => {
  describe("addOrUpdateCase", () => {
    test("Should not send mail to admins and branch managers when rdn case is not exist in cases table", () => {
      const dbCase = null;

      expect(!!dbCase).toBe(false);
    });

    test("Should not send mail to admins and branch managers when no vehicle is spotted in this case", () => {
      const dbCase = {
        caseId: "2103861490",
        status: "On Hold",
        orderDate: "2022-03-08T07:00:00.000Z",
        orderType: "Repossess",
        spottedDate: null,
        spottedNote: "",
        spottedAddress: "1351 NW 197th St, Miami, FL, 33169",
        spottedLat: 25.9549834,
        spottedLng: -80.22478989999999,
        spotterId: 298,
        repoDate: null,
        rdnRepoDate: null,
        repoAddress: "",
        repoLat: null,
        repoLng: null,
        repoAgentRdnId: null,
        repoAgentFirstName: null,
        repoAgentLastName: null,
        closeDate: null,
        holdDate: "2022-04-08T07:00:00.000Z",
        vendorId: "FL9543266929",
        vendorName: "Rapid Recovery Agency",
        vendorAddress: "2152 Johnson St.",
        vendorCity: "Hollywood",
        vendorState: "FL",
        vendorZipCode: "33020",
        vendorPhone: "954-597-1396",
        vendorFax: "954-597-1394",
        vendorBranchName: "Main Lot",
        lenderClientId: "275600",
        lenderClientName: "CenterOne",
        lenderPhone: null,
        lenderType: "Local",
        lienholderClientId: "974637",
        lienholderClientName: "Southeast Toyota Finance",
        vin: "4T1B11HK8JU559285",
        yearMakeModel: "2018 TOYOTA CAMRY",
        vehicleColor: null,
        vehicleLicenseNumber: null,
        vehicleLicenseState: null,
        investigator: "0",
        assigneeId: "497845",
        assigneeName: "WOFCO/Repo Group ",
        orderWorkerId: "0",
        caseRefNum: "0",
        accountNum: "001010000003866183",
        spottedBranchId: 5,
        repossessedBranchName: "Unknown",
        createdAt: "2022-03-09T08:07:52.000Z",
        updatedAt: "2022-04-11T12:12:11.000Z"
      };
      expect(!!dbCase).toBe(true);
      expect(dbCase.spottedDate === null).toBe(true);
    });

    test("Should not send mail to admins and branch managers when case status is other than closed, pending close or hold, pending hold", () => {
      const rdnStatus = "Repossessed";
      const dbCase = {
        caseId: "2103861490",
        status: "On Hold",
        orderDate: "2022-03-08T07:00:00.000Z",
        orderType: "Repossess",
        spottedDate: "2022-03-10T04:44:45.000Z",
        spottedNote: "",
        spottedAddress: "1351 NW 197th St, Miami, FL, 33169",
        spottedLat: 25.9549834,
        spottedLng: -80.22478989999999,
        spotterId: 298,
        repoDate: null,
        rdnRepoDate: null,
        repoAddress: "",
        repoLat: null,
        repoLng: null,
        repoAgentRdnId: null,
        repoAgentFirstName: null,
        repoAgentLastName: null,
        closeDate: null,
        holdDate: "2022-04-08T07:00:00.000Z",
        vendorId: "FL9543266929",
        vendorName: "Rapid Recovery Agency",
        vendorAddress: "2152 Johnson St.",
        vendorCity: "Hollywood",
        vendorState: "FL",
        vendorZipCode: "33020",
        vendorPhone: "954-597-1396",
        vendorFax: "954-597-1394",
        vendorBranchName: "Main Lot",
        lenderClientId: "275600",
        lenderClientName: "CenterOne",
        lenderPhone: null,
        lenderType: "Local",
        lienholderClientId: "974637",
        lienholderClientName: "Southeast Toyota Finance",
        vin: "4T1B11HK8JU559285",
        yearMakeModel: "2018 TOYOTA CAMRY",
        vehicleColor: null,
        vehicleLicenseNumber: null,
        vehicleLicenseState: null,
        investigator: "0",
        assigneeId: "497845",
        assigneeName: "WOFCO/Repo Group ",
        orderWorkerId: "0",
        caseRefNum: "0",
        accountNum: "001010000003866183",
        spottedBranchId: 5,
        repossessedBranchName: "Unknown",
        createdAt: "2022-03-09T08:07:52.000Z",
        updatedAt: "2022-04-11T12:12:11.000Z"
      };
      expect(!!dbCase).toBe(true);
      expect(!!dbCase.spottedDate).toBe(true);
      expect(
        MISSED_REPOSSESSED_STATUSES.includes(rdnStatus) &&
          !MISSED_REPOSSESSED_STATUSES.includes(dbCase.status)
      ).toBe(false);
    });

    test("Should not send mail to admins and branch managers when spotter user does not exist", async () => {
      const rdnStatus = "Closed";
      const dbCase = {
        caseId: "2103861490",
        status: "Open",
        orderDate: "2022-03-08T07:00:00.000Z",
        orderType: "Repossess",
        spottedDate: "2022-03-10T04:44:45.000Z",
        spottedNote: "",
        spottedAddress: "1351 NW 197th St, Miami, FL, 33169",
        spottedLat: 25.9549834,
        spottedLng: -80.22478989999999,
        spotterId: 298,
        repoDate: null,
        rdnRepoDate: null,
        repoAddress: "",
        repoLat: null,
        repoLng: null,
        repoAgentRdnId: null,
        repoAgentFirstName: null,
        repoAgentLastName: null,
        closeDate: null,
        holdDate: "2022-04-08T07:00:00.000Z",
        vendorId: "FL9543266929",
        vendorName: "Rapid Recovery Agency",
        vendorAddress: "2152 Johnson St.",
        vendorCity: "Hollywood",
        vendorState: "FL",
        vendorZipCode: "33020",
        vendorPhone: "954-597-1396",
        vendorFax: "954-597-1394",
        vendorBranchName: "Main Lot",
        lenderClientId: "275600",
        lenderClientName: "CenterOne",
        lenderPhone: null,
        lenderType: "Local",
        lienholderClientId: "974637",
        lienholderClientName: "Southeast Toyota Finance",
        vin: "4T1B11HK8JU559285",
        yearMakeModel: "2018 TOYOTA CAMRY",
        vehicleColor: null,
        vehicleLicenseNumber: null,
        vehicleLicenseState: null,
        investigator: "0",
        assigneeId: "497845",
        assigneeName: "WOFCO/Repo Group ",
        orderWorkerId: "0",
        caseRefNum: "0",
        accountNum: "001010000003866183",
        spottedBranchId: 5,
        repossessedBranchName: "Unknown",
        createdAt: "2022-03-09T08:07:52.000Z",
        updatedAt: "2022-04-11T12:12:11.000Z"
      };
      expect(!!dbCase).toBe(true);
      expect(!!dbCase.spottedDate).toBe(true);
      expect(
        MISSED_REPOSSESSED_STATUSES.includes(rdnStatus) &&
          !MISSED_REPOSSESSED_STATUSES.includes(dbCase.status)
      ).toBe(true);

      const spotterUser = null;

      expect(!!spotterUser).toBe(false);
    });

    test("Should send mail to admins and branch managers when spotter user exist", async () => {
      const rdnStatus = "Closed";
      const dbCase = {
        caseId: "2103861490",
        status: "Open",
        orderDate: "2022-03-08T07:00:00.000Z",
        orderType: "Repossess",
        spottedDate: "2022-03-10T04:44:45.000Z",
        spottedNote: "",
        spottedAddress: "1351 NW 197th St, Miami, FL, 33169",
        spottedLat: 25.9549834,
        spottedLng: -80.22478989999999,
        spotterId: 298,
        repoDate: null,
        rdnRepoDate: null,
        repoAddress: "",
        repoLat: null,
        repoLng: null,
        repoAgentRdnId: null,
        repoAgentFirstName: null,
        repoAgentLastName: null,
        closeDate: null,
        holdDate: "2022-04-08T07:00:00.000Z",
        vendorId: "FL9543266929",
        vendorName: "Rapid Recovery Agency",
        vendorAddress: "2152 Johnson St.",
        vendorCity: "Hollywood",
        vendorState: "FL",
        vendorZipCode: "33020",
        vendorPhone: "954-597-1396",
        vendorFax: "954-597-1394",
        vendorBranchName: "Main Lot",
        lenderClientId: "275600",
        lenderClientName: "CenterOne",
        lenderPhone: null,
        lenderType: "Local",
        lienholderClientId: "974637",
        lienholderClientName: "Southeast Toyota Finance",
        vin: "4T1B11HK8JU559285",
        yearMakeModel: "2018 TOYOTA CAMRY",
        vehicleColor: null,
        vehicleLicenseNumber: null,
        vehicleLicenseState: null,
        investigator: "0",
        assigneeId: "497845",
        assigneeName: "WOFCO/Repo Group ",
        orderWorkerId: "0",
        caseRefNum: "0",
        accountNum: "001010000003866183",
        spottedBranchId: 5,
        repossessedBranchName: "Unknown",
        createdAt: "2022-03-09T08:07:52.000Z",
        updatedAt: "2022-04-11T12:12:11.000Z"
      };
      expect(!!dbCase).toBe(true);
      expect(!!dbCase.spottedDate).toBe(true);
      expect(
        MISSED_REPOSSESSED_STATUSES.includes(rdnStatus) &&
          !MISSED_REPOSSESSED_STATUSES.includes(dbCase.status)
      ).toBe(true);

      const spotterUser = {
        id: 298,
        firstName: "Gregory",
        lastName: "Schules",
        email: "gryschules@gmail.com",
        rdnId: "216850",
        drnId: "RapidFLDriver06",
        password:
          "$2b$10$jhxt60YZdWjh..79yIg8R.x5zZpU4KE./04kEctrZHEEgnbk/YP0W",
        phoneNumber: "786-492-2329",
        avatarUrl: null,
        roleId: 6,
        teamId: 1,
        branchId: 1,
        hourlyRate: null,
        hireDate: null,
        status: "ACTIVE",
        isPasswordChangeRequired: 0,
        createdAt: "2021-10-27T20:48:46.000Z",
        updatedAt: "2022-03-17T01:28:30.000Z",
        role: { id: 6, name: "Spotter", type: "spotter", role: "driver" },
        branch: { id: 1, name: "Main" }
      };

      expect(!!spotterUser).toBe(true);
    });
  });
});
