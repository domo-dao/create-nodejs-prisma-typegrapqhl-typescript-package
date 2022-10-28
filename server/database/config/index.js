require("dotenv").config();

const local = {
  username: process.env.PLATFORM_DB_USERNAME,
  password: process.env.PLATFORM_DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME,
  host: process.env.PLATFORM_DB_HOST,
  port: process.env.PLATFORM_DB_PORT,
  dialect: "mysql",
  logging: false
};

const test = {
  username: process.env.PLATFORM_DB_USERNAME,
  password: process.env.PLATFORM_DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME,
  host: process.env.PLATFORM_DB_HOST,
  port: process.env.PLATFORM_DB_PORT,
  dialect: "mysql"
};

const dev = {
  username: process.env.PLATFORM_DB_USERNAME,
  password: process.env.PLATFORM_DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME,
  host: process.env.PLATFORM_DB_HOST,
  port: process.env.PLATFORM_DB_PORT,
  dialect: "mysql",
  logging: false
};

const staging = {
  username: process.env.PLATFORM_DB_USERNAME,
  password: process.env.PLATFORM_DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME,
  host: process.env.PLATFORM_DB_HOST,
  port: process.env.PLATFORM_DB_PORT,
  dialect: "mysql"
};

const master = {
  username: process.env.PLATFORM_DB_USERNAME,
  password: process.env.PLATFORM_DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME,
  host: process.env.PLATFORM_DB_HOST,
  port: process.env.PLATFORM_DB_PORT,
  dialect: "mysql"
};

const platform_db = {
  username: process.env.PLATFORM_DB_USERNAME,
  password: process.env.PLATFORM_DB_PASSWORD,
  database: process.env.PLATFORM_DB_NAME,
  host: process.env.PLATFORM_DB_HOST,
  port: process.env.PLATFORM_DB_PORT,
  dialect: "mysql"
};

module.exports = {
  local,
  test,
  dev,
  staging,
  master,
  platform_db
};
