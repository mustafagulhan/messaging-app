// src/utils/auth.ts
export const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    return token;
  };