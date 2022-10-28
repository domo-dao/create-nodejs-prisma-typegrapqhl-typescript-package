const mjml2html = require('mjml');

module.exports = function (templateOptions) {
  const { duplicateZipCodeString } = templateOptions;
  return mjml2html(`
  <mjml>
    <mj-head>
      <mj-font name="Circular Std Black" href="https://insightt-email-templates.s3.us-east-2.amazonaws.com/fonts/circularStd-black.css" />
      <mj-font name="Circular Std Book" href="https://insightt-email-templates.s3.us-east-2.amazonaws.com/fonts/circularStd-book.css" />
      <mj-font name="Circular Std Bold" href="https://insightt-email-templates.s3.us-east-2.amazonaws.com/fonts/circularStd-bold.css" />
      <mj-font name="Circular Std Bold" href="https://fonts.googleapis.com/css?family=Roboto:400,700" />
      <mj-attributes>
        <mj-all padding="0"></mj-all>
      </mj-attributes>
      <mj-style inline="inline">
        a { 
          text-decoration: none; 
          color: inherit; 
        } 
      </mj-style>
    </mj-head>
    <mj-body background-color="#fafafa">
      <mj-section padding-top="30px">
        <mj-column width="100%" >
            <mj-image src="https://insightt-email-templates.s3.us-east-2.amazonaws.com/images/insightt-logo.png" alt="tickets" width="170px"></mj-image>
        </mj-column>
      </mj-section>
      <mj-section padding-top="20px">
        <mj-column width="100%" background-color="#006AFF" padding="130px 0" border-radius="10px">
          <mj-text align="center" color="#ffffff" font-weight="bold" font-size="35px" font-family="Roboto">
            Duplicate zipcodes
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section>
        <mj-column width="80%">
          <mj-text font-size="16px" padding-top="10px">
            <p style="line-height:22px;color:#838299;padding-top:10px;font-family:Roboto">
              <span style="display:block">Hello,</span> 
              
              Based on the information that imported from RDN for you agency and offices 
              it seems that one or more Zip Codes are being serve by more than one RDN branch on your organization. 
              We are letting you know this because Insightt.io uses the Zip Code from the Repossession Address 
              to identify which one of your RDN Branches performed the Repossession.
            </p>
          </mj-text>
          <mj-text font-size="16px" padding-top="10px">
          <div style="line-height:12px;color:#838299;font-family:Roboto">
            ${duplicateZipCodeString}
          </div>
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `).html;
};
