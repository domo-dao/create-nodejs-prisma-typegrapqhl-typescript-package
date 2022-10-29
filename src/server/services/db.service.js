const database = require("../config/database");
const { serverLogger } = require("../config/logger");

const dbService = environment => {
  const authenticateDB = () => database.authenticate();

  const syncDB = () => database.sync();

  const successfulDBStart = () =>
    serverLogger.info(
      "connection to the database has been established successfully"
    );

  const errorDBStart = error =>
    serverLogger.log({
      operationName: "errorDBStart",
      message: error.message || "unable to connect to the database",
      stack: error.stack,
      level: "error"
    });

  const wrongEnvironment = () => {
    serverLogger.log({
      operationName: "wrongEnvironment",
      message: "wrong environment",
      error: `only local, test, dev, staging, and master are valid NODE_ENV variables but ${environment} is specified`,
      level: "error"
    });
    return process.exit(1);
  };

  const startDBService = async () => {
    try {
      await syncDB();
      successfulDBStart();
      console.log("DB CONNECTED");
    } catch (err) {
      errorDBStart(err);
    }
  };

  const startLocal = async () => {
    try {
      await authenticateDB();
      // Force dropDB
      return startDBService();
    } catch (err) {
      return errorDBStart(err);
    }
  };

  const startTest = async () => {
    try {
      await authenticateDB();
      // Force dropDB
      return startDBService();
    } catch (err) {
      return errorDBStart(err);
    }
  };

  const startDev = async () => {
    try {
      await authenticateDB();
      // Determine migrate
      return startDBService();
    } catch (err) {
      return errorDBStart(err);
    }
  };

  const startStage = async () => {
    try {
      await authenticateDB();
      // Determine migrate
      return startDBService();
    } catch (err) {
      return errorDBStart(err);
    }
  };

  const startProd = async () => {
    try {
      await authenticateDB();
      // Don't dropDB
      return startDBService();
    } catch (err) {
      return errorDBStart(err);
    }
  };

  const start = async () => {
    switch (environment) {
      case "local":
        await startLocal();
        break;
      case "test":
        await startTest();
        break;
      case "dev":
        await startDev();
        break;
      case "staging":
        await startStage();
        break;
      case "master":
        await startProd();
        break;
      default:
        await wrongEnvironment();
    }
  };

  return {
    start
  };
};

module.exports = dbService;
