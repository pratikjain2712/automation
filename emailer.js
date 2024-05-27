const fs = require('fs');
const nodemailer = require('nodemailer');
const { zipFolder } = require('./util/createZip');
// Function to send email for a specific editor
const sendEmailFunction = async (editor, articleIDs, folderPath, filename) => {
  const attachmentFile = zipFolder(folderPath, filename);
  const tableRows = articleIDs
    .map((articleID, index) => `<tr>
        <td style='border: 1px solid #dddddd; padding: 8px;text-align: center;'>${index + 1}</td>
        <td style='border: 1px solid #dddddd; padding: 8px;text-align: center;'>${articleID}</td></tr>`)
    .join('');

  const emailContent = fs.readFileSync(`${editor.toLowerCase()}.txt`, 'utf8');
  const emailTemplate = `
  Hi,<br><br>
  PFA articles for technical editing for your reference.<br><br>
    <table style='border-collapse: collapse; width: 100%;'>
      <thead>
        <tr>
          <th style='border: 1px solid #dddddd; padding: 8px;'>#</th>
          <th style='border: 1px solid #dddddd; padding: 8px;'>Article ID</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <br><br>
    <pre>${emailContent}</pre>
    <br><br>
  `;

  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
      user: 'pratikj@editink.in',
      pass: 'Editink@007',
    },
  });

  console.log(emailTemplate);
  console.log(emailContent);
  // Define the email options
  const mailOptions = {
    from: 'pratikj@editink.in',
    to: `pratikj@editink.in,subrata4uin@gmail.com`, // Add the actual email addresses for Subrata and Noor
    subject: `TE Allocation - ${articleIDs.length} Articles`,
    html: emailTemplate,
    attachments: [
      {
        filename: attachmentFile,
        path: `allocateTE/${attachmentFile}`, // Add the folder path where the downloaded articles are stored
      },

    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${editor} with info:`, info.response);
  } catch (error) {
    console.error(`Error sending email to ${editor}:`, error.message);
  }
};

// Send emails for Subrata
// sendEmailFunction('Subrata', [
//   "jcrt_435_24"
// ],
//   './downloadedTE/2024-03-20/subrata/',
//   'subrata-2024-03-20.zip'
// );

// Send emails for Noor
// sendEmail('Noor', noorArticleIDs);

export default sendEmailFunction;