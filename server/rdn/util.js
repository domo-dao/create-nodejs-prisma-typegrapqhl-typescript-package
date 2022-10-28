const { keys, has, get, isEqual, isArray, isString, isNumber, isEmpty } = require('lodash');
const moment = require('moment');

const { RDN_SERVER_TIME_ZONE_OFFSET } = require('./constants');

const { VOLUNTARY_ORDER_TYPES, IMPOUND_ORDER_TYPES } = require('../../server/rdn/constants');

function beautify(data, type = 'text') {
  /**
   * type: text | number
   */
  keys(data).forEach((key) => {
    if (isArray(data[key])) {
      data = data[key];
      beautify(data);
    }

    if (isString(data[key]) || isNumber(data[key])) {
      return;
    } else if (has(data[key], '_text')) {
      if (isEqual('text', type)) {
        data[key] = data[key]['_text'];
      } else {
        data[key] = Number(data[key]['_text']);
      }
    } else if (has(data[key], '_attributes') || isEmpty(data[key])) {
      data[key] = null;
    } else {
      beautify(data[key]);
    }
  });

  return data;
}

function getCaseValidAddresses(rdnCase) {
  const validAddresses = [];

  if (isArray(get(rdnCase, ['addresses', 'item']))) {
    const caseAddresses = get(rdnCase, ['addresses', 'item']);
    for (const caseAddress of caseAddresses) {
      if (get(caseAddress, ['is_valid', '_text']) === 'true') {
        const address = get(caseAddress, ['address', '_text']) || '';
        const city = get(caseAddress, ['city', '_text']) || '';
        const state = get(caseAddress, ['state', '_text']) || '';
        const zip = get(caseAddress, ['zip', '_text']) || '';

        const fullAddress =
          (address ? address + ', ' : '') + (city ? city + ', ' : '') + (state ? state + ', ' : '') + (zip || '');

        fullAddress && validAddresses.push(fullAddress);
      }
    }
  } else {
    const isValid = get(rdnCase, ['addresses', 'item', 'is_valid', '_text']);
    // is_valid is string type of "true" or "false", no boolean
    if (isValid === 'true') {
      const address = get(rdnCase, ['addresses', 'item', 'address', '_text']) || '';
      const city = get(rdnCase, ['addresses', 'item', 'city', '_text']) || '';
      const state = get(rdnCase, ['addresses', 'item', 'state', '_text']) || '';
      const zip = get(rdnCase, ['addresses', 'item', 'zip', '_text']) || '';

      const fullAddress =
        (address ? address + ', ' : '') + (city ? city + ', ' : '') + (state ? state + ', ' : '') + (zip || '');

      fullAddress && validAddresses.push(fullAddress);
    }
  }

  return validAddresses;
}

function getTimeByRDNTimeZone(time) {
  if (!time) return null;

  const converted = moment
    .utc(time)
    .utcOffset(RDN_SERVER_TIME_ZONE_OFFSET * 7)
    .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
    .format();

  return converted;
}

const checkIsVoluntaryRepossession = (rdnCase) => {
  if (VOLUNTARY_ORDER_TYPES.includes(rdnCase.orderType) || IMPOUND_ORDER_TYPES.includes(rdnCase.orderType)) {
    return true;
  }
  return false;
};

module.exports = {
  beautify,
  getCaseValidAddresses,
  getTimeByRDNTimeZone,
  checkIsVoluntaryRepossession,
};
