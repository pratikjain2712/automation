const fs = require('fs');

const folderPath = 'batchUploader';
const jsonFilePath = 'batchToUpload.json';

// Get the list of files in the folder
fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error('Error reading folder:', err);
    return;
  }

  // Write the list of files to a JSON file
  const fileData = files.map(file => {
    let articleID = '';
    if (file.startsWith('SMJ')) {
      articleID = file.split('-')[0] + '-' + file.split('-')[1] + '-' + file.split('-')[2].slice(0, 2);
    }
    else articleID = file.split('_')[0] + '_' + file.split('_')[1] + '_' + file.split('_')[2].slice(0, 2);
    const fileExt = file.split('.')[1];
    fs.renameSync(`${folderPath}/${file}`, `${folderPath}/${articleID}.${fileExt}`);
    return articleID;

  });
  const jsonData = JSON.stringify(fileData, null, 2);

  fs.writeFile(jsonFilePath, jsonData, err => {
    if (err) {
      console.error('Error writing to JSON file:', err);
    } else {
      console.log('File list written to:', jsonFilePath);
    }
  });
});
