const companyService = require('../../server/services/company.service');
const mysql = require('mysql2/promise');
const { PlatformCompany } = require('../../server/database/models');
const { dbHost } = require('../../server/config/vars');

require('dotenv').config();
global.__baseDir = __dirname;

const main = async () => {
  const { Task } = await companyService().getCompanyDatabase('rra_db', true);
  const data = {
    assigner_id: 7,
    assignee_id: 7,
    name: 'test task',
    urgency: 'high',
    completion_date: '2020-01-01',
    status: 'open',
  };
  const sample = 10000;
  let promises = [];
  // Sequalize
  const startTime1 = new Date().getTime();

  for (let i = 0; i < sample; i++) {
    promises.push(
      Task.create({
        assignerId: data.assigner_id,
        assigneeId: data.assignee_id,
        name: data.name,
        urgency: data.urgency,
        completionDate: data.completion_date,
        status: data.status,
      }),
    );
  }
  await Promise.all(promises);
  const endTime1 = new Date().getTime();
  console.log(`Time taken: ${endTime1 - startTime1}ms`);

  const company = await PlatformCompany.findOne({
    where: { dbName: 'rra_db' },
  });

  // SQL Direct with Pool
  promises = [];
  const pool = await mysql.createPool({
    host: dbHost,
    user: company.dbUsername,
    password: company.dbUserPassword,
    database: 'rra_db',
    connectionLimit: 100,
    acquireTimeout: 200000,
  });

  const startTime4 = new Date().getTime();
  for (let i = 0; i < sample; i++) {
    // simple query
    promises.push(
      pool.query(
        `
      INSERT INTO tasks(assigner_id, assignee_id, name, urgency, completion_date, status)
    VALUES (?,?,?,?,?,?)
    `,
        [data.assigner_id, data.assignee_id, data.name, data.urgency, data.completion_date, data.status],
      ),
    );
  }
  await Promise.all(promises);
  const endTime4 = new Date().getTime();
  console.log(`Time taken: ${endTime4 - startTime4}ms`);
};

main()
  .catch(console.error)
  .finally(() => {
    console.log('Test Finished');
    process.exit();
  });
