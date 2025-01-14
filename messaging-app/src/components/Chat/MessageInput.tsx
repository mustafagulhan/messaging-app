// src/components/Chat/MessageInput.tsx
import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';


export type EncryptionType = 'AES' | 'BLOWFISH' | 'RSA' | 'VIGENERE' | 'BASE64';

interface MessageInputProps {
    onSendMessage: (content: string, encryption_type: EncryptionType) => Promise<void>;
    onFileUpload: (file: File, encryption_type: EncryptionType) => Promise<void>;
    selectedReceiverId?: string;
}

interface EncryptionOption {
    value: EncryptionType;
    label: string;
    supportsBinaryData: boolean;
}

const ENCRYPTION_OPTIONS: EncryptionOption[] = [
    { value: 'AES', label: 'AES Şifreleme', supportsBinaryData: true },
    { value: 'BLOWFISH', label: 'Blowfish Şifreleme', supportsBinaryData: true },
    { value: 'RSA', label: 'RSA Şifreleme', supportsBinaryData: false },
    { value: 'VIGENERE', label: 'Vigenere Şifreleme', supportsBinaryData: false },
    { value: 'BASE64', label: 'Base64 Encoding', supportsBinaryData: false }
];

const MessageInput: React.FC<MessageInputProps> = ({ 
    onSendMessage, 
    onFileUpload, 
    selectedReceiverId 
}) => {
    const [message, setMessage] = useState('');
    const [encryptionType, setEncryptionType] = useState<EncryptionType>('AES');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !selectedReceiverId) return;
        
        try {
            setIsSubmitting(true);
            
            if (selectedFile) {
                // Dosya gönderme işlemi
                await onFileUpload(selectedFile, encryptionType);
                
                // Form temizleme
                setSelectedFile(null);
                setFilePreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else if (message.trim()) {
                // Normal mesaj gönderme işlemi
                await onSendMessage(message, encryptionType);
                setMessage('');
            }
        } catch (error) {
            console.error('Error sending:', error);
            alert(error instanceof Error ? error.message : 'Bir hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
                return;
            }

            setSelectedFile(file);
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                // Resim olmayan dosyalar için filePreview'i null yap
                setFilePreview(null);
            }

            // Dosya seçildiğinde AES'e geç
            setEncryptionType('AES');
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    return (
        <div className="p-4 bg-white border-t">
            {selectedFile && (
                <div className="relative mb-2">
                    {filePreview ? (
                        // Resim önizlemesi
                        <div className="relative max-h-32 w-fit">
                            <img 
                                src={filePreview} 
                                alt="Preview" 
                                className="max-h-32 rounded object-contain bg-gray-100"
                            />
                            <button
                                onClick={removeSelectedFile}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                title="Dosyayı kaldır"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        // Dosya bilgisi (resim olmayan dosyalar için)
                        <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-600">
                                    {selectedFile.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                            <button
                                onClick={removeSelectedFile}
                                className="text-red-500 hover:text-red-600 p-1"
                                title="Dosyayı kaldır"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <div className="mt-1 text-sm text-gray-500">
                        Şifreleme: {encryptionType}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <select
                    value={encryptionType}
                    onChange={(e) => setEncryptionType(e.target.value as EncryptionType)}
                    className={`px-3 py-2 border rounded-md transition-colors
                        ${selectedFile 
                            ? 'bg-gray-50' 
                            : 'bg-white hover:border-blue-500'}`}
                >
                    {ENCRYPTION_OPTIONS.map(option => (
                        <option 
                            key={option.value} 
                            value={option.value}
                            disabled={!!selectedFile && !option.supportsBinaryData}
                        >
                            {option.label}
                            {selectedFile && !option.supportsBinaryData ? ' (Dosya için uygun değil)' : ''}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    disabled={!!selectedFile}
                    className="flex-1 px-4 py-2 border rounded-md"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700"
                >
                    <Camera size={24} />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <button
                    type="submit"
                    disabled={isSubmitting || (!message.trim() && !selectedFile)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                             disabled:bg-blue-300"
                >
                    {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
            </form>
        </div>
    );
};

export default MessageInput;