const mysql = require("mysql2/promise");
const { dbHost } = require("../../server/config/vars");
const { PlatformCompany } = require("../../server/database/models");
const { COMPANY_USER_STATUS } = require("../../server/constants/app.constants");
const { sleep } = require("../sleep");

require("dotenv").config();
global.__baseDir = __dirname;

async function processCompanyDuplicates(company) {
  console.log(company.name, "Processing company: ");
  let promises = [];
  const config = {
    host: dbHost,
    user: company.dbUsername,
    password: company.dbUserPassword,
    database: company.dbName,
    waitForConnections: true,
    connectionLimit: 100
  };
  const pool = await mysql.createPool(config);
  const duplicateQuery = `SELECT count(update_id) as duplicateCounts, update_id as updateId FROM ${company.dbName}.user_activities GROUP by update_id HAVING COUNT(update_id) > 1`;
  console.log(company.name, "Running query: ", duplicateQuery);
  const [results] = await pool.query(duplicateQuery);
  console.log(company.name, "Found: ", results.length, "duplicates");
  for (let j = 0; j < results.length; j++) {
    const result = results[j];
    const deleteQuery = `DELETE FROM ${
      company.dbName
    }.user_activities WHERE update_id = ${result.updateId} LIMIT ${
      result.duplicateCounts - 1
    }`;
    promises.push(pool.query(deleteQuery));
    if (j % 50 === 0) {
      console.log(company.name, "Processing:", j, " of ", results.length);
      await Promise.all(promises);
      promises = [];
    }
  }
  console.log(
    company.name,
    "Processing:",
    results.length,
    " of ",
    results.length
  );
  await Promise.all(promises);
}

const main = async () => {
  for (let k = 0; k < 60; k++) {
    const companies = await PlatformCompany.findAll({
      where: {
        status: COMPANY_USER_STATUS.approved
      },
      raw: true
    });
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      try {
        await processCompanyDuplicates(company);
      } catch (error) {
        console.log("Error processing company: ", company.name, error);
      }
    }
    sleep(60 * 20);
  }
};

main()
  .catch(console.error)
  .finally(() => {
    console.log("Test Finished");
    process.exit();
  });
