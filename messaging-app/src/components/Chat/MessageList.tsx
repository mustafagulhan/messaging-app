import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../../types';
import FilePreview from './FilePreview';
import FileViewerModal from './FileViewerModal';


interface MessageListProps {
    messages: Message[];
    currentUserId?: string;
    isLoading?: boolean;
}

interface FileInfo {
    id: string;
    name: string;
    type: string;
    size: number;
    isMessage: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, isLoading = false }) => {
    const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const [initialLoad, setInitialLoad] = useState(true);

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
    
            return date.toLocaleString('tr-TR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return '--:--';
        }
    };

    // İlk yükleme ve kullanıcı değişiminde en alta scroll yap
    useEffect(() => {
        if (messageContainerRef.current && messages.length > 0 && initialLoad) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            setInitialLoad(false);
        }
    }, [messages.length, currentUserId, initialLoad]);

    // Yeni kullanıcı seçildiğinde initialLoad'u resetle
    useEffect(() => {
        setInitialLoad(true);
    }, [currentUserId]);

    const handleFileClick = (fileContent: string) => {
        try {
            const fileData = JSON.parse(fileContent.slice(6, -1));
            setSelectedFile({
                ...fileData,
                isMessage: true
            });
        } catch (error) {
            console.error('Error parsing file info:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto" ref={messageContainerRef}>
                <div className="p-4 space-y-4">
                    {sortedMessages.map((message, index) => {
                        const isCurrentUser = message.sender_id === currentUserId;
                        
                        return (
                            <div
                                key={message.id || index}
                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                    {message.content.startsWith('[FILE:') ? (
                                        <div
                                            onClick={() => handleFileClick(message.content)}
                                            className="cursor-pointer hover:opacity-90 transition-opacity"
                                        >
                                            <FilePreview
                                                file={JSON.parse(message.content.slice(6, -1))}
                                                isMessage={true}
                                                className={isCurrentUser ? 'bg-blue-500 p-2 rounded-lg' : 'bg-white p-2 rounded-lg'}
                                            />
                                        </div>
                                    ) : (
                                        <div className={`px-4 py-2 rounded-2xl break-words ${
                                            isCurrentUser 
                                                ? 'bg-blue-500 text-white rounded-br-none' 
                                                : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                        }`}>
                                            <span className="whitespace-pre-wrap">{message.content}</span>
                                        </div>
                                    )}
                                    <div className={`text-xs text-gray-500 mt-1 ${
                                        isCurrentUser ? 'text-right' : 'text-left'
                                    }`}>
                                        {formatMessageTime(message.timestamp)}
                                        {isCurrentUser && (
                                            <span className="ml-2 text-blue-500">
                                                {message.is_read ? '✓✓' : '✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedFile && (
                <FileViewerModal
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
};

export default MessageList;