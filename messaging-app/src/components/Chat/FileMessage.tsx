// src/components/Chat/FileMessage.tsx
import React from 'react';
import { Download, FileText, Image } from 'lucide-react';

interface FileMessageProps {
    fileName: string;
    fileId: string;
    fileType: string;
    fileSize?: number;
}

const FileMessage: React.FC<FileMessageProps> = ({ fileName, fileId, fileType, fileSize }) => {
    const isImage = fileType.startsWith('image/');
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/files/files/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Dosya indirilemedi: ${errorText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert(error instanceof Error ? error.message : 'Dosya indirilemedi');
        }
    };

    return (
        <div 
            className="flex items-center space-x-3 bg-white bg-opacity-10 rounded-lg p-3 cursor-pointer hover:bg-opacity-20"
            onClick={handleDownload}
        >
            <div className="flex-shrink-0">
                {isImage ? (
                    <Image size={40} />
                ) : (
                    <FileText size={40} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                    {fileName}
                </div>
                <div className="text-xs opacity-70">
                    {fileExtension?.toUpperCase()} • {formatFileSize(fileSize)}
                </div>
            </div>
            <Download size={20} className="flex-shrink-0 opacity-70" />
        </div>
    );
};

export default FileMessage;