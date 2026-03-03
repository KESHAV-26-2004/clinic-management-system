//server/crypto/cryptoService.js
const crypto = require('crypto');
const { getMasterKey } = require('./keyManager');

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function encrypt(plainText) {
  if (plainText === null || plainText === undefined) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getMasterKey();

  const cipher = crypto.createCipheriv(ALGO, key, iv);

  let encrypted = cipher.update(String(plainText), 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('base64'),
    content: encrypted,
    tag: tag.toString('base64'),
  });
}

function decrypt(payload) {
  if (!payload) return null;

  const { iv, content, tag } = JSON.parse(payload);
  const key = getMasterKey();

  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(content, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};
