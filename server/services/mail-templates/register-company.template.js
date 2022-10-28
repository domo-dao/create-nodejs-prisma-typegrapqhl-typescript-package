const {
  COMPANY_NAME,
  COMPANY_CONTACT
} = require("../../constants/app.constants");

module.exports = function (templateOptions) {
  const { registerCompany: newCompanyOwner } = templateOptions;

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
                Company Registered
              </div>
              <div style="padding: 50px 120px;">
                <div style="max-width: 440px; line-height: 24px;">
                  <div
                    style="font-size: 16px; font-weight: bold; margin-bottom: 24px; color: #000000;"
                  >
                    Hey ${newCompanyOwner.email},
                  </div>
                  <div
                    style="font-size: 16px; margin-bottom: 24px; color: #838299;"
                  >
                    Your company has been successfully added to the Insightt portal, and is now pending for approval. Once the company gets approved, you'll receive an instructive email with videos and links to get you started.
                  </div>
                  <div
                    style="font-size: 16px; margin-bottom: 24px; color: #838299;"
                  >
                    If you have any questions, please contact us at
                    <a
                      href="mailto:${COMPANY_CONTACT}"
                      style="color: #006aff; text-decoration: none;"
                      >${COMPANY_CONTACT}</a
                    >
                  </div>
                  <div
                    style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #000000"
                  >
                    Thanks,
                  </div>
                  <div
                    style="font-size: 16px; margin-bottom: 16px; color: #838299;"
                  >
                    The ${COMPANY_NAME} Team
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
