const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const articleIDs = [
  'mjdrdypu_870_23',
  'IJO_2469_23',
  'IJO_2765_23',
  'IJO_2212_23',
  'jfmpc_1413_23',
  'ijdr_533_23',
  'njbcs_9_23',
  'joacp_140_23',
];
const editorName = process.env.EDITOR_NAME;
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
const tableRows = articleIDs
  .map((articleID, index) => `<tr><td>${index + 1}</td><td>${articleID}</td></tr>`)
  .join('');
const emailContent = fs.readFileSync('email.txt', 'utf8');
console.log(emailContent);
const emailTemplate = `
Hi,<br><br>
PFA articles for technical editing for your referance.<br><br>
  <table border="1" width="100%">
    <thead>
      <tr>
        <th>#</th>
        <th>Article ID</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  <br><br>
  <pre>${emailContent}</pre>
  <br><br>
  Regards,<br><br>
  Pratik Jain
  Client Relationship Manager
  E: pratikj@editink.in
`;
const emailBody = emailTemplate;
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',
  port: 465,
  secure: true,
  auth: {
    user: 'pratikj@editink.in',
    pass: 'Editink@007',
  },
});

// Define the email optionsS
const mailOptions = {
  from: 'pratikj@editink.in',
  to: 'pratikj@editink.in',
  subject: `TE Allocation - ${articleIDs.length} Articles`,
  html: emailTemplate,
  attachments: [],
};

const attachmentsDir = `./downloadedTE/${formattedDate}/Subrata1/`;
const attachments = fs.readdirSync(attachmentsDir);
attachments.forEach((attachment) => {
  mailOptions.attachments.push({
    path: `${attachmentsDir}${attachment}`,
  });
});
// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error occurred:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});