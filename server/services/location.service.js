const db = require('../database/models');
const httpStatus = require('http-status');
const distance = require('google-distance-matrix');

const { googleApiKey } = require('../config/vars');
const { serverLogger } = require('../config/logger');
const { EARTH_RADIUS_IN_METER } = require('../constants/app.constants');
const { isEmpty } = require('lodash');
const { PlatformLocation } = require('../database/models');
const { getGeoAddress, getGeoLocation } = require('../helpers/location.helper');

const locationService = () => {
  const companyService = require('./company.service');
  const getDistances = async (origins, destinations, mode, units) => {
    distance.key(googleApiKey);

    return new Promise((resolve, reject) => {
      distance.matrix(origins, destinations, mode || 'driving', units || 'metric', (err, distances) => {
        if (err) {
          reject(err);
        }
        if (distances.error_message) {
          reject({
            status: httpStatus.FORBIDDEN,
            message: distances.error_message,
          });
        }
        resolve(distances);
      });
    });
  };

  const getOrSetLocation = async (geoCoords, company) => {
    const { Location } = await companyService().getCompanyDatabase(company.dbName);
    try {
      const approximate_location_query = `
        SELECT
          *,
          SQRT(POW(69.1 * (lat - :lat), 2) + POW(69.1 * (:lng - lng) * COS(lat / 57.3), 2)) AS distance
        FROM
          locations
        HAVING
          distance < :distance_threshold
        ORDER BY
          distance
        LIMIT 3;
      `;

      let locations = await db[`${company.dbName}_sequelize`].query(approximate_location_query, {
        replacements: {
          lat: geoCoords.lat,
          lng: geoCoords.lng,
          distance_threshold: 0.0155343, // 25 meters (in miles)
        },
        raw: true,
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      });

      if (isEmpty(locations)) {
        const address = await getGeoAddress(geoCoords);
        const newLocation = await Location.create({
          ...geoCoords,
          address: address,
        });
        return newLocation;
      } else {
        return locations[0];
      }
    } catch (error) {
      serverLogger.log({
        operationName: 'getOrSetLocation',
        message: error.message,
        error: error,
        level: 'error',
      });
      return null;
    }
  };

  const calculateDistance = (sourceLocation, destinationLocation) => {
    const distanceInLatitude = calculateRadius(+destinationLocation.lat - +sourceLocation.lat);
    const distanceInLongitude = calculateRadius(+destinationLocation.lng - +sourceLocation.lng);
    const distanceFromPreviousAndCurrentLatitude =
      Math.sin(+distanceInLatitude / 2) * Math.sin(+distanceInLatitude / 2) +
      Math.cos(calculateRadius(+sourceLocation.lat)) *
        Math.cos(calculateRadius(+destinationLocation.lat)) *
        Math.sin(+distanceInLongitude / 2) *
        Math.sin(+distanceInLongitude / 2);
    const distanceCoveredInMeter =
      EARTH_RADIUS_IN_METER *
      (2 *
        Math.atan2(
          Math.sqrt(distanceFromPreviousAndCurrentLatitude),
          Math.sqrt(1 - distanceFromPreviousAndCurrentLatitude),
        ));
    return distanceCoveredInMeter;
  };

  const calculateRadius = (locationPoint) => {
    return (locationPoint * Math.PI) / 180;
  };

  const getOrSetAddress = async (address, company) => {
    const { Location } = await companyService().getCompanyDatabase(company.dbName);

    if (!address) return null;

    const platformLocation = await PlatformLocation.findOne({
      where: {
        address,
      },
      raw: true,
      logging: (...msg) => {
        console.log('location.services.js:getOrSetAddress:PlatformLocation.findOne:logging:start');
        console.log('location.services.js:getOrSetAddress:PlatformLocation.findOne:logging:msg', msg);
        console.log('location.services.js:getOrSetAddress:PlatformLocation.findOne:logging:end');
      },
      benchmark: true,
    });
    const location = await Location.findOne({
      where: {
        address,
      },
      raw: true,
      logging: (...msg) => {
        console.log('location.services.js:getOrSetAddress:Location.findOne:logging:start');
        console.log('location.services.js:getOrSetAddress:Location.findOne:logging:msg', msg);
        console.log('location.services.js:getOrSetAddress:Location.findOne:logging:end');
      },
      benchmark: true,
    });
    if (platformLocation && location) {
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    if (platformLocation && !location) {
      await Location.create({
        lat: platformLocation.lat,
        lng: platformLocation.lng,
        address: platformLocation.address,
      });
      return {
        lat: platformLocation.lat,
        lng: platformLocation.lng,
      };
    }

    if (!platformLocation && location) {
      await PlatformLocation.create({
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      });

      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    let coordinates = null;
    try {
      coordinates = await getGeoLocation(address);
    } catch (error) {
      console.log('location.services.js:getOrSetAddress:getGeoLocation.error', error);
      return null;
    }

    await Promise.all([
      PlatformLocation.create({
        ...coordinates,
        address: address,
      }),
      Location.create({
        ...coordinates,
        address: address,
      }),
    ]);

    return {
      ...coordinates,
    };
  };

  return {
    getDistances,
    getOrSetLocation,
    getOrSetAddress,
    calculateDistance,
  };
};

module.exports = locationService;
