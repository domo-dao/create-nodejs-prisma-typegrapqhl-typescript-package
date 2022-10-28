// const Sequelize = require('sequelize');
const { concat, get, isEmpty, filter, includes } = require('lodash');
const moment = require('moment');
const Endpoints = require('./endpoints');
const { timeDiffAsSeconds } = require('../utils/util');
const { getTimeByRDNTimeZone } = require('./util');
const { cronRDNLogger } = require('../config/logger');
const { CASE_STATUSES, EVENT_TYPES, RDN_FIRE_HOSE_LIMIT, MISSED_REPOSSESSED_STATUSES } = require('./constants');

const {
  USER_ACTIVITIES,
  UNKNOWN,
  REPOSSESSED_VEHICLE,
  // WORKER_TASKS
} = require('../constants/app.constants');
const locationService = require('../services/location.service');
const shiftService = require('../services/shift.service');
const companyService = require('../services/company.service');
// const sqsService = require("../services/sqs.service");
// const { awsSqsWorkerQueueUrl } = require("../config/vars");
const userService = require('../services/user.service');
const { PlatformCompany } = require('../database/models');
const platformService = require('../services/platform.service');
const { PLATFORM_SETTINGS } = require('../constants/platform.constants');
const { handleDispositionChanged } = require('../api/controllers/worker/cron.controller');
const { PromisePool } = require('@supercharge/promise-pool');

exports.getAndSetOpenCases = async (company, startDate, endDate) => {
  let openCases = await Endpoints.getOpenCases(company, startDate, endDate);
  openCases = openCases.map((id) => ({ id, status: CASE_STATUSES.open }));
  await Promise.all(
    openCases.map(async (item) => {
      const caseId = item.id || item.case_id;
      const reg = /^\d{10}$/;
      cronRDNLogger.info(`Working on Case ${caseId}`);
      if (reg.test(caseId)) {
        await addOrUpdateCase(caseId, company);
      }
    }),
  );
};

const addOrUpdateCase = async (caseId, company, isSyncPending = false) => {
  let result = {};
  const {
    Case,
    // ManualHotCase,
  } = await companyService().getCompanyDatabase(company.dbName, true);

  try {
    const rdnCase = await Endpoints.getRDNCaseInfo(company, caseId);

    if (isEmpty(rdnCase)) {
      return {
        status: 'error',
        caseId,
        message: 'Case not Found in RDN',
      };
    }

    const dbCase = await Case.findOne({
      where: { caseId },
    });

    const status = get(rdnCase, ['status', '_text']);

    // currently, RDN is returning no-ISO 8601 date format for order_date, close_date, hold_date
    // only ISO 8601 date format for repo_date
    // also returning always by -7 Mountain TimeZone
    // so, substring by YYYY-MM-DD which is -7, and convert that to insightt time zone
    const _orderDate = get(rdnCase, ['order_date', '_text']);
    const orderDate = _orderDate
      ? moment(getTimeByRDNTimeZone(_orderDate.substring(0, 10))).format('YYYY-MM-DD HH:mm:ss')
      : null;

    const _closeDate = get(rdnCase, ['close_date', '_text']) || null;
    const closeDate = _closeDate
      ? moment(getTimeByRDNTimeZone(_closeDate.substring(0, 10))).format('YYYY-MM-DD HH:mm:ss')
      : null;

    const _holdDate = get(rdnCase, ['hold_date', '_text']) || null;
    const holdDate = _holdDate
      ? moment(getTimeByRDNTimeZone(_holdDate.substring(0, 10))).format('YYYY-MM-DD HH:mm:ss')
      : null;

    const translateAddressesWithinDays = Number.parseInt(
      await platformService().getPlatformSetting(PLATFORM_SETTINGS.translateAddressesWithinDays),
    );

    if (dbCase && dbCase.spottedDate !== null) {
      if (MISSED_REPOSSESSED_STATUSES.includes(status) && !MISSED_REPOSSESSED_STATUSES.includes(dbCase.status)) {
        const spotterUser = await userService().getUserById(company.dbName, dbCase.spotterId);
        if (spotterUser) {
          await shiftService().sendMailToAdminsForMissedRepossessionsAlert(
            company,
            [CASE_STATUSES.pending_close, CASE_STATUSES.closed].includes(status) ? 'Closed' : 'Hold',
            dbCase,
          );
        }
      }
    }

    let repoDate = null;
    let rdnRepoDate = null;
    let reposessionDateTime = null;
    if (status === CASE_STATUSES.repossessed) {
      const _repoDate = get(rdnCase, ['time_marked_repossessed', '_text']);
      repoDate = moment(getTimeByRDNTimeZone(_repoDate)).format('YYYY-MM-DD HH:mm:ss');

      const _rdnRepoDate = get(rdnCase, ['repo_date', '_text']);
      reposessionDateTime = _rdnRepoDate;
      rdnRepoDate = moment(getTimeByRDNTimeZone(_rdnRepoDate.substring(0, 19))).format('YYYY-MM-DD HH:mm:ss');
    }

    const _recoveryAddress = get(rdnCase, ['recovery_address', 'address', '_text']) || '';
    const _recoveryCity = get(rdnCase, ['recovery_address', 'city', '_text']) || '';
    const _recoveryState = get(rdnCase, ['recovery_address', 'state', '_text']) || '';
    const _recoveryZip = get(rdnCase, ['recovery_address', 'zip', '_text']) || '';
    const repoAddress =
      (_recoveryAddress ? _recoveryAddress + ', ' : '') +
      (_recoveryCity ? _recoveryCity + ', ' : '') +
      (_recoveryState ? _recoveryState + ', ' : '') +
      (_recoveryZip || '');

    const vendorBranchName = get(rdnCase, ['vendor_branch_name', '_text']) || null;

    let repossessedBranchName = null;
    if (status === CASE_STATUSES.repossessed) {
      if (!_recoveryZip) {
        repossessedBranchName = UNKNOWN;
      } else {
        const repossessedSubBranch = await shiftService().getSubBranchIdBasedOnAddressNew(
          _recoveryZip,
          repoAddress,
          vendorBranchName,
          company.dbName,
          REPOSSESSED_VEHICLE,
        );

        if (repossessedSubBranch.success) {
          if (repossessedSubBranch.subBranch.name) {
            repossessedBranchName = repossessedSubBranch.subBranch.name;
          } else {
            repossessedBranchName = vendorBranchName;
          }
        }
      }
    }
    let repoLat = null;
    let repoLng = null;

    const daysSinceRepossession = moment().diff(repoDate, 'days');

    if (dbCase) {
      if (repoAddress === dbCase.repoAddress) {
        repoLat = dbCase.repoLat;
        repoLng = dbCase.repoLng;
      } else {
        if (daysSinceRepossession <= translateAddressesWithinDays) {
          const location = await locationService().getOrSetAddress(repoAddress, company);

          repoLat = location.lat;
          repoLng = location.lng;
        }
      }

      await Case.update(
        {
          status,
          orderDate,
          repoDate,
          rdnRepoDate,
          repoAddress,
          repoLat,
          repoLng,
          closeDate,
          holdDate,
          vendorBranchName,
          repossessedBranchName,
          reposessionDateTime,
        },
        {
          where: { caseId },
        },
      );

      result = { status: 'ok', caseId, message: 'RDN Case Updated' };
    } else {
      // TODO save repoLat, repoLng, spottedLat, spottedLng
      if (repoAddress) {
        if (daysSinceRepossession <= translateAddressesWithinDays) {
          const location = await locationService().getOrSetAddress(repoAddress, company);

          repoLat = location.lat;
          repoLng = location.lng;
        }
      }

      await Case.create({
        caseId,
        status,
        orderDate,
        orderType: get(rdnCase, ['order_type', '_text']),
        repoDate,
        rdnRepoDate,
        repoAddress,
        repoLat,
        repoLng,
        closeDate,
        holdDate,
        repossessedBranchName,
        vendorId: get(rdnCase, ['vendor', 'vendor_id', '_text']),
        vendorName: get(rdnCase, ['vendor', 'name', '_text']),
        vendorAddress: get(rdnCase, ['vendor', 'address', '_text']),
        vendorCity: get(rdnCase, ['vendor', 'city', '_text']),
        vendorState: get(rdnCase, ['vendor', 'state', '_text']),
        vendorZipCode: get(rdnCase, ['vendor', 'zip_code', '_text']),
        vendorPhone: get(rdnCase, ['vendor', 'phone', '_text']),
        vendorFax: get(rdnCase, ['vendor', 'fax', '_text']),
        vendorBranchName,
        lenderClientId: get(rdnCase, ['lender', 'client_id', '_text']),
        lenderClientName: get(rdnCase, ['lender', 'client_name', '_text']),
        lenderPhone: get(rdnCase, ['lender', 'phone', '_text']),
        lenderType: get(rdnCase, ['lender', 'type', '_text']),
        disposition: get(rdnCase, ['disposition', '_text']),
        lienholderClientId: get(rdnCase, ['lienholder', 'client_id', '_text']),
        lienholderClientName: get(rdnCase, ['lienholder', 'client_name', '_text']),
        vin: get(rdnCase, ['collateral', 'vin', '_text']),
        yearMakeModel:
          (get(rdnCase, ['collateral', 'year', '_text']) || '') +
          ' ' +
          (get(rdnCase, ['collateral', 'make', '_text']) || '') +
          ' ' +
          (get(rdnCase, ['collateral', 'model', '_text']) || ''),
        vehicleColor: get(rdnCase, ['collateral', 'vehicle_color', '_text']),
        vehicleLicenseNumber: get(rdnCase, ['collateral', 'vehicle_license_number', '_text']),
        vehicleLicenseState: get(rdnCase, ['collateral', 'vehicle_license_state', '_text']),
        investigator: get(rdnCase, ['investigator', '_text']),
        assigneeId: get(rdnCase, ['assigneeid', '_text']),
        assigneeName: get(rdnCase, ['assignee_name', '_text']),
        orderWorkerId: get(rdnCase, ['order_worker_id', '_text']),
        caseRefNum: get(rdnCase, ['case_ref_num', '_text']),
        accountNum: get(rdnCase, ['account_num', '_text']),
        reposessionDateTime,
      });

      result = { status: 'ok', caseId, message: 'RDN Case Added' };

      // Update Manual Hot Case
      // const caseVin = get(rdnCase, ['collateral', 'vin', '_text']);
      // const lastSixOfVin = caseVin ? caseVin.substring(caseVin.length - 6) : '';
      // if (lastSixOfVin) {
      //   await ManualHotCase.update(
      //     {
      //       caseId,
      //     },
      //     {
      //       where: {
      //         vin: {
      //           [Sequelize.Op.like]: '%' + lastSixOfVin + '%',
      //         },
      //       },
      //     },
      //   );
      // }
    }

    if (isSyncPending) {
      let lastApprovedDate = moment(company.approvedDate);
      lastApprovedDate = lastApprovedDate.add(1, 'day');
      await PlatformCompany.update(
        {
          ...(orderDate && {
            lastOpenDate: dbCase ? lastApprovedDate : orderDate,
          }),
          ...(closeDate && {
            lastCloseDate: dbCase ? lastApprovedDate : closeDate,
          }),
          ...(holdDate && {
            lastHoldDate: dbCase ? lastApprovedDate : holdDate,
          }),
          ...(rdnRepoDate && {
            lastRepossessedDate: dbCase ? lastApprovedDate : rdnRepoDate,
          }),
        },
        {
          where: {
            id: company.id,
          },
        },
      );
    }
  } catch (error) {
    result = {
      status: 'error',
      caseId,
      message: error.message,
    };
  }

  return result;
};

exports.addOrUpdateCase = addOrUpdateCase;

const addCaseAgent = async (caseId, company) => {
  let result = {};

  try {
    const { Case, User } = await companyService().getCompanyDatabase(company.dbName, true);
    const rdnCaseRecoveryInfo = await Endpoints.getRDNCaseRecoveryInfo(company, caseId);

    if (rdnCaseRecoveryInfo) {
      const _case = await Case.findOne({
        where: {
          caseId,
        },
      });

      if (_case) {
        const repoAgentRdnId = get(rdnCaseRecoveryInfo, ['recovered_by', '_text']);
        const recoveryAgent = await User.findOne({
          where: {
            rdnId: repoAgentRdnId,
          },
        });

        _case.repoAgentRdnId = repoAgentRdnId;
        _case.repoAgentFirstName = recoveryAgent ? recoveryAgent.firstName : '';
        _case.repoAgentLastName = recoveryAgent ? recoveryAgent.lastName : '';
        await _case.save();

        result = { status: 'ok', caseId, message: 'Recovery Agent Added' };
      } else {
        result = {
          status: 'error',
          caseId,
          message: "Couldn't add Recovery Agent",
        };
      }
    } else {
      return {
        status: 'error',
        caseId,
        message: 'Case Recovery Info not found',
      };
    }
  } catch (error) {
    return {
      status: 'error',
      caseId,
      message: error.message,
    };
  }
  return result;
};

const addUserActivity = async (caseId, company, rdnDataMissingString = '') => {
  let result = {};
  const { User, UserActivity } = await companyService().getCompanyDatabase(company.dbName, true);

  try {
    const rdnCaseUpdates = await Endpoints.getRDNCaseUpdates(company, caseId);
    if (rdnCaseUpdates) {
      for (const caseUpdate of rdnCaseUpdates) {
        const caseUpdateId = get(caseUpdate, ['update_id', '_text']);
        const updateNote = get(caseUpdate, ['update_text', '_text']);
        const updatedType = get(caseUpdate, ['update_type', '_text']);
        let updateTime = get(caseUpdate, ['update_date', '_text']);
        if (updateTime) {
          updateTime = moment(updateTime).toISOString();
        }
        const userRDNId = get(caseUpdate, ['posted_by', '_text']);
        const user = await User.findOne({
          where: {
            rdnId: userRDNId,
          },
        });

        const userActivity = await UserActivity.findOne({
          where: {
            userId: user ? user.id : null,
            caseId,
            updateId: caseUpdateId,
          },
        });

        if (userActivity) {
          let isUserActivityDataChanged = false;
          if (userActivity.updateNote != updateNote) {
            userActivity.updateNote = updateNote;
            isUserActivityDataChanged = true;
          }
          if (userActivity.updateTime && userActivity.updateTime.toISOString() != updateTime) {
            userActivity.updateTime = updateTime;
            isUserActivityDataChanged = true;
          }
          if (userActivity.updatedType != updatedType) {
            userActivity.updatedType = updatedType;
            isUserActivityDataChanged = true;
          }

          if (isUserActivityDataChanged) {
            userActivity.type = USER_ACTIVITIES.rdn;
            await userActivity.save();
          }
        } else {
          await UserActivity.create({
            userId: user ? user.id : null,
            caseId,
            updateId: caseUpdateId,
            updateNote,
            updateTime,
            updatedType,
            type: USER_ACTIVITIES.rdn,
          });
        }

        result = {
          status: 'ok',
          message: 'Added User Activity',
        };
      }
    } else {
      rdnDataMissingString += `${caseId} Case Recovery Info not found in RDN getRDNCaseUpdates endpoints \n`;
      result = {
        status: 'error',
        caseId,
        message: 'Case Recovery Info not found',
        rdnDataMissingString,
      };
    }
  } catch (error) {
    result = {
      status: 'error',
      message: error.message,
    };
  }

  return result;
};
exports.addUserActivity = addUserActivity;

exports.processRDNCases = async (company, opts = {}) => {
  const lastImportedRdnCaseDateTime = company.lastImportedRdnCaseTimestamp ?? company.syncRdnFrom;
  const momentNow = moment();
  const momentStartDate = moment(lastImportedRdnCaseDateTime);
  let momentEndDate = momentStartDate.clone();
  momentEndDate.add(2, 'week');

  if (momentEndDate.isAfter(momentNow, 'day')) {
    momentEndDate = momentNow;
  }
  const startDate = momentStartDate.format('YYYY-MM-DD');
  const endDate = momentEndDate.format('YYYY-MM-DD');

  cronRDNLogger.info(`processRDNCases:${company.name} by start_date ${startDate} - end_date ${endDate}`);

  // Getting Open Cases
  cronRDNLogger.info(`processRDNCases:${company.name} Getting Open Cases...`);
  let openCases = await Endpoints.getOpenCases(company, startDate, endDate);
  if (openCases.length) {
    openCases = openCases.map((id) => ({ id, status: CASE_STATUSES.open }));
  } else {
    if (openCases == undefined || openCases == null) {
      const rdnDataMissingString = `Open Cases not Found in RDN getOpenCases endpoints from ${startDate} to ${endDate}`;
      cronRDNLogger.info(rdnDataMissingString);
      await companyService().sendMailToAdminsForMissingRdnData(company);
    }
  }
  cronRDNLogger.info(`Got ${openCases.length} Open Cases...`);
  // Getting Pending Close Cases
  cronRDNLogger.info('Getting Pending Close Cases...');
  let pendingCloseCases = await Endpoints.getPendingCases(company, CASE_STATUSES.pending_close);
  if (pendingCloseCases.length) {
    pendingCloseCases = pendingCloseCases.map((id) => ({
      id,
      status: CASE_STATUSES.pending_close,
    }));
  } else {
    if (pendingCloseCases == undefined || pendingCloseCases == null) {
      const rdnDataMissingString = `Case not Found in RDN getPendingCases endpoints `;
      cronRDNLogger.info(rdnDataMissingString);
      await companyService().sendMailToAdminsForMissingRdnData(company);
    }
  }
  cronRDNLogger.info(`Got ${pendingCloseCases.length} Pending Close Cases!`);

  // Getting Pending On Hold Cases
  cronRDNLogger.info('Getting Pending On Hold Cases...');
  let pendingOnHoldCases = await Endpoints.getPendingCases(company, CASE_STATUSES.pending_on_hold);
  if (pendingOnHoldCases.length) {
    pendingOnHoldCases = pendingOnHoldCases.map((id) => ({
      id,
      status: CASE_STATUSES.pending_on_hold,
    }));
  } else {
    if (pendingOnHoldCases == undefined || pendingOnHoldCases == null) {
      const rdnDataMissingString = `Case not Found in RDN getPendingCases endpoints from ${momentStartDate} to ${momentEndDate}`;
      cronRDNLogger.info(rdnDataMissingString);
      await companyService().sendMailToAdminsForMissingRdnData(company);
    }
  }
  cronRDNLogger.info(`Got ${pendingOnHoldCases.length} Pending On Hold Cases!`);

  // Getting Closed Cases
  cronRDNLogger.info('Getting Closed Cases...');
  let closedCases = await Endpoints.getClosedCases(company, startDate, endDate);
  if (closedCases.length) {
    closedCases = closedCases.map((id) => ({ id, status: CASE_STATUSES.closed }));
  } else {
    if (closedCases == undefined || closedCases == null) {
      const rdnDataMissingString = `Case not Found in RDN getClosedCases endpoints from ${momentStartDate} to ${momentEndDate}`;
      cronRDNLogger.info(rdnDataMissingString);
      await companyService().sendMailToAdminsForMissingRdnData(company);
    }
  }

  cronRDNLogger.info(`Got ${closedCases.length} Closed Cases!`);

  // Getting On Hold Cases
  cronRDNLogger.info('Getting On Hold Cases...');
  let onHoldCases = await Endpoints.getOnHoldCases(company, startDate, endDate);
  if (onHoldCases.length) {
    onHoldCases = onHoldCases.map((id) => ({ id, status: CASE_STATUSES.onHold }));
  } else {
    if (onHoldCases == undefined || onHoldCases == null) {
      const rdnDataMissingString = `Case not Found in RDN getOnHoldCases endpoints from ${momentStartDate} to ${momentEndDate}`;
      cronRDNLogger.info(rdnDataMissingString);
      await companyService().sendMailToAdminsForMissingRdnData(company);
    }
  }

  cronRDNLogger.info(`Got ${onHoldCases.length} On Hold Cases!`);

  // Getting Repossessed Cases
  cronRDNLogger.info('Getting Repossessed Cases...');
  let repossessedCases = await Endpoints.getRepossessedCases(company, startDate, endDate);
  if (repossessedCases.length) {
    repossessedCases = repossessedCases.map((id) => ({
      id,
      status: CASE_STATUSES.repossessed,
    }));
  } else {
    if (repossessedCases == undefined || repossessedCases == null) {
      const rdnDataMissingString = `Case not Found in RDN getRepossessedCases endpoints from ${startDate} to ${endDate}`;
      cronRDNLogger.info(rdnDataMissingString);
      await companyService().sendMailToAdminsForMissingRdnData(company);
    }
  }

  cronRDNLogger.info(`Got ${repossessedCases.length} Repossessed Cases!`);

  let cases = [];
  cases = concat(cases, openCases);
  cases = concat(cases, pendingCloseCases);
  cases = concat(cases, pendingOnHoldCases);
  cases = concat(cases, closedCases);
  cases = concat(cases, onHoldCases);
  cases = concat(cases, repossessedCases);

  cronRDNLogger.info(
    `Open: ${openCases.length}, Pending Close: ${pendingCloseCases.length} Pending On Hold: ${pendingOnHoldCases.length}, Closed: ${closedCases.length}, On Hold: ${onHoldCases.length}, Repossessed: ${repossessedCases.length}`,
  );
  cronRDNLogger.info(`Total Cases: ${cases.length} for company ${company.name}`);

  let completedCasesCount = 0;
  const { results, errors } = await PromisePool.for(cases).process(async (item, index) => {
    if (opts?.signal?.aborted) {
      return;
    }
    const caseId = item.id || item.case_id;
    const caseStatus = item.status;
    const reg = /^\d{10}$/;
    cronRDNLogger.info(`processRDNCases:${company.name} Working on Case ${caseId}:${caseStatus}`);

    if (!reg.test(caseId)) {
      console.log('CaseId invalid:', caseId);
      return;
    }

    const caseResult = await addOrUpdateCase(caseId, company);

    if (caseResult.status === 'error') {
      cronRDNLogger.log({
        operationName: 'processRDNCases:addOrUpdateCase',
        message: 'RDN Case Error',
        error: { caseId, message: caseResult.message },
        level: 'error',
      });
      return;
    } else {
      cronRDNLogger.log({
        operationName: 'processRDNCases',
        message: 'RDN Case Processed',
        caseId,
        level: 'info',
      });
    }

    try {
      if (caseStatus === CASE_STATUSES.repossessed) {
        const agentResult = await addCaseAgent(caseId, company);
        if (agentResult.status === 'error') {
          cronRDNLogger.log({
            operationName: 'processRDNCases',
            message: 'Recovery Agent Error',
            error: { caseId, message: agentResult.message },
            level: 'error',
          });
        } else {
          cronRDNLogger.log({
            operationName: 'processRDNCases',
            message: 'Recovery Agent Processed',
            caseId,
            level: 'info',
          });
        }
      }
      completedCasesCount++;
      if (index % 10 === 0) {
        cronRDNLogger.log({
          operationName: 'processRDNCases',
          message: `RDN Case stored completed ${completedCasesCount} out of ${cases.length} for ${company.name}`,
          level: 'info',
        });
      }
    } catch (error) {
      cronRDNLogger.log({
        operationName: 'processRDNCases',
        message: 'Process RDN Case Error',
        case: item,
        error: {
          message: error.message,
          stack: error.stack,
        },
        level: 'error',
      });
    }
    return caseId;
  });

  console.log('RESULTS:', results);
  console.log('ERRORS', errors);
  console.log('lastImportedRdnCaseTimestamp', endDate);

  await PlatformCompany.update(
    {
      lastImportedRdnCaseTimestamp: endDate,
    },
    {
      where: { id: company.id },
    },
  );

  cronRDNLogger.info('Processing RDN Cases, Recovery Agents Finished...');
};

exports.processRDNEvents = async (company, opts = {}) => {
  cronRDNLogger.info('Processing RDN Events...');
  const lastEventId = await Endpoints.getLastEventId(company);
  const eventsOccuredAfter = await Endpoints.getFireHose(company, lastEventId - RDN_FIRE_HOSE_LIMIT);
  cronRDNLogger.info(`Found RDN Events from ${lastEventId - RDN_FIRE_HOSE_LIMIT} to ${lastEventId}`);

  // process only unchecked events
  let occuredAtOfLastCheckedEvent = '';
  try {
    occuredAtOfLastCheckedEvent = await companyService().importRdnEvents(company.dbName);
  } catch (error) {
    occuredAtOfLastCheckedEvent = '';
  }
  const eventsListToProcess =
    !occuredAtOfLastCheckedEvent || !moment(occuredAtOfLastCheckedEvent).isValid()
      ? eventsOccuredAfter
      : filter(eventsOccuredAfter, (eventOfRDN) => {
          const occurredAt = get(eventOfRDN, ['occurred_at', '_text']);
          if (timeDiffAsSeconds(occurredAt, occuredAtOfLastCheckedEvent) >= 0) {
            return true;
          } else {
            return false;
          }
        });

  const checkedCases = [];
  // let rdnDataMissingString = "";
  for (const eventOfRDN of eventsListToProcess) {
    if (opts?.signal?.aborted) {
      break;
    }

    const caseId = get(eventOfRDN, ['case_id', '_text']);
    const eventType = get(eventOfRDN, ['event_type', '_text']);
    const eventOccuredAt = get(eventOfRDN, ['occurred_at', '_text']);
    const oldValue = get(eventOfRDN, ['old', '_text']);
    const newValue = get(eventOfRDN, ['new', '_text']);

    try {
      // Process Cases
      if (!includes(checkedCases, caseId)) {
        // check out the duplicated cases.
        // only get case-info one time for them. occured events are meaning that case has been updated in RDN
        // so, no need to determine last event for the same cases
        checkedCases.push(caseId);

        const caseResult = await addOrUpdateCase(
          caseId,
          company,
          // rdnDataMissingString
        );
        if (caseResult.status === 'error') {
          cronRDNLogger.log({
            operationName: 'processRDNEvents',
            message: 'RDN Case Error by Event',
            error: { caseId, message: caseResult.message },
            level: 'error',
          });
        } else {
          cronRDNLogger.log({
            operationName: 'processRDNEvents',
            message: 'RDN Case Processed by Event',
            caseId,
            eventType,
            occuredAt: eventOccuredAt,
            level: 'info',
          });
        }
        // if (caseResult.rdnDataMissingString.length > 0) {
        //   rdnDataMissingString = caseResult.rdnDataMissingString;
        // }

        if (Number(eventType) === EVENT_TYPES.case_was_repoed) {
          const agentResult = await addCaseAgent(
            caseId,
            company,
            // rdnDataMissingString
          );
          if (agentResult.status === 'error') {
            cronRDNLogger.log({
              operationName: 'processRDNEvents',
              message: 'Recovery Agent Error by Event',
              error: { caseId, message: agentResult.message },
              level: 'error',
            });
          } else {
            cronRDNLogger.log({
              operationName: 'processRDNEvents',
              message: 'Recovery Agent Processed by Event',
              caseId,
              level: 'info',
            });
          }
          // if (agentResult.rdnDataMissingString.length > 0) {
          //   rdnDataMissingString = agentResult.rdnDataMissingString;
          // }
        }
      }

      // Add User Activities
      if (Number(eventType) === EVENT_TYPES.update_added) {
        const result = await addUserActivity(
          caseId,
          company,
          // rdnDataMissingString
        );
        if (result.status === 'ok') {
          cronRDNLogger.log({
            operationName: 'processRDNEvents',
            message: 'Added User Activity by RDN Event',
            caseId,
            eventType,
            occuredAt: eventOccuredAt,
            level: 'info',
          });
        }
        if (result.status === 'error') {
          cronRDNLogger.log({
            operationName: 'processRDNEvents',
            message: 'Add an User Activity error',
            error: { caseId, message: result.message },
            level: 'error',
          });
        }
        // if (result.rdnDataMissingString.length > 0) {
        //   rdnDataMissingString = result.rdnDataMissingString;
        // }
      }

      // handle case disposition event change
      if (Number(eventType) === EVENT_TYPES.case_disposition_changed) {
        const result = await handleDispositionChanged({
          caseId,
          oldValue,
          newValue,
          eventOccurredAt: eventOccuredAt,
          company,
        });
        if (result.status) {
          cronRDNLogger.log({
            operationName: 'processRDNEvents',
            message: 'Handled Case Disposition Changed - SUCCESS',
            caseId,
            eventType,
            oldValue,
            newValue,
            occuredAt: eventOccuredAt,
            level: 'info',
          });
        } else {
          cronRDNLogger.log({
            operationName: 'processRDNEvents',
            message: 'Handled Case Disposition Changed - ERROR',
            caseId,
            eventType,
            oldValue,
            newValue,
            occuredAt: eventOccuredAt,
            error: result.error,
            level: 'error',
          });
        }
      }

      // Save the last checked event's occured time
      await companyService().storeRdnEvents(company.dbName, eventOccuredAt);
    } catch (error) {
      cronRDNLogger.log({
        operationName: 'processRDNEvents',
        message: 'Processing RDN Events Error',
        error: {
          message: error.message,
          stack: error.stack,
        },
        level: 'error',
      });
    }
  }

  // if (rdnDataMissingString.length) {
  //   rdnDataMissingString += `with company name is ${company.name}`;
  //   cronRDNLogger.info(rdnDataMissingString);
  //   await companyService().sendMailToAdminsForMissingRdnData(company);
  // }

  cronRDNLogger.info('Processing RDN Events Finished...');
};
