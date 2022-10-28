const Endpoints = require('../../server/rdn/endpoints');

require('dotenv').config();
global.__baseDir = __dirname;

const run = async () => {
  const company = {
    rdnKey: '87086cebeff1129f4f3779cf5d8fd407',
  };
  const caseId = '2082485193';
  const rdnCase = await Endpoints.getRDNCaseInfo(company, caseId);
  console.log(rdnCase);
  //
  // const updates = await Endpoints.getRDNCaseUpdates(company, caseId);
  // console.log(updates);
  // console.log('');
  // console.log('');
  // console.log('');
  // console.log('');

  // const hits = await Endpoints.getPurchasedDrnHits(company, caseId);
  // console.log(hits);

  return 1;
};

run()
  .catch(console.error)
  .finally(() => {
    console.log('Test Finished');
    process.exit();
  });
