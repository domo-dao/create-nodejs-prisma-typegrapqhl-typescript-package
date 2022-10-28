const minify = require("html-minifier").minify;

const { getColor, getIcon } = require("./utils");

module.exports = function (templateOptions) {
  const {
    newAssignments,
    totalRepossessions,
    confirmedNotRepossessed,
    spotted,
    spottedNotSecured,
    scans,
    accountNotChecked,
    checkIns,
    recoverRates,
    liveHits,
    liveHitsNotSecured,
    totalRepossessionsMap,
    spottedMap,
    spottedNotSecuredMap
  } = templateOptions;
  console.log(templateOptions);

  const newAssignmentsColor = getColor(
    newAssignments.value,
    newAssignments.previousValue
  );
  const totalRepossessionsColor = getColor(
    totalRepossessions.value,
    totalRepossessions.previousValue
  );
  const confirmedNotRepossessedColor = getColor(
    confirmedNotRepossessed.value,
    confirmedNotRepossessed.previousValue
  );
  const spottedColor = getColor(spotted.value, spotted.previousValue);
  const spottedNotSecuredColor = getColor(
    spottedNotSecured.value,
    spottedNotSecured.previousValue
  );
  const scansColor = getColor(scans.value, scans.previousValue);
  const accountNotCheckedColor = getColor(
    accountNotChecked.value,
    accountNotChecked.previousValue
  );
  const checkInsColor = getColor(checkIns.value, checkIns.previousValue);
  const liveHitsColor = getColor(liveHits.value, liveHits.previousValue);
  const liveHitsNotSecuredColor = getColor(
    liveHitsNotSecured.value,
    liveHitsNotSecured.previousValue
  );

  const newAssignmentsIcon = getIcon(
    newAssignments.value,
    newAssignments.previousValue
  );
  const totalRepossessionsIcon = getIcon(
    totalRepossessions.value,
    totalRepossessions.previousValue
  );
  const confirmedNotRepossessedIcon = getIcon(
    confirmedNotRepossessed.value,
    confirmedNotRepossessed.previousValue
  );
  const spottedIcon = getIcon(spotted.value, spotted.previousValue);
  const spottedNotSecuredIcon = getIcon(
    spottedNotSecured.value,
    spottedNotSecured.previousValue
  );
  const scansIcon = getIcon(scans.value, scans.previousValue);
  const accountNotCheckedIcon = getIcon(
    accountNotChecked.value,
    accountNotChecked.previousValue
  );
  const checkInsIcon = getIcon(checkIns.value, checkIns.previousValue);
  const liveHitsIcon = getIcon(liveHits.value, liveHits.previousValue);
  const liveHitsNotSecuredIcon = getIcon(
    liveHitsNotSecured.value,
    liveHitsNotSecured.previousValue
  );

  const html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
    <html data-editor-version="2" class="sg-campaigns" xmln="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1" />
        <!--[if !mso]><!-->
        <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
        <!--<![endif]-->
        <!--[if (gte mso 9)|(IE)]>
          <xml>
            <o:OfficeDocumentSettings>
              <o:AllowPNG />
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        <![endif]-->
        <!--[if (gte mso 9)|(IE)]>
          <style type="text/css">
            body {
              width: 680px;
              margin: 0 auto;
            }
            table {
              border-collapse: collapse;
            }
            table,
            td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
            }
          </style>
        <![endif]-->
        <style type="text/css">
          body,
          p,
          div {
            font-family: helvetica, sans-serif;
            font-size: 14px;
          }
          body {
            color: #000000;
          }
          body a {
            color: #1188e6;
            text-decoration: none;
          }
          p {
            margin: 0;
            padding: 0;
          }
          table.wrapper {
            width: 100% !important;
            table-layout: fixed;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            -moz-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          img.max-width {
            max-width: 100% !important;
          }
          .column.of-2 {
            width: 50%;
          }
          .column.of-3 {
            width: 33.333%;
          }
          .column.of-4 {
            width: 25%;
          }
          ul ul ul ul {
            list-style-type: disc !important;
          }
          ol ol {
            list-style-type: lower-roman !important;
          }
          ol ol ol {
            list-style-type: lower-latin !important;
          }
          ol ol ol ol {
            list-style-type: decimal !important;
          }
          @media screen and (max-width: 480px) {
            .preheader .rightColumnContent,
            .footer .rightColumnContent {
              text-align: left !important;
            }
            .preheader .rightColumnContent div,
            .preheader .rightColumnContent span,
            .footer .rightColumnContent div,
            .footer .rightColumnContent span {
              text-align: left !important;
            }
            .preheader .rightColumnContent,
            .preheader .leftColumnContent {
              font-size: 80% !important;
              padding: 5px 0;
            }
            table.wrapper-mobile {
              width: 100% !important;
              table-layout: fixed;
            }
            img.max-width {
              height: auto !important;
              max-width: 100% !important;
            }
            a.bulletproof-button {
              display: block !important;
              width: auto !important;
              font-size: 80%;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .columns {
              width: 100% !important;
            }
            .column {
              display: block !important;
              width: 100% !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .social-icon-column {
              display: inline-block !important;
            }
          }
        </style>
        <!--user entered Head Start-->
        <style>
          * {
            font-family: sans-serif !important;
          }
        </style>
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet" type="text/css" />
        <style>
          * {
            font-family: Arial, sans-serif;
          }
        </style>
        <!--End Head user entered-->
      </head>
      <body>
        <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:helvetica,sans-serif; color:#000000; background-color:ghostwhite;">
          <div class="webkit">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="ghostwhite">
              <tr>
                <td valign="top" bgcolor="ghostwhite" width="100%">
                  <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="100%">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <!--[if mso]>
        <center>
        <table><tr><td width="680">
      <![endif]-->
                              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 680px" align="center">
                                <tr>
                                  <td role="modules-container" style="padding: 0px 0px 0px 0px; color: #000000; text-align: left" bgcolor="ghostwhite" width="100%" align="left">
                                    <table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0">
                                      <tr>
                                        <td role="module-content">
                                          <p>Insightt Daily Report</p>
                                        </td>
                                      </tr>
                                    </table>
                                    <table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="1b34d9f5-7a6d-45ef-b770-79d4f8b74931">
                                      <tbody>
                                        <tr>
                                          <td style="font-size: 6px; line-height: 10px; padding: 0px 0px 0px 0px" valign="top" align="center">
                                            <img class="max-width" border="0" style="display: block; color: #000000; text-decoration: none; font-family: helvetica, sans-serif; font-size: 16px" width="270" alt="" data-proportionally-constrained="true" data-responsive="false" src="http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/dd13f062-d746-40a2-815c-951c026b9611/1500x900.png" height="162" />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="a04cd346-1aa5-4f6a-8bdc-a7606c9e20bb" data-mc-module-version="2019-10-22">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 75px 0px 75px 0px; line-height: 22px; text-align: inherit; background-color: #006aff; border-radius: 12px" height="100%" valign="top" bgcolor="#006aff" role="module-content">
                                            <div>
                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                <span style="color: #ffffff; font-size: 36px; font-family: helvetica, sans-serif"><strong>Daily Report</strong></span>
                                              </div>
                                              <div></div>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 40px 0px 0px 0px" bgcolor="ghostwhite" data-distribution="1,1">
                                      <tbody>
                                        <tr role="module-content">
                                          <td height="100%" valign="top">
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 0px" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px; background-color: white" bgcolor="white">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>New Assignments</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  newAssignments.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  newAssignments.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${newAssignmentsColor}; font-size: 14px"><strong><img src="${newAssignmentsIcon}" style="height: 10px;" height="10">${
    newAssignments.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.1">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 0px 0px 20px" cellpadding="0" cellspacing="0" align="right" border="0" bgcolor="" class="column column-1">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px; float: right" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Accounts Not Checked</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  accountNotChecked.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  accountNotChecked.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${accountNotCheckedColor}; font-size: 14px"><strong><img src="${accountNotCheckedIcon}" style="height: 10px;" height="10">${
    accountNotChecked.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 0px 0px 40px 0px" role="module-content" bgcolor=""></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="9105d09c-1f47-40d9-b176-38d20ddb7a73" data-mc-module-version="2019-10-22">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 40px 0px 0px 0px; line-height: 22px; text-align: inherit; border-top-left-radius: 12px; border-top-right-radius: 12px; background-color: #ffffff; padding-top: 24px; padding-bottom: 12px" height="100%" valign="top" role="module-content">
                                            <div>
                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                <span style="color: #838299"><strong>Recovery Rate By Branch</strong></span>
                                              </div>
                                              <div></div>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 0px 0px 24px 0px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px" bgcolor="#ffffff" data-distribution="1,1,1">
                                      <tbody>
                                        <tr role="module-content" align="center">
                                          <td height="100%" valign="top">
                                            <table width="200" style="width: 200px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 0px" cellpadding="0" cellspacing="0" align="center" border="0" class="column column-0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 0px; margin: 0px; border-spacing: 0">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${Math.round(
                                                                  recoverRates[0]
                                                                    .value
                                                                )}%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c1b1ae1f-0022-44cb-a40a-8496576ee67d.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 12px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #006aff"><strong>${
                                                                  recoverRates[0]
                                                                    .branchName
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                          <td height="100%" valign="top">
                                            <table width="200" style="width: 200px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 20px" cellpadding="0" cellspacing="0" align="center" border="0" bgcolor="" class="column column-1">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 0px; margin: 0px; border-spacing: 0">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.2.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${Math.round(
                                                                  recoverRates?.[1]
                                                                    ?.value ?? 0
                                                                )}%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c1b1ae1f-0022-44cb-a40a-8496576ee67d.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 12px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #006aff"><strong>${
                                                                  recoverRates?.[1]
                                                                    ?.branchName ??
                                                                  "N/A"
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                          <td height="100%" valign="top">
                                            <table width="200" style="width: 200px; border-spacing: 0; border-collapse: collapse; margin: 0px 0px 0px 20px" cellpadding="0" cellspacing="0" align="center" border="0" bgcolor="" class="column column-2">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 0px; margin: 0px; border-spacing: 0">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${Math.round(
                                                                  recoverRates?.[2]
                                                                    ?.value ?? 0
                                                                )}%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c1b1ae1f-0022-44cb-a40a-8496576ee67d" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 12px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #006aff"><strong>${
                                                                  recoverRates?.[2]
                                                                    ?.branchName ??
                                                                  "N/A"
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 40px 0px 0px 0px" bgcolor="ghostwhite" data-distribution="1,1">
                                      <tbody>
                                        <tr role="module-content">
                                          <td height="100%" valign="top">
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 0px" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Total Repossessions</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  totalRepossessions.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.2.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  totalRepossessions.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${totalRepossessionsColor}; font-size: 14px"><strong><img src="${totalRepossessionsIcon}" style="height: 10px;" height="10">${
    totalRepossessions.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.1.1">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 0px 0px 20px" cellpadding="0" cellspacing="0" align="right" border="0" bgcolor="" class="column column-1">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Confirmed Not Repossessed</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  confirmedNotRepossessed.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  confirmedNotRepossessed.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${confirmedNotRepossessedColor}; font-size: 14px"><strong><img src="${confirmedNotRepossessedIcon}" style="height: 10px;" height="10">${
    confirmedNotRepossessed.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.2">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 40px 0px 0px 0px" bgcolor="ghostwhite" data-distribution="1,1">
                                      <tbody>
                                        <tr role="module-content">
                                          <td height="100%" valign="top">
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 0px" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Live Hits</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.1.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  liveHits.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.2.1.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  liveHits.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.1.1.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${liveHitsColor}; font-size: 14px"><strong><img src="${liveHitsIcon}" style="height: 10px;" height="10">${
    liveHits.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.1.1.3">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 0px 0px 20px" cellpadding="0" cellspacing="0" align="right" border="0" bgcolor="" class="column column-1">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Scans</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.2.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  scans.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.3.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  scans.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.2.3" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${scansColor}; font-size: 14px"><strong><img src="${scansIcon}" style="height: 10px;" height="10">${
    scans.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.2.3">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 40px 0px 0px 0px" bgcolor="ghostwhite" data-distribution="1,1">
                                      <tbody>
                                        <tr role="module-content">
                                          <td height="100%" valign="top">
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 0px" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Spotted</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.1.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  spotted.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.2.1.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  spotted.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.1.1.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${spottedColor}; font-size: 14px"><strong><img src="${spottedIcon}" style="height: 10px;" height="10">${
    spotted.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.1.1.2">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 0px 0px 20px" cellpadding="0" cellspacing="0" align="right" border="0" bgcolor="" class="column column-1">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Spotted Not Secured</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.2.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  spottedNotSecured.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.3.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  spottedNotSecured.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.2.2" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${spottedNotSecuredColor}; font-size: 14px"><strong><img src="${spottedNotSecuredIcon}" style="height: 10px;" height="10">${
    spottedNotSecured.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.2.2">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 40px 0px 0px 0px" bgcolor="ghostwhite" data-distribution="1,1">
                                      <tbody>
                                        <tr role="module-content">
                                          <td height="100%" valign="top">
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 20px 0px 0px" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Live Hits Not Secured</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.1.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  liveHitsNotSecured.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  liveHitsNotSecured.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.1.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${liveHitsNotSecuredColor}; font-size: 14px"><strong><img src="${liveHitsNotSecuredIcon}" style="height: 10px;" height="10">${
    liveHitsNotSecured.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.1.1.1">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table width="320" style="width: 320px; border-spacing: 0; border-collapse: collapse; margin: 0px 0px 0px 20px" cellpadding="0" cellspacing="0" align="right" border="0" bgcolor="" class="column column-1">
                                              <tbody>
                                                <tr>
                                                  <td style="padding: 24px; margin: 0px; border-spacing: 0; border-radius: 12px" bgcolor="#ffffff">
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.2.1.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 14px; color: #838299"><strong>Check Ins</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="3cf1be6a-d2e1-4a01-9c53-4d677ff68a9d.2.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 20px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="font-size: 60px"><strong>${
                                                                  checkIns.value
                                                                }</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.3.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 0px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: #838299; font-size: 11px"><strong>${
                                                                  checkIns.previousValue
                                                                } </strong></span><span style="color: #838299; font-size: 11px">yesterday</span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="c882cbfa-c5cb-445a-a548-b21d9e001e31.1.1.2.1" data-mc-module-version="2019-10-22">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 5px 0px 5px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                                            <div>
                                                              <div style="font-family: helvetica, sans-serif; text-align: center">
                                                                <span style="color: ${checkInsColor}; font-size: 14px"><strong><img src="${checkInsIcon}" style="height: 10px;" height="10">${
    checkIns.percentage
  }%</strong></span>
                                                              </div>
                                                              <div></div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                                      <tbody>
                                                        <tr>
                                                          <td style="padding: 0px 0px 10px 0px" role="module-content" bgcolor=""></td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout: fixed" width="100%" data-muid="a3abb488-fca7-4297-9399-ee30c3084954.2.1">
                                                      <tbody>
                                                        <tr>
                                                          <td align="center" bgcolor="" class="outer-td" style="padding: 0px 0px 0px 0px">
                                                            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align: center">
                                                              <tbody>
                                                                <tr>
                                                                  <td align="center" bgcolor="#ffffff" class="inner-td" style="border-radius: 6px; font-size: 16px; text-align: center; background-color: inherit">
                                                                    <a href="https://app.insightt.io" style="background-color: #ffffff; color: #006aff; display: inline-block; font-size: 14px; font-weight: bold; letter-spacing: 0px; line-height: normal; padding: 0px 18px 0px 18px; text-align: center; text-decoration: none" target="_blank">View More <span style="font-family: monospace !important; font-size: 16px">›</span></a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="30197d6f-2784-4102-b8ac-eecea46b5a32" data-mc-module-version="2019-10-22">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 40px 0px 10px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                            <div>
                                              <div style="font-family: helvetica, sans-serif; text-align: inherit">
                                                <span style="font-size: 24px"><strong>Total Repossessions</strong></span>
                                              </div>
                                              <div></div>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="8ca449f7-e90e-4f4a-b8a2-974fc7178b1b">
                                      <tbody>
                                        <tr>
                                          <td style="font-size: 6px; line-height: 10px; padding: 0px 0px 0px 0px" valign="top" align="center">
                                            <img class="max-width" border="0" style="border-radius: 12px; display: block; color: #000000; text-decoration: none; font-family: helvetica, sans-serif; font-size: 16px; max-width: 100% !important; width: 100%; height: auto !important" width="680" alt="" data-proportionally-constrained="true" data-responsive="true" src="${totalRepossessionsMap}" />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="30197d6f-2784-4102-b8ac-eecea46b5a32.1" data-mc-module-version="2019-10-22">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 40px 0px 10px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                            <div>
                                              <div style="font-family: helvetica, sans-serif; text-align: inherit">
                                                <span style="font-size: 24px"><strong>Spotted</strong></span>
                                              </div>
                                              <div></div>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="8ca449f7-e90e-4f4a-b8a2-974fc7178b1b.1">
                                      <tbody>
                                        <tr>
                                          <td style="font-size: 6px; line-height: 10px; padding: 0px 0px 0px 0px" valign="top" align="center">
                                            <img class="max-width" border="0" style="border-radius: 12px; display: block; color: #000000; text-decoration: none; font-family: helvetica, sans-serif; font-size: 16px; max-width: 100% !important; width: 100%; height: auto !important" width="680" alt="" data-proportionally-constrained="true" data-responsive="true" src="${spottedMap}" />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="30197d6f-2784-4102-b8ac-eecea46b5a32.1.1" data-mc-module-version="2019-10-22">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 40px 0px 10px 0px; line-height: 22px; text-align: inherit" height="100%" valign="top" bgcolor="" role="module-content">
                                            <div>
                                              <div style="font-family: helvetica, sans-serif; text-align: inherit">
                                                <span style="font-size: 24px"><strong>Spotted Not Secured</strong></span>
                                              </div>
                                              <div></div>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="8ca449f7-e90e-4f4a-b8a2-974fc7178b1b.1.1">
                                      <tbody>
                                        <tr>
                                          <td style="font-size: 6px; line-height: 10px; padding: 0px 0px 0px 0px" valign="top" align="center">
                                            <img class="max-width" border="0" style="border-radius: 12px; display: block; color: #000000; text-decoration: none; font-family: helvetica, sans-serif; font-size: 16px; max-width: 100% !important; width: 100%; height: auto !important" width="680" alt="" data-proportionally-constrained="true" data-responsive="true" src="${spottedNotSecuredMap}" />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed" data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6">
                                      <tbody>
                                        <tr>
                                          <td style="padding: 0px 0px 40px 0px" role="module-content" bgcolor=""></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              <!--[if mso]>
                                      </td>
                                    </tr>
                                  </table>
                                </center>
                                <![endif]-->
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        </center>
      </body>
    </html>
  `;

  const compressed = minify(html, {
    minifyCSS: true,
    collapseWhitespace: true,
    removeTagWhitespace: true
  });

  return compressed;
};
