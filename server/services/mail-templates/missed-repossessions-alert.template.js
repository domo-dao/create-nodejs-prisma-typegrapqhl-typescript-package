const { html } = require('./utils');
const { rdnSiteVehicleInfo } = require('../../config/vars');

module.exports = function (templateOptions) {
  const { companyAdminName, status, vin, caseId, companyName, isVoluntary } = templateOptions;

  const mail = html`
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
        <center
          class="wrapper"
          data-link-color="#1188E6"
          data-body-style="font-size:14px; font-family:helvetica,sans-serif; color:#000000; background-color:ghostwhite;"
        >
          <div class="webkit">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="ghostwhite">
              <tr>
                <td valign="top" bgcolor="ghostwhite" width="100%">
                  <table
                    width="100%"
                    role="content-container"
                    class="outer"
                    align="center"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                  >
                    <tr>
                      <td width="100%">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="width: 100%; max-width: 680px"
                                align="center"
                              >
                                <tr>
                                  <td
                                    role="modules-container"
                                    style="padding: 0px 0px 0px 0px; color: #000000; text-align: left"
                                    bgcolor="ghostwhite"
                                    width="100%"
                                    align="left"
                                  >
                                    <table
                                      class="wrapper"
                                      role="module"
                                      data-type="image"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="table-layout: fixed"
                                      data-muid="1b34d9f5-7a6d-45ef-b770-79d4f8b74931"
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            style="font-size: 6px; line-height: 10px; padding: 0px 0px 0px 0px"
                                            valign="top"
                                            align="center"
                                          >
                                            <img
                                              class="max-width"
                                              border="0"
                                              style="display: block; color: #000000; text-decoration: none; font-family: helvetica, sans-serif; font-size: 16px"
                                              width="270"
                                              alt=""
                                              data-proportionally-constrained="true"
                                              data-responsive="false"
                                              src="http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/dd13f062-d746-40a2-815c-951c026b9611/1500x900.png"
                                              height="162"
                                            />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table
                                      style="background-color: aliceblue; border-radius: 12px;"
                                      bgcolor="aliceblue"
                                      role="module-content"
                                    >
                                      <tbody>
                                        <tr>
                                          <td>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="text"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="a04cd346-1aa5-4f6a-8bdc-a7606c9e20bb"
                                              data-mc-module-version="2019-10-22"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 125px 32px; text-align: inherit; background-color: #006aff; border-radius: 12px"
                                                    height="100%"
                                                    valign="top"
                                                    bgcolor="#006aff"
                                                    role="module-content"
                                                  >
                                                    <div>
                                                      <div
                                                        style="font-family: helvetica, sans-serif; text-align: center"
                                                      >
                                                        <span
                                                          style="color: #ffffff; font-size: 36px; font-family: helvetica, sans-serif"
                                                          ><strong>
                                                            Missed ${isVoluntary ? 'Voluntary ' : ''}Repossession
                                                            Alert<br /><br /><br />
                                                            <a
                                                              style="color: white; text-decoration: underline;"
                                                              href="${rdnSiteVehicleInfo}/?case_id=${caseId}"
                                                              >VIN: ${vin}
                                                            </a>
                                                          </strong></span
                                                        >
                                                      </div>
                                                      <div></div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="spacer"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 0px 0px 40px 0px"
                                                    role="module-content"
                                                    bgcolor=""
                                                  ></td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="text"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="a04cd346-1aa5-4f6a-8bdc-a7606c9e20bb"
                                              data-mc-module-version="2019-10-22"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 0px 0px 22px 0px; line-height: 22px; text-align: inherit;"
                                                    height="100%"
                                                    valign="top"
                                                    role="module-content"
                                                  >
                                                    <div>
                                                      <div
                                                        style="font-family: helvetica, sans-serif; text-align: center"
                                                      >
                                                        <span
                                                          style="font-size: 16px; font-family: helvetica, sans-serif"
                                                          ><strong>Hello ${companyAdminName},</strong></span
                                                        >
                                                      </div>
                                                      <div></div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="text"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="a04cd346-1aa5-4f6a-8bdc-a7606c9e20bb"
                                              data-mc-module-version="2019-10-22"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 0px 36px 22px 36px; line-height: 22px; text-align: inherit;"
                                                    height="100%"
                                                    valign="top"
                                                    role="module-content"
                                                  >
                                                    <div>
                                                      <div
                                                        style="font-family: helvetica, sans-serif; text-align: center"
                                                      >
                                                        ${isVoluntary
                                                          ? `<span style="font-size: 16px; font-family: helvetica, sans-serif; color: #838299;">
                                                          Please be advised that the following case assigned to ${companyName}
                                                          currently shows a status in RDN as "${status}".
                                                          Please re-open the account in RDN so ${companyName} 
                                                          can secure the vehicle.
                                                          </span>`
                                                          : `<span
                                                          style="font-size: 16px; font-family: helvetica, sans-serif; color: #838299;"
                                                        >
                                                          Please be advised that
                                                          the following vehicle
                                                          has been spotted by
                                                          ${companyName}, and
                                                          currently shows a
                                                          status in RDN as
                                                          "${status}". Please
                                                          re-open the account in
                                                          RDN so ${companyName}
                                                          can secure the
                                                          vehicle.
                                                        </span>`}
                                                      </div>
                                                      <div></div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="text"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="a04cd346-1aa5-4f6a-8bdc-a7606c9e20bb"
                                              data-mc-module-version="2019-10-22"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 0px 0px 22px 0px; line-height: 22px; text-align: inherit;"
                                                    height="100%"
                                                    valign="top"
                                                    role="module-content"
                                                  >
                                                    <div>
                                                      <div
                                                        style="font-family: helvetica, sans-serif; text-align: center"
                                                      >
                                                        <span
                                                          style="font-size: 16px; font-family: helvetica, sans-serif"
                                                          ><strong>Thanks,</strong></span
                                                        >
                                                      </div>
                                                      <div></div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="text"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="a04cd346-1aa5-4f6a-8bdc-a7606c9e20bb"
                                              data-mc-module-version="2019-10-22"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 0px 36px 22px 36px; line-height: 22px; text-align: inherit;"
                                                    height="100%"
                                                    valign="top"
                                                    role="module-content"
                                                  >
                                                    <div>
                                                      <div
                                                        style="font-family: helvetica, sans-serif; text-align: center"
                                                      >
                                                        <span
                                                          style="font-size: 16px; font-family: helvetica, sans-serif; color: #838299;"
                                                        >
                                                          The ${companyName} team.
                                                        </span>
                                                      </div>
                                                      <div></div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                            <table
                                              class="module"
                                              role="module"
                                              data-type="spacer"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              width="100%"
                                              style="table-layout: fixed"
                                              data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6"
                                            >
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding: 0px 0px 40px 0px"
                                                    role="module-content"
                                                    bgcolor=""
                                                  ></td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <table
                                      class="module"
                                      role="module"
                                      data-type="spacer"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="100%"
                                      style="table-layout: fixed"
                                      data-muid="ee300bd3-db70-4056-9dde-dd1e36500da6"
                                    >
                                      <tbody>
                                        <tr>
                                          <td
                                            style="padding: 0px 0px 40px 0px"
                                            role="module-content"
                                            bgcolor=""
                                          ></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </table>
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

  return mail;
};
