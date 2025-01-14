// src/types/index.ts

export type EncryptionType = 'AES' | 'BLOWFISH' | 'RSA' | 'VIGENERE' | 'BASE64';

export interface MessageInputProps {
  onSendMessage: (content: string, encryptionType: EncryptionType) => void;
  onFileUpload: (file: File, encryptionType: EncryptionType) => Promise<void>;
  receiverId?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  timestamp: string;
  is_read: boolean;
  encryption_type: string;
  is_image?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadDate: string;
  isEncrypted?: boolean;
  isMessage?: boolean; // isMessage flag'ini ekledik
}

export interface Folder {
  id: string;
  name: string;
  createdBy: string;
  createdDate: string;
  parentId?: string | null;
  path: string;
  subFolders?: Folder[];
}

export type PartialMessage = Partial<Message>;

// export enum EncryptionType {
//   AES = 'AES',
//   BLOWFISH = 'BLOWFISH',
//   RSA = 'RSA',
//   VIGENERE = 'VIGENERE',
//   BASE64 = 'BASE64',
//   NONE = 'NONE'
// }

export interface WebSocketMessage {
  type: 'message';
  content: string;
  receiverId: string;
  encryptionType: EncryptionType;
}

export interface ImageMessage extends Message {
  is_image: true;
  file_id?: string;
}