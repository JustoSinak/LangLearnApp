const crypto = require('crypto');
const fs = require('fs');

// Generate a random secret
const secret = crypto.randomBytes(64).toString('hex');

// Create or update .env file
const envContent = `JWT_SECRET=${secret}\n`;

fs.writeFileSync('.env', envContent, { flag: 'a' });

console.log('JWT Secret has been generated and added to .env file');
console.log('Generated Secret:', secret);