const errorHandler = (err, req, res, next) => {
  console.log(err.name);
  if (err) {
    return res.status(500).json({ message: err.message });
  } else {
    next();
  }
};

module.exports = errorHandler;
