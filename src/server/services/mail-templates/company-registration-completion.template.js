const mjml2html = require("mjml");

module.exports = function (templateOptions) {
  const { company } = templateOptions;

  return mjml2html(`
  <mjml>
    <mj-head>
      <mj-font name="Circular Std Black" href="https://insightt-email-templates.s3.us-east-2.amazonaws.com/fonts/circularStd-black.css" />
      <mj-font name="Circular Std Book" href="https://insightt-email-templates.s3.us-east-2.amazonaws.com/fonts/circularStd-book.css" />
      <mj-font name="Circular Std Bold" href="https://insightt-email-templates.s3.us-east-2.amazonaws.com/fonts/circularStd-bold.css" />
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
          <mj-text align="center" color="#ffffff" font-weight="bold" font-size="35px" font-family="Circular-Loom">
            Registration Completion
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section>
        <mj-column width="80%">
          <mj-text align="center" font-size="16px" padding-top="40px">
            <p style="line-height: 20px;color:#292933;font-family:Circular-Loom;font-weight: bold">Hey Admin,</p>
            <p style="line-height:22px;color:#838299;padding-top:10px;font-family:Circular-Loom">
              A company ${company.email} has completed it's registration. You can approve/reject it's request
            </p>
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `).html;
};
