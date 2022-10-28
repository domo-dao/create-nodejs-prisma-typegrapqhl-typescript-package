'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const Sequelize = require('sequelize');
const sequelize = require('../../config/database');
const { dbHost, dbPort, env } = require('../../config/vars');
const Utils = require('../../utils/util');
const { DATABASE_TYPES } = require('../../constants/app.constants');
const { PrismaClient } = require('@prisma/client');

const db = {};

if (env !== 'test') {
  fs.readdirSync(`${__dirname}/${[DATABASE_TYPES.platform_db]}`)
    .filter((file) => {
      return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
    })
    .forEach((file) => {
      const model = require(path.join(`${__dirname}/${[DATABASE_TYPES.platform_db]}`, file))(
        sequelize,
        Sequelize.DataTypes,
      );
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });
  db.platform_sequelize = sequelize;
  const authenticateDynamicDB = async () => {
    const databases = await db.PlatformCompany.findAll({
      raw: true,
    });
    databases.map(async (database) => {
      try {
        let companySequelize = new Sequelize({
          database: database.dbName,
          username: database.dbUsername,
          // password: '',
          password: database.dbUserPassword,
          host: dbHost,
          port: dbPort,
          dialect: 'mysql',
          pool: {
            max: 5,
            min: 0,
            idle: 10000,
            acquireTimeout: 100000,
          },
          define: {
            charset: 'utf8',
            collate: 'utf8_general_ci',
          },
          logging: false,
        });
        companySequelize.authenticate();
        db[database.dbName] = {};

        fs.readdirSync(`${__dirname}/${[DATABASE_TYPES.company_db]}`)
          .filter((file) => {
            return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
          })
          .forEach((file) => {
            const model = require(path.join(`${__dirname}/${[DATABASE_TYPES.company_db]}`, file))(
              companySequelize,
              Sequelize.DataTypes,
            );
            db[database.dbName][model.name] = model;
          });
        Object.keys(db[database.dbName]).forEach((modelName) => {
          if (db[database.dbName][modelName].associate) {
            db[database.dbName][modelName].associate(db[database.dbName]);
          }
        });
        if (env !== 'test') await Utils.getBranchAndSubBranches(database.dbName);

        const companyPrisma = new PrismaClient({
          datasources: {
            db: {
              url: `mysql://${database.dbUsername}:${database.dbUserPassword}@${dbHost}:${dbPort}/${database.dbName}`,
            },
          },
        });

        db[`${database.dbName}_sequelize`] = companySequelize;
        db[`${database.dbName}_prisma`] = companyPrisma;
      } catch (error) {
        console.log('error=>', error);
      }
    });
  };
  authenticateDynamicDB();
}

module.exports = db;
