"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("cases", {
      case_id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      status: {
        type: Sequelize.STRING
      },
      order_date: {
        type: Sequelize.DATE
      },
      order_type: {
        type: Sequelize.STRING
      },
      spotted_date: {
        type: Sequelize.DATE
      },
      spotted_address: {
        type: Sequelize.DATE
      },
      spotter_id: {
        type: Sequelize.INTEGER
      },
      repo_date: {
        type: Sequelize.DATE
      },
      repo_agent_rdn_id: {
        type: Sequelize.STRING
      },
      repo_agent_first_name: {
        type: Sequelize.STRING
      },
      repo_agent_last_name: {
        type: Sequelize.STRING
      },
      close_date: {
        type: Sequelize.DATE
      },
      hold_date: {
        type: Sequelize.DATE
      },
      vendor_id: {
        type: Sequelize.STRING
      },
      vendor_name: {
        type: Sequelize.STRING
      },
      vendor_address: {
        type: Sequelize.STRING
      },
      vendor_city: {
        type: Sequelize.STRING
      },
      vendor_state: {
        type: Sequelize.STRING
      },
      vendor_zip_code: {
        type: Sequelize.STRING
      },
      vendor_phone: {
        type: Sequelize.STRING
      },
      vendor_fax: {
        type: Sequelize.STRING
      },
      vendor_branch_name: {
        type: Sequelize.STRING
      },
      lender_client_id: {
        type: Sequelize.STRING
      },
      lender_client_name: {
        type: Sequelize.STRING
      },
      lender_phone: {
        type: Sequelize.STRING
      },
      lender_type: {
        type: Sequelize.STRING
      },
      lienholder_client_id: {
        type: Sequelize.STRING
      },
      lienholder_client_name: {
        type: Sequelize.STRING
      },
      vin: {
        type: Sequelize.STRING
      },
      year_make_model: {
        type: Sequelize.STRING
      },
      vehicle_color: {
        type: Sequelize.STRING
      },
      vehicle_license_number: {
        type: Sequelize.STRING
      },
      vehicle_license_state: {
        type: Sequelize.STRING
      },
      investigator: {
        type: Sequelize.STRING
      },
      assignee_id: {
        type: Sequelize.STRING
      },
      assignee_name: {
        type: Sequelize.STRING
      },
      order_worker_id: {
        type: Sequelize.STRING
      },
      case_ref_num: {
        type: Sequelize.STRING
      },
      account_num: {
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

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.
    */
    return queryInterface.dropTable("cases");
  }
};
