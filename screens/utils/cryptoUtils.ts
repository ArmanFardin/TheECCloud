import crypto from 'crypto';
import { ec as EC } from 'elliptic';
import * as eccrypto from 'eccrypto';
import RNFS from 'react-native-fs';

const ec = new EC('secp256k1');

/**
 * An Elliptic Curve key pair is generated
 * @returns {Object} Contains both keys]
 * @property {string} privateKey The private key in hex format
 * @property {string} publicKey The public key in hex format
 */
export const generateKeyPair = () => {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate('hex');
  const publicKey = keyPair.getPublic('hex');
  return { privateKey, publicKey };
};

/**
 * Encrypts the files using the server's public key
 * @param filePath The path of the file to be encrypted
 * @param serverPublicKey The public key of server in hex format
 * @returns {Promise<object>} An object containing the encrypted file path and the encrypted AES key
 * @property {string} encryptedFilePath The path of the encrypted file
 * @property {Object} encryptedKey The AES key
 */
export const encryptFile = async (filePath: string, serverPublicKey: string) => {
  try {
    console.log('Encrypting file with server public key:', serverPublicKey); 

    const fileData = await RNFS.readFile(filePath, 'base64');
    const fileBuffer = Buffer.from(fileData, 'base64');

    const key = crypto.randomBytes(32);

    const serverPublicKeyBuffer = Buffer.from(serverPublicKey, 'hex');
    const encryptedKey = await eccrypto.encrypt(serverPublicKeyBuffer, key);

    console.log('Encrypted AES Key:', encryptedKey); 

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedFilePath = `${filePath}.enc`;

    await RNFS.writeFile(
      encryptedFilePath,
      Buffer.concat([iv, authTag, encrypted]).toString('base64'),
      'base64'
    );

    return { encryptedFilePath, encryptedKey };
  } catch (error) {
    console.error('Error encrypting file:', error);
    throw error;
  }
};


/**
 * Decrypts a file using the servers private key
 * @param encryptedFilePath The path of the encrypted file
 * @param serverPrivateKey The servers private key in hex format
 * @param encryptedKey The encrypted AES key
 * @param bypassMACCheck Optional flag to bypass MAC check
 * @returns The path to the decrypted file
 */
export const decryptFile = async (
  encryptedFilePath: string,
  serverPrivateKey: string,
  encryptedKey: any,
  bypassMACCheck = false
) => {
  try {
    console.log('Decrypting file with server private key:', serverPrivateKey); 
    console.log('Encrypted Key:', encryptedKey); 

    encryptedKey = {
      ciphertext: Buffer.from(encryptedKey.ciphertext.data),
      ephemPublicKey: Buffer.from(encryptedKey.ephemPublicKey.data),
      iv: Buffer.from(encryptedKey.iv.data),
      mac: Buffer.from(encryptedKey.mac.data),
    };

    const encryptedData = await RNFS.readFile(encryptedFilePath, 'base64');
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    const iv = encryptedBuffer.subarray(0, 12);
    const authTag = encryptedBuffer.subarray(12, 28);
    const encrypted = encryptedBuffer.subarray(28);

    console.log('IV:', iv.toString('hex'));
    console.log('Auth Tag:', authTag.toString('hex'));

    const serverPrivateKeyBuffer = Buffer.from(serverPrivateKey, 'hex');
    const key = await eccrypto.decrypt(serverPrivateKeyBuffer, encryptedKey);

    console.log('Decrypted AES Key:', key.toString('hex'));

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    if (!bypassMACCheck) {
      decipher.setAuthTag(authTag);
    }

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const decryptedFilePath = encryptedFilePath.replace('.enc', '.dec');
    await RNFS.writeFile(decryptedFilePath, decrypted.toString('base64'), 'base64');

    return decryptedFilePath;
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw error;
  }
};
