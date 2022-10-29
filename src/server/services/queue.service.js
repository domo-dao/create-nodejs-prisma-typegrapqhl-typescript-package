const trackLocationJob = require("./queues/track-location.queue");
const syncPreviousLocationJob = require("./queues/sync-previous-location.queue");
const saveAllInfractionJob = require("./queues/save-all-infractions.queue");

const queueService = () => {
  return {
    trackLocationJob,
    syncPreviousLocationJob,
    saveAllInfractionJob
  };
};

module.exports = queueService;
