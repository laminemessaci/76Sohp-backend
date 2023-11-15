const colors = require("colors");
/**
 * Handles errors and sends appropriate response.
 *
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @return {undefined} This function does not return anything.
 */
const errorHandler = (err, req, res, next) => {
  console.log(colors.bgYellow(err));
  if (res.headersSent || err.name === "ValidationError") {
    return next(err);
  }

  let status = 500;
  let message = "Internal server error";

  switch (err.name) {
    case "CastError":
      status = 400;
      message = `Invalid ${err.path}: ${err.inner}`;
      break;
    case "JsonWebTokenError":
      status = 401;
      message = "Invalid token";
      break;
    case "TokenExpiredError":
      status = 401;
      message = "Token expired";
      break;
    case "NotBeforeError":
      status = 401;
      message = "Token not yet active";
      break;
    case "UnauthorizedError":
      status = 401;
      message = `${err.message}`;
      break;
    case "ForbiddenError":
      status = 403;
      message = "Forbidden";
      break;
    case "NotFoundError":
      status = 404;
      message = "Not found";
      break;
    case "MongoError":
      status = 400;
      message = `${Object.keys(err.keyValue)} already exists`;
      break;
  }

  res.status(status).send({ message });
};

module.exports = errorHandler;
