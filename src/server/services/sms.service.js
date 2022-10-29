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

const smsService = () => {
  const sendMsg = message => {
    return new Promise((resolve, reject) => {
      const params = {
        Message: message.message,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: message.type || "Transactional"
          },
          "AWS.SNS.SMS.SenderID": {
            DataType: "String",
            StringValue: message.sender || "Insightt"
          }
        },
        MessageStructure: "string",
        PhoneNumber: message.phoneNumber
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
    sendMsg
  };
};

module.exports = smsService;
