/**
 * Run: node utils/hashPassword.js <plaintext_password>
 * Use the output hash in your SQL seed INSERT.
 */
const bcrypt = require('bcryptjs');

const plain = process.argv[2] || 'Admin@123';
bcrypt.hash(plain, 12).then((hash) => {
  console.log(`Password : ${plain}`);
  console.log(`Hash     : ${hash}`);
});
