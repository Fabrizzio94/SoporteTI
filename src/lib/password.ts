import crypto from "crypto";

const IV = Buffer.from([11, 110, 19, 46, 49, 210, 205, 247, 5, 54, 156, 234, 168, 76, 99, 204]);
const ENCRYPTION_KEY = process.env.NET_ENCRYPTION_KEY!; // "easy@123"

function getLegalKey(key: string): Buffer {
    const minSize = 128;
    const maxSize = 256;
    const skipSize = 64;

    let bitLen = key.length * 8;

    if (bitLen > maxSize) {
        key = key.substring(0, maxSize / 8);
    } else if (bitLen < maxSize) {
        const newBitLen = bitLen <= minSize ? minSize : bitLen - (bitLen % skipSize) + skipSize;
        key = key.padEnd(newBitLen / 8, "*");
    }

    return Buffer.from(key, "ascii");
}

export function desencriptar(cryptoText: string, key: string = ENCRYPTION_KEY): string {
    const data = Buffer.from(cryptoText, "base64");
    const keyBuf = getLegalKey(key);
    const algo = `aes-${keyBuf.length * 8}-cbc`;
    const decipher = crypto.createDecipheriv(algo, keyBuf, IV);
    decipher.setAutoPadding(true);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("ascii");
}

export function encriptar(plainText: string, key: string = ENCRYPTION_KEY): string {
    const data = Buffer.from(plainText, "ascii");
    const keyBuf = getLegalKey(key);
    const algo = `aes-${keyBuf.length * 8}-cbc`;
    const cipher = crypto.createCipheriv(algo, keyBuf, IV);
    return Buffer.concat([cipher.update(data), cipher.final()]).toString("base64");
}

export function verifyPassword(plainPassword: string, encryptedBD: string): boolean {
    try {
        const decrypted = desencriptar(encryptedBD);
        return decrypted.trim() === plainPassword.trim();
    } catch {
        return false;
    }
}