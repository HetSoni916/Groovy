const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    await User.updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    };
  }

  async seedAdmin() {
    const email = process.env.ADMIN_EMAIL || 'admin@school.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existing = await User.findByEmail(email);
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
    });

    console.log('Admin user seeded successfully');
  }
}

module.exports = new AuthService();
