const moment = require('moment');
const alertService = require('../alert.service');
const { cronTaskLogger } = require('../../config/logger');
const {
  TASK_STATUSES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
  ALERT_WHEN_TASK_REMAINING_PERCENTAGE,
} = require('../../constants/app.constants');
const { checkTaskDateWithPercentage, checkTaskDateIsExpired } = require('../../helpers/task.helper');
const Sequelize = require('sequelize');

const getTasks = async (company) => {
  const companyService = require('../company.service');
  const { Task, User } = await companyService().getCompanyDatabase(company.dbName);
  const taskData = await Task.findAll({
    attributes: ['id', 'name', 'details', 'urgency', 'completionDate', 'status', 'completedAt', 'createdAt'],
    where: {
      status: {
        [Sequelize.Op.notIn]: [
          TASK_STATUSES.closed,
          TASK_STATUSES.marked_as_completed,
          TASK_STATUSES.completed,
          TASK_STATUSES.uncompleted,
          TASK_STATUSES.acknowledged_uncompleted,
        ],
      },
    },
    raw: true,
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'email'],
      },
    ],
  });
  return taskData;
};

const doSendTaskReminders = async (company) => {
  cronTaskLogger.info('doSendTaskReminders cron job');
  try {
    const taskArray = await getTasks(company);
    const now = moment();
    taskArray.map(async (task) => {
      // TODO: We don't needs this, see previous TODO
      if (task) {
        let notifyUser = false;
        let notifyText = '';

        const isTaskOnPercent = checkTaskDateWithPercentage(
          now.toISOString(),
          task.createdAt,
          task.completionDate,
          100 - ALERT_WHEN_TASK_REMAINING_PERCENTAGE,
        );
        const isExpired = checkTaskDateIsExpired(now.toISOString(), task.completionDate);

        if (isTaskOnPercent) {
          notifyUser = true;
          notifyText = `Reminder: You have a task "${task.name}" that has 20% time remaining to be completed!`;
        }

        if (isExpired) {
          notifyUser = true;
          notifyText = `Reminder: You have a task "${task.name}" that is expired due to time!`;
        }

        if (notifyUser) {
          const notification = {
            userId: task.assignee.id,
            type: NOTIFICATION_TYPES.task_alloted_time_reminder,
            color: NOTIFICATION_COLOR.task_alloted_time_reminder,
            text: notifyText,
            notifyForUserId: task.assignee.id,
          };
          const payload = {
            title: 'Task Notification',
            body: {
              type: NOTIFICATION_TYPES.task_alloted_time_reminder,
              message: notifyText,
              details: task,
            },
          };
          await alertService().notifyUser(task.assignee, notification, payload, company);
        }
      }
    });
  } catch (error) {
    cronTaskLogger.log({
      operationName: 'doSendTaskReminders',
      message: 'doSendTaskReminders cron job error',
      error: {
        message: error.message,
        stack: error.stack,
      },
      level: 'error',
    });
  }
};

const doMarkUncompletedTasks = async (company) => {
  const companyService = require('../company.service');
  try {
    cronTaskLogger.info('doMarkUncompletedTasks cron job');
    const { Task } = await companyService().getCompanyDatabase(company.dbName);
    const taskArray = await getTasks(company);
    const now = moment();
    taskArray.map(async (task) => {
      if (task) {
        const completionDate = moment(task.completionDate);
        const diff = completionDate.diff(now, 'seconds');

        if (diff <= 0) {
          await Task.update({ status: TASK_STATUSES.uncompleted }, { where: { id: task.id } });
        }
      }
    });
  } catch (error) {
    cronTaskLogger.log({
      operationName: 'doMarkUncompletedTasks',
      message: 'doMarkUncompletedTasks cron job error',
      error: {
        message: error.message,
        stack: error.stack,
      },
      level: 'error',
    });
  }
};

module.exports = {
  doSendTaskReminders,
  doMarkUncompletedTasks,
};
