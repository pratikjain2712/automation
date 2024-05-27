const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zipFolder = (folderPath, zipFilePath) => {
    const zip = new AdmZip();

    // Read the contents of the folder
    const folderContents = fs.readdirSync(folderPath);

    // Add each file in the folder to the zip
    folderContents.forEach((file) => {
        const filePath = path.join(folderPath, file);
        zip.addLocalFile(filePath);
    });

    // Write the zip file
    const fileName =`${generateUniqueFolderName()}.zip`;
    const filepath = `./allocateTE/${fileName}`;
    zip.writeZip(filepath);
    console.log(`Folder ${folderPath} zipped to ${fileName}`);
    return fileName
}

const generateUniqueFolderName = () => {
    const timestamp = new Date().getTime(); // Get current timestamp
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string

    const uniqueFolderName = `batch_${timestamp}_${randomString}`; // Combine timestamp and random string

    return uniqueFolderName;
}

module.exports = {
    zipFolder,
    generateUniqueFolderName
}