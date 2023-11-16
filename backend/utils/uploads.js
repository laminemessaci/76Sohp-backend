const fs = require("fs");
const colors = require("colors");

function deleteUploadedFile(req) {
  const { filename, destination } = req.file;
  const basePath = `${destination}/${filename}`;

  console.log(colors.bgGreen(basePath));

  if (fs.existsSync(basePath)) {
    fs.unlinkSync(basePath);
  }
}

module.exports = {
  deleteUploadedFile,
};
