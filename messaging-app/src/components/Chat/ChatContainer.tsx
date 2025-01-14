import React, { useState, useEffect, useCallback } from 'react';
import { Message, User, EncryptionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080';



const ChatContainer: React.FC = () => {
    const { user, token, logout } = useAuth();
    const [selectedChat, setSelectedChat] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentChats, setRecentChats] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Tüm API isteklerinde kullanılacak ortak hata yönetimi
    const handleApiError = useCallback((error: any) => {
        if (error.response?.status === 401) {
            logout();
            return;
        }
        console.error('API Error:', error);
        setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    }, [logout]);

    const handleMessageReceived = useCallback((message: Message) => {
        if (!user?.id) return;
        console.log('Received message:', message);
        
        // Mesajları güncelle
        setMessages(prev => {
            // Mesaj zaten varsa ekleme
            const exists = prev.some(m => m.id === message.id);
            if (exists) return prev;
            return [...prev, message];
        });
         // Gelen mesaj bizim içinse okundu olarak işaretle
        if (message.receiver_id === user.id) {
            markMessageAsRead(message.id);
        }
    }, [user?.id]);

    const { connected } = useWebSocket(user?.id || '', handleMessageReceived);

    const loadMessages = useCallback(async () => {
        if (!selectedChat?.id || !token) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/messages/${selectedChat.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Mesajlar yüklenemedi');
            }
    
            const data = await response.json();
            const sortedMessages = data.sort((a: Message, b: Message) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
    
            setMessages(sortedMessages);
            
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedChat?.id, token, handleApiError]);


    const handleSendMessage = async (content: string, encryption_type: EncryptionType) => {
        if (!selectedChat?.id || !user?.id || !content.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/messages/send-message`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    receiver_id: selectedChat.id,
                    encryption_type
                })
            });

            if (!response.ok) throw new Error('Mesaj gönderilemedi');
            await response.json();
            
            // Mesajları yeniden yükle
            await loadMessages();

        } catch (error) {
            console.error('Error sending message:', error);
            setError('Mesaj gönderilemedi');
        }
    };

    const handleFileUpload = async (file: File, encryption_type: EncryptionType) => {
        if (!selectedChat?.id || !user?.id) {
            alert('Önce bir sohbet seçin');
            return;
        }
        
        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('receiver_id', selectedChat.id);
            formData.append('encryption_type', encryption_type);

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/messages/upload-file`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Dosya gönderilemedi');
            }
            
            // Mesajları yeniden yükle
            await loadMessages();

        } catch (error) {
            console.error('Error uploading file:', error);
            alert(error instanceof Error ? error.message : 'Dosya gönderilemedi');
        } finally {
            setIsLoading(false);
        }
    };

    

    const markMessageAsRead = async (messageId: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/api/messages/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const fetchRecentChats = useCallback(async () => {
        if (!user || !token) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/recent-chats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Son mesajlaşmalar yüklenemedi');
            }
            
            const data = await response.json();
            setRecentChats(data);
        } catch (error) {
            handleApiError(error);
        }
    }, [user, token, handleApiError]);

    useEffect(() => {
        // Token yoksa login sayfasına yönlendir
        if (!token) {
            navigate('/login');
            return;
        }

        // Token varsa recent chats'i yükle
        fetchRecentChats();
    }, [token]);

    useEffect(() => {
        if (selectedChat) {
            loadMessages();
        }
    }, [selectedChat, loadMessages]);

    return (
        <div className="h-full flex">
          {/* Sol Sidebar */}
          <div className="w-80 border-r">
            <ChatSidebar
              onSelectChat={setSelectedChat}
              selectedUserId={selectedChat?.id}
              recentChats={recentChats}
            />
          </div>
      
          {/* Ana İçerik */}
          <div className="flex-1 flex flex-col">
            {!selectedChat ? (
              // Boş başlangıç sayfası
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg mb-2">Sohbet başlatmak için bir kullanıcı seçin</p>
                <p className="text-sm">Sol menüden bir kullanıcı seçerek mesajlaşmaya başlayabilirsiniz</p>
              </div>
            ) : (
              // Normal içerik
              <>
                <ChatHeader
                  user={selectedChat}
                  isOnline={connected}
                />
                <div className="flex-1 overflow-hidden">
                  <MessageList
                    messages={messages}
                    currentUserId={user?.id}
                    isLoading={isLoading}
                  />
                </div>
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onFileUpload={handleFileUpload}
                  selectedReceiverId={selectedChat?.id}
                />
              </>
            )}
          </div>
        </div>
    );
};

export default ChatContainer;