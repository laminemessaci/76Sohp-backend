const { expressjwt } = require("express-jwt");

const authJwt = expressjwt({
  secret: process.env.SECRET,
  algorithms: ["HS256"],
});

module.exports = authJwt;
