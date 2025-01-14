// src/services/messageService.ts
import axios from 'axios';
import { Message } from '../types';

const API_URL = 'http://localhost:8080/api';  // URL'i düzelttik

export const messageService = {
    async getMessages(otherUserId: string): Promise<Message[]> {
        try {
            const token = localStorage.getItem('token');
            console.log('Getting messages for user:', otherUserId);
            
            const response = await axios.get(`${API_URL}/messages/${otherUserId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log('Received messages:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    },

    async sendMessage(content: string, receiverId: string): Promise<Message> {
        try {
            const token = localStorage.getItem('token');
            console.log('Sending message:', { content, receiverId });
            
            const response = await axios.post(
                `${API_URL}/messages`, 
                {
                    content,
                    receiver_id: receiverId  // backend'deki beklenen format
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Message sent, response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
};