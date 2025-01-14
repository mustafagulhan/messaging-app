// src/services/api.ts
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const uploadFile = async (file: File) => {
    const formData = new FormData();    
    formData.append('file', file);
    
    const response = await api.post('/files/upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getFiles = async () => {
    const response = await api.get('/files/');
    return response.data;
};

export const downloadFile = async (fileId: string) => {
    const response = await api.get(`/files/${fileId}`, {
        responseType: 'blob'
    });
    return response.data;
};

export default api;