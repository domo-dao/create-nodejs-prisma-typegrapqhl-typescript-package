const shiftService = require("./shift.service");
const { CASE_STATUSES } = require("../rdn/constants");
const { isEmpty } = require("lodash");

let companyDetails = {
  id: 1,
  name: "Rapid Recovery Agency",
  email: "admin@rra.com",
  emailReplyAddress: "no-reply@insightt.io",
  companyDomain: "",
  password: "$2b$10$ldn95b8fcbrjqmGk3sBb8.k3o7GuYDa.Kd58ooq9NrjmCGBKcSJMO",
  dbName: "rra_db",
  dbUsername: "root",
  dbUserPassword: "plit",
  uniqueName: "insightt-rapidrecoveryagency",
  awsChecklistBucketName: "insightt-rapidrecoveryagency/checklist",
  awsProfilePicsBucketName: "insightt-rapidrecoveryagency/profile-pics",
  awsEmployementFilesBucketName:
    "insightt-rapidrecoveryagency/employment-files",
  rdnId: "2895",
  rdnKey: "87086cebeff1129f4f3779cf5d8fd407",
  drnKey: "35878782-4459-454B-A840-37838197744A",
  syncRdnFrom: "2015-03-09T00:00:00.000Z",
  roleId: 1,
  status: "approved",
  isRegistrationCompleted: true,
  lastImportedRdnEventTimestamp: "2022-03-16T16:30:52.000Z",
  lastOpenDate: null,
  lastCloseDate: null,
  lastHoldDate: null,
  lastRepossessedDate: null,
  lastScannedAndHitDate: null,
  approvedDate: null,
  createdAt: "2021-11-02T10:55:40.000Z",
  updatedAt: "2022-03-17T07:27:37.000Z"
};

jest.mock("../database/models", () => ({
  PlatformCompany: {
    findOne: jest.fn(() => companyDetails)
  },
  rra_db: {
    GeoLocation: {
      findOne: jest.fn(() => ({ endTrackTime: "2022-01-01 12:00:00" })),
      findAll: jest.fn(() => [
        { endTrackTime: "2022-01-01 12:00:00", distance: 0 }
      ])
    }
  }
}));

describe("Shift service", () => {
  describe("getIdleMotionStatus", () => {
    const company = { dbName: "rra_db" };
    const activeShiftTime = { id: 1234 };
    const allowedTime = 10;

    test("Should not send an infraction (below allowed idle time)", async () => {
      let currentDateTime = "2022-01-01 12:05:00";

      const { isIdle } = await shiftService().getIdleMotionStatus(
        company,
        activeShiftTime,
        currentDateTime,
        allowedTime
      );

      expect(isIdle).toBe(false);
    });

    test("Should send an infraction (exactly at allowed idle time)", async () => {
      let currentDateTime = "2022-01-01 12:10:00";

      const { isIdle } = await shiftService().getIdleMotionStatus(
        company,
        activeShiftTime,
        currentDateTime,
        allowedTime
      );

      expect(isIdle).toBe(true);
    });

    test("Should send an infraction (above allowed idle time)", async () => {
      let currentDateTime = "2022-01-01 12:15:00";

      const { isIdle } = await shiftService().getIdleMotionStatus(
        company,
        activeShiftTime,
        currentDateTime,
        allowedTime
      );

      expect(isIdle).toBe(true);
    });
  });
  describe("getSpottedVehicleByVin", () => {
    test("Should not able to spot any vehicle when spottedCase not found for specified vin number", async () => {
      const spottedCase = null;
      expect(spottedCase).toBe(null);
    });
    test("Should not able to spot any vehicle when spottedCase found for specified vin number but not having either open or need_info status", async () => {
      const spottedCase = {
        caseId: 2101380488,
        status: "Repossessed",
        vin: "4T4BF1FK8FR481009",
        yearMakeModel: "2015 Toyota Camry",
        vehicleColor: "BLACK",
        spottedDate: "2022-04-20 04:33:24",
        spottedAddress: "411 Highland Cross Dr, Houston, TX, 77073",
        spotterId: 8
      };
      expect(!!spottedCase).toBe(true);
      expect(
        ![CASE_STATUSES.open, CASE_STATUSES.need_info].includes(
          spottedCase.status
        )
      ).toBe(true);
    });

    test("Should not able to spot any vehicle when spottedCase not found for specified vin number from RDN", async () => {
      const spottedCase = {
        caseId: 210138048877474,
        status: "Open",
        vin: "4T4BF1FK8FR481009",
        yearMakeModel: "2015 Toyota Camry",
        vehicleColor: "BLACK",
        spottedDate: "2022-04-20 04:33:24",
        spottedAddress: "411 Highland Cross Dr, Houston, TX, 77073",
        spotterId: 8
      };
      expect(!!spottedCase).toBe(true);
      expect(
        ![CASE_STATUSES.open, CASE_STATUSES.need_info].includes(
          spottedCase.status
        )
      ).toBe(false);
      // fetching a case from RDN
      const rdnCase = {};
      expect(isEmpty(rdnCase)).toBe(true);
    });

    test("Should not able to spot any vehicle when spottedCase found for specified vin number but having status other open and need_info from RDN", async () => {
      const spottedCase = {
        caseId: 2053932836,
        status: "Open",
        vin: "4T4BF1FK8FR481009",
        yearMakeModel: "2015 Toyota Camry",
        vehicleColor: "BLACK",
        spottedDate: "2022-04-20 04:33:24",
        spottedAddress: "411 Highland Cross Dr, Houston, TX, 77073",
        spotterId: 8
      };

      expect(
        ![CASE_STATUSES.open, CASE_STATUSES.need_info].includes(
          spottedCase.status
        )
      ).toBe(false);

      // fetching a case from RDN
      const rdnCase = {
        collateral: {
          vin: { _text: "1G1ZB5ST0KF207292" },
          year: { _text: "2019" },
          make: { _text: "CHEVROLET" },
          model: { _text: "MALIBU" },
          vehicle_color: { _text: "MAUVE" },
          vehicle_license_number: { _text: "17AQPN" },
          vehicle_license_state: { _text: "FL" },
          vehicle_license_exp: {},
          key_code_1: {},
          key_code_2: {},
          dealer_name: {},
          milage: { _text: "0" }
        },
        debtor: {
          first_name: { _text: "DEMETRIK" },
          middle_initial: {},
          last_name: { _text: "LAFLEUR" },
          ssn: {},
          date_of_birth: { _attributes: [Object] }
        },
        co_signer: {
          first_name: {},
          middle_initial: {},
          last_name: {},
          ssn: {},
          date_of_birth: { _attributes: [Object] }
        },
        addresses: { item: [[Object], [Object]] },
        status: { _text: "Pending Close" },
        substatus: { item: [[Object], [Object], [Object]] },
        was_drn_used: { _attributes: { "xsi:nil": "true" } },
        drn_reason: {},
        order_date: { _text: "2022-04-12" },
        repo_date: { _attributes: { "xsi:nil": "true" } },
        close_date: { _text: "2022-04-22" },
        hold_date: { _attributes: { "xsi:nil": "true" } },
        close_reason: { _text: "Closed for Further Investigation" },
        hold_reason: {},
        expiration_date: { _attributes: { "xsi:nil": "true" } },
        account_info: {
          amount_past_due: { _text: "936.16" },
          balance_on_account: { _text: "20668.05" },
          monthly_payments: { _text: "470.58" },
          delinquent_since: { _attributes: [Object] },
          charge_off_date: { _attributes: [Object] },
          bankruptcy_type: { _attributes: [Object] }
        },
        bankruptcy_type: { _text: "None" },
        investigator: { _text: "26832" },
        order_type: { _text: "Repossess" },
        vendor: {
          vendor_id: { _text: "FL9543266929" },
          name: { _text: "Rapid Recovery Agency" },
          address: { _text: "2152 Johnson St." },
          city: { _text: "Hollywood" },
          state: { _text: "FL" },
          zip_code: { _text: "33020" },
          phone: { _text: "954-597-1396" },
          fax: { _text: "954-597-1394" },
          memberships: {
            is_Allied_member: [Object],
            is_ARA_member: [Object],
            is_DRN_member: [Object],
            is_LRRP_member: [Object],
            is_NFA_member: [Object],
            is_Reliance_member: [Object]
          },
          lpr2_assignments_only: { _attributes: [Object] },
          state_license_number: { _text: "R2700054" }
        },
        vendor_branch_name: { _text: "Jacksonville Office" },
        assigneeid: { _text: "1009270" },
        assignee_name: { _text: "Robot Nowcom" },
        order_worker_id: { _text: "640077" },
        case_ref_num: { _text: "248789" },
        account_num: { _text: "16827580" },
        lender: {
          client_id: { _text: "201883" },
          client_name: { _text: "Westlake Services" },
          phone: { _text: "323-692-8800" },
          type: { _text: "Local" }
        },
        lender_branch_name: { _attributes: { "xsi:nil": "true" } },
        lienholder: {
          client_id: { _text: "1742559" },
          client_name: { _text: "Westlake Financial Services" },
          address: {},
          city: {},
          state: {},
          zip_code: {}
        },
        recovery_address: { address: {}, city: {}, state: {}, zip: {} },
        police_agency: {},
        police_badge: {},
        storage_location: {
          address: { _attributes: [Object] },
          name: { _attributes: [Object] },
          phone: {},
          fax: {},
          hours: {},
          lat: { _attributes: [Object] },
          long: { _attributes: [Object] },
          storage_location_id: { _text: "0" }
        },
        storage_location_space: {},
        estimated_damage: { _text: "0" },
        transported_released_to: { _text: "0" },
        transport_notes: {},
        transport_date: { _attributes: { "xsi:nil": "true" } },
        delivered_released_to: {},
        disposition: { _text: "I/P" },
        personal_items: {},
        has_personals: { _text: "false" },
        is_drivable: { _text: "false" },
        has_keys: { _text: "false" },
        additional_info: {},
        skip_flag: { _text: "false" },
        custom_fields: {
          item: [[Object], [Object], [Object], [Object], [Object]]
        },
        police_notified_date: { _attributes: { "xsi:nil": "true" } },
        police_report_number: {},
        odometer_type: {},
        overall_condition: {},
        dmv: { _text: "0" },
        key_type: {},
        police_info: {
          name: { _attributes: [Object] },
          branch: { _attributes: [Object] },
          updates_email: { _attributes: [Object] },
          address: { _attributes: [Object] },
          phone: { _attributes: [Object] },
          fax: { _attributes: [Object] },
          toll_free: { _attributes: [Object] },
          additional_info: { _attributes: [Object] },
          transport_notes: { _attributes: [Object] },
          police_id: { _attributes: [Object] }
        },
        icra: {
          ticket: {},
          debtor_notified_by: {},
          debtor_two_notified_by: {},
          debtor_notified_date: { _attributes: [Object] },
          debtor_two_notified_date: { _attributes: [Object] }
        },
        additional_collateral: {},
        violent_case: {
          is_violent: { _text: "false" },
          violent_debtor: { _text: "false" },
          violent_cosigner: { _text: "false" },
          violent_acct: { _text: "false" }
        },
        is_lpr20: { _text: "false" },
        is_vla: { _text: "false" },
        time_marked_repossessed: { _text: "1969-12-31T17:00:00" },
        lss_code: { _attributes: { "xsi:nil": "true" } },
        sub_branch: { _attributes: { "xsi:nil": "true" } },
        case_id: { _text: "2053932836" },
        tier: { _attributes: { "xsi:nil": "true" } },
        tier_name: { _attributes: { "xsi:nil": "true" } }
      };
      expect(isEmpty(rdnCase)).toBe(false);
      const statusInRDN = rdnCase.status._text;

      expect(
        statusInRDN !== CASE_STATUSES.open &&
          statusInRDN !== CASE_STATUSES.need_info
      ).toBe(true);
    });

    test("Should be able to spot any vehicle when spottedCase found for specified vin number and having status either open or need_info from RDN", async () => {
      const spottedCase = {
        caseId: 2105685332,
        status: "Open",
        vin: "WBA8B9G34HNU54457",
        yearMakeModel: "2017 BMW 3 Series",
        vehicleColor: "BLACK",
        spottedDate: null,
        spottedAddress: null,
        spotterId: null
      };

      expect(
        ![CASE_STATUSES.open, CASE_STATUSES.need_info].includes(
          spottedCase.status
        )
      ).toBe(false);

      // fetching a case from RDN
      const rdnCase = {
        collateral: {
          vin: { _text: "1G1ZB5ST0KF207292" },
          year: { _text: "2019" },
          make: { _text: "CHEVROLET" },
          model: { _text: "MALIBU" },
          vehicle_color: { _text: "MAUVE" },
          vehicle_license_number: { _text: "17AQPN" },
          vehicle_license_state: { _text: "FL" },
          vehicle_license_exp: {},
          key_code_1: {},
          key_code_2: {},
          dealer_name: {},
          milage: { _text: "0" }
        },
        debtor: {
          first_name: { _text: "DEMETRIK" },
          middle_initial: {},
          last_name: { _text: "LAFLEUR" },
          ssn: {},
          date_of_birth: { _attributes: [Object] }
        },
        co_signer: {
          first_name: {},
          middle_initial: {},
          last_name: {},
          ssn: {},
          date_of_birth: { _attributes: [Object] }
        },
        addresses: { item: [[Object], [Object]] },
        status: { _text: "Open" },
        substatus: { item: [[Object], [Object], [Object]] },
        was_drn_used: { _attributes: { "xsi:nil": "true" } },
        drn_reason: {},
        order_date: { _text: "2022-04-12" },
        repo_date: { _attributes: { "xsi:nil": "true" } },
        close_date: { _text: "2022-04-22" },
        hold_date: { _attributes: { "xsi:nil": "true" } },
        close_reason: { _text: "Closed for Further Investigation" },
        hold_reason: {},
        expiration_date: { _attributes: { "xsi:nil": "true" } },
        account_info: {
          amount_past_due: { _text: "936.16" },
          balance_on_account: { _text: "20668.05" },
          monthly_payments: { _text: "470.58" },
          delinquent_since: { _attributes: [Object] },
          charge_off_date: { _attributes: [Object] },
          bankruptcy_type: { _attributes: [Object] }
        },
        bankruptcy_type: { _text: "None" },
        investigator: { _text: "26832" },
        order_type: { _text: "Repossess" },
        vendor: {
          vendor_id: { _text: "FL9543266929" },
          name: { _text: "Rapid Recovery Agency" },
          address: { _text: "2152 Johnson St." },
          city: { _text: "Hollywood" },
          state: { _text: "FL" },
          zip_code: { _text: "33020" },
          phone: { _text: "954-597-1396" },
          fax: { _text: "954-597-1394" },
          memberships: {
            is_Allied_member: [Object],
            is_ARA_member: [Object],
            is_DRN_member: [Object],
            is_LRRP_member: [Object],
            is_NFA_member: [Object],
            is_Reliance_member: [Object]
          },
          lpr2_assignments_only: { _attributes: [Object] },
          state_license_number: { _text: "R2700054" }
        },
        vendor_branch_name: { _text: "Jacksonville Office" },
        assigneeid: { _text: "1009270" },
        assignee_name: { _text: "Robot Nowcom" },
        order_worker_id: { _text: "640077" },
        case_ref_num: { _text: "248789" },
        account_num: { _text: "16827580" },
        lender: {
          client_id: { _text: "201883" },
          client_name: { _text: "Westlake Services" },
          phone: { _text: "323-692-8800" },
          type: { _text: "Local" }
        },
        lender_branch_name: { _attributes: { "xsi:nil": "true" } },
        lienholder: {
          client_id: { _text: "1742559" },
          client_name: { _text: "Westlake Financial Services" },
          address: {},
          city: {},
          state: {},
          zip_code: {}
        },
        recovery_address: { address: {}, city: {}, state: {}, zip: {} },
        police_agency: {},
        police_badge: {},
        storage_location: {
          address: { _attributes: [Object] },
          name: { _attributes: [Object] },
          phone: {},
          fax: {},
          hours: {},
          lat: { _attributes: [Object] },
          long: { _attributes: [Object] },
          storage_location_id: { _text: "0" }
        },
        storage_location_space: {},
        estimated_damage: { _text: "0" },
        transported_released_to: { _text: "0" },
        transport_notes: {},
        transport_date: { _attributes: { "xsi:nil": "true" } },
        delivered_released_to: {},
        disposition: { _text: "I/P" },
        personal_items: {},
        has_personals: { _text: "false" },
        is_drivable: { _text: "false" },
        has_keys: { _text: "false" },
        additional_info: {},
        skip_flag: { _text: "false" },
        custom_fields: {
          item: [[Object], [Object], [Object], [Object], [Object]]
        },
        police_notified_date: { _attributes: { "xsi:nil": "true" } },
        police_report_number: {},
        odometer_type: {},
        overall_condition: {},
        dmv: { _text: "0" },
        key_type: {},
        police_info: {
          name: { _attributes: [Object] },
          branch: { _attributes: [Object] },
          updates_email: { _attributes: [Object] },
          address: { _attributes: [Object] },
          phone: { _attributes: [Object] },
          fax: { _attributes: [Object] },
          toll_free: { _attributes: [Object] },
          additional_info: { _attributes: [Object] },
          transport_notes: { _attributes: [Object] },
          police_id: { _attributes: [Object] }
        },
        icra: {
          ticket: {},
          debtor_notified_by: {},
          debtor_two_notified_by: {},
          debtor_notified_date: { _attributes: [Object] },
          debtor_two_notified_date: { _attributes: [Object] }
        },
        additional_collateral: {},
        violent_case: {
          is_violent: { _text: "false" },
          violent_debtor: { _text: "false" },
          violent_cosigner: { _text: "false" },
          violent_acct: { _text: "false" }
        },
        is_lpr20: { _text: "false" },
        is_vla: { _text: "false" },
        time_marked_repossessed: { _text: "1969-12-31T17:00:00" },
        lss_code: { _attributes: { "xsi:nil": "true" } },
        sub_branch: { _attributes: { "xsi:nil": "true" } },
        case_id: { _text: "2053932836" },
        tier: { _attributes: { "xsi:nil": "true" } },
        tier_name: { _attributes: { "xsi:nil": "true" } }
      };
      expect(isEmpty(rdnCase)).toBe(false);
      const statusInRDN = rdnCase.status._text;

      expect(
        statusInRDN !== CASE_STATUSES.open &&
          statusInRDN !== CASE_STATUSES.need_info
      ).toBe(false);
    });
  });
  describe("getShiftEmptyReasonInfraction", () => {
    test("test getShiftEmptyReasonInfraction() infraction type not allowed", () => {
      const infractions = [
        {
          id: 89249,
          lat: 37.785834,
          lng: -122.406417,
          address: "1800 Ellis St, San Francisco, CA 94115, USA",
          startTime: "2022-04-26T01:43:00.000Z",
          endTime: "2022-04-26T02:03:00.000Z",
          user_id: 336,
          first_name: "Jose",
          last_name: "Bohorquez",
          object_id: 521900,
          type: "shift_end_early",
          category: "infraction"
        }
      ];

      const infraction = shiftService().getShiftEmptyReasonInfraction(
        infractions,
        "shift_end_early"
      );

      expect(infraction).toBe(undefined);
    });

    test("test getShiftEmptyReasonInfraction() object fields", async () => {
      const infractions = [
        {
          id: 89249,
          lat: 37.785834,
          lng: -122.406417,
          address: "1800 Ellis St, San Francisco, CA 94115, USA",
          startTime: "2022-04-26T01:43:00.000Z",
          endTime: "2022-04-26T02:03:00.000Z",
          user_id: 336,
          first_name: "Jose",
          last_name: "Bohorquez",
          object_id: 521900,
          type: "shift_being_idle",
          category: "infraction"
        }
      ];
      const infraction = shiftService().getShiftEmptyReasonInfraction(
        infractions,
        "shift_being_idle"
      );

      expect(infraction).toBeDefined();
      expect(infraction.id).toBeDefined();
      expect(infraction.lat).toBeDefined();
      expect(infraction.lng).toBeDefined();
      expect(infraction.address).toBeDefined();
      expect(infraction.startTime).toBeDefined();
      expect(infraction.endTime).toBeDefined();
      expect(infraction.user_id).toBeDefined();
      expect(infraction.first_name).toBeDefined();
      expect(infraction.last_name).toBeDefined();
      expect(infraction.object_id).toBeDefined();
      expect(infraction.type).toBeDefined();
      expect(infraction.category).toBeDefined();
      expect(infraction.title).toBeDefined();
      expect(infraction.description).toBeDefined();
    });
  });
});
