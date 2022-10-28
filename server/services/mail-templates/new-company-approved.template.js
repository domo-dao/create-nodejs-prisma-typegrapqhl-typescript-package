const {
  COMPANY_NAME,
  COMPANY_CONTACT
} = require("../../constants/app.constants");

module.exports = function (templateOptions) {
  const { firstName, companyLink, video } = templateOptions;

  let videoHtml = "";

  if (video) {
    videoHtml = `
      <div style="font-size: 16px; margin-bottom: 24px; color: #838299">
        Below you'll find an instructive video to get you started with
        Insightt.
      </div>
      <div style="font-size: 16px; margin-bottom: 24px; color: #838299">
        <a
          href="${video.video}"
        >
          <img
            src="${video.thumbnail}"
            width="320"
            style="border-radius: 10px"
          />
        </a>
      </div>
    `;
  }

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
                Welcome to ${COMPANY_NAME}
              </div>
              <div style="padding: 50px 120px;">
                <div style="max-width: 440px; line-height: 24px;">
                  <div
                    style="font-size: 16px; font-weight: bold; margin-bottom: 24px; color: #000000;"
                  >
                    Hey ${firstName},
                  </div>
                  <div
                    style="font-size: 16px; margin-bottom: 24px; color: #838299;"
                  >
                    Your company has been approved in the Insightt Portal. To complete your
                    company registration, please click
                    <a
                      href="${companyLink}"
                      style="color: #006aff; text-decoration: none;"
                      >here</a
                    >.
                  </div>
                  ${videoHtml}
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
                  <a href="https://apps.apple.com/us/app/insightt-io/id1555956306" style="text-decoration: none;">
                    <img src="http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/b349909d-e446-41d9-af44-34e11a714cba/500x150.png" width="200px"/>
                  </a>
                  <span>&nbsp;</span>
                  <a href="https://play.google.com/store/apps/details?id=com.insightt.io.prod" style="text-decoration: none;">
                    <img src="http://cdn.mcauto-images-production.sendgrid.net/999ed28dd779fb18/0d5db210-2e37-48ad-bf21-b06adc2ee4fc/500x150.png" width="200px"/>
                  </a>
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
