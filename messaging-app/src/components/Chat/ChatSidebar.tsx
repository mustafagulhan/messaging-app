import React, { useState } from 'react';
import { User } from '../../types';

interface ChatSidebarProps {
    onSelectChat: (user: User) => void;
    selectedUserId?: string;
    recentChats: User[];
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSelectChat, selectedUserId, recentChats }) => {
    const [showUsersList, setShowUsersList] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAllUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching users...'); // Debug log
            
            const response = await fetch('http://localhost:8080/api/messages/all-users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
    
            console.log('Response status:', response.status); // Debug log
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Kullanıcılar yüklenemedi');
            }
    
            const users = await response.json();
            console.log('Fetched users:', users); // Debug log
            
            setAllUsers(users);
            
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error instanceof Error ? error.message : 'Bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserSelect = (user: User) => {
        onSelectChat(user);
        setShowUsersList(false);
    };

    return (
        <div className="h-full bg-white flex flex-col">
            <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Son Mesajlaşmalar</h2>
                    <button
                        onClick={() => {
                            setShowUsersList(true);
                            fetchAllUsers();
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <span className="text-xl">+</span>
                    </button>
                </div>
            </div>

            {/* Son Mesajlaşmalar Listesi */}
            <div className="flex-1 overflow-y-auto">
                {recentChats.map((user) => (
                    <div
                        key={user.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedUserId === user.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => onSelectChat(user)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Kullanıcı Listesi Modal */}
            {showUsersList && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Yeni Sohbet Başlat</h3>
                            <button
                                onClick={() => setShowUsersList(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {isLoading ? (
                            <div className="flex justify-center items-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        ) : error ? (
                            <div className="text-red-500 text-center p-4">
                                {error}
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1">
                                {allUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer rounded-md flex items-center space-x-3"
                                        onClick={() => handleUserSelect(user)}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                            {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatSidebar;