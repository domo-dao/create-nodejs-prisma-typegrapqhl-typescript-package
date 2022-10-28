const { get, filter, isArray, isPlainObject, isNil, isEmpty } = require('lodash');
const { RDN_ERRORS } = require('./constants');
const API = require('./apis');
const { sleep } = require('../../shared/sleep');

const RETRY_SECONDS_MULTIPLIER = 2;

const getPaginationData = async (payload, company, attempt = 0) => {
  const api = API.create();
  let response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);

  // 429: Too many requests
  if (response.status === 429) {
    const nexAttempt = attempt + 1;
    const sleepFor = nexAttempt * RETRY_SECONDS_MULTIPLIER;
    console.log(`DEBUG: RDN: Too many requests, sleeping for ${sleepFor} seconds...`);
    sleep(sleepFor);
    return getPaginationData(payload, company, nexAttempt);
  }

  if (response && response.data && !response.data.item) {
    if (isEmpty(response.data)) {
      response.data = [];
    }
    return response.data;
  }

  let items = [];
  if (!response || !response.data || !response.data.item) return items;

  if (isArray(response.data.item)) {
    response.data.item.forEach((aa) => {
      items.push(aa);
    });
  } else if (isPlainObject(response.data.item)) {
    items.push(response.data.item);
  }

  if (response.header && response.header.total_pages) {
    for (let i = 2; i <= response.header.total_pages; ) {
      const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, i);
      // 429: Too many requests
      if (response.status === 429) {
        sleep(RETRY_SECONDS_MULTIPLIER);
        continue;
      }

      if (response.data && response.data.item) {
        if (isArray(response.data.item)) {
          response.data.item.forEach((aa) => {
            items.push(aa);
          });
        } else if (isPlainObject(response.data.item)) {
          items.push(response.data.item);
        }
      }
      i++;
    }
  }

  items = filter(items, (e) => !isNil(e));
  return items;
};

const getSubBranchList = async (company, excludedLocked = false) => {
  const payload = `
    <ns:getBranchList>
      <exclude_locked>${excludedLocked}</exclude_locked>
    </ns:getBranchList>
  `;

  let subBranches = await getPaginationData(payload, company);
  return subBranches;
};

const getZipCodesByBranch = async (branchId, company) => {
  const payload = `
    <ns:getBranchZips>
      <branch_id>${branchId}</branch_id>
    </ns:getBranchZips>
  `;

  let zipCodes = await getPaginationData(payload, company);
  return zipCodes;
};

const getUsersList = async (company) => {
  const employeesPayload = `
    <ns:getEmployees>
    </ns:getEmployees>
  `;
  const agentsPayload = `
    <ns:getAgents>
      <type>Company Adjuster</type>
    </ns:getAgents>
  `;

  let employeesList = await getPaginationData(employeesPayload, company);
  let agentsList = await getPaginationData(agentsPayload, company);

  employeesList = employeesList.map((employee) => ({
    ...employee,
    user_type: { _text: 'RDN Manager' },
  }));

  agentsList = await Promise.all(
    agentsList.map(async (agent) => {
      let agentId = agent['agent_id']['_text'];
      let agentInfoPayload = `
        <ns:getAgentInfo>
          <agent_id>${agentId}</agent_id>
        </ns:getAgentInfo>
      `;

      let agentInfo = await getPaginationData(agentInfoPayload, company);

      if (!agentInfo['email']?.['_text']) {
        // Search for same user in the employees list to gather the email
        const existentEmployee = employeesList.find((employee) => {
          return (
            employee?.first_name?._text?.toLowerCase() === agentInfo?.FN?._text?.toLowerCase() &&
            employee?.last_name?._text?.toLowerCase() === agentInfo?.LN?._text?.toLowerCase()
          );
        });

        if (existentEmployee) {
          agentInfo.email._text = existentEmployee?.email_address?._text;
        }
      }

      return {
        ...agent,
        id: { _text: agentId },
        active: { _text: 'true' },
        user_type: { _text: 'RDN Agent' },
        email_address: { _text: agentInfo['email']?.['_text'] || null },
      };
    }),
  );

  return [...employeesList, ...agentsList];
};

/**
 * It pulls all the cases from RDN based on the Date.
 * @param company
 * @param startDate
 * @param endDate
 * @returns {Promise<any[]>}
 */
exports.getOpenCases = async (company, startDate, endDate) => {
  if (isNil(company)) throw new Error('endpoints:getOpenCases: Company is Missing');

  const payload = `
    <ns:getOpenCases>
      <array>
        <start>${startDate}</start>
        <end>${endDate}</end>
      </array>
    </ns:getOpenCases>
  `;

  let cases = await getPaginationData(payload, company);
  cases = cases.map((_case) => get(_case, ['case_id', '_text']));
  return cases;
};

const getPendingCases = async (company, pending_order_status) => {
  const payload = `
    <ns:getPendingCases>
      <pending_order_status>${pending_order_status}</pending_order_status>
    </ns:getPendingCases>
  `;

  let cases = await getPaginationData(payload, company);
  cases = cases.map((_case) => get(_case, ['case_id', '_text']));
  return cases;
};

exports.getPurchasedDrnHits = async (company, caseId, attempt = 0) => {
  const payload = `
    <ns:getPurchasedDrnHits>
      <case_id>${caseId}</case_id>
    </ns:getPurchasedDrnHits>
  `;
  const api = API.create();
  const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);
  // If we are exhausting the RDN api, we need to wait
  if (response.status === 429) {
    console.log('getPurchasedDrnHits: 429 Too many requests');
    const nextAttempt = attempt + 1;
    sleep(nextAttempt * RETRY_SECONDS_MULTIPLIER);
    return exports.getPurchasedDrnHits(company, caseId, nextAttempt);
  }
  // if we get a 500, we need to check that is a Chase CASE
  if (response.status === 500) {
    // We need to check if this is a Chase case
    console.log(JSON.stringify(response));
    console.log(response.originalError);
    if (response?.originalError?.response?.data !== undefined) {
      if (String(response?.originalError?.response?.data).toLowerCase().indexOf('chase')) {
        throw new Error(RDN_ERRORS.CHASE_CASE);
      }
    }
  }
  const data = response.data;
  if (isNil(data)) return {};
  return data;
};

const getClosedCases = async (company, startDate, endDate) => {
  const payload = `
    <ns:getClosedCasesRange>
      <start_date>${startDate}</start_date>
      <end_date>${endDate}</end_date>
    </ns:getClosedCasesRange>
  `;

  let cases = await getPaginationData(payload, company);
  cases = cases.map((_case) => get(_case, ['case_id', '_text']));
  return cases;
};

const getOnHoldCases = async (company, startDate, endDate) => {
  const payload = `
    <ns:getOnHoldCases>
      <start_date>${startDate}</start_date>
      <end_date>${endDate}</end_date>
    </ns:getOnHoldCases>
  `;

  let cases = await getPaginationData(payload, company);
  cases = cases.map((_case) => get(_case, ['case_id', '_text']));
  return cases;
};

const getRepossessedCases = async (company, startDate, endDate) => {
  const payload = `
    <ns:getRepossessedCasesRange>
      <start_date>${startDate}</start_date>
      <end_date>${endDate}</end_date>
    </ns:getRepossessedCasesRange>
  `;

  let cases = await getPaginationData(payload, company);
  cases = cases.map((_case) => get(_case, ['case_id', '_text']));
  return cases;
};

const getRDNCaseInfo = async (company, caseId, attempt = 0) => {
  const payload = `
    <ns:getRdnCaseInfo>
      <case>${caseId}</case>
    </ns:getRdnCaseInfo>
  `;
  const api = API.create();
  const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);
  // If we are exhausting the RDN api, we need to wait
  if (response.status === 429) {
    const nextAttempt = attempt + 1;
    sleep(nextAttempt * RETRY_SECONDS_MULTIPLIER);
    return getRDNCaseInfo(company, caseId, nextAttempt);
  }
  // if we get a 500, we need to check that is a Chase CASE
  if (response.status === 500) {
    // We need to check if this is a Chase case
    if (response?.originalError?.response?.data !== undefined) {
      if (String(response?.originalError?.response?.data).toLowerCase().indexOf('chase')) {
        throw new Error(RDN_ERRORS.CHASE_CASE);
      }
    }
  }
  const data = response.data;
  if (isNil(data)) return {};
  return data;
};

const getRDNCaseUpdates = async (company, case_id) => {
  const payload = `
    <ns:getCaseUpdates>
      <case>${case_id}</case>
    </ns:getCaseUpdates>
  `;
  const caseUpdates = await getPaginationData(payload, company);
  return caseUpdates;
};

const getRDNCaseRecoveryInfo = async (company, case_id, attempt = 0) => {
  const payload = `
    <ns:getCaseRecoveryInfo>
      <case_id>${case_id}</case_id>
    </ns:getCaseRecoveryInfo>
  `;
  const api = API.create();
  const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);
  // If we are exhausting the RDN api, we need to wait
  if (response.status === 429) {
    const nextAttempt = attempt + 1;
    sleep(nextAttempt * RETRY_SECONDS_MULTIPLIER);
    return getRDNCaseRecoveryInfo(company, case_id, nextAttempt);
  }

  if (response.status === 500) {
    console.log('DEBUG:getRDNCaseRecoveryInfo', response);
  }
  const data = response.data;
  if (isNil(data)) return {};
  return data;
};

const getLastEventId = async (company, attempt = 0) => {
  const payload = `
    <ns:getLastEventId>
    </ns:getLastEventId>
  `;
  const api = API.create();
  const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);

  if (response.status === 429) {
    const nextAttempt = attempt + 1;
    sleep(nextAttempt * RETRY_SECONDS_MULTIPLIER);
    return getLastEventId(company, nextAttempt);
  }

  if (isNil(response.data)) return 0;
  return response.data._text;
};

const getFireHose = async (company, lastEventId, attempt = 0) => {
  const payload = `
    <ns:getFireHose>
      <last_event_id>${lastEventId}</last_event_id>
      <show_vendor_events>true</show_vendor_events>
    </ns:getFireHose>
  `;
  const api = API.create();
  const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);

  if (response.status === 429) {
    const nextAttempt = attempt + 1;
    sleep(nextAttempt * RETRY_SECONDS_MULTIPLIER);
    return getFireHose(company, lastEventId, nextAttempt);
  }
  if (isNil(response.data) || isEmpty(response.data.meta_data)) {
    return [];
  }
  if (isArray(response.data.meta_data.item)) {
    return response.data.meta_data.item;
  }
  return [response.data.meta_data.item];
};

const getBranchList = async (company, attempt = 0) => {
  const payload = `
    <ns:getBranchList>
    </ns:getBranchList>
  `;

  const api = API.create();
  const response = await api.postRNDWithDynamicKey(payload, company.rdnKey, 1);
  const data = response.data;

  if (response.status === 429) {
    const nextAttempt = attempt + 1;
    sleep(nextAttempt * RETRY_SECONDS_MULTIPLIER);

    return getBranchList(company, nextAttempt);
  }

  if (isNil(data)) {
    return [];
  }

  const branches = data.item;

  return branches;
};

module.exports = {
  ...exports,
  getRepossessedCases,
  getClosedCases,
  getOnHoldCases,
  getPendingCases,
  getRDNCaseInfo,
  getRDNCaseUpdates,
  getRDNCaseRecoveryInfo,
  getLastEventId,
  getFireHose,
  getSubBranchList,
  getUsersList,
  getZipCodesByBranch,
  getBranchList,
};
