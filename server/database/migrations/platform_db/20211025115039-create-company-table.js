"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("platform_companies", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email_reply_address: {
        type: Sequelize.STRING
      },
      company_domain: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      db_name: {
        type: Sequelize.STRING
      },
      db_username: {
        type: Sequelize.STRING
      },
      db_user_password: {
        type: Sequelize.STRING
      },
      unique_name: {
        type: Sequelize.STRING,
        unique: true
      },
      aws_checklist_bucket_name: {
        type: Sequelize.STRING
      },
      aws_profile_pics_bucket_name: {
        type: Sequelize.STRING
      },
      aws_employement_files_bucket_name: {
        type: Sequelize.STRING
      },
      role_id: {
        type: Sequelize.INTEGER
      },
      rdn_id: {
        type: Sequelize.STRING
      },
      rdn_key: {
        type: Sequelize.STRING
      },
      drn_key: {
        type: Sequelize.STRING
      },
      sync_rdn_from: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.dropTable("platform_companies");
  }
};
