const db = require('../config/db');
const crypto = require('crypto');

const TokenBlacklist = {
  hashToken: (token) => crypto.createHash('sha256').update(token).digest('hex'),

  add: async (token) => {
    const decoded = require('jsonwebtoken').decode(token);
    if (!decoded || !decoded.exp) return;
    const expiresAt = new Date(decoded.exp * 1000);
    const hash = TokenBlacklist.hashToken(token);
    await db.query(
      'INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [hash, expiresAt]
    );
  },

  isBlacklisted: async (token) => {
    const hash = TokenBlacklist.hashToken(token);
    const { rows } = await db.query(
      'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
      [hash]
    );
    return rows.length > 0;
  },

  cleanExpired: async () => {
    await db.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
  },
};

// Clean expired tokens every hour
setInterval(() => TokenBlacklist.cleanExpired(), 3600000);

module.exports = TokenBlacklist;
