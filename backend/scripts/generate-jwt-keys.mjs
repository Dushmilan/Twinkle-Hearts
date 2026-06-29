import crypto from 'crypto';
import fs from 'fs';

crypto.generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
}, (err, publicKey, privateKey) => {
  if (err) {
    console.error('Error generating keys:', err);
    process.exit(1);
  }
  fs.writeFileSync('jwtRS256.key', privateKey, 'utf-8');
  fs.writeFileSync('jwtRS256.key.pub', publicKey, 'utf-8');
  console.log('✅ JWT keys generated: jwtRS256.key and jwtRS256.key.pub');
});
