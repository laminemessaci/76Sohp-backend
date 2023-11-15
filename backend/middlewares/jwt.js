const { expressjwt } = require("express-jwt");
const colors = require("colors");

const api = process.env.API_URL;

const authJwt = expressjwt({
  secret: process.env.SECRET,
  algorithms: ["HS256"],
  isRevoked: isRevokedCallback,
  function(req, res) {
    if (!req.auth.admin) return res.sendStatus(401);
    res.sendStatus(200);
  },
}).unless({
  path: [
    { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
    { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
    `${api}/users/login`,
    `${api}/users/register`,
  ],
});

async function isRevokedCallback(req, token) {
  if (!token.payload.isAdmin) {
    return true;
  }

  return false;
}

module.exports = authJwt;
