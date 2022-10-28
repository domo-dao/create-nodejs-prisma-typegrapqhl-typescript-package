const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

const freeBodyTemplate = require('./mail-templates/free-body.template');
const inviteUserTemplate = require('./mail-templates/invite-user.template');
const reactivateUserTemplate = require('./mail-templates/reactivate-user.template');
const resetPasswordTemplate = require('./mail-templates/reset-password.template');
const dailyReportTemplate = require('./mail-templates/daily-report.template');
const companyRegistrationCompletionTemplate = require('./mail-templates/company-registration-completion.template');
const registerNewCompanyTemplate = require('./mail-templates/register-company.template');
const companyRequestAcknowledgeTemplate = require('./mail-templates/company-request-acknowledge.template');
const bibleRequestTemplate = require('./mail-templates/bible-request.template');
const bibleConfirmationTemplate = require('./mail-templates/bible-confirmation.template');
const duplicateZipcodeTemplate = require('./mail-templates/duplicate-zipcodes.template');
const companyRegistrationRequestTemplate = require('./mail-templates/company-registration-request.template');
const missedRepossessionsAlertTemplate = require('./mail-templates/missed-repossessions-alert.template');
const missedRdndataTemplate = require('./mail-templates/rdn-data-missing.template');
const { awsAccessKeyId, awsSecretAccessKey, awsRegion } = require('../config/vars');
const { EMAIL_TEMPLATE_NAMES } = require('../constants/app.constants');
const newCompanyApprovedTemplate = require('./mail-templates/new-company-approved.template');

AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
  region: awsRegion || 'us-east-1',
});

const transporter = nodemailer.createTransport({
  SES: new AWS.SES({
    apiVersion: '2010-12-01',
  }),
});

const sendMail = () => {
  const config = ({ to, subject, template, templateOptions, planText, emailReplyAddress }) => {
    let html = '';
    switch (template) {
      case 'invite-user':
        html = inviteUserTemplate(templateOptions);
        break;
      case 'reactivate-user':
        html = reactivateUserTemplate(templateOptions);
        break;
      case 'reset-password':
        html = resetPasswordTemplate(templateOptions);
        break;
      case 'daily-report':
        html = dailyReportTemplate(templateOptions);
        break;
      case 'company-registration-completion':
        html = companyRegistrationCompletionTemplate(templateOptions);
        break;
      case 'register-company':
        html = registerNewCompanyTemplate(templateOptions);
        break;
      case 'new-company-approved':
        html = newCompanyApprovedTemplate(templateOptions);
        break;
      case 'rdn-data-missing':
        html = missedRdndataTemplate(templateOptions);
        break;
      case EMAIL_TEMPLATE_NAMES.unknownCompanyRegistrationRequest:
        html = companyRegistrationRequestTemplate(templateOptions);
        break;
      case EMAIL_TEMPLATE_NAMES.unknownCompanyRegistrationAcknowledge:
        html = companyRequestAcknowledgeTemplate(templateOptions);
        break;
      case EMAIL_TEMPLATE_NAMES.bibleRequest:
        html = bibleRequestTemplate(templateOptions);
        break;
      case EMAIL_TEMPLATE_NAMES.bibleConfirmationMail:
        html = bibleConfirmationTemplate(templateOptions);
        break;
      case EMAIL_TEMPLATE_NAMES.duplicateZipCodes:
        html = duplicateZipcodeTemplate(templateOptions);
        break;
      case EMAIL_TEMPLATE_NAMES.missedRepossessionAlert:
        html = missedRepossessionsAlertTemplate(templateOptions);
        break;
      case 'emailFreeTemplate':
        html = freeBodyTemplate(templateOptions);
        break;
      default:
        html = planText || '';
    }

    return {
      to,
      from: emailReplyAddress || process.env.EMAIL_REPLY_ADDRESS,
      subject,
      html,
    };
  };

  const send = (mailOptions) => {
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, async (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };

  return {
    config,
    send,
  };
};

module.exports = sendMail;
