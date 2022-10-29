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

const sns = new AWS.SNS();

const snsService = () => {
  const publishToTopic = (arn, data) => {
    return new Promise((resolve, reject) => {
      var params = {
        Message: JSON.stringify(data),
        TopicArn: arn
      };

      sns.publish(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };

  return {
    publishToTopic
  };
};

module.exports = snsService;
