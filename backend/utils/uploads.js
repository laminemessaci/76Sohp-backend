const fs = require("fs");
const colors = require("colors");

/**
 * Deletes an uploaded file from the server.
 *
 * @param {Object} req - The request object containing the file information.
 * @param {string} req.file.filename - The name of the uploaded file.
 * @param {string} req.file.destination - The destination directory of the uploaded file.
 * @return {void} This function does not return anything.
 */
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
