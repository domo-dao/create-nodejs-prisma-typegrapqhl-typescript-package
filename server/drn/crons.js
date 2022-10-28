const moment = require('moment');
const Endpoints = require('./endpoints');
const { cronRDNLogger } = require('../config/logger');

const { DRN_BUNCH_LIMIT } = require('../constants/app.constants');
const companyService = require('../services/company.service');
const { PlatformCompany } = require('../database/models');

// const cronRDNLogger = {
//   info: msg => console.log(msg)
// };

exports.addCameraScansAndHits = async (company) => {
  cronRDNLogger.info(
    `addCameraScansAndHits: Adding Camera scans and Hits: ${String(company.name)} - ${String(
      company.lastScannedAndHitDate,
    )}`,
  );
  const { CameraHit, CameraScan } = await companyService().getCompanyDatabase(company.dbName);

  const momentLastScannedAndHitDate = moment(company.lastScannedAndHitDate);
  const momentToday = moment();
  momentLastScannedAndHitDate.subtract(1, 'day');

  for (let i = 0; i < DRN_BUNCH_LIMIT; i += 1) {
    momentLastScannedAndHitDate.add(1, 'day');
    // if Query Date today, then we do nothing:
    if (
      momentLastScannedAndHitDate.isSame(momentToday, 'day') ||
      momentLastScannedAndHitDate.isAfter(momentToday)
    ) {
      cronRDNLogger.info(
        `addCameraScansAndHits: Nothing to Search today for: ${[momentLastScannedAndHitDate, momentToday]}`,
      );
      return;
    }

    const queryDate = momentLastScannedAndHitDate.format('YYYY-MM-DD');
    cronRDNLogger.info(`addCameraScansAndHits: Querying DRN for: ${queryDate}`);
    const drnDetails = await Endpoints.getCameraScansAndHits(company, queryDate);
    // If DRN errors out, we stop the process
    if (drnDetails.error_message) {
      cronRDNLogger.info(
        `addCameraScansAndHits: Error pulling data from DRN on ${queryDate}: ${String(drnDetails.error_message)}`,
      );
      return;
    }
    cronRDNLogger.info(`addCameraScansAndHits: Result(${queryDate}): ${JSON.stringify(drnDetails)}}`);
    // If we pulled date, we continue:
    //SCANS:
    for (const item of drnDetails?.scans) {
      cronRDNLogger.info(`addCameraScansAndHits: Working on camera scan: ${JSON.stringify(item)}`);
      const cameraScan = await CameraScan.findOne({
        where: {
          scannedAt: queryDate,
          drnId: item.id,
        },
      });
      if (cameraScan) {
        cameraScan.count = item.count;
        await cameraScan.save();
      } else {
        await CameraScan.create({
          scannedAt: queryDate,
          drnId: item.id,
          count: item.count,
        });
      }
    }
    // HITS:
    for (const item of drnDetails?.hits) {
      cronRDNLogger.info(`Working on camera hit ${JSON.stringify(item)}`);
      const cameraHit = await CameraHit.findOne({
        where: {
          scannedAt: queryDate,
          drnId: item.id,
        },
      });
      if (cameraHit) {
        cameraHit.lpr = item.lpr;
        cameraHit.direct = item.direct;
        cameraHit.count = item.count;
        cameraHit.lprVins = item.lprVins;
        cameraHit.directHitsVins = item.directHitsVins;
        await cameraHit.save();
      } else {
        await CameraHit.create({
          scannedAt: queryDate,
          drnId: item.id,
          lpr: item.lpr,
          direct: item.direct,
          count: item.count,
          lprVins: item.lprVins,
          directHitsVins: item.directHitsVins,
        });
      }
    }
    // We update the date either way on each cycle, just in case:
    await PlatformCompany.update({ lastScannedAndHitDate: queryDate }, { where: { id: company.id } });
    cronRDNLogger.info(`addCameraScansAndHits: Adding Camera scans and Hits (${queryDate}) Finished...`);
  }

  cronRDNLogger.info(`addCameraScansAndHits:  Finished...`);
  return;
};
