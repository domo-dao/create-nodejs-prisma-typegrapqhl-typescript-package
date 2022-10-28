const systemService = require('../../server/services/system.service');

const start = async () => {
  const data = await systemService().getImportProgress('rra_db');
  console.log(data);
};

start().catch(console.error);
