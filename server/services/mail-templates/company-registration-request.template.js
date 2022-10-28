const { COMPANY_NAME } = require("../../constants/app.constants");

module.exports = function (templateOptions) {
  const { joinWaitingCompanyDetails } = templateOptions;

  const html = `
  <html>
  <body
    style="box-sizing: border-box; margin: 0; padding: 0; font-family: arial"
  >
    <center>
      <div style="background: #fafafa; padding: 0px 15px 68px 15px;">
        <img
          src="http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/dd13f062-d746-40a2-815c-951c026b9611/1500x900.png"
          style="width: 270px;"
        />
        <div
          style="background-color: #e6f0ff; max-width: 680px; border-radius: 10px;"
        >
          <div
            style="padding: 125px 32px; background-color: #006aff; font-size: 36px; font-weight: bold; color: #ffffff; border-radius: 10px;"
          >
            Company Registration Request
          </div>
          <div style="padding: 50px 120px;">
            <div style="max-width: 440px; line-height: 24px;">
              <div
                style="font-size: 16px; margin-bottom: 24px; color: #838299;"
              >
                Company <span style="font-weight: bold">${joinWaitingCompanyDetails.companyName}</span>'s user <span style="font-weight: bold">${joinWaitingCompanyDetails.contactName}</span> has shown interest in ${COMPANY_NAME}
                
              </div>
              <div
                style="font-size: 16px; margin-bottom: 24px; color: #838299;"
              >
                Here, is more details
                
              </div>
              
              <div
                style="font-size: 16px; margin-bottom: 16px; color: #838299;"
              >
                <div style="font-weight: bold">Company name:</div> ${joinWaitingCompanyDetails.companyName}
              </div>
              <div
                style="font-size: 16px; margin-bottom: 16px; color: #838299;"
              >
                <div style="font-weight: bold">Contact name:</div> ${joinWaitingCompanyDetails.contactName}
              </div>
              <div
                style="font-size: 16px; margin-bottom: 16px; color: #838299;"
              >
                <div style="font-weight: bold">Email:</div> ${joinWaitingCompanyDetails.email}
              </div>
              <div
                style="font-size: 16px; margin-bottom: 16px; color: #838299;"
              >
                <div style="font-weight: bold">Number of users:</div> ${joinWaitingCompanyDetails.noOfUsers}
              </div>
              <div
                style="font-size: 16px; margin-bottom: 16px; color: #838299;"
              >
                <div style="font-weight: bold">Contact Number:</div> ${joinWaitingCompanyDetails.contactNumber}
              </div>
              <div
                style="font-size: 16px; margin-bottom: 16px; color: #838299;"
              >
                <div style="font-weight: bold">Feedback:</div> ${joinWaitingCompanyDetails.feedback}
              </div>
            </div>
          </div>
        </div>
      </div>
    </center>
  </body>
</html>
  `;

  return html;
};
