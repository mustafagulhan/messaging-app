export const useEncryption = () => {
    const encryptMessage = (message: string) => {
      // Şifreleme mantığı eklenecek
      return message;
    };
  
    const decryptMessage = (encryptedMessage: string) => {
      // Şifre çözme mantığı eklenecek
      return encryptedMessage;
    };
  
    return { encryptMessage, decryptMessage };
  };