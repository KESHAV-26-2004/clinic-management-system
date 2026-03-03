// server/auth/setupGuard.js
const { isSetupRequired } = require("../services/setupService");

function setupGuard(req, res, next) {
  if (isSetupRequired()) {
    return res.status(403).json({
      error: "System not initialized. Go to /setup",
      setupRequired: true,
    });
  }
  next();
}

module.exports = setupGuard;