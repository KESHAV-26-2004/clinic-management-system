// server/auth/authService.js
const bcrypt = require('bcrypt');
const db = require('../db');
const { signToken } = require('./tokenService');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createUser({ username, password, role }) {
  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);

  db.prepare(`
    INSERT INTO users (username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?)
  `).run(username, password_hash, role, new Date().toISOString());
}

function login({ username, password, accessMode }) {
  const user = db
    .prepare(`
      SELECT id, username, password_hash, role,
             must_change_password, password_changed_at
      FROM users
      WHERE username = ? AND is_active = 1
    `)
    .get(username);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  return verifyPassword(password, user.password_hash).then(valid => {
    if (!valid) throw new Error('Invalid credentials');

    const token = signToken({
      userId: user.id,
      role: user.role,
      accessMode,
      mustChangePassword: user.must_change_password === 1,
      pwdAt: user.password_changed_at, // ✅ IMPORTANT
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: user.must_change_password === 1,
      },
    };
  });
}

module.exports = {
  hashPassword,
  login,
  createUser,
};
