// src/services/authService.ts
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

export const authService = {
    async login(email: string, password: string) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await axios.post(`${API_URL}/token`, formData);
        return response.data;
    },

    async register(email: string, username: string, password: string) {
        const response = await axios.post(`${API_URL}/register`, {
            email,
            username,
            password
        });
        return response.data;
    }
};