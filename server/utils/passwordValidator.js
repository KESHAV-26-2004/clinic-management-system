//server/utils/passwordValidator.js
function isStrongPassword(password) {
  if (!password) return false;

  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return minLength && hasUpper && hasNumber && hasSpecial;
}

module.exports = { isStrongPassword };
