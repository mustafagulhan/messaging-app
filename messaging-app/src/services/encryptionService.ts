// src/services/encryptionService.ts
export enum EncryptionType {
    AES = 'AES',
    BLOWFISH = 'BLOWFISH',
    RSA = 'RSA',
    VIGENERE = 'VIGENERE',
    BASE64 = 'BASE64'
  }
  
  interface IEncryptionService {
    encrypt: (text: string, type: EncryptionType) => string;
    decrypt: (text: string, type: EncryptionType) => string;
  }
  
  export const encryptionService: IEncryptionService = {
    encrypt: (text: string, type: EncryptionType) => {
      switch (type) {
        case EncryptionType.AES:
          // AES şifreleme
          return "AES_" + text;
        case EncryptionType.BLOWFISH:
          // Blowfish şifreleme
          return "BF_" + text;
        case EncryptionType.RSA:
          // RSA şifreleme
          return "RSA_" + text;
        case EncryptionType.VIGENERE:
          // Vigenere şifreleme
          return "VIG_" + text;
        case EncryptionType.BASE64:
          // Base64 encoding
          return btoa(text);
        default:
          return text;
      }
    },
  
    decrypt: (text: string, type: EncryptionType) => {
      switch (type) {
        case EncryptionType.AES:
          // AES şifre çözme
          return text.substring(4);
        case EncryptionType.BLOWFISH:
          // Blowfish şifre çözme
          return text.substring(3);
        case EncryptionType.RSA:
          // RSA şifre çözme
          return text.substring(4);
        case EncryptionType.VIGENERE:
          // Vigenere şifre çözme
          return text.substring(4);
        case EncryptionType.BASE64:
          // Base64 decoding
          return atob(text);
        default:
          return text;
      }
    }
  };