import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Message } from '../../types';
import MessageFileViewerModal from './MessageFileViewerModal';

const API_BASE_URL = 'http://localhost:8080';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
    const [selectedFile, setSelectedFile] = useState<any>(null);

    const handleFileDownload = async (fileId: string, fileName: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/messages/files/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Dosya indirilemedi');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Dosya indirilemedi');
        }
    };

    const formatMessageTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            
            if (isToday) {
                return date.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '--:--';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const renderContent = () => {
        if (message.content.startsWith('[FILE:')) {
            try {
                const fileData = JSON.parse(message.content.slice(6, -1));
                const isImage = fileData.type.startsWith('image/');

                if (isImage) {
                    return (
                        <div className={`max-w-[250px] ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
                            <div 
                                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-gray-100"
                                onClick={() => setSelectedFile({
                                    ...fileData,
                                    isMessage: true
                                })}
                            >
                                <img
                                    src={`http://localhost:8080/api/messages/files/${fileData.id}`}
                                    alt={fileData.name}
                                    className="w-full h-full object-contain rounded-lg bg-gray-100"
                                />
                                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileDownload(fileData.id, fileData.name);
                                    }}
                                    className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
                                    title="İndir"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {formatMessageTime(message.timestamp)}
                                </span>
                                {isOwn && (
                                    <span className={isOwn ? 'text-blue-100' : 'text-gray-500'}>
                                        {message.is_read ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }

                return (
                    <div>
                        <div 
                            className={`flex items-center p-3 rounded-lg cursor-pointer ${
                                isOwn ? 'bg-blue-500 text-white' : 'bg-white'
                            }`}
                            onClick={() => handleFileDownload(fileData.id, fileData.name)}
                        >
                            <FileText size={24} className="mr-2 opacity-80" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{fileData.name}</p>
                                <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {formatFileSize(fileData.size)}
                                </p>
                            </div>
                            <Download size={16} className="ml-2 opacity-70" />
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatMessageTime(message.timestamp)}
                            </span>
                            {isOwn && (
                                <span className={isOwn ? 'text-blue-100' : 'text-gray-500'}>
                                    {message.is_read ? '✓✓' : '✓'}
                                </span>
                            )}
                        </div>
                    </div>
                );
            } catch (error) {
                console.error('Error parsing file data:', error);
                return <span className="text-red-500">Dosya görüntülenemiyor</span>;
            }
        }

        return (
            <div>
                <div className={`px-4 py-2 rounded-2xl break-words ${
                    isOwn 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                    <span className="whitespace-pre-wrap break-words">{message.content}</span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatMessageTime(message.timestamp)}
                    </span>
                    {isOwn && (
                        <span className={isOwn ? 'text-blue-100' : 'text-gray-500'}>
                            {message.is_read ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {renderContent()}
                </div>
            </div>

            {selectedFile && (
                <MessageFileViewerModal
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </>
    );
};

export default MessageBubble;