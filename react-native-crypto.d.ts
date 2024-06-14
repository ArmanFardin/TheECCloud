// react-native-crypto.d.ts
declare module 'react-native-crypto' {
    import { Cipher, Decipher } from 'crypto';
    export function createCipheriv(algorithm: string, key: Buffer, iv: Buffer): Cipher;
    export function createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): Decipher;
  }
  