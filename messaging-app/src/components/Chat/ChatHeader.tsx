// src/components/Chat/ChatHeader.tsx
import React from 'react';
import { User } from '../../types';

interface ChatHeaderProps {
    user?: User;  // optional yaptık
    isOnline?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, isOnline }) => {
    // Kullanıcı yoksa veya veriler yüklenmemişse
    if (!user || !user.first_name) {
        return (
            <div className="px-4 py-3 bg-white border-b">
                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.first_name[0].toUpperCase()}
                    </div>
                    {isOnline !== undefined && (
                        <div 
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                                ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                    )}
                </div>
                <div>
                    <h2 className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;