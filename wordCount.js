const fs = require('fs');
const mammoth = require("mammoth");

export async function getWordCount(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({buffer: buffer});

  if(result.messages.length > 0) {
    console.log("There were some issues extracting the text:");
    result.messages.forEach(message => console.log(message));
  }

  return result.value.split(/\s+/).length;
}
