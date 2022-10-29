const AWS = require("aws-sdk");

const {
  awsAccessKeyId,
  awsSecretAccessKey,
  awsRegion
} = require("../config/vars");

AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
  region: awsRegion || "us-east-1"
});

const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const snsService = () => {
  const sendMessageToQueue = (queue, data) => {
    return new Promise((resolve, reject) => {
      var params = {
        MessageBody: JSON.stringify(data),
        QueueUrl: queue
      };

      sqs.sendMessage(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };

  return {
    sendMessageToQueue
  };
};

module.exports = snsService;
