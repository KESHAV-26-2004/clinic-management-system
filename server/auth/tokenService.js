//server/auth/tokenService.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

const JWT_TTL = "8h";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing. Server cannot start.");
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
};