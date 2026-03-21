import { webcrypto } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, '..');

const privateKeyPath = join(backendDir, 'jwtRS256.key');
const publicKeyPath = join(backendDir, 'jwtRS256.key.pub');

// Check if keys already exist
if (existsSync(privateKeyPath) && existsSync(publicKeyPath)) {
  console.log('⚠️  JWT keys already exist. Delete them first to regenerate.');
  console.log(`   rm ${privateKeyPath}`);
  console.log(`   rm ${publicKeyPath}`);
  process.exit(1);
}

async function generateKeys() {
  console.log('🔑 Generating RS256 JWT key pair...\n');

  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  // Export private key (PKCS#8 format)
  const privateKeyBuffer = await webcrypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyPEM = formatPEM(privateKeyBuffer, 'PRIVATE KEY');

  // Export public key (SPKI format)
  const publicKeyBuffer = await webcrypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyPEM = formatPEM(publicKeyBuffer, 'PUBLIC KEY');

  // Write files
  writeFileSync(privateKeyPath, privateKeyPEM);
  writeFileSync(publicKeyPath, publicKeyPEM);

  console.log('✅ Keys generated successfully!\n');
  console.log(`   Private key: ${privateKeyPath}`);
  console.log(`   Public key:  ${publicKeyPath}\n`);
  console.log('📝 Key formats:');
  console.log('   - Private: PKCS#8 (compatible with jose library)');
  console.log('   - Public:  SPKI/PEM (compatible with jose library)');
}

function formatPEM(buffer, label) {
  const base64 = Buffer.from(buffer).toString('base64');
  const lines = base64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----\n`;
}

generateKeys().catch((err) => {
  console.error('❌ Error generating keys:', err);
  process.exit(1);
});
