const nodeGeoCoder = require('node-geocoder');
const { googleApiKey } = require('../config/vars');
const { serverLogger } = require('../config/logger');
const { sleep } = require('../../shared/sleep');

exports.getGeoLocation = async (address, attempt = 0) => {
  if (!address) {
    throw new Error('location.helper.js:getGeoLocation:Address is required');
  }

  const options = {
    provider: 'google',
    apiKey: googleApiKey,
    formatter: null, // 'gpx', 'string', ...
  };

  const geoCoder = nodeGeoCoder(options);
  let location = null;

  try {
    location = await geoCoder.geocode(address);
    console.log('location.helper.js:getGeoLocation:geoCoder.geocode:location:', location);
  } catch (error) {
    console.log('location.helper.js:getGeoLocation:geoCoder.geocode:error:', attempt, error);
    if (error.code === 'ECONNRESET' && attempt < 3) {
      sleep(attempt + 1);
      return exports.getGeoLocation(address, attempt + 1);
    }
    throw error;
  }

  if (location && location[0]) {
    return {
      lat: location[0].latitude || 0,
      lng: location[0].longitude || 0,
    };
  }
  throw new Error('location.helper.js:getGeoLocation:Location Not Found');
};

exports.getGeoAddress = async (geoCoords) => {
  try {
    if (!geoCoords || !geoCoords.lat || !geoCoords.lng) {
      return '';
    }

    const options = {
      provider: 'google',
      apiKey: googleApiKey,
      formatter: null, // 'gpx', 'string', ...
    };

    const geoCoder = nodeGeoCoder(options);
    const location = await geoCoder.reverse({
      lat: geoCoords.lat,
      lon: geoCoords.lng,
    });

    if (location && location[0]) {
      return location[0].formattedAddress;
    } else {
      return '';
    }
  } catch (error) {
    serverLogger.log({
      operationName: 'getGeoAddress',
      message: error.message,
      error: error,
      level: 'error',
    });
    return '';
  }
};
