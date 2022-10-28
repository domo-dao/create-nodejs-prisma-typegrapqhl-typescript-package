const moment = require('moment');
const sqsService = require('../sqs.service');
const { serverLogger } = require('../../config/logger');
const { WORKER_TASKS } = require('../../constants/app.constants');
const { awsSqsWorkerQueueUrl } = require('../../config/vars');
const endpoints = require('../../rdn/endpoints');
const { find, uniq } = require('lodash');

const checkBranchesWithDuplicateZipcodes = async (company) => {
  serverLogger.info('checkBranchesWithDuplicateZipcodes cron job');
  const companyService = require('../company.service');
  try {
    const { SubBranch, Branch } = await companyService().getCompanyDatabase(company.dbName);
    const [subBranches, branches] = await Promise.all([
      SubBranch.findAll({
        nest: true,
        raw: true,
      }),
      Branch.findAll({
        nest: true,
        raw: true,
      }),
    ]);
    let duplicateZipCodeString = '';
    if (subBranches.length && branches.length) {
      let zipCodesWithBranchId = [];
      subBranches.map((subBranch) => {
        subBranch.parsedZipCodes = [];
        if (subBranch.zipCodes) {
          subBranch.parsedZipCodes = JSON.parse(subBranch.zipCodes);
          JSON.parse(subBranch.zipCodes).map((zipCode) => {
            const matchedBranch = find(branches, (branch) => branch.id == subBranch.branchId);
            if (matchedBranch) {
              const duplicateZipcodeIndex = zipCodesWithBranchId.findIndex(
                (zipCodeWithBranchId) => zipCodeWithBranchId.zipCode == zipCode,
              );
              if (duplicateZipcodeIndex === -1) {
                zipCodesWithBranchId.push({
                  zipCode,
                  branchNames: [matchedBranch.name],
                  subBranchNames: [subBranch.name],
                });
              } else {
                zipCodesWithBranchId[duplicateZipcodeIndex] = {
                  ...zipCodesWithBranchId[duplicateZipcodeIndex],
                  branchNames: [...zipCodesWithBranchId[duplicateZipcodeIndex].branchNames, matchedBranch.name],
                  subBranchNames: [...zipCodesWithBranchId[duplicateZipcodeIndex].subBranchNames, subBranch.name],
                };
              }
            }
          });
        }
      });
      if (zipCodesWithBranchId.length > 0) {
        zipCodesWithBranchId.map((zipCodeWithBranchId) => {
          if (uniq(zipCodeWithBranchId.branchNames).length > 1) {
            duplicateZipCodeString += `<p>${zipCodeWithBranchId.zipCode}:</p>
            <ul>
              ${zipCodeWithBranchId.subBranchNames.map((s) => `<li>${s}</li>`)}
            </ul>
            `;
          }
        });
      }
      await Promise.all(
        subBranches.map(async (subBranch) => {
          let rdnZipCodes = await endpoints.getZipCodesByBranch(subBranch.rdnBranchId, company);
          if (rdnZipCodes) {
            rdnZipCodes = rdnZipCodes.map((zipCode) => zipCode['_text']);
            await SubBranch.update(
              {
                zipCodes: rdnZipCodes.length ? JSON.stringify(rdnZipCodes) : null,
              },
              {
                where: {
                  id: subBranch.id,
                },
              },
            );
          }
        }),
      );
      if (duplicateZipCodeString.length) {
        serverLogger.info(duplicateZipCodeString);
        await sqsService().sendMessageToQueue(awsSqsWorkerQueueUrl, {
          task: WORKER_TASKS.duplicateZipCodes,
          dbName: company.dbName,
          duplicateZipCodeString: `${duplicateZipCodeString} for DB ${company.dbName}`,
          timestamp: moment().format(),
        });
      } else {
        serverLogger.info(`Not found any Duplicate Zipcode in DB ${company.dbName}`);
      }
    }
  } catch (e) {
    serverLogger.log({
      operationName: 'checkBranchesWithDuplicateZipcodes',
      message: `===> Error duplicate zip ${e}`,
      error: e,
      level: 'error',
    });
  }
};

module.exports = {
  checkBranchesWithDuplicateZipcodes,
};
