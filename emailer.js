const fs = require('fs');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
require('dotenv').config();

// Load assignment data from data.json
const data = require('./data.json');

const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

// Extract article IDs and corresponding editors from data.json
const subrataAssignments = data.subrataAssignment.map(articleID => ({ articleID, editor: 'Subrata' }));
const noorAssignments = data.noorAssignment.map(articleID => ({ articleID, editor: 'Noor' }));

// Combine assignments for both editors
const allAssignments = [...subrataAssignments, ...noorAssignments];

// Separate assignments based on editors
const subrataArticleIDs = subrataAssignments.map(assignment => assignment.articleID);
const noorArticleIDs = noorAssignments.map(assignment => assignment.articleID);

// Function to upload files to Google Drive and get the shareable link
const uploadToGoogleDrive = async (editor, articleIDs) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'path-to-your-service-account-key.json', // Add the path to your service account key JSON file
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const folderName = `${editor}_Assignments_${formattedDate}`;
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  // Create a folder for the editor's assignments
  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id',
  });

  // Upload files to the folder
  for (const articleID of articleIDs) {
    const filePath = `./downloadedTE/${formattedDate}/${editor}/${articleID}.pdf`; // Adjust the file path accordingly
    const fileMetadata = {
      name: `${articleID}.pdf`,
      parents: [folder.data.id],
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath),
    };

    await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id',
    });
  }

  // Get the shareable link of the folder
  const folderLink = `https://drive.google.com/drive/folders/${folder.data.id}`;

  return folderLink;
};

// Function to send email for a specific editor
const sendEmail = async (editor, articleIDs) => {
  // Upload files to Google Drive and get the shareable link
  const folderLink = await uploadToGoogleDrive(editor, articleIDs);

  const tableRows = articleIDs
    .map((articleID, index) => `<tr><td>${index + 1}</td><td>${articleID}</td></tr>`)
    .join('');

  const emailContent = fs.readFileSync(`${editor.toLowerCase()}.txt`, 'utf8');

  const emailTemplate = `
  Hi,<br><br>
  PFA articles for technical editing for your reference.<br><br>
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
    You can access the assigned articles on Google Drive:<br>
    <a href="${folderLink}" target="_blank">Link to ${editor}'s Assignments</a>
    <br><br>
    Regards,<br><br>
    Pratik Jain
    Client Relationship Manager
    E: pratikj@editink.in
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

  // Define the email options
  const mailOptions = {
    from: 'pratikj@editink.in',
    to: `pratikj@editink.in, ${editor.toLowerCase()}@example.com`, // Add the actual email addresses for Subrata and Noor
    subject: `TE Allocation - ${articleIDs.length} Articles`,
    html: emailTemplate,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${editor} with info:`, info.response);
  } catch (error) {
    console.error(`Error sending email to ${editor}:`, error.message);
  }
};

// Send emails for Subrata
sendEmail('Subrata', subrataArticleIDs);

// Send emails for Noor
sendEmail('Noor', noorArticleIDs);
